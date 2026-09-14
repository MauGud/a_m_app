import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, DbMemory, uploadImage, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth-store';

type MemberSlot = 'MEMBER_A' | 'MEMBER_B';

interface Memory {
  id: string;
  image_front: string;
  image_back: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_by: MemberSlot;
  created_at: string;
}

interface MemoriesState {
  memories: Memory[];
  isLoading: boolean;
  
  addMemory: (memory: Omit<Memory, 'id' | 'created_at'>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  getMemories: () => Memory[];
  
  fetchFromSupabase: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useMemoriesStore = create<MemoriesState>()(
  persist(
    (set, get) => ({
      memories: [],
      isLoading: false,

      addMemory: async (memory) => {
        const newMemory: Memory = {
          ...memory,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        
        // Add locally first
        set((state) => ({
          memories: [newMemory, ...state.memories],
        }));

        // Upload to Supabase
        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            // Upload images to storage
            const timestamp = Date.now();
            const frontUrl = await uploadImage(
              'memories',
              memory.image_front,
              `${auth.instanceId}/${timestamp}_front.jpg`
            );
            const backUrl = await uploadImage(
              'memories',
              memory.image_back,
              `${auth.instanceId}/${timestamp}_back.jpg`
            );

            if (frontUrl && backUrl) {
              const client = auth.getSupabase();
              if (client) {
                await client.from('memories').insert({
                  id: newMemory.id,
                  instance_id: auth.instanceId,
                  image_front_url: frontUrl,
                  image_back_url: backUrl,
                  caption: memory.caption || null,
                  latitude: memory.location?.latitude || null,
                  longitude: memory.location?.longitude || null,
                  address: memory.location?.address || null,
                  created_by: memory.created_by,
                  created_at: newMemory.created_at,
                });
              }
            }
          } catch (err) {
            console.warn('Could not sync memory:', err);
          }
        }
      },

      deleteMemory: async (id) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        }));

        const auth = useAuthStore.getState();
        if (auth.instanceId && auth.isOnline) {
          try {
            const client = auth.getSupabase();
            if (client) {
              await client.from('memories').delete().eq('id', id);
            }
          } catch (err) {
            console.warn('Could not sync memory deletion:', err);
          }
        }
      },

      getMemories: () => {
        return get().memories.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      },

      fetchFromSupabase: async () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        set({ isLoading: true });
        try {
          const client = auth.getSupabase();
          if (client) {
            const { data, error } = await client
              .from('memories')
              .select('*')
              .order('created_at', { ascending: false });

            if (!error && data) {
              const memories: Memory[] = data.map((d: DbMemory) => ({
                id: d.id,
                image_front: d.image_front_url,
                image_back: d.image_back_url,
                caption: d.caption || undefined,
                location: d.latitude && d.longitude ? {
                  latitude: d.latitude,
                  longitude: d.longitude,
                  address: d.address || undefined,
                } : undefined,
                created_by: d.created_by,
                created_at: d.created_at,
              }));
              set({ memories });
            }
          }
        } catch (err) {
          console.warn('Could not fetch memories:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        const auth = useAuthStore.getState();
        if (!auth.instanceId || !isSupabaseConfigured() || !supabase) return () => {};

        const channel = supabase
          .channel('memories-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'memories',
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
      name: 'espacio-pareja-memories',
    }
  )
);
