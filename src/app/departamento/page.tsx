'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { ErrorBoundary } from '@/components/error-boundary';
import { SectionIntro } from '@/components/ui/section-intro';
import { cn } from '@/lib/utils';
import { AddressPanel } from './address-panel';
import { FinanzasPanel } from './finanzas-panel';
import { PaymentsPanel } from './payments-panel';
import { InstallPanel } from './install-panel';
import { SuperPanel } from './super-panel';
import { TallerPanel } from './taller-panel';
import { useAuthStore } from '@/stores/auth-store';

const TABS = [
  { id: 'depto', label: 'Depto' },
  { id: 'super', label: 'Súper' },
  { id: 'finanzas', label: 'Presupuesto' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'instalar', label: 'App' },
  { id: 'taller', label: 'Taller' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function DepartamentoPage() {
  const searchParams = useSearchParams();
  const { memberSlot } = useAuthStore();
  const isMau = memberSlot === 'MEMBER_B';
  const visibleTabs = TABS.filter((item) => {
    if (item.id === 'finanzas' || item.id === 'taller') return isMau;
    return true;
  });
  const initial = searchParams.get('tab');
  const [tab, setTab] = useState<TabId>(() => {
    if (isTab(initial)) {
      if (!isMau && (initial === 'finanzas' || initial === 'taller')) return 'depto';
      return initial;
    }
    return 'depto';
  });

  useEffect(() => {
    if (!isMau && (tab === 'finanzas' || tab === 'taller')) {
      setTab('depto');
    }
  }, [isMau, tab]);

  const intro = useMemo(() => {
    if (tab === 'super') {
      return {
        emoji: '🛒',
        title: 'Súper del depto',
        text: 'Busquen por pasillo, SKU real o marca. Presencial con mapa; en línea abre Chedraui, Soriana, Walmart o Jüsto. El cobro queda en su caja, no aquí.',
      };
    }
    if (tab === 'finanzas') {
      return {
        emoji: '💬',
        title: 'Consultas de presupuesto',
        text: 'El mismo asistente de Finanzas Mau, con el look de esta app: deudas, cajas, quincena y gastos, sin salir de aquí.',
      };
    }
    if (tab === 'pagos') {
      return {
        emoji: '💰',
        title: 'Recordatorios de pagos',
        text: 'Amanda o Mau pueden crear un pago y asignárselo al otro. Si activan notificaciones, el teléfono avisa.',
      };
    }
    if (tab === 'instalar') {
      return {
        emoji: '📲',
        title: 'Como una app en el celular',
        text: 'Agréguenla a la pantalla de inicio. Queda el icono de A & M junto al resto de apps.',
      };
    }
    if (tab === 'taller') {
      return {
        emoji: '🛠️',
        title: 'Taller de Mau',
        text: 'Protocolo de tarjetas, gemelo de Finanzas y reportes. Amanda no ve esta pestaña.',
      };
    }
    return {
      emoji: '🏡',
      title: 'Cosas del departamento',
      text: isMau
        ? 'La dirección, el presupuesto y los pagos del depto, en un solo lugar para los dos.'
        : 'La dirección y los pagos del depto, en un solo lugar para los dos.',
    };
  }, [isMau, tab]);

  const selectTab = (next: TabId) => {
    setTab(next);
    const url = `/departamento?tab=${next}`;
    window.history.replaceState(window.history.state, '', url);
  };

  return (
    <AppLayout title="Departamento">
      <ErrorBoundary>
        <div className="page-container space-y-4">
          <SectionIntro emoji={intro.emoji} title={intro.title}>
            {intro.text}
          </SectionIntro>

          <div className="flex gap-1 overflow-x-auto bg-gray-100 border border-gray-100 rounded-2xl p-1">
            {visibleTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={cn(
                  'flex-1 min-w-0 rounded-xl px-2 py-2 text-[11px] font-medium transition-all',
                  tab === item.id
                    ? 'bg-pastel-pink-100 text-gray-800'
                    : 'text-gray-600 hover:bg-white'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'depto' && <AddressPanel />}
          {tab === 'super' && <SuperPanel />}
          {tab === 'finanzas' && <FinanzasPanel />}
          {tab === 'pagos' && <PaymentsPanel />}
          {tab === 'instalar' && <InstallPanel />}
          {tab === 'taller' && isMau && <TallerPanel />}
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function DepartamentoRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-2xl">🏡</div>
        </div>
      }
    >
      <DepartamentoPage />
    </Suspense>
  );
}
