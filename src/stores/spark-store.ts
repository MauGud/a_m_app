import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbSpark, DbSparkSubmission, uploadImage, isSupabaseConfigured, logSupabaseError } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { getTodayISO } from '@/lib/utils';
import type { MemberSlot } from '@/lib/constants';

type SparkStatus = 'waiting' | 'one_submitted' | 'revealed';

interface SparkSubmission {
  member: MemberSlot;
  image: string;
  submitted_at: string;
}

interface Spark {
  id: string;
  date: string;
  status: SparkStatus;
  submissions: SparkSubmission[];
  revealed_at?: string;
}

interface SparkState {
  sparks: Spark[];
  isLoading: boolean;

  getTodaySpark: () => Spark | undefined;
  triggerSpark: () => Promise<void>;
  submitSpark: (member: MemberSlot, image: string) => Promise<void>;
  hasSubmitted: (member: MemberSlot) => boolean;

  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

function sparkStatusFromSubmissions(submissions: SparkSubmission[]): SparkStatus {
  if (submissions.length >= 2) return 'revealed';
  if (submissions.length === 1) return 'one_submitted';
  return 'waiting';
}

function mergeSparks(local: Spark[], remote: Spark[]): Spark[] {
  const map = new Map<string, Spark>();
  for (const spark of local) map.set(spark.date, spark);
  for (const spark of remote) {
    const existing = map.get(spark.date);
    if (!existing) {
      map.set(spark.date, spark);
      continue;
    }
    const subMap = new Map<string, SparkSubmission>();
    for (const sub of existing.submissions) subMap.set(sub.member, sub);
    for (const sub of spark.submissions) subMap.set(sub.member, sub);
    const submissions = Array.from(subMap.values());
    map.set(spark.date, {
      ...existing,
      id: spark.id || existing.id,
      submissions,
      status: sparkStatusFromSubmissions(submissions),
      revealed_at:
        submissions.length >= 2
          ? spark.revealed_at || existing.revealed_at || new Date().toISOString()
          : undefined,
    });
  }
  return Array.from(map.values());
}

async function broadcastSpark(instanceId: string, date: string) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const topic = `sparks-live-${instanceId}`;
    const channel = supabase.getChannels().find((ch) => String(ch.topic).includes(topic));
    if (!channel) return;
    await channel.send({
      type: 'broadcast',
      event: 'spark-sync',
      payload: { date },
    });
  } catch (err) {
    console.warn('Could not broadcast spark:', err);
  }
}

export const useSparkStore = create<SparkState>()(
  persist(
    (set, get) => ({
      sparks: [],
      isLoading: false,

      getTodaySpark: () => {
        const today = getTodayISO();
        return get().sparks.find((s) => s.date === today);
      },

      triggerSpark: async () => {
        const today = getTodayISO();
        if (get().sparks.find((s) => s.date === today)) return;

        const newSpark: Spark = {
          id: crypto.randomUUID(),
          date: today,
          status: 'waiting',
          submissions: [],
        };
        set((state) => ({
          sparks: [...state.sparks.filter((s) => s.date !== today), newSpark],
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              const { data: existing } = await client
                .from('sparks')
                .select('*')
                .eq('instance_id', auth.instanceId)
                .eq('date', today)
                .maybeSingle();

              if (existing) {
                set((state) => ({
                  sparks: state.sparks.map((s) =>
                    s.date === today
                      ? { ...s, id: existing.id, status: sparkStatusFromSubmissions(s.submissions) }
                      : s
                  ),
                }));
              } else {
                const { error } = await client.from('sparks').insert({
                  id: newSpark.id,
                  instance_id: auth.instanceId,
                  date: newSpark.date,
                  status: newSpark.status,
                });
                if (error) {
                  logSupabaseError('sparks.insert', error);
                  await get().fetchFromSupabase();
                }
              }
              await broadcastSpark(auth.instanceId, today);
            }
          } catch (err) {
            console.warn('Could not sync spark:', err);
          }
        }
      },

      submitSpark: async (member, image) => {
        const today = getTodayISO();
        let spark = get().sparks.find((s) => s.date === today);
        if (!spark) {
          await get().triggerSpark();
          spark = get().sparks.find((s) => s.date === today);
        }
        if (!spark) return;

        const alreadySubmitted = spark.submissions.some((s) => s.member === member);
        if (alreadySubmitted) return;

        const newSubmission: SparkSubmission = {
          member,
          image,
          submitted_at: new Date().toISOString(),
        };

        const updatedSubmissions = [...spark.submissions, newSubmission];
        const newStatus = sparkStatusFromSubmissions(updatedSubmissions);
        const revealedAt = newStatus === 'revealed' ? new Date().toISOString() : undefined;

        set((state) => ({
          sparks: state.sparks.map((s) =>
            s.date === today
              ? {
                  ...s,
                  submissions: updatedSubmissions,
                  status: newStatus,
                  revealed_at: revealedAt,
                }
              : s
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            let imageUrl: string | null = null;
            for (let attempt = 0; attempt < 3 && !imageUrl; attempt++) {
              imageUrl = await uploadImage(
                'sparks',
                image,
                `${auth.instanceId}/${today}_${member}.jpg`
              );
            }

            const client = auth.getSupabase();
            if (client && imageUrl) {
              await client.from('spark_submissions').upsert({
                spark_id: spark.id,
                member,
                image_url: imageUrl,
                submitted_at: newSubmission.submitted_at,
              }, { onConflict: 'spark_id,member' });

              await client.from('sparks').upsert({
                id: spark.id,
                instance_id: auth.instanceId,
                date: today,
                status: newStatus,
                revealed_at: revealedAt || null,
              });
            }
            await broadcastSpark(auth.instanceId, today);
            await get().fetchFromSupabase();
          } catch (err) {
            console.warn('Could not sync spark submission:', err);
          }
        }
      },

      hasSubmitted: (member) => {
        const spark = get().getTodaySpark();
        return spark?.submissions.some((s) => s.member === member) || false;
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        set({ isLoading: true });
        try {
          const client = auth.getSupabase();
          if (client) {
            const { data: sparksData, error: sparksError } = await client
              .from('sparks')
              .select('*')
              .eq('instance_id', auth.instanceId)
              .order('date', { ascending: false });

            if (!sparksError && sparksData) {
              const remote: Spark[] = [];

              for (const sparkData of sparksData as DbSpark[]) {
                const { data: submissionsData } = await client
                  .from('spark_submissions')
                  .select('*')
                  .eq('spark_id', sparkData.id);

                const submissions: SparkSubmission[] = (submissionsData || []).map(
                  (s: DbSparkSubmission) => ({
                    member: s.member,
                    image: s.image_url,
                    submitted_at: s.submitted_at,
                  })
                );

                remote.push({
                  id: sparkData.id,
                  date: sparkData.date,
                  status: sparkStatusFromSubmissions(submissions),
                  submissions,
                  revealed_at: sparkData.revealed_at || undefined,
                });
              }

              set({ sparks: mergeSparks(get().sparks, remote) });
            }
          }
        } catch (err) {
          console.warn('Could not fetch sparks:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};

        const refetch = () => {
          get().fetchFromSupabase();
        };

        const pgChannel = supabase
          .channel(`sparks-changes-${auth.instanceId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sparks',
              filter: `instance_id=eq.${auth.instanceId}`,
            },
            refetch
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'spark_submissions',
            },
            refetch
          )
          .subscribe();

        const liveChannel = supabase
          .channel(`sparks-live-${auth.instanceId}`, {
            config: { broadcast: { self: false } },
          })
          .on('broadcast', { event: 'spark-sync' }, refetch)
          .subscribe();

        return () => {
          supabase.removeChannel(pgChannel);
          supabase.removeChannel(liveChannel);
        };
      },
    }),
    {
      name: 'espacio-pareja-sparks',
      partialize: (state) => ({ sparks: state.sparks }),
    }
  )
);
