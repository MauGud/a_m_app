import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_FINANZAS,
  parseFinanceSnapshot,
  parseMirrorPayload,
  type FinanceSnapshot,
} from '@/lib/finanzas';
import { supabase, isSupabaseConfigured, logSupabaseError } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { assertSafeToPersist, safeLog } from '@/lib/security';

function isLegacySeed(snapshot: FinanceSnapshot) {
  const nu = snapshot.cards.find((card) => card.name === 'NU');
  return nu?.debt === 12840 && nu?.spendable === 4200;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  createdAt: string;
  pendingLabel?: string;
}

interface FinanzasState {
  snapshot: FinanceSnapshot;
  updatedAt: string;
  source: 'app' | 'import';
  heartbeatAt: string | null;
  messages: ChatMessage[];
  pendingActionLabel: string | null;
  applyPending: ((snapshot: FinanceSnapshot) => FinanceSnapshot) | null;
  setSnapshot: (snapshot: FinanceSnapshot, source?: FinanzasState['source']) => void;
  importMirror: (raw: unknown, source?: FinanzasState['source']) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'> & { apply?: (snapshot: FinanceSnapshot) => FinanceSnapshot }) => void;
  confirmPending: () => void;
  dismissPending: () => void;
  newConversation: () => void;
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
  pushSnapshot: () => Promise<void>;
}

const WELCOME: Omit<ChatMessage, 'id' | 'createdAt'> = {
  role: 'assistant',
  text: 'Pregúntame deudas, gastos o cajas. Antes de cambiar un número te pido que lo confirmes. Lo que registres queda en esta app y en Supabase, no en Claude.',
};

function emptyState() {
  return {
    snapshot: DEFAULT_FINANZAS,
    updatedAt: new Date().toISOString(),
    source: 'app' as const,
  };
}

export const useFinanzasStore = create<FinanzasState>()(
  persist(
    (set, get) => ({
      ...emptyState(),
      heartbeatAt: null,
      messages: [
        {
          ...WELCOME,
          id: 'welcome',
          createdAt: new Date().toISOString(),
        },
      ],
      pendingActionLabel: null,
      applyPending: null,

      setSnapshot: (snapshot, source = 'app') => {
        assertSafeToPersist(snapshot, 'finanzas');
        const updatedAt = new Date().toISOString();
        set({ snapshot, updatedAt, source });
        void get().pushSnapshot();
      },

      importMirror: (raw, source = 'import') => {
        const snapshot = parseMirrorPayload(raw);
        get().setSnapshot(snapshot, source);
      },

      addMessage: (message) => {
        const id = crypto.randomUUID();
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id,
              role: message.role,
              text: message.text,
              createdAt: new Date().toISOString(),
              pendingLabel: message.pendingLabel,
            },
          ],
          pendingActionLabel: message.pendingLabel || null,
          applyPending: message.apply || null,
        }));
      },

      confirmPending: () => {
        set((state) => {
          if (!state.applyPending) return state;
          const snapshot = state.applyPending(state.snapshot);
          assertSafeToPersist(snapshot, 'finanzas');
          return {
            snapshot,
            updatedAt: new Date().toISOString(),
            source: 'app',
            applyPending: null,
            pendingActionLabel: null,
            messages: [
              ...state.messages,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                text: 'Listo, ya quedó registrado 💕',
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
        void get().pushSnapshot();
      },

      dismissPending: () => {
        set({
          applyPending: null,
          pendingActionLabel: null,
          messages: [
            ...get().messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: 'No hice el cambio.',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      },

      newConversation: () =>
        set({
          messages: [
            {
              ...WELCOME,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
          applyPending: null,
          pendingActionLabel: null,
        }),

      pushSnapshot: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;
        const { snapshot, updatedAt, source } = get();
        try {
          const client = auth.getSupabase();
          if (!client) return;
          const { error } = await client.from('finanzas_snapshots').upsert({
            instance_id: auth.instanceId,
            snapshot,
            source,
            updated_at: updatedAt,
            heartbeat_at: new Date().toISOString(),
          });
          if (error) logSupabaseError('finanzas.upsert', error);
        } catch (err) {
          safeLog('finanzas push', err);
        }
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;
        try {
          const client = auth.getSupabase();
          if (!client) return;
          const { data, error } = await client
            .from('finanzas_snapshots')
            .select('snapshot,source,updated_at,heartbeat_at')
            .eq('instance_id', auth.instanceId)
            .maybeSingle();
          if (error) {
            logSupabaseError('finanzas.fetch', error);
            return;
          }
          if (!data?.snapshot) {
            if (!isLegacySeed(get().snapshot)) void get().pushSnapshot();
            return;
          }
          const remote = parseFinanceSnapshot(data.snapshot);
          if (isLegacySeed(remote)) {
            set({ heartbeatAt: data.heartbeat_at || data.updated_at || null });
            return;
          }
          const remoteTs = Date.parse(data.updated_at || '');
          const localTs = Date.parse(get().updatedAt || '');
          set({ heartbeatAt: data.heartbeat_at || data.updated_at || null });
          if (!Number.isFinite(remoteTs) || remoteTs >= localTs) {
            set({
              snapshot: remote,
              updatedAt: data.updated_at || get().updatedAt,
              source: (data.source as FinanzasState['source']) || 'app',
            });
          } else {
            void get().pushSnapshot();
          }
        } catch (err) {
          safeLog('finanzas fetch', err);
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};
        const channel = supabase
          .channel(`finanzas-${auth.instanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'finanzas_snapshots',
              filter: `instance_id=eq.${auth.instanceId}`,
            },
            () => {
              get().fetchFromSupabase();
            }
          )
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      },
    }),
    {
      name: 'espacio-pareja-finanzas-v4',
      partialize: (state) => ({
        snapshot: state.snapshot,
        updatedAt: state.updatedAt,
        source: state.source,
        messages: state.messages.slice(-40),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && isLegacySeed(state.snapshot)) {
          useFinanzasStore.setState(emptyState());
        }
      },
    }
  )
);
