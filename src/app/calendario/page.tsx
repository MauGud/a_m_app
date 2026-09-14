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

type ActivityCategory = 'pago' | 'recoger' | 'pendiente' | 'casa' | 'compras' | 'date' | 'cumple';
type RecurringType = 'none' | 'weekly' | 'monthly' | 'yearly';

const CATEGORIES = [
  { value: 'date' as const, label: 'Date Juntos', emoji: '💕', color: 'bg-pastel-pink-100' },
  { value: 'pago' as const, label: 'Pago', emoji: '💰', color: 'bg-yellow-100' },
  { value: 'recoger' as const, label: 'Recoger', emoji: '📦', color: 'bg-pastel-blue-100' },
  { value: 'pendiente' as const, label: 'Pendiente', emoji: '✏️', color: 'bg-orange-100' },
  { value: 'casa' as const, label: 'Casa', emoji: '🏠', color: 'bg-pastel-green-100' },
  { value: 'compras' as const, label: 'Compras', emoji: '🛒', color: 'bg-purple-100' },
  { value: 'cumple' as const, label: 'Cumpleaños', emoji: '🎂', color: 'bg-pink-200' },
];

const RECURRING_OPTIONS = [
  { value: 'none' as const, label: 'Una vez' },
  { value: 'weekly' as const, label: 'Semanal' },
  { value: 'monthly' as const, label: 'Mensual' },
  { value: 'yearly' as const, label: 'Anual' },
];

// Cumpleaños fijos
const BIRTHDAYS = [
  { name: 'Amanda', date: '11-17', emoji: '🎂👩' },
  { name: 'Mau', date: '07-11', emoji: '🎂👨' },
];

function getNextBirthday(monthDay: string): string {
  const [month, day] = monthDay.split('-').map(Number);
  const today = new Date();
  const thisYear = today.getFullYear();
  
  let birthdayDate = new Date(thisYear, month - 1, day);
  
  if (birthdayDate < today) {
    birthdayDate = new Date(thisYear + 1, month - 1, day);
  }
  
  return birthdayDate.toISOString().split('T')[0];
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CalendarioPage() {
  const { memberSlot } = useAuthStore();
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
  const [category, setCategory] = useState<ActivityCategory>('date');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('');
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
      assigned_to: undefined,
      created_by: memberSlot,
      recurring: recurring === 'yearly' ? 'monthly' : recurring, // yearly se maneja como monthly por ahora
    });

    setTitle('');
    setDescription('');
    setCategory('date');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('');
    setRecurring('none');
    setShowForm(false);
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[0];
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

  return (
    <AppLayout title="Calendario">
      <div className="page-container space-y-6">
        {/* Cumpleaños */}
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
                {CATEGORIES.filter(c => c.value !== 'cumple').map((cat) => (
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

            {/* Recurring */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Repetir</label>
              <div className="flex gap-2 flex-wrap">
                {RECURRING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRecurring(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm transition-all',
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
              Guardar
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
                                🔄
                              </span>
                            )}
                          </div>
                          <p className="font-medium mt-1">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
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
                Agrega un date, pago o pendiente
              </p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
