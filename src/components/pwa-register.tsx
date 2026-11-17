'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usePaymentsStore } from '@/stores/payments-store';

export function PwaRegister() {
  const memberSlot = useAuthStore((s) => s.memberSlot);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notifyDuePayments = usePaymentsStore((s) => s.notifyDuePayments);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW register failed, retrying:', err);
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }, 2500);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !memberSlot) return;
    notifyDuePayments(memberSlot).catch(() => {});
    const interval = setInterval(() => {
      notifyDuePayments(memberSlot).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, memberSlot, notifyDuePayments]);

  return null;
}
