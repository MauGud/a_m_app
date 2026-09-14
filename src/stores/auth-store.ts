import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getSupabaseWithInstance, isSupabaseConfigured } from '@/lib/supabase';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';

interface AuthState {
  isAuthenticated: boolean;
  instanceId: string | null;
  instanceSecret: string | null;
  memberSlot: MemberSlot | null;
  displayName: string | null;
  partnerName: string | null;
  isOnline: boolean;
  
  setupInstance: (names: { memberA: string; memberB: string }) => void;
  selectMember: (slot: MemberSlot) => void;
  setSecret: (secret: string) => Promise<void>;
  loginWithSecret: (secret: string) => Promise<boolean>;
  logout: () => void;
  setOnline: (online: boolean) => void;
  getSupabase: () => ReturnType<typeof getSupabaseWithInstance> | null;
}

// Simple hash function for secret (in production, use bcrypt on server)
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + 'espacio-pareja-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      instanceId: null,
      instanceSecret: null,
      memberSlot: null,
      displayName: null,
      partnerName: null,
      isOnline: true,

      setupInstance: (names) => {
        set({
          displayName: names.memberA,
          partnerName: names.memberB,
        });
      },

      selectMember: (slot) => {
        const state = get();
        const isA = slot === 'MEMBER_A';
        set({
          memberSlot: slot,
          displayName: isA ? state.displayName : state.partnerName,
          partnerName: isA ? state.partnerName : state.displayName,
        });
      },

      setSecret: async (secret) => {
        const state = get();
        const secretHash = await hashSecret(secret);
        
        // Try to create instance in Supabase if configured
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data, error } = await supabase
              .from('instances')
              .insert({
                secret_hash: secretHash,
                member_a_name: state.memberSlot === 'MEMBER_A' ? state.displayName : state.partnerName,
                member_b_name: state.memberSlot === 'MEMBER_B' ? state.displayName : state.partnerName,
              })
              .select()
              .single();

            if (error) throw error;

            set({
              instanceId: data.id,
              instanceSecret: secret,
              isAuthenticated: true,
            });
            return;
          } catch (err) {
            console.warn('Could not create instance in Supabase, using local mode:', err);
          }
        }
        
        // Fallback to local-only mode
        set({
          instanceId: crypto.randomUUID(),
          instanceSecret: secret,
          isAuthenticated: true,
        });
      },

      loginWithSecret: async (secret) => {
        if (!isSupabaseConfigured() || !supabase) {
          return false;
        }
        
        const secretHash = await hashSecret(secret);
        
        try {
          const { data, error } = await supabase
            .from('instances')
            .select('*')
            .eq('secret_hash', secretHash)
            .single();

          if (error || !data) {
            return false;
          }

          set({
            instanceId: data.id,
            instanceSecret: secret,
            displayName: data.member_a_name,
            partnerName: data.member_b_name,
            isAuthenticated: true,
          });
          
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          instanceId: null,
          instanceSecret: null,
          memberSlot: null,
          displayName: null,
          partnerName: null,
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
    }),
    {
      name: 'espacio-pareja-auth',
    }
  )
);
