'use client';

import { BrandMark } from '@/components/brand/brand-mark';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-pastel-pink-100">
      <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
        <BrandMark size={36} />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-800 truncate">{title}</h1>
          <p className="text-sm text-gray-500">Amanda 💕 Mau</p>
        </div>
      </div>
    </header>
  );
}
