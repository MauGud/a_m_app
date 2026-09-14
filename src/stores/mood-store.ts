import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbMood, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { getTodayISO } from '@/lib/utils';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';
type MoodValue = 1 | 2 | 3 | 4 | 5;

interface MoodEntry {
  id: string;
  member: MemberSlot;
  value: MoodValue;
  note?: string;
  date: string;
  created_at: string;
}

interface MoodState {
  moods: MoodEntry[];
  isLoading: boolean;
  
  upsertMood: (member: MemberSlot, value: MoodValue, note?: string) => Promise<void>;
  getTodayMood: (member: MemberSlot) => MoodEntry | undefined;
  getPartnerTodayMood: (mySlot: MemberSlot) => MoodEntry | undefined;
  getRecentMoods: (member: MemberSlot, days: number) => MoodEntry[];
  
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      moods: [],
      isLoading: false,

      upsertMood: async (member, value, note) => {
        const today = getTodayISO();
        const existing = get().moods.find(
          (m) => m.member === member && m.date === today
        );

        if (existing) {
          set((state) => ({
            moods: state.moods.map((m) =>
              m.id === existing.id ? { ...m, value, note } : m
            ),
          }));

          // Sync to Supabase
          const auth = useAuthStore.getState();
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client.from('moods').update({ value, note: note || null }).eq('id', existing.id);
              }
            } catch (err) {
              console.warn('Could not sync mood update:', err);
            }
          }
        } else {
          const newMood: MoodEntry = {
            id: crypto.randomUUID(),
            member,
            value,
            note,
            date: today,
            created_at: new Date().toISOString(),
          };
          set((state) => ({
            moods: [...state.moods, newMood],
          }));

          const auth = useAuthStore.getState();
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client.from('moods').insert({
                  id: newMood.id,
                  instance_id: auth.instanceId,
                  member: newMood.member,
                  value: newMood.value,
                  note: newMood.note || null,
                  date: newMood.date,
                  created_at: newMood.created_at,
                });
              }
            } catch (err) {
              console.warn('Could not sync mood:', err);
            }
          }
        }
      },

      getTodayMood: (member) => {
        const today = getTodayISO();
        return get().moods.find((m) => m.member === member && m.date === today);
      },

      getPartnerTodayMood: (mySlot) => {
        const partnerSlot = mySlot === 'MEMBER_A' ? 'MEMBER_B' : 'MEMBER_A';
        return get().getTodayMood(partnerSlot);
      },

      getRecentMoods: (member, days) => {
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - days);
        const startStr = startDate.toISOString().split('T')[0];

        return get()
          .moods.filter((m) => m.member === member && m.date >= startStr)
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        set({ isLoading: true });
        try {
          const client = auth.getSupabase();
          if (client) {
            const { data, error } = await client
              .from('moods')
              .select('*')
              .order('date', { ascending: false });

            if (!error && data) {
              const moods: MoodEntry[] = data.map((d: DbMood) => ({
                id: d.id,
                member: d.member,
                value: d.value as MoodValue,
                note: d.note || undefined,
                date: d.date,
                created_at: d.created_at,
              }));
              set({ moods });
            }
          }
        } catch (err) {
          console.warn('Could not fetch moods:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};

        const channel = supabase
          .channel('moods-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'moods',
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
      name: 'espacio-pareja-moods',
    }
  )
);
