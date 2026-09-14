'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usePlansStore } from '@/stores/plans-store';
import { useMoodStore } from '@/stores/mood-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { useSparkStore } from '@/stores/spark-store';
import { useActivitiesStore } from '@/stores/activities-store';
import { isSupabaseConfigured } from '@/lib/supabase';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, instanceId, isOnline, setOnline } = useAuthStore();
  
  const plansSubscribe = usePlansStore((s) => s.subscribeToChanges);
  const plansFetch = usePlansStore((s) => s.fetchFromSupabase);
  
  const moodsSubscribe = useMoodStore((s) => s.subscribeToChanges);
  const moodsFetch = useMoodStore((s) => s.fetchFromSupabase);
  
  const memoriesSubscribe = useMemoriesStore((s) => s.subscribeToChanges);
  const memoriesFetch = useMemoriesStore((s) => s.fetchFromSupabase);
  
  const sparksSubscribe = useSparkStore((s) => s.subscribeToChanges);
  const sparksFetch = useSparkStore((s) => s.fetchFromSupabase);
  
  const activitiesSubscribe = useActivitiesStore((s) => s.subscribeToChanges);
  const activitiesFetch = useActivitiesStore((s) => s.fetchFromSupabase);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Sync when authenticated and online (only if Supabase is configured)
  useEffect(() => {
    if (!isAuthenticated || !instanceId || !isOnline || !isSupabaseConfigured()) return;

    // Initial fetch
    plansFetch();
    moodsFetch();
    memoriesFetch();
    sparksFetch();
    activitiesFetch();

    // Subscribe to real-time changes
    const unsubscribers = [
      plansSubscribe(),
      moodsSubscribe(),
      memoriesSubscribe(),
      sparksSubscribe(),
      activitiesSubscribe(),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    isAuthenticated,
    instanceId,
    isOnline,
    plansFetch,
    moodsFetch,
    memoriesFetch,
    sparksFetch,
    activitiesFetch,
    plansSubscribe,
    moodsSubscribe,
    memoriesSubscribe,
    sparksSubscribe,
    activitiesSubscribe,
  ]);

  return <>{children}</>;
}
