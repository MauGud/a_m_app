'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CamaraRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/recuerdos/nuevo');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-2xl">📸</div>
    </div>
  );
}
