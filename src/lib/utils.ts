import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T12:00:00`);
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  const d = parseLocalDate(date);
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = parseLocalDate(date);
  return d.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISO(date: Date = new Date()): string {
  return getLocalISODate(date);
}

export function getCalendarDaysUntil(dateStr: string, from: Date = new Date()): number {
  const today = getLocalISODate(from);
  const start = Date.parse(`${today}T12:00:00`);
  const end = Date.parse(`${dateStr}T12:00:00`);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  if (days > 1) return `En ${days} días`;
  return `Hace ${Math.abs(days)} días`;
}

export function daysAgoISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalISODate(date);
}

export function addCalendarMonths(date: Date, months: number, anchorDay?: number): Date {
  const day = anchorDay ?? date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

export function getNextDueDate(
  dueDate: string,
  recurring: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom',
  interval = 1,
  unit: 'day' | 'week' | 'month' | 'year' = 'day',
  anchorDay?: number
): string | null {
  if (recurring === 'none') return null;

  const current = parseLocalDate(dueDate);
  const day = anchorDay ?? current.getDate();
  let next = new Date(current);

  if (recurring === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (recurring === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (recurring === 'biweekly') {
    next.setDate(next.getDate() + 14);
  } else if (recurring === 'monthly') {
    next = addCalendarMonths(current, 1, day);
  } else if (recurring === 'yearly') {
    next = addCalendarMonths(current, 12, day);
  } else if (recurring === 'custom') {
    const step = Math.max(1, interval);
    if (unit === 'day') next.setDate(next.getDate() + step);
    else if (unit === 'week') next.setDate(next.getDate() + step * 7);
    else if (unit === 'month') next = addCalendarMonths(current, step, day);
    else if (unit === 'year') next = addCalendarMonths(current, step * 12, day);
  }

  return getLocalISODate(next);
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
