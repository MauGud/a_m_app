import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DbMemory, uploadImage } from '@/lib/supabase';
import { coupleDidChange, listenCoupleTable } from '@/lib/couple-realtime';
import { isFixtureCaption, isRemoteMediaUrl } from '@/lib/fixtures';
import { useAuthStore } from './auth-store';
import { mergeById } from '@/lib/merge';
import type { MemberSlot } from '@/lib/constants';

export interface Memory {
  id: string;
  image_front: string;
  image_back: string;
  caption?: string;
  date_id?: string;
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

function isKeptMemory(memory: Memory) {
  if (isFixtureCaption(memory.caption)) return false;
  return isRemoteMediaUrl(memory.image_front) && isRemoteMediaUrl(memory.image_back);
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

        set((state) => ({
          memories: [newMemory, ...state.memories],
        }));

        const auth = useAuthStore.getState();
        if (!auth.instanceId || !auth.isOnline) return;

        try {
          const timestamp = Date.now();
          const [frontUrl, backUrl] = await Promise.all([
            uploadImage('memories', memory.image_front, `${auth.instanceId}/${timestamp}_front.jpg`),
            uploadImage('memories', memory.image_back, `${auth.instanceId}/${timestamp}_back.jpg`),
          ]);

          if (!frontUrl || !backUrl) {
            throw new Error('No se pudieron subir las fotos');
          }

          const client = auth.getSupabase();
          if (!client) return;
          const { error } = await client.from('memories').insert({
            id: newMemory.id,
            instance_id: auth.instanceId,
            image_front_url: frontUrl,
            image_back_url: backUrl,
            caption: memory.caption || null,
            date_id: memory.date_id || null,
            latitude: memory.location?.latitude || null,
            longitude: memory.location?.longitude || null,
            address: memory.location?.address || null,
            created_by: memory.created_by,
            created_at: newMemory.created_at,
          });
          if (error) {
            throw new Error(error.message || 'No se pudo guardar el recuerdo');
          }
          set((state) => ({
            memories: state.memories.map((item) =>
              item.id === newMemory.id ? { ...item, image_front: frontUrl, image_back: backUrl } : item
            ),
          }));
          coupleDidChange('memories');
        } catch (err) {
          set((state) => ({
            memories: state.memories.filter((item) => item.id !== newMemory.id),
          }));
          throw err;
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
              coupleDidChange('memories');
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
              .eq('instance_id', auth.instanceId)
              .order('created_at', { ascending: false });

            if (!error && data) {
              const remote: Memory[] = data.map((d: DbMemory) => ({
                id: d.id,
                image_front: d.image_front_url,
                image_back: d.image_back_url,
                caption: d.caption || undefined,
                date_id: d.date_id || undefined,
                location:
                  d.latitude && d.longitude
                    ? {
                        latitude: Number(d.latitude),
                        longitude: Number(d.longitude),
                        address: d.address || undefined,
                      }
                    : undefined,
                created_by: d.created_by,
                created_at: d.created_at,
              }));
              const keptRemote = remote.filter(isKeptMemory);
              const pendingLocal = get().memories.filter(
                (item) => !isKeptMemory(item) && !isFixtureCaption(item.caption)
              );
              set({ memories: mergeById(pendingLocal, keptRemote) });
            }
          }
        } catch (err) {
          console.warn('Could not fetch memories:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToChanges: () => {
        return listenCoupleTable(useAuthStore.getState().instanceId, 'memories', () => {
          void get().fetchFromSupabase();
        });
      },
    }),
    {
      name: 'espacio-pareja-memories-v2',
      partialize: (state) => ({ memories: state.memories.filter(isKeptMemory) }),
    }
  )
);
