'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-pastel-pink-100',
          'bg-white/50 backdrop-blur-sm',
          'focus:outline-none focus:ring-2 focus:ring-pastel-pink-200 focus:border-transparent',
          'placeholder:text-gray-400',
          'transition-all',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
