export const COUPLE_SECRET = '1711';
export const SECRET_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
export const MOOD_RETENTION_DAYS = 30;

export const MEMBER_NAMES = {
  MEMBER_A: 'Amanda',
  MEMBER_B: 'Mau',
} as const;

export type MemberSlot = 'MEMBER_A' | 'MEMBER_B';
export type ActivityCategory =
  | 'date'
  | 'meta'
  | 'pago'
  | 'recoger'
  | 'pendiente'
  | 'casa'
  | 'compras'
  | 'cumple';
export type RecurringType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'custom';
export type RecurringUnit = 'day' | 'week' | 'month' | 'year';

export const ACTIVITY_CATEGORIES = [
  { value: 'date' as const, label: 'Date Juntos', emoji: '💕', color: 'bg-pastel-pink-100' },
  { value: 'meta' as const, label: 'Metas Juntos', emoji: '🎯', color: 'bg-pastel-blue-100' },
  { value: 'pago' as const, label: 'Pago', emoji: '💰', color: 'bg-yellow-100' },
  { value: 'recoger' as const, label: 'Recoger', emoji: '📦', color: 'bg-pastel-green-50' },
  { value: 'pendiente' as const, label: 'Pendiente', emoji: '✏️', color: 'bg-orange-100' },
  { value: 'casa' as const, label: 'Casa', emoji: '🏠', color: 'bg-pastel-green-100' },
  { value: 'compras' as const, label: 'Compras', emoji: '🛒', color: 'bg-purple-100' },
  { value: 'cumple' as const, label: 'Cumpleaños', emoji: '🎂', color: 'bg-pink-200' },
];

export const DATE_GOAL_CATEGORIES: ActivityCategory[] = ['date', 'meta'];

export const RECURRING_OPTIONS = [
  { value: 'none' as const, label: 'Una vez' },
  { value: 'daily' as const, label: 'Diario' },
  { value: 'weekly' as const, label: 'Semanal' },
  { value: 'biweekly' as const, label: 'Quincenal' },
  { value: 'monthly' as const, label: 'Mensual' },
  { value: 'yearly' as const, label: 'Anual' },
  { value: 'custom' as const, label: 'Personalizado' },
];

export const RECURRING_UNITS = [
  { value: 'day' as const, label: 'días' },
  { value: 'week' as const, label: 'semanas' },
  { value: 'month' as const, label: 'meses' },
  { value: 'year' as const, label: 'años' },
];

export function getCategoryInfo(category: string) {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category) || ACTIVITY_CATEGORIES[0];
}

export function isDateGoalCategory(category: string): boolean {
  return DATE_GOAL_CATEGORIES.includes(category as ActivityCategory);
}
