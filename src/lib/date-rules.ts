import type { Activity } from '@/stores/activities-store';
import { addCalendarMonths, getTodayISO } from '@/lib/utils';

export const DATE_LIST_LIMIT = 20;
export const DATE_WINDOW_MONTHS = 3;
export const DATE_RESCHEDULE_LIMIT = 3;
export const PHOTO_NUDGE_LIMIT = 10;

export const PRE_DATE_REMINDERS = [
  { id: '8h', minutes: 8 * 60, text: 'En 8 horas es su date. Hoy se trata de estar presentes, no de llegar perfectos.' },
  { id: '3h', minutes: 3 * 60, text: 'Faltan 3 horas. Dejen lo pendiente: este rato es de ustedes.' },
  { id: '1h', minutes: 60, text: 'En 1 hora se ven. Un vaso de agua, un perfume, y salgan con calma.' },
  { id: '15m', minutes: 15, text: '15 minutos. Disfruten este momento juntos.' },
  { id: '1m', minutes: 1, text: 'Ya es ahora. Vivan el presente juntos.' },
] as const;

export function activityStart(activity: Pick<Activity, 'due_date' | 'due_time'>): Date {
  const time = activity.due_time && /^\d{2}:\d{2}/.test(activity.due_time)
    ? activity.due_time.slice(0, 5)
    : '19:00';
  return new Date(`${activity.due_date}T${time}:00`);
}

export function windowEnd(from = new Date()) {
  return addCalendarMonths(from, DATE_WINDOW_MONTHS);
}

export function datesInWindow(dates: Activity[], from = new Date()) {
  const start = getTodayISO(from);
  const end = getTodayISO(windowEnd(from));
  return dates.filter(
    (a) => a.category === 'date' && a.status === 'pending' && a.due_date >= start && a.due_date <= end
  );
}

export function canAddDateToList(dates: Activity[], dueDate: string) {
  const start = getTodayISO();
  const end = getTodayISO(windowEnd());
  if (dueDate < start || dueDate > end) return false;
  return remainingListSlots(dates) > 0;
}

export function remainingListSlots(dates: Activity[], from = new Date()) {
  return Math.max(0, DATE_LIST_LIMIT - datesInWindow(dates, from).length);
}
