'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { SectionIntro } from '@/components/ui/section-intro';
import { useActivitiesStore } from '@/stores/activities-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn, getTodayISO } from '@/lib/utils';
import {
  ACTIVITY_CATEGORIES,
  RECURRING_OPTIONS,
  RECURRING_UNITS,
  getCategoryInfo,
  type ActivityCategory,
  type RecurringType,
  type RecurringUnit,
} from '@/lib/constants';

const BIRTHDAYS = [
  { name: 'Amanda', date: '11-17', emoji: '🎂👩' },
  { name: 'Mau', date: '07-11', emoji: '🎂👨' },
];

function getNextBirthday(monthDay: string): string {
  const [month, day] = monthDay.split('-').map(Number);
  const today = new Date();
  const thisYear = today.getFullYear();

  today.setHours(0, 0, 0, 0);
  let birthdayDate = new Date(thisYear, month - 1, day);

  if (birthdayDate < today) {
    birthdayDate = new Date(thisYear + 1, month - 1, day);
  }

  return getTodayISO(birthdayDate);
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T12:00:00');
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CalendarioPage() {
  const { memberSlot } = useAuthStore();
  const addActivity = useActivitiesStore((s) => s.addActivity);
  const completeActivity = useActivitiesStore((s) => s.completeActivity);
  const deleteActivity = useActivitiesStore((s) => s.deleteActivity);
  const getPendingActivities = useActivitiesStore((s) => s.getPendingActivities);
  const getOverdueActivities = useActivitiesStore((s) => s.getOverdueActivities);
  useActivitiesStore((s) => s.activities);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('date');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [dueTime, setDueTime] = useState('');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringUnit, setRecurringUnit] = useState<RecurringUnit>('week');
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
      assigned_to: undefined,
      created_by: memberSlot,
      recurring,
      recurring_interval: recurring === 'custom' ? recurringInterval : 1,
      recurring_unit: recurring === 'custom' ? recurringUnit : 'day',
    });

    setTitle('');
    setDescription('');
    setCategory('date');
    setDueDate(getTodayISO());
    setDueTime('');
    setRecurring('none');
    setRecurringInterval(1);
    setRecurringUnit('week');
    setShowForm(false);
  };

  const handleComplete = (id: string) => {
    if (!memberSlot) return;
    setCompleting(id);
    setTimeout(() => {
      completeActivity(id, memberSlot);
      setCompleting(null);
    }, 300);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteActivity(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = getTodayISO();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getTodayISO(tomorrowDate);

    if (dateStr === today) return 'Hoy';
    if (dateStr === tomorrow) return 'Mañana';

    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <AppLayout title="Calendario">
      <div className="page-container space-y-6">
        <SectionIntro emoji="📅" title="Su tiempo, en un mismo lugar">
          Organicen dates, metas, pagos y pendientes. Lo que marquen como Date Juntos o Metas
          Juntos también aparece en Dates, en tiempo real.
        </SectionIntro>

        <Card className="p-4 bg-gradient-to-r from-pastel-pink-50 to-pastel-blue-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            🎂 Cumpleaños
          </h3>
          <div className="space-y-2">
            {BIRTHDAYS.map((bday) => {
              const nextDate = getNextBirthday(bday.date);
              const daysUntil = getDaysUntil(nextDate);
              return (
                <div key={bday.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span>{bday.emoji}</span>
                    <span className="font-medium">{bday.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(nextDate)}</p>
                    {daysUntil === 0 ? (
                      <p className="text-xs text-pastel-pink-400 font-bold">¡HOY! 🎉</p>
                    ) : daysUntil <= 7 ? (
                      <p className="text-xs text-pastel-pink-400">En {daysUntil} días</p>
                    ) : (
                      <p className="text-xs text-gray-400">En {daysUntil} días</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

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

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_CATEGORIES.filter((c) => c.value !== 'cumple').map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'px-3 py-2 rounded-full text-sm flex items-center gap-1 transition-all active:scale-95',
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

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Repetir</label>
              <div className="flex gap-2 flex-wrap">
                {RECURRING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRecurring(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm transition-all active:scale-95',
                      recurring === opt.value
                        ? 'bg-pastel-green-100 ring-2 ring-pastel-green-300'
                        : 'bg-gray-100 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {recurring === 'custom' && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-gray-600">Cada</span>
                  <Input
                    type="number"
                    min={1}
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20"
                  />
                  <select
                    value={recurringUnit}
                    onChange={(e) => setRecurringUnit(e.target.value as RecurringUnit)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {RECURRING_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full"
            >
              Guardar
            </Button>
          </Card>
        )}

        {overdueActivities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2">⚠️ Vencidas</h3>
            <div className="space-y-2">
              {overdueActivities.map((activity) => {
                const catInfo = getCategoryInfo(activity.category);
                return (
                  <Card
                    key={activity.id}
                    className={cn(
                      'p-3 border-l-4 border-red-400 bg-red-50 transition-all duration-300',
                      completing === activity.id && 'bg-pastel-green-100 scale-95 opacity-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleComplete(activity.id)}
                        disabled={completing === activity.id}
                        aria-label={`Completar ${activity.title}`}
                        className={cn(
                          'mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center',
                          completing === activity.id
                            ? 'border-pastel-green-400 bg-pastel-green-200'
                            : 'border-red-400 hover:bg-red-100 active:scale-90'
                        )}
                      >
                        {completing === activity.id && <span className="text-pastel-green-600 text-sm">✓</span>}
                      </button>
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
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(activity.id)}
                        aria-label={`Eliminar ${activity.title}`}
                        className="text-gray-400 hover:text-red-500 p-2 -m-2 hover:bg-red-100 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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

        {pendingActivities.filter((a) => !overdueActivities.includes(a)).length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">📋 Próximas</h3>
            <div className="space-y-2">
              {pendingActivities
                .filter((a) => !overdueActivities.includes(a))
                .map((activity) => {
                  const catInfo = getCategoryInfo(activity.category);
                  return (
                    <Card
                      key={activity.id}
                      className={cn(
                        'p-3 transition-all duration-300',
                        completing === activity.id && 'bg-pastel-green-100 scale-95 opacity-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleComplete(activity.id)}
                          disabled={completing === activity.id}
                          aria-label={`Completar ${activity.title}`}
                          className={cn(
                            'mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center',
                            completing === activity.id
                              ? 'border-pastel-green-400 bg-pastel-green-200'
                              : 'border-gray-300 hover:border-pastel-green-400 hover:bg-pastel-green-50 active:scale-90'
                          )}
                        >
                          {completing === activity.id && <span className="text-pastel-green-600 text-sm">✓</span>}
                        </button>
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
                              <span className="text-xs text-pastel-blue-400">🔄</span>
                            )}
                          </div>
                          <p className="font-medium mt-1">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setDeleteConfirm(activity.id)}
                          aria-label={`Eliminar ${activity.title}`}
                          className="text-gray-400 hover:text-red-500 p-2 -m-2 hover:bg-red-50 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                Agrega un date, una meta, un pago o pendiente
              </p>
            </div>
          )
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="¿Eliminar actividad?"
        message="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}
