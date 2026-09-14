'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useActivitiesStore } from '@/stores/activities-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

type ActivityCategory = 'pago' | 'recoger' | 'pendiente' | 'casa' | 'compras';
type RecurringType = 'none' | 'weekly' | 'monthly';

const CATEGORIES = [
  { value: 'pago' as const, label: 'Pago', emoji: '💰', color: 'bg-pastel-pink-100' },
  { value: 'recoger' as const, label: 'Recoger', emoji: '📦', color: 'bg-pastel-blue-100' },
  { value: 'pendiente' as const, label: 'Pendiente', emoji: '✏️', color: 'bg-yellow-100' },
  { value: 'casa' as const, label: 'Casa', emoji: '🏠', color: 'bg-pastel-green-100' },
  { value: 'compras' as const, label: 'Compras', emoji: '🛒', color: 'bg-purple-100' },
];

const RECURRING_OPTIONS = [
  { value: 'none' as const, label: 'Una vez' },
  { value: 'weekly' as const, label: 'Semanal' },
  { value: 'monthly' as const, label: 'Mensual' },
];

export default function CalendarioPage() {
  const { memberSlot, displayName, partnerName } = useAuthStore();
  const {
    addActivity,
    completeActivity,
    deleteActivity,
    getPendingActivities,
    getOverdueActivities,
  } = useActivitiesStore();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('pendiente');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('');
  const [assignedTo, setAssignedTo] = useState<'MEMBER_A' | 'MEMBER_B' | ''>('');
  const [recurring, setRecurring] = useState<RecurringType>('none');

  const pendingActivities = getPendingActivities();
  const overdueActivities = getOverdueActivities();

  const handleSubmit = () => {
    if (!title.trim() || !memberSlot) return;

    addActivity({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      due_date: dueDate,
      due_time: dueTime || undefined,
      assigned_to: assignedTo || undefined,
      created_by: memberSlot,
      recurring,
    });

    setTitle('');
    setDescription('');
    setCategory('pendiente');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('');
    setAssignedTo('');
    setRecurring('none');
    setShowForm(false);
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[2];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoy';
    if (dateStr === tomorrowStr) return 'Mañana';

    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getMemberName = (slot?: 'MEMBER_A' | 'MEMBER_B') => {
    if (!slot) return null;
    return slot === memberSlot ? displayName : partnerName;
  };

  return (
    <AppLayout title="Calendario">
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              {pendingActivities.length} pendientes
              {overdueActivities.length > 0 && (
                <span className="text-red-500 ml-2">
                  ({overdueActivities.length} vencidas)
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nueva'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-4 space-y-4 border-2 border-pastel-pink-200">
            <Input
              placeholder="¿Qué hay que hacer?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            <Textarea
              placeholder="Detalles adicionales (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            {/* Categories */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'px-3 py-2 rounded-full text-sm flex items-center gap-1 transition-all',
                      category === cat.value
                        ? `${cat.color} ring-2 ring-offset-1 ring-gray-400`
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Fecha</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Hora (opcional)</label>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            {/* Assign to */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Asignar a</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignedTo('')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm flex-1 transition-all',
                    assignedTo === ''
                      ? 'bg-pastel-blue-100 ring-2 ring-pastel-blue-300'
                      : 'bg-gray-100'
                  )}
                >
                  👫 Ambos
                </button>
                <button
                  onClick={() => setAssignedTo('MEMBER_A')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm flex-1 transition-all',
                    assignedTo === 'MEMBER_A'
                      ? 'bg-pastel-pink-100 ring-2 ring-pastel-pink-300'
                      : 'bg-gray-100'
                  )}
                >
                  {memberSlot === 'MEMBER_A' ? displayName : partnerName}
                </button>
                <button
                  onClick={() => setAssignedTo('MEMBER_B')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm flex-1 transition-all',
                    assignedTo === 'MEMBER_B'
                      ? 'bg-pastel-green-100 ring-2 ring-pastel-green-300'
                      : 'bg-gray-100'
                  )}
                >
                  {memberSlot === 'MEMBER_B' ? displayName : partnerName}
                </button>
              </div>
            </div>

            {/* Recurring */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Repetir</label>
              <div className="flex gap-2">
                {RECURRING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRecurring(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm flex-1 transition-all',
                      recurring === opt.value
                        ? 'bg-pastel-green-100 ring-2 ring-pastel-green-300'
                        : 'bg-gray-100'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full"
            >
              Guardar actividad
            </Button>
          </Card>
        )}

        {/* Overdue activities */}
        {overdueActivities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2">⚠️ Vencidas</h3>
            <div className="space-y-2">
              {overdueActivities.map((activity) => {
                const catInfo = getCategoryInfo(activity.category);
                return (
                  <Card
                    key={activity.id}
                    className="p-3 border-l-4 border-red-400 bg-red-50"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => memberSlot && completeActivity(activity.id, memberSlot)}
                        className="mt-1 w-5 h-5 rounded-full border-2 border-red-400 flex-shrink-0 hover:bg-red-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', catInfo.color)}>
                            {catInfo.emoji} {catInfo.label}
                          </span>
                          <span className="text-xs text-red-600">
                            {formatDate(activity.due_date)}
                          </span>
                        </div>
                        <p className="font-medium mt-1">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                        )}
                        {activity.assigned_to && (
                          <p className="text-xs text-gray-500 mt-1">
                            → {getMemberName(activity.assigned_to)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending activities */}
        {pendingActivities.filter((a) => !overdueActivities.includes(a)).length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">📋 Próximas</h3>
            <div className="space-y-2">
              {pendingActivities
                .filter((a) => !overdueActivities.includes(a))
                .map((activity) => {
                  const catInfo = getCategoryInfo(activity.category);
                  return (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => memberSlot && completeActivity(activity.id, memberSlot)}
                          className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-pastel-green-400 hover:bg-pastel-green-50"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', catInfo.color)}>
                              {catInfo.emoji} {catInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.due_date)}
                              {activity.due_time && ` ${activity.due_time}`}
                            </span>
                            {activity.recurring !== 'none' && (
                              <span className="text-xs text-pastel-blue-400">
                                🔄 {activity.recurring === 'weekly' ? 'Semanal' : 'Mensual'}
                              </span>
                            )}
                          </div>
                          <p className="font-medium mt-1">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          )}
                          {activity.assigned_to && (
                            <p className="text-xs text-gray-500 mt-1">
                              → {getMemberName(activity.assigned_to)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        ) : (
          !showForm && overdueActivities.length === 0 && (
            <div className="empty-state">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-gray-500">No hay actividades pendientes</p>
              <p className="text-sm text-gray-400 mt-1">
                Agrega pagos, pendientes o tareas del hogar
              </p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
