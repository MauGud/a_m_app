import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getSupabaseWithInstance, isSupabaseConfigured } from '@/lib/supabase';
import { COUPLE_SECRET, MEMBER_NAMES, SECRET_TTL_MS, type MemberSlot } from '@/lib/constants';

interface AuthState {
  hasHydrated: boolean;
  isAuthenticated: boolean;
  instanceId: string | null;
  instanceSecret: string | null;
  memberSlot: MemberSlot | null;
  displayName: string | null;
  partnerName: string | null;
  lastSecretVerifiedAt: number | null;
  isOnline: boolean;

  selectMember: (slot: MemberSlot) => void;
  verifySecret: (secret: string) => Promise<boolean>;
  reconcileInstance: () => Promise<void>;
  logout: () => void;
  setOnline: (online: boolean) => void;
  getSupabase: () => ReturnType<typeof getSupabaseWithInstance> | null;
  finishHydration: () => void;
}

async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + 'espacio-pareja-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function instanceIdFromHash(hash: string): string {
  const raw = hash.slice(0, 32);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
}

function isSecretFresh(lastSecretVerifiedAt: number | null): boolean {
  if (!lastSecretVerifiedAt) return false;
  return Date.now() - lastSecretVerifiedAt < SECRET_TTL_MS;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      isAuthenticated: false,
      instanceId: null,
      instanceSecret: null,
      memberSlot: null,
      displayName: null,
      partnerName: null,
      lastSecretVerifiedAt: null,
      isOnline: true,

      selectMember: (slot) => {
        const isA = slot === 'MEMBER_A';
        set({
          memberSlot: slot,
          displayName: isA ? MEMBER_NAMES.MEMBER_A : MEMBER_NAMES.MEMBER_B,
          partnerName: isA ? MEMBER_NAMES.MEMBER_B : MEMBER_NAMES.MEMBER_A,
        });
      },

      verifySecret: async (secret) => {
        if (secret !== COUPLE_SECRET) return false;

        const secretHash = await hashSecret(secret);
        let instanceId = instanceIdFromHash(secretHash);
        const now = Date.now();

        if (isSupabaseConfigured() && supabase) {
          try {
            const { data: existingRows } = await supabase
              .from('instances')
              .select('id')
              .eq('secret_hash', secretHash)
              .limit(1);

            if (existingRows?.[0]?.id) {
              instanceId = existingRows[0].id;
            } else {
              await supabase.from('instances').upsert({
                id: instanceId,
                secret_hash: secretHash,
                member_a_name: MEMBER_NAMES.MEMBER_A,
                member_b_name: MEMBER_NAMES.MEMBER_B,
              });
            }
          } catch (err) {
            console.warn('Could not upsert instance in Supabase, using shared local id:', err);
          }
        }

        set({
          instanceId,
          instanceSecret: secret,
          lastSecretVerifiedAt: now,
          isAuthenticated: true,
        });
        return true;
      },

      reconcileInstance: async () => {
        const secretHash = await hashSecret(COUPLE_SECRET);
        let instanceId = instanceIdFromHash(secretHash);

        if (isSupabaseConfigured() && supabase) {
          try {
            const { data: existingRows } = await supabase
              .from('instances')
              .select('id')
              .eq('secret_hash', secretHash)
              .limit(1);

            if (existingRows?.[0]?.id) {
              instanceId = existingRows[0].id;
            } else {
              await supabase.from('instances').upsert({
                id: instanceId,
                secret_hash: secretHash,
                member_a_name: MEMBER_NAMES.MEMBER_A,
                member_b_name: MEMBER_NAMES.MEMBER_B,
              });
            }
          } catch (err) {
            console.warn('Could not reconcile instance:', err);
          }
        }

        if (get().instanceId !== instanceId) {
          set({ instanceId, instanceSecret: COUPLE_SECRET });
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          lastSecretVerifiedAt: null,
        });
      },

      setOnline: (online) => {
        set({ isOnline: online });
      },

      getSupabase: () => {
        const { instanceId } = get();
        if (!instanceId) return null;
        return getSupabaseWithInstance(instanceId);
      },

      finishHydration: () => {
        const { memberSlot, lastSecretVerifiedAt } = get();
        set({
          hasHydrated: true,
          isAuthenticated: Boolean(memberSlot && isSecretFresh(lastSecretVerifiedAt)),
        });
      },
    }),
    {
      name: 'espacio-pareja-auth',
      partialize: (state) => ({
        instanceId: state.instanceId,
        instanceSecret: state.instanceSecret,
        memberSlot: state.memberSlot,
        displayName: state.displayName,
        partnerName: state.partnerName,
        lastSecretVerifiedAt: state.lastSecretVerifiedAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
        if (!state) {
          useAuthStore.setState({ hasHydrated: true });
        }
      },
    }
  )
);
