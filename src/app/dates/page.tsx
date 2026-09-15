'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { SectionIntro } from '@/components/ui/section-intro';
import { useAuthStore } from '@/stores/auth-store';
import { useActivitiesStore } from '@/stores/activities-store';
import { cn, getTodayISO } from '@/lib/utils';
import {
  ACTIVITY_CATEGORIES,
  DATE_GOAL_CATEGORIES,
  RECURRING_OPTIONS,
  RECURRING_UNITS,
  getCategoryInfo,
  type ActivityCategory,
  type RecurringType,
  type RecurringUnit,
} from '@/lib/constants';

const DATE_CATEGORIES = ACTIVITY_CATEGORIES.filter(
  (c) => c.value === 'date' || c.value === 'meta'
);

export default function DatesPage() {
  const { memberSlot } = useAuthStore();
  const activities = useActivitiesStore((s) => s.activities);
  const addActivity = useActivitiesStore((s) => s.addActivity);
  const completeActivity = useActivitiesStore((s) => s.completeActivity);
  const deleteActivity = useActivitiesStore((s) => s.deleteActivity);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('date');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [dueTime, setDueTime] = useState('');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringUnit, setRecurringUnit] = useState<RecurringUnit>('week');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [completing, setCompleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const pending = activities
    .filter((a) => DATE_GOAL_CATEGORIES.includes(a.category) && a.status === 'pending')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const completed = activities
    .filter((a) => DATE_GOAL_CATEGORIES.includes(a.category) && a.status === 'completed')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const resetForm = () => {
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
    resetForm();
  };

  const handleComplete = (id: string) => {
    if (!memberSlot) return;
    setCompleting(id);
    setTimeout(() => {
      completeActivity(id, memberSlot);
      setCompleting(null);
    }, 300);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = getTodayISO();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;
    if (dateStr === today) return 'Hoy';
    if (dateStr === tomorrow) return 'Mañana';
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const list = activeTab === 'pending' ? pending : completed;

  return (
    <AppLayout title="Dates y Metas Juntos">
      <div className="page-container space-y-4">
        <SectionIntro emoji="💕" title="Lo que sueñan y viven juntos">
          Aquí solo viven los Dates y las Metas Juntos. Todo lo que agreguen se refleja en el
          calendario, y lo que marquen allá como Date o Meta aparece aquí.
        </SectionIntro>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeTab === 'pending'
                  ? 'bg-pastel-pink-100 text-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              Pendientes ({pending.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeTab === 'completed'
                  ? 'bg-pastel-green-100 text-gray-800'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              Logrados ({completed.length})
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? '✕' : '+'}
          </Button>
        </div>

        {showForm && (
          <Card className="p-4 space-y-3 border-2 border-pastel-pink-200">
            <Input
              placeholder="¿Qué quieren vivir o lograr juntos?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {DATE_CATEGORIES.map((cat) => (
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

            <Button onClick={handleSubmit} disabled={!title.trim()} className="w-full">
              Guardar
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="empty-state">
              <p className="text-4xl mb-2">{activeTab === 'pending' ? '🎯' : '✨'}</p>
              <p className="text-gray-500">
                {activeTab === 'pending'
                  ? 'No hay dates ni metas pendientes'
                  : 'Aún no han completado dates o metas'}
              </p>
              {activeTab === 'pending' && (
                <p className="text-sm text-gray-400 mt-1">
                  Agreguen un date o una meta juntos
                </p>
              )}
            </div>
          ) : (
            list.map((item) => {
              const catInfo = getCategoryInfo(item.category);
              const isDone = item.status === 'completed';
              return (
                <Card
                  key={item.id}
                  className={cn(
                    'p-4 transition-all duration-300',
                    completing === item.id && 'bg-pastel-green-100 scale-95 opacity-50',
                    isDone && 'bg-pastel-green-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isDone ? (
                      <span className="mt-1 w-6 h-6 rounded-full bg-pastel-green-200 flex items-center justify-center text-pastel-green-600 text-sm flex-shrink-0">
                        ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleComplete(item.id)}
                        disabled={completing === item.id}
                        aria-label={`Completar ${item.title}`}
                        className={cn(
                          'mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center',
                          completing === item.id
                            ? 'border-pastel-green-400 bg-pastel-green-200'
                            : 'border-pastel-pink-200 hover:bg-pastel-pink-100 hover:border-pastel-pink-300 active:scale-90'
                        )}
                      >
                        {completing === item.id && (
                          <span className="text-pastel-green-600 text-sm">✓</span>
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', catInfo.color)}>
                          {catInfo.emoji} {catInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.due_date)}
                          {item.due_time && ` ${item.due_time}`}
                        </span>
                        {item.recurring !== 'none' && (
                          <span className="text-xs text-pastel-blue-400">🔄</span>
                        )}
                      </div>
                      <h3 className={cn('font-medium mt-1', isDone ? 'text-gray-600 line-through' : 'text-gray-800')}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className={cn('text-sm mt-1', isDone ? 'text-gray-500' : 'text-gray-600')}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {!isDone && (
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        aria-label={`Eliminar ${item.title}`}
                        className="text-gray-400 hover:text-red-500 p-2 -m-2 hover:bg-red-50 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="¿Eliminar?"
        message="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm) deleteActivity(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}
