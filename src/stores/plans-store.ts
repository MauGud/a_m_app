import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbPlan, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth-store';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';

interface Plan {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  created_by: MemberSlot;
  created_at: string;
  completed_at?: string;
}

interface PlansState {
  plans: Plan[];
  isLoading: boolean;
  
  // Local actions
  addPlan: (title: string, description: string | undefined, createdBy: MemberSlot) => Promise<void>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  completePlan: (id: string) => Promise<void>;
  
  // Queries
  getPendingPlans: () => Plan[];
  getCompletedPlans: () => Plan[];
  
  // Sync
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const usePlansStore = create<PlansState>()(
  persist(
    (set, get) => ({
      plans: [],
      isLoading: false,

      addPlan: async (title, description, createdBy) => {
        const newPlan: Plan = {
          id: crypto.randomUUID(),
          title,
          description,
          status: 'pending',
          created_by: createdBy,
          created_at: new Date().toISOString(),
        };
        
        // Update local state immediately
        set((state) => ({
          plans: [...state.plans, newPlan],
        }));

        // Sync to Supabase
        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('plans').insert({
                id: newPlan.id,
                instance_id: auth.instanceId,
                title: newPlan.title,
                description: newPlan.description || null,
                status: newPlan.status,
                created_by: newPlan.created_by,
                created_at: newPlan.created_at,
              });
            }
          } catch (err) {
            console.warn('Could not sync plan to Supabase:', err);
          }
        }
      },

      updatePlan: async (id, updates) => {
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('plans').update(updates).eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync plan update:', err);
          }
        }
      },

      deletePlan: async (id) => {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('plans').delete().eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync plan deletion:', err);
          }
        }
      },

      completePlan: async (id) => {
        const completedAt = new Date().toISOString();
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === id
              ? { ...p, status: 'completed' as const, completed_at: completedAt }
              : p
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('plans').update({
                status: 'completed',
                completed_at: completedAt,
              }).eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync plan completion:', err);
          }
        }
      },

      getPendingPlans: () => {
        return get().plans.filter((p) => p.status === 'pending');
      },

      getCompletedPlans: () => {
        return get().plans.filter((p) => p.status === 'completed');
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        set({ isLoading: true });
        try {
          const client = auth.getSupabase();
          if (client) {
            const { data, error } = await client
              .from('plans')
              .select('*')
              .order('created_at', { ascending: false });

            if (!error && data) {
              const plans: Plan[] = data.map((d: DbPlan) => ({
                id: d.id,
                title: d.title,
                description: d.description || undefined,
                status: d.status,
                created_by: d.created_by,
                created_at: d.created_at,
                completed_at: d.completed_at || undefined,
              }));
              set({ plans });
            }
          }
        } catch (err) {
          console.warn('Could not fetch plans:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};

        const channel = supabase
          .channel('plans-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'plans',
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
      name: 'espacio-pareja-plans',
    }
  )
);
