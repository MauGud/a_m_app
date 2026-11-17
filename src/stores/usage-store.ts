import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemberSlot } from '@/lib/constants';
import { redactSecrets } from '@/lib/security';

export type UsageKind =
  | 'home'
  | 'dates'
  | 'calendario'
  | 'depto'
  | 'recuerdos'
  | 'spark'
  | 'mood'
  | 'super'
  | 'finanzas'
  | 'mensaje'
  | 'huella';

export interface UsageEvent {
  id: string;
  member: MemberSlot;
  kind: UsageKind;
  label: string;
  at: string;
}

interface UsageState {
  events: UsageEvent[];
  track: (member: MemberSlot | null, kind: UsageKind, label: string) => void;
  forMember: (member: MemberSlot) => UsageEvent[];
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      events: [],
      track: (member, kind, label) => {
        if (!member) return;
        const event: UsageEvent = {
          id: crypto.randomUUID(),
          member,
          kind,
          label: redactSecrets(label).slice(0, 80),
          at: new Date().toISOString(),
        };
        set((state) => ({ events: [event, ...state.events].slice(0, 800) }));
      },
      forMember: (member) => get().events.filter((e) => e.member === member),
    }),
    { name: 'espacio-pareja-usage', partialize: (s) => ({ events: s.events }) }
  )
);
