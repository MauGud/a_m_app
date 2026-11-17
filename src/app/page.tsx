'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useMoodStore } from '@/stores/mood-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { useActivitiesStore } from '@/stores/activities-store';
import { getMoodEmoji, getMoodLabel, getTodayISO } from '@/lib/utils';
import { MEMBER_NAMES, getCategoryInfo, DATE_GOAL_CATEGORIES } from '@/lib/constants';

export default function HomePage() {
  const { memberSlot } = useAuthStore();
  const moods = useMoodStore((s) => s.moods);
  const memories = useMemoriesStore((s) => s.memories);
  const activities = useActivitiesStore((s) => s.activities);
  const getUpcomingActivities = useActivitiesStore((s) => s.getUpcomingActivities);
  const getOverdueActivities = useActivitiesStore((s) => s.getOverdueActivities);

  const myName = memberSlot === 'MEMBER_A' ? MEMBER_NAMES.MEMBER_A : MEMBER_NAMES.MEMBER_B;
  const partnerName = memberSlot === 'MEMBER_A' ? MEMBER_NAMES.MEMBER_B : MEMBER_NAMES.MEMBER_A;
  const todayISO = getTodayISO();
  const myMood = memberSlot
    ? moods.find((m) => m.member === memberSlot && m.date === todayISO)
    : undefined;
  const partnerSlot = memberSlot === 'MEMBER_A' ? 'MEMBER_B' : 'MEMBER_A';
  const partnerMood = memberSlot
    ? moods.find((m) => m.member === partnerSlot && m.date === todayISO)
    : undefined;
  const pendingDates = activities.filter(
    (a) => DATE_GOAL_CATEGORIES.includes(a.category) && a.status === 'pending'
  );
  const upcomingActivities = getUpcomingActivities(7);
  const overdueActivities = getOverdueActivities();

  return (
    <AppLayout title="Inicio">
      <div className="page-container space-y-6">
        <SectionIntro emoji="🏠" title="Su espacio, al mismo tiempo">
          Todo lo que uno agrega —un mood, un date, un spark, un recuerdo— llega al otro en tiempo
          real. Aquí se cuida la magia de estar juntos.
        </SectionIntro>

        <div className="text-center py-2">
          <h2 className="text-2xl font-bold text-gray-800">
            Hola, {myName} 💕
          </h2>
          <p className="text-gray-600">¿Cómo estamos hoy?</p>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            😊 Estado de ánimo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/mood" className="block">
              <div className="text-center p-3 rounded-xl bg-pastel-pink-50 hover:bg-pastel-pink-100 transition-all">
                <p className="text-sm text-gray-600 mb-1">{myName}</p>
                {myMood ? (
                  <>
                    <span className="text-3xl">{getMoodEmoji(myMood.value)}</span>
                    <p className="text-xs text-gray-500 mt-1">{getMoodLabel(myMood.value)}</p>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Sin registrar</p>
                )}
              </div>
            </Link>
            <div className="text-center p-3 rounded-xl bg-pastel-green-50">
              <p className="text-sm text-gray-600 mb-1">{partnerName}</p>
              {partnerMood ? (
                <>
                  <span className="text-3xl">{getMoodEmoji(partnerMood.value)}</span>
                  <p className="text-xs text-gray-500 mt-1">{getMoodLabel(partnerMood.value)}</p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">Sin registrar</p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/dates">
            <Card className="p-4 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">💕</span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{pendingDates.length}</p>
                <p className="text-sm text-gray-600">Dates y metas</p>
              </div>
            </Card>
          </Link>
          <Link href="/recuerdos">
            <Card className="p-4 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">📷</span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{memories.length}</p>
                <p className="text-sm text-gray-600">Recuerdos</p>
              </div>
            </Card>
          </Link>
        </div>

        {(overdueActivities.length > 0 || upcomingActivities.length > 0) && (
          <Link href="/calendario">
            <Card className={`p-4 ${overdueActivities.length > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                📅 Calendario
                {overdueActivities.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {overdueActivities.length} vencidas
                  </span>
                )}
              </h3>
              {upcomingActivities.slice(0, 3).map((activity) => {
                const cat = getCategoryInfo(activity.category);
                return (
                  <div key={activity.id} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                    <span className="mr-2">{cat.emoji}</span>
                    {activity.title}
                  </div>
                );
              })}
              {upcomingActivities.length === 0 && overdueActivities.length === 0 && (
                <p className="text-sm text-gray-500">Sin actividades próximas</p>
              )}
            </Card>
          </Link>
        )}

        <Link href="/departamento">
          <Card className="p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏡</span>
              <div>
                <p className="font-medium text-gray-800">Cosas del departamento</p>
                <p className="text-sm text-gray-600">Dirección, presupuesto y pagos</p>
              </div>
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/spark">
            <Card className="p-4 bg-gradient-to-br from-pastel-pink-50 to-pastel-blue-50 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">✨</span>
                <p className="text-sm font-medium text-gray-800 mt-1">Spark del día</p>
              </div>
            </Card>
          </Link>
          <Link href="/recuerdos/nuevo">
            <Card className="p-4 bg-gradient-to-br from-pastel-green-50 to-pastel-blue-50 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">📸</span>
                <p className="text-sm font-medium text-gray-800 mt-1">Nuevo recuerdo</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
