'use client';

import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: number;
  className?: string;
  alt?: string;
}

export function BrandMark({ size = 40, className, alt = 'A & M' }: BrandMarkProps) {
  return (
    <img
      src="/logo-mark.png"
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={cn('select-none shrink-0 object-contain', className)}
    />
  );
}
