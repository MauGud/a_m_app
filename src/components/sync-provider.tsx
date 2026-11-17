'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useMoodStore } from '@/stores/mood-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { useSparkStore } from '@/stores/spark-store';
import { useActivitiesStore } from '@/stores/activities-store';
import { usePaymentsStore } from '@/stores/payments-store';
import { useFinanzasStore } from '@/stores/finanzas-store';
import { useVaultStore } from '@/stores/vault-store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { listenCoupleTable, onCoupleRealtimeStatus } from '@/lib/couple-realtime';
import { DateReminders } from '@/components/date-reminders';
import { SessionWatch } from '@/components/session-watch';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { hasHydrated, isAuthenticated, instanceId, isOnline, setOnline, finishHydration, reconcileInstance } =
    useAuthStore();

  const moodsSubscribe = useMoodStore((s) => s.subscribeToChanges);
  const moodsFetch = useMoodStore((s) => s.fetchFromSupabase);
  const pruneMoods = useMoodStore((s) => s.pruneOldMoods);

  const memoriesSubscribe = useMemoriesStore((s) => s.subscribeToChanges);
  const memoriesFetch = useMemoriesStore((s) => s.fetchFromSupabase);

  const sparksSubscribe = useSparkStore((s) => s.subscribeToChanges);
  const sparksFetch = useSparkStore((s) => s.fetchFromSupabase);

  const activitiesSubscribe = useActivitiesStore((s) => s.subscribeToChanges);
  const activitiesFetch = useActivitiesStore((s) => s.fetchFromSupabase);

  const paymentsSubscribe = usePaymentsStore((s) => s.subscribeToChanges);
  const paymentsFetch = usePaymentsStore((s) => s.fetchFromSupabase);
  const finanzasSubscribe = useFinanzasStore((s) => s.subscribeToChanges);
  const finanzasFetch = useFinanzasStore((s) => s.fetchFromSupabase);
  const vaultSubscribe = useVaultStore((s) => s.subscribeToChanges);
  const vaultFetch = useVaultStore((s) => s.fetchFromSupabase);
  const liveRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().hasHydrated) {
        finishHydration();
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [finishHydration]);

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

  useEffect(() => {
    pruneMoods();
    if (hasHydrated && isAuthenticated) {
      reconcileInstance();
    }
  }, [hasHydrated, isAuthenticated, pruneMoods, reconcileInstance]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !instanceId || !isOnline || !isSupabaseConfigured()) {
      return;
    }

    const fetchAll = () => {
      moodsFetch();
      memoriesFetch();
      sparksFetch();
      activitiesFetch();
      paymentsFetch();
      finanzasFetch();
      vaultFetch();
      void useAuthStore.getState().fetchPresence();
    };

    fetchAll();

    const unsubscribers = [
      moodsSubscribe(),
      memoriesSubscribe(),
      sparksSubscribe(),
      activitiesSubscribe(),
      paymentsSubscribe(),
      finanzasSubscribe(),
      vaultSubscribe(),
      listenCoupleTable(instanceId, 'member_presence', () => {
        void useAuthStore.getState().fetchPresence();
      }),
    ];

    const armPoll = () => {
      return setInterval(fetchAll, liveRef.current ? 12_000 : 2500);
    };

    let poll = armPoll();
    const unsubStatus = onCoupleRealtimeStatus((live) => {
      liveRef.current = live;
      clearInterval(poll);
      poll = armPoll();
    });

    const onResume = () => {
      fetchAll();
      void useAuthStore.getState().recordPresence();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onResume();
    };

    window.addEventListener('focus', onResume);
    window.addEventListener('online', onResume);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      unsubStatus();
      clearInterval(poll);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onResume);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    hasHydrated,
    isAuthenticated,
    instanceId,
    isOnline,
    moodsFetch,
    memoriesFetch,
    sparksFetch,
    activitiesFetch,
    paymentsFetch,
    finanzasFetch,
    vaultFetch,
    moodsSubscribe,
    memoriesSubscribe,
    sparksSubscribe,
    activitiesSubscribe,
    paymentsSubscribe,
    finanzasSubscribe,
    vaultSubscribe,
  ]);

  return (
    <>
      <DateReminders />
      <SessionWatch />
      {children}
    </>
  );
}
