import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { impactPrompt, mapImpact, type ImpactReport } from '@/lib/impact';
import { MAU_OPS_EMAIL, assertSafeText, redactSecrets, safeLog } from '@/lib/security';
import { useAuthStore } from './auth-store';

export interface OpsIncident {
  id: string;
  text: string;
  report: ImpactReport;
  cursorPrompt: string;
  at: string;
  status: 'open' | 'sent';
}

interface OpsState {
  incidents: OpsIncident[];
  report: (text: string) => OpsIncident;
  markSent: (id: string) => void;
}

export function mailtoForIncident(incident: OpsIncident) {
  const body = encodeURIComponent(
    `${incident.text}\n\n${incident.report.title}\n${incident.report.summary}\n\n${incident.cursorPrompt}`
  );
  const subject = encodeURIComponent(`A & M · ${incident.report.title}`);
  return `mailto:${MAU_OPS_EMAIL}?subject=${subject}&body=${body}`;
}

export const useOpsStore = create<OpsState>()(
  persist(
    (set) => ({
      incidents: [],
      report: (raw) => {
        const text = redactSecrets(raw.trim());
        assertSafeText('reporte', text);
        const report = mapImpact(text);
        const incident: OpsIncident = {
          id: crypto.randomUUID(),
          text,
          report,
          cursorPrompt: impactPrompt(text, report),
          at: new Date().toISOString(),
          status: 'open',
        };
        set((state) => ({ incidents: [incident, ...state.incidents].slice(0, 40) }));
        const slot = useAuthStore.getState().memberSlot;
        if (slot && slot !== 'MEMBER_B') {
          safeLog('ops ignored for non-Mau');
        }
        return incident;
      },
      markSent: (id) =>
        set((state) => ({
          incidents: state.incidents.map((item) => (item.id === id ? { ...item, status: 'sent' } : item)),
        })),
    }),
    { name: 'espacio-pareja-ops-v1', partialize: (state) => ({ incidents: state.incidents }) }
  )
);
