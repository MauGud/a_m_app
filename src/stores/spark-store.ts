import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbSpark, DbSparkSubmission, uploadImage, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth-store';
import { getTodayISO } from '@/lib/utils';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';
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
        const existing = get().sparks.find((s) => s.date === today);
        
        if (!existing) {
          const newSpark: Spark = {
            id: crypto.randomUUID(),
            date: today,
            status: 'waiting',
            submissions: [],
          };
          set((state) => ({
            sparks: [...state.sparks, newSpark],
          }));

          const auth = useAuthStore.getState();
          if (auth.instanceId && auth.isOnline) {
            try {
              const client = auth.getSupabase();
              if (client) {
                await client.from('sparks').insert({
                  id: newSpark.id,
                  instance_id: auth.instanceId,
                  date: newSpark.date,
                  status: newSpark.status,
                });
              }
            } catch (err) {
              console.warn('Could not sync spark:', err);
            }
          }
        }
      },

      submitSpark: async (member, image) => {
        const today = getTodayISO();
        const spark = get().sparks.find((s) => s.date === today);
        if (!spark) return;

        const alreadySubmitted = spark.submissions.some((s) => s.member === member);
        if (alreadySubmitted) return;

        const newSubmission: SparkSubmission = {
          member,
          image,
          submitted_at: new Date().toISOString(),
        };

        const updatedSubmissions = [...spark.submissions, newSubmission];
        const newStatus: SparkStatus =
          updatedSubmissions.length >= 2 ? 'revealed' : 'one_submitted';
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
            // Upload image
            const imageUrl = await uploadImage(
              'sparks',
              image,
              `${auth.instanceId}/${today}_${member}.jpg`
            );

            if (imageUrl) {
              const client = auth.getSupabase();
              if (client) {
                // Insert submission
                await client.from('spark_submissions').insert({
                  spark_id: spark.id,
                  member,
                  image_url: imageUrl,
                });

                // Update spark status
                await client.from('sparks').update({
                  status: newStatus,
                  revealed_at: revealedAt || null,
                }).eq('id', spark.id);
              }
            }
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
            // Fetch sparks with submissions
            const { data: sparksData, error: sparksError } = await client
              .from('sparks')
              .select('*')
              .order('date', { ascending: false });

            if (!sparksError && sparksData) {
              const sparks: Spark[] = [];

              for (const sparkData of sparksData as DbSpark[]) {
                const { data: submissionsData } = await client
                  .from('spark_submissions')
                  .select('*')
                  .eq('spark_id', sparkData.id);

                const submissions: SparkSubmission[] = (submissionsData || []).map((s: DbSparkSubmission) => ({
                  member: s.member,
                  image: s.image_url,
                  submitted_at: s.submitted_at,
                }));

                sparks.push({
                  id: sparkData.id,
                  date: sparkData.date,
                  status: sparkData.status,
                  submissions,
                  revealed_at: sparkData.revealed_at || undefined,
                });
              }

              set({ sparks });
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

        const channel = supabase
          .channel('sparks-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sparks',
              filter: `instance_id=eq.${auth.instanceId}`,
            },
            () => {
              get().fetchFromSupabase();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'spark_submissions',
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
      name: 'espacio-pareja-sparks',
    }
  )
);
