import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logSupabaseError } from '@/lib/supabase';
import { coupleDidChange, listenCoupleTable } from '@/lib/couple-realtime';
import { useAuthStore } from './auth-store';
import { mergeById } from '@/lib/merge';
import {
  buildVaultedMethod,
  canAddMethod,
  type CardBrand,
  type VaultedMethod,
} from '@/lib/payment-vault';
import { MAX_PAYMENT_METHODS, assertSafeToPersist, safeLog } from '@/lib/security';
import type { MemberSlot } from '@/lib/constants';

interface VaultState {
  methods: VaultedMethod[];
  addMethod: (input: {
    alias: string;
    brand: CardBrand;
    last4: string;
    expMonth: number;
    expYear: number;
    owner: MemberSlot;
  }) => VaultedMethod;
  removeMethod: (id: string) => void;
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

function toDb(method: VaultedMethod, instanceId: string) {
  assertSafeToPersist(method, 'método');
  return {
    id: method.id,
    instance_id: instanceId,
    alias: method.alias,
    brand: method.brand,
    last4: method.last4,
    exp_month: method.expMonth,
    exp_year: method.expYear,
    owner: method.owner,
    processor: method.processor,
    processor_ref: method.processorRef,
    created_at: method.createdAt,
    updated_at: method.updatedAt || method.createdAt,
  };
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      methods: [],

      addMethod: (input) => {
        if (!canAddMethod(get().methods.length)) {
          throw new Error(`Máximo ${MAX_PAYMENT_METHODS} métodos.`);
        }
        const method = buildVaultedMethod(input);
        set((state) => ({ methods: [method, ...state.methods] }));
        const auth = useAuthStore.getState();
        void (async () => {
          if (!auth.instanceId || !auth.isOnline) return;
          try {
            const client = auth.getSupabase();
            if (!client) return;
            const { error } = await client.from('payment_methods').insert(toDb(method, auth.instanceId));
            if (error) logSupabaseError('payment_methods.insert', error);
            else coupleDidChange('payment_methods');
          } catch (err) {
            safeLog('vault insert', err);
          }
        })();
        return method;
      },

      removeMethod: (id) => {
        set((state) => ({ methods: state.methods.filter((method) => method.id !== id) }));
        const auth = useAuthStore.getState();
        void (async () => {
          if (!auth.instanceId || !auth.isOnline) return;
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('payment_methods').delete().eq('id', id);
              coupleDidChange('payment_methods');
            }
          } catch (err) {
            safeLog('vault delete', err);
          }
        })();
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;
        try {
          const client = auth.getSupabase();
          if (!client) return;
          const { data, error } = await client
            .from('payment_methods')
            .select('id,alias,brand,last4,exp_month,exp_year,owner,processor,processor_ref,created_at,updated_at')
            .eq('instance_id', auth.instanceId)
            .order('created_at', { ascending: false })
            .limit(MAX_PAYMENT_METHODS);
          if (error) {
            logSupabaseError('payment_methods.fetch', error);
            return;
          }
          if (!data) return;
          const remote: VaultedMethod[] = data.map((row) => ({
            id: row.id,
            alias: row.alias,
            brand: row.brand,
            last4: row.last4,
            expMonth: row.exp_month,
            expYear: row.exp_year,
            owner: row.owner,
            processor: row.processor,
            processorRef: row.processor_ref,
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at,
            created_at: row.created_at,
            updated_at: row.updated_at || row.created_at,
          }));
          assertSafeToPersist(remote, 'vault remoto');
          set({ methods: mergeById(get().methods, remote).slice(0, MAX_PAYMENT_METHODS) });
        } catch (err) {
          safeLog('vault fetch', err);
        }
      },

      subscribeToChanges: () => {
        return listenCoupleTable(useAuthStore.getState().instanceId, 'payment_methods', () => {
          void get().fetchFromSupabase();
        });
      },
    }),
    {
      name: 'espacio-pareja-vault-v1',
      partialize: (state) => ({ methods: state.methods.slice(0, MAX_PAYMENT_METHODS) }),
    }
  )
);
