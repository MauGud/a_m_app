import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DateExtra {
  ideaId?: string;
  city?: string;
  state?: string;
  country?: string;
  priceMxn?: number;
  rescheduleCount: number;
  remindersSent: string[];
  photoNudges: number;
  lastPhotoNudgeAt?: string;
  memoryId?: string;
}

interface DateExtraState {
  extras: Record<string, DateExtra>;
  getExtra: (id: string) => DateExtra;
  patchExtra: (id: string, patch: Partial<DateExtra>) => void;
  markReminder: (id: string, reminderId: string) => void;
}

export const EMPTY_DATE_EXTRA: DateExtra = {
  rescheduleCount: 0,
  remindersSent: [],
  photoNudges: 0,
};

export const useDateExtraStore = create<DateExtraState>()(
  persist(
    (set, get) => ({
      extras: {},
      getExtra: (id) => get().extras[id] || EMPTY_DATE_EXTRA,
      patchExtra: (id, patch) =>
        set((state) => ({
          extras: {
            ...state.extras,
            [id]: { ...EMPTY_DATE_EXTRA, ...state.extras[id], ...patch },
          },
        })),
      markReminder: (id, reminderId) => {
        const extra = get().getExtra(id);
        if (extra.remindersSent.includes(reminderId)) return;
        get().patchExtra(id, { remindersSent: [...extra.remindersSent, reminderId] });
      },
    }),
    { name: 'espacio-pareja-date-extra', partialize: (s) => ({ extras: s.extras }) }
  )
);
