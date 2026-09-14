import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export const MOOD_CONFIG = {
  1: { emoji: '😢', label: 'Muy mal', color: 'bg-red-100' },
  2: { emoji: '😕', label: 'Mal', color: 'bg-orange-100' },
  3: { emoji: '😐', label: 'Normal', color: 'bg-yellow-100' },
  4: { emoji: '🙂', label: 'Bien', color: 'bg-pastel-green-100' },
  5: { emoji: '😄', label: 'Muy bien', color: 'bg-pastel-pink-100' },
} as const;

export function getMoodEmoji(value: number): string {
  return MOOD_CONFIG[value as keyof typeof MOOD_CONFIG]?.emoji || '😐';
}

export function getMoodLabel(value: number): string {
  return MOOD_CONFIG[value as keyof typeof MOOD_CONFIG]?.label || 'Normal';
}

export function getMoodColor(value: number): string {
  return MOOD_CONFIG[value as keyof typeof MOOD_CONFIG]?.color || 'bg-gray-100';
}
