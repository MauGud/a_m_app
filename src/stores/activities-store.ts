import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbActivity, isSupabaseConfigured, logSupabaseError } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { mergeById } from '@/lib/merge';
import { getNextDueDate, getTodayISO } from '@/lib/utils';
import type {
  ActivityCategory,
  MemberSlot,
  RecurringType,
  RecurringUnit,
} from '@/lib/constants';
import { DATE_GOAL_CATEGORIES } from '@/lib/constants';

export type { ActivityCategory, RecurringType, RecurringUnit };

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  status: 'pending' | 'completed';
  due_date: string;
  due_time?: string;
  assigned_to?: MemberSlot;
  created_by: MemberSlot;
  created_at: string;
  completed_at?: string;
  completed_by?: MemberSlot;
  recurring: RecurringType;
  recurring_interval?: number;
  recurring_unit?: RecurringUnit;
  recurring_anchor_day?: number;
  updated_at?: string;
}

interface ActivitiesState {
  activities: Activity[];
  isLoading: boolean;

  addActivity: (
    input: Omit<Activity, 'id' | 'status' | 'created_at' | 'completed_at' | 'completed_by'>
  ) => Promise<void>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  completeActivity: (id: string, completedBy: MemberSlot) => Promise<void>;
  getPendingActivities: () => Activity[];
  getOverdueActivities: () => Activity[];
  getUpcomingActivities: (days: number) => Activity[];
  getDateGoals: (status?: Activity['status']) => Activity[];

  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

function toDbPayload(activity: Activity, instanceId: string) {
  return {
    id: activity.id,
    instance_id: instanceId,
    title: activity.title,
    description: activity.description || null,
    category: activity.category,
    status: activity.status,
    due_date: activity.due_date,
    due_time: activity.due_time || null,
    assigned_to: activity.assigned_to || null,
    created_by: activity.created_by,
    created_at: activity.created_at,
    completed_at: activity.completed_at || null,
    completed_by: activity.completed_by || null,
    recurring: activity.recurring,
    recurring_interval: activity.recurring_interval || 1,
    recurring_unit: activity.recurring_unit || 'day',
    recurring_anchor_day: activity.recurring_anchor_day || parseInt(activity.due_date.slice(8, 10), 10),
  };
}

export const useActivitiesStore = create<ActivitiesState>()(
  persist(
    (set, get) => ({
      activities: [],
      isLoading: false,

      addActivity: async (input) => {
        const now = new Date().toISOString();
        const newActivity: Activity = {
          ...input,
          id: crypto.randomUUID(),
          status: 'pending',
          created_at: now,
          updated_at: now,
          recurring: input.recurring || 'none',
          recurring_interval: input.recurring_interval || 1,
          recurring_unit: input.recurring_unit || 'day',
          recurring_anchor_day:
            input.recurring_anchor_day || parseInt(input.due_date.slice(8, 10), 10),
        };
        set((state) => ({
          activities: [...state.activities, newActivity],
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              const { error } = await client.from('activities').insert(toDbPayload(newActivity, auth.instanceId));
              if (error) {
                logSupabaseError('activities.insert', error);
                const payload = toDbPayload(newActivity, auth.instanceId);
                const withoutAnchor: Record<string, unknown> = { ...payload };
                delete withoutAnchor.recurring_anchor_day;
                const mid = await client.from('activities').insert(withoutAnchor);
                if (mid.error) {
                  logSupabaseError('activities.insert.no-anchor', mid.error);
                  const legacy = {
                    id: payload.id,
                    instance_id: payload.instance_id,
                    title: payload.title,
                    description: payload.description,
                    category: payload.category,
                    status: payload.status,
                    due_date: payload.due_date,
                    due_time: payload.due_time,
                    assigned_to: payload.assigned_to,
                    created_by: payload.created_by,
                    created_at: payload.created_at,
                    completed_at: payload.completed_at,
                    completed_by: payload.completed_by,
                    recurring: ['none', 'weekly', 'monthly'].includes(payload.recurring)
                      ? payload.recurring
                      : 'none',
                  };
                  const retry = await client.from('activities').insert(legacy);
                  if (retry.error) logSupabaseError('activities.insert.legacy', retry.error);
                }
              }
            }
          } catch (err) {
            console.warn('Could not sync activity:', err);
          }
        }
      },

      updateActivity: async (id, updates) => {
        const stamped = { ...updates, updated_at: new Date().toISOString() };
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...stamped } : a
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              const remoteUpdates: Record<string, unknown> = { ...stamped };
              delete remoteUpdates.updated_at;
              await client.from('activities').update(remoteUpdates).eq('id', id);
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
                  updated_at: completedAt,
                }
              : a
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client
                .from('activities')
                .update({
                  status: 'completed',
                  completed_at: completedAt,
                  completed_by: completedBy,
                })
                .eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync activity completion:', err);
          }
        }

        const nextDate = getNextDueDate(
          activity.due_date,
          activity.recurring,
          activity.recurring_interval,
          activity.recurring_unit,
          activity.recurring_anchor_day
        );
        if (nextDate) {
          await get().addActivity({
            title: activity.title,
            description: activity.description,
            category: activity.category,
            due_date: nextDate,
            due_time: activity.due_time,
            assigned_to: activity.assigned_to,
            created_by: activity.created_by,
            recurring: activity.recurring,
            recurring_interval: activity.recurring_interval,
            recurring_unit: activity.recurring_unit,
            recurring_anchor_day: activity.recurring_anchor_day,
          });
        }
      },

      getPendingActivities: () => {
        return get()
          .activities.filter((a) => a.status === 'pending')
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      getOverdueActivities: () => {
        const localToday = getTodayISO();
        return get()
          .activities.filter((a) => a.status === 'pending' && a.due_date < localToday)
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      getUpcomingActivities: (days) => {
        const today = new Date();
        const localToday = getTodayISO(today);
        const future = new Date();
        future.setDate(today.getDate() + days);
        const futureStr = getTodayISO(future);

        return get()
          .activities.filter(
            (a) =>
              a.status === 'pending' &&
              a.due_date >= localToday &&
              a.due_date <= futureStr
          )
          .sort((a, b) => a.due_date.localeCompare(b.due_date));
      },

      getDateGoals: (status) => {
        return get()
          .activities.filter(
            (a) =>
              DATE_GOAL_CATEGORIES.includes(a.category) &&
              (status ? a.status === status : true)
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
              .eq('instance_id', auth.instanceId)
              .order('due_date', { ascending: true });

            if (!error && data) {
              const remote: Activity[] = data.map((d: DbActivity) => ({
                id: d.id,
                title: d.title,
                description: d.description || undefined,
                category: d.category as ActivityCategory,
                status: d.status,
                due_date: d.due_date,
                due_time: d.due_time || undefined,
                assigned_to: d.assigned_to || undefined,
                created_by: d.created_by,
                created_at: d.created_at,
                completed_at: d.completed_at || undefined,
                completed_by: d.completed_by || undefined,
                recurring: (d.recurring as RecurringType) || 'none',
                recurring_interval: d.recurring_interval || 1,
                recurring_unit: (d.recurring_unit as RecurringUnit) || 'day',
                recurring_anchor_day:
                  d.recurring_anchor_day || parseInt(d.due_date.slice(8, 10), 10),
                updated_at: d.updated_at || d.completed_at || d.created_at,
              }));
              set({ activities: mergeById(get().activities, remote) });
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
          .channel(`activities-changes-${auth.instanceId}`)
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
      partialize: (state) => ({ activities: state.activities }),
    }
  )
);
