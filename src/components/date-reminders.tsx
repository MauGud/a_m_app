'use client';

import { useEffect } from 'react';
import { useActivitiesStore } from '@/stores/activities-store';
import { EMPTY_DATE_EXTRA, useDateExtraStore, type DateExtra } from '@/stores/date-extra-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { notifyCouple } from '@/lib/notifications';
import {
  PHOTO_NUDGE_LIMIT,
  PRE_DATE_REMINDERS,
  activityStart,
} from '@/lib/date-rules';

export function DateReminders() {
  const activities = useActivitiesStore((s) => s.activities);
  const extras = useDateExtraStore((s) => s.extras);
  const getExtra = useDateExtraStore((s) => s.getExtra);
  const patchExtra = useDateExtraStore((s) => s.patchExtra);
  const markReminder = useDateExtraStore((s) => s.markReminder);
  const memories = useMemoriesStore((s) => s.memories);

  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      for (const activity of activities) {
        if (activity.category !== 'date') continue;
        const start = activityStart(activity).getTime();
        const extra = {
          ...EMPTY_DATE_EXTRA,
          ...(activity.extra as Partial<DateExtra> | undefined),
          ...getExtra(activity.id),
        };

        if (activity.status === 'pending') {
          for (const reminder of PRE_DATE_REMINDERS) {
            const at = start - reminder.minutes * 60 * 1000;
            if (now >= at && now < at + 90 * 1000 && !extra.remindersSent.includes(reminder.id)) {
              markReminder(activity.id, reminder.id);
              await notifyCouple('A & M · su date', reminder.text, '/dates');
            }
          }
        }

        if (activity.status === 'completed' || now > start + 30 * 60 * 1000) {
          const linked = extra.memoryId || memories.some((m) => m.caption?.includes(activity.title));
          if (!linked && extra.photoNudges < PHOTO_NUDGE_LIMIT) {
            const last = extra.lastPhotoNudgeAt ? Date.parse(extra.lastPhotoNudgeAt) : 0;
            if (now - last > 45 * 60 * 1000) {
              patchExtra(activity.id, {
                photoNudges: extra.photoNudges + 1,
                lastPhotoNudgeAt: new Date().toISOString(),
              });
              await notifyCouple(
                'Suban la foto del date',
                `Queda el recuerdo de “${activity.title}”. Un instante basta para guardarlo juntos.`,
                `/recuerdos/nuevo?dateId=${encodeURIComponent(activity.id)}&title=${encodeURIComponent(activity.title)}&description=${encodeURIComponent(activity.description || '')}`
              );
            }
          }
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 20_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activities, extras, memories, getExtra, markReminder, patchExtra]);

  return null;
}
