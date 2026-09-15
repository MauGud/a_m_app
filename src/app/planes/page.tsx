'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PlanesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dates');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-2xl">💕</div>
    </div>
  );
}
