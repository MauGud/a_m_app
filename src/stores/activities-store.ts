import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbActivity, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth-store';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';
type ActivityCategory = 'pago' | 'recoger' | 'pendiente' | 'casa' | 'compras';
type ActivityStatus = 'pending' | 'completed';
type RecurringType = 'none' | 'weekly' | 'monthly';

interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  status: ActivityStatus;
  due_date: string;
  due_time?: string;
  assigned_to?: MemberSlot;
  created_by: MemberSlot;
  created_at: string;
  completed_at?: string;
  completed_by?: MemberSlot;
  recurring: RecurringType;
}

interface ActivitiesState {
  activities: Activity[];
  isLoading: boolean;
  
  addActivity: (input: Omit<Activity, 'id' | 'status' | 'created_at' | 'completed_at' | 'completed_by'>) => Promise<void>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  completeActivity: (id: string, completedBy: MemberSlot) => Promise<void>;
  getPendingActivities: () => Activity[];
  getOverdueActivities: () => Activity[];
  getUpcomingActivities: (days: number) => Activity[];
  
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      isLoading: false,

      addActivity: async (input) => {
        const newActivity: Activity = {
          ...input,
          id: crypto.randomUUID(),
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          activities: [...state.activities, newActivity],
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('activities').insert({
                id: newActivity.id,
                instance_id: auth.instanceId,
                title: newActivity.title,
                description: newActivity.description || null,
                category: newActivity.category,
                status: newActivity.status,
                due_date: newActivity.due_date,
                due_time: newActivity.due_time || null,
                assigned_to: newActivity.assigned_to || null,
                created_by: newActivity.created_by,
                created_at: newActivity.created_at,
                recurring: newActivity.recurring,
              });
            }
          } catch (err) {
            console.warn('Could not sync activity:', err);
          }
        }
      },

      updateActivity: async (id, updates) => {
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('activities').update(updates).eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync activity update:', err);
          }
        }
      },

      deleteActivity: async (id) => {
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('activities').delete().eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync activity deletion:', err);
          }
        }
      },

      completeActivity: async (id, completedBy) => {
        const activity = get().activities.find((a) => a.id === id);
        if (!activity) return;

        const completedAt = new Date().toISOString();
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'completed' as const,
                  completed_at: completedAt,
                  completed_by: completedBy,
                }
              : a
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('activities').update({
                status: 'completed',
                completed_at: completedAt,
                completed_by: completedBy,
              }).eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync activity completion:', err);
          }
        }

        // Create recurring activity
        if (activity.recurring !== 'none') {
          const nextDate = new Date(activity.due_date);
          if (activity.recurring === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (activity.recurring === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          }

          await get().addActivity({
            title: activity.title,
            description: activity.description,
            category: activity.category,
            due_date: nextDate.toISOString().split('T')[0],
            due_time: activity.due_time,
            assigned_to: activity.assigned_to,
            created_by: activity.created_by,
            recurring: activity.recurring,
          });
        }
      },

      getPendingActivities: () => {
        return get()
          .activities.filter((a) => a.status === 'pending')
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      getOverdueActivities: () => {
        const today = new Date().toISOString().split('T')[0];
        return get()
          .activities.filter((a) => a.status === 'pending' && a.due_date < today)
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      getUpcomingActivities: (days) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];

        return get()
          .activities.filter(
            (a) =>
              a.status === 'pending' &&
              a.due_date >= todayStr &&
              a.due_date <= futureStr
          )
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        set({ isLoading: true });
        try {
          const client = auth.getSupabase();
          if (client) {
            const { data, error } = await client
              .from('activities')
              .select('*')
              .order('due_date', { ascending: true });

            if (!error && data) {
              const activities: Activity[] = data.map((d: DbActivity) => ({
                id: d.id,
                title: d.title,
                description: d.description || undefined,
                category: d.category,
                status: d.status,
                due_date: d.due_date,
                due_time: d.due_time || undefined,
                assigned_to: d.assigned_to || undefined,
                created_by: d.created_by,
                created_at: d.created_at,
                completed_at: d.completed_at || undefined,
                completed_by: d.completed_by || undefined,
                recurring: d.recurring,
              }));
              set({ activities });
            }
          }
        } catch (err) {
          console.warn('Could not fetch activities:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};

        const channel = supabase
          .channel('activities-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'activities',
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
      name: 'espacio-pareja-activities',
    }
  )
);
