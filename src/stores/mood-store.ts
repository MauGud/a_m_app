import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbMood } from '@/lib/supabase';
import { coupleDidChange, listenCoupleTable } from '@/lib/couple-realtime';
import { mergeByKey } from '@/lib/merge';
import { useAuthStore } from './auth-store';
import { daysAgoISO, getTodayISO } from '@/lib/utils';
import { MOOD_RETENTION_DAYS, type MemberSlot } from '@/lib/constants';

type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  member: MemberSlot;
  value: MoodValue;
  note?: string;
  date: string;
  created_at: string;
  updated_at?: string;
}

interface MoodState {
  moods: MoodEntry[];
  isLoading: boolean;

  upsertMood: (member: MemberSlot, value: MoodValue, note?: string) => Promise<void>;
  getTodayMood: (member: MemberSlot) => MoodEntry | undefined;
  getPartnerTodayMood: (mySlot: MemberSlot) => MoodEntry | undefined;
  getRecentMoods: (member: MemberSlot, days?: number) => MoodEntry[];
  pruneOldMoods: () => void;

  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

function pruneMoods(moods: MoodEntry[]): MoodEntry[] {
  const cutoff = daysAgoISO(MOOD_RETENTION_DAYS);
  return moods.filter((m) => m.date >= cutoff);
}

function mergeMoods(local: MoodEntry[], remote: MoodEntry[]): MoodEntry[] {
  return pruneMoods(mergeByKey(local, remote, (mood) => `${mood.member}-${mood.date}`));
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      moods: [],
      isLoading: false,

      pruneOldMoods: () => {
        set((state) => ({ moods: pruneMoods(state.moods) }));
      },

      upsertMood: async (member, value, note) => {
        const today = getTodayISO();
        const existing = get().moods.find(
          (m) => m.member === member && m.date === today
        );

        if (existing) {
          const updatedAt = new Date().toISOString();
          set((state) => ({
            moods: pruneMoods(
              state.moods.map((m) =>
                m.id === existing.id ? { ...m, value, note, updated_at: updatedAt } : m
              )
            ),
          }));

          const auth = useAuthStore.getState();
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client
                  .from('moods')
                  .upsert({
                    id: existing.id,
                    instance_id: auth.instanceId,
                    member,
                    value,
                    note: note || null,
                    date: today,
                    created_at: existing.created_at,
                  }, { onConflict: 'instance_id,member,date' });
                coupleDidChange('moods');
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
            updated_at: new Date().toISOString(),
          };
          set((state) => ({
            moods: pruneMoods([...state.moods, newMood]),
          }));

          const auth = useAuthStore.getState();
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client.from('moods').upsert({
                  id: newMood.id,
                  instance_id: auth.instanceId,
                  member: newMood.member,
                  value: newMood.value,
                  note: newMood.note || null,
                  date: newMood.date,
                  created_at: newMood.created_at,
                }, { onConflict: 'instance_id,member,date' });
                coupleDidChange('moods');
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

      getRecentMoods: (member, days = MOOD_RETENTION_DAYS) => {
        const startStr = daysAgoISO(days);
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
            const cutoff = daysAgoISO(MOOD_RETENTION_DAYS);
            const { data, error } = await client
              .from('moods')
              .select('*')
              .eq('instance_id', auth.instanceId)
              .gte('date', cutoff)
              .order('date', { ascending: false });

            if (!error && data) {
              const remote: MoodEntry[] = data.map((d: DbMood) => ({
                id: d.id,
                member: d.member,
                value: d.value as MoodValue,
                note: d.note || undefined,
                date: d.date,
                created_at: d.created_at,
                updated_at: (d as DbMood & { updated_at?: string }).updated_at || d.created_at,
              }));
              set({ moods: mergeMoods(get().moods, remote) });
              await client.from('moods').delete().eq('instance_id', auth.instanceId).lt('date', cutoff);
            }
          }
        } catch (err) {
          console.warn('Could not fetch moods:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        return listenCoupleTable(useAuthStore.getState().instanceId, 'moods', () => {
          void get().fetchFromSupabase();
        });
      },
    }),
    {
      name: 'espacio-pareja-moods',
      partialize: (state) => ({ moods: pruneMoods(state.moods) }),
    }
  )
);
