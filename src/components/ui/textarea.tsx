'use client';

import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-pastel-pink-100',
          'bg-white/50 backdrop-blur-sm',
          'focus:outline-none focus:ring-2 focus:ring-pastel-pink-200 focus:border-transparent',
          'placeholder:text-gray-400',
          'transition-all resize-none',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
