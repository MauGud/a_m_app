'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { notifyCouple } from '@/lib/notifications';
import { expiryNudgeCopy, shouldNudgeAmandaSilence, shouldNudgeExpiry } from '@/lib/session-watch';

export function SessionWatch() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const recordPresence = useAuthStore((s) => s.recordPresence);
  const fetchPresence = useAuthStore((s) => s.fetchPresence);
  const markExpiryNudge = useAuthStore((s) => s.markExpiryNudge);
  const markAmandaSilenceNudge = useAuthStore((s) => s.markAmandaSilenceNudge);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const tick = async () => {
      await recordPresence();
      await fetchPresence();
      const state = useAuthStore.getState();

      if (shouldNudgeExpiry(state.lastSecretVerifiedAt, state.lastExpiryNudgeAt)) {
        const body = expiryNudgeCopy(state.lastSecretVerifiedAt || Date.now());
        markExpiryNudge();
        await notifyCouple('A & M · código', body, '/setup');
      }

      if (
        state.memberSlot === 'MEMBER_B' &&
        shouldNudgeAmandaSilence(state.lastSeenByMember.MEMBER_A, state.lastAmandaSilenceNudgeAt)
      ) {
        markAmandaSilenceNudge();
        await notifyCouple('A & M', 'Amanda ya no entró a la app', '/');
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 60 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [
    fetchPresence,
    hasHydrated,
    isAuthenticated,
    markAmandaSilenceNudge,
    markExpiryNudge,
    recordPresence,
  ]);

  return null;
}
