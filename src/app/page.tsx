'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useMoodStore } from '@/stores/mood-store';
import { usePlansStore } from '@/stores/plans-store';
import { useMemoriesStore } from '@/stores/memories-store';
import { useActivitiesStore } from '@/stores/activities-store';
import { getMoodEmoji, getMoodLabel } from '@/lib/utils';

export default function HomePage() {
  const { memberSlot } = useAuthStore();
  const { getTodayMood, getPartnerTodayMood } = useMoodStore();
  const { getPendingPlans } = usePlansStore();
  const { memories } = useMemoriesStore();
  const { getUpcomingActivities, getOverdueActivities } = useActivitiesStore();

  const myMood = memberSlot ? getTodayMood(memberSlot) : undefined;
  const partnerMood = memberSlot ? getPartnerTodayMood(memberSlot) : undefined;
  const pendingPlans = getPendingPlans();
  const upcomingActivities = getUpcomingActivities(7);
  const overdueActivities = getOverdueActivities();

  return (
    <AppLayout title="Inicio">
      <div className="page-container space-y-6">
        {/* Greeting */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Hola, {memberSlot === 'MEMBER_A' ? 'Amanda' : 'Mau'} 💕
          </h2>
          <p className="text-gray-600">¿Cómo estamos hoy?</p>
        </div>

        {/* Mood Section */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            😊 Estado de ánimo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/mood" className="block">
              <div className="text-center p-3 rounded-xl bg-pastel-pink-50 hover:bg-pastel-pink-100 transition-all">
                <p className="text-sm text-gray-600 mb-1">{memberSlot === 'MEMBER_A' ? 'Amanda' : 'Mau'}</p>
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
              <p className="text-sm text-gray-600 mb-1">{memberSlot === 'MEMBER_A' ? 'Mau' : 'Amanda'}</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/planes">
            <Card className="p-4 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">📋</span>
                <p className="text-2xl font-bold text-gray-800 mt-1">{pendingPlans.length}</p>
                <p className="text-sm text-gray-600">Planes pendientes</p>
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

        {/* Activities Alert */}
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
              {upcomingActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                  <span className="mr-2">
                    {activity.category === 'pago' && '💰'}
                    {activity.category === 'recoger' && '📦'}
                    {activity.category === 'pendiente' && '✏️'}
                    {activity.category === 'casa' && '🏠'}
                    {activity.category === 'compras' && '🛒'}
                  </span>
                  {activity.title}
                </div>
              ))}
              {upcomingActivities.length === 0 && overdueActivities.length === 0 && (
                <p className="text-sm text-gray-500">Sin actividades próximas</p>
              )}
            </Card>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/spark">
            <Card className="p-4 bg-gradient-to-br from-pastel-pink-50 to-pastel-blue-50 hover:shadow-md transition-all">
              <div className="text-center">
                <span className="text-2xl">💕</span>
                <p className="text-sm font-medium text-gray-800 mt-1">Spark del día</p>
              </div>
            </Card>
          </Link>
          <Link href="/camara">
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
