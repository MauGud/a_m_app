'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { useUsageStore } from '@/stores/usage-store';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, memberSlot } = useAuthStore();
  const track = useUsageStore((s) => s.track);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/setup');
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    const kind =
      title === 'Dates'
        ? 'dates'
        : title === 'Recuerdos'
          ? 'recuerdos'
          : title === 'Departamento'
            ? 'depto'
            : title === 'Spark'
              ? 'spark'
              : title === 'Mood'
                ? 'mood'
                : title === 'Calendario'
                  ? 'calendario'
                  : 'home';
    track(memberSlot, kind, title);
  }, [title, hasHydrated, isAuthenticated, memberSlot, track]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl">💕</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title={title} />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
