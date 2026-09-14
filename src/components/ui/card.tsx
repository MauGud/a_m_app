'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-pastel-pink-100 p-4',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
