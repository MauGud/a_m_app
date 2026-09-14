'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-pastel-pink-100 text-gray-800 hover:bg-pastel-pink-200 focus:ring-pastel-pink-200':
              variant === 'primary',
            'bg-pastel-blue-100 text-gray-800 hover:bg-pastel-blue-200 focus:ring-pastel-blue-200':
              variant === 'secondary',
            'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200':
              variant === 'ghost',
            'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-200':
              variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
