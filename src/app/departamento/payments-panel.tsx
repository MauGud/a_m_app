'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useAuthStore } from '@/stores/auth-store';
import { usePaymentsStore } from '@/stores/payments-store';
import { MEMBER_NAMES, PAYMENT_PRESETS, RECURRING_OPTIONS, type MemberSlot, type RecurringType } from '@/lib/constants';
import { formatMoney } from '@/lib/finanzas';
import { ensureNotificationPermission } from '@/lib/notifications';
import { cn, getTodayISO } from '@/lib/utils';
import { VaultPanel } from './vault-panel';

export function PaymentsPanel() {
  const { memberSlot } = useAuthStore();
  const payments = usePaymentsStore((s) => s.payments);
  const addPayment = usePaymentsStore((s) => s.addPayment);
  const completePayment = usePaymentsStore((s) => s.completePayment);
  const deletePayment = usePaymentsStore((s) => s.deletePayment);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [assignedTo, setAssignedTo] = useState<MemberSlot | null>(null);
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [notifyStatus, setNotifyStatus] = useState('Las notificaciones se piden una vez y sirven para ambos.');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const assignee = assignedTo ?? memberSlot ?? 'MEMBER_A';

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setNotifyStatus('Notificaciones activadas 💕');
    }
  }, []);

  const pending = payments
    .filter((p) => p.status === 'pending')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const done = payments.filter((p) => p.status === 'completed').slice(0, 8);

  const enableNotifications = async () => {
    const permission = await ensureNotificationPermission();
    if (permission === 'granted') setNotifyStatus('Notificaciones activadas 💕');
    else if (permission === 'denied') setNotifyStatus('El celular bloqueó avisos. Actívenlos en Ajustes.');
    else if (permission === 'unsupported') setNotifyStatus('Este navegador no permite avisos. Instalen la app.');
    else setNotifyStatus('Aún no se activaron.');
  };

  const submit = async () => {
    if (!title.trim() || !memberSlot || saving) return;
    const value = Number(amount.replace(/,/g, ''));
    if (!Number.isFinite(value) || value < 0) return;
    setSaving(true);
    try {
      await addPayment({
        title: title.trim(),
        amount: value,
        due_date: dueDate,
        assigned_to: assignee,
        created_by: memberSlot,
        recurring,
      });
      setTitle('');
      setAmount('');
      setRecurring('none');
    } catch (err) {
      console.warn('Payment create recovered:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <VaultPanel />

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Avisos en el teléfono</h3>
        <p className="text-sm text-gray-600">{notifyStatus}</p>
        <Button variant="secondary" onClick={enableNotifications}>
          Activar notificaciones
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Nuevo recordatorio</h3>
        <Input
          placeholder="Renta, Internet, Tarjeta Nu…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {PAYMENT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setTitle(preset);
                setRecurring('monthly');
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs',
                title === preset ? 'bg-yellow-100 ring-1 ring-yellow-300' : 'bg-gray-100'
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          inputMode="decimal"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <div>
          <p className="text-sm text-gray-600 mb-2">Asignar a</p>
          <div className="flex gap-2">
            {(['MEMBER_A', 'MEMBER_B'] as MemberSlot[]).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setAssignedTo(slot)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm',
                  assignee === slot ? 'bg-pastel-pink-100 text-gray-800' : 'bg-gray-100'
                )}
              >
                {MEMBER_NAMES[slot]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {RECURRING_OPTIONS.filter((o) => ['none', 'monthly', 'weekly'].includes(o.value)).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRecurring(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm',
                recurring === opt.value ? 'bg-pastel-green-100 text-gray-800' : 'bg-gray-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button className="w-full" disabled={!title.trim() || saving} onClick={submit}>
          {saving ? 'Guardando...' : 'Crear pago'}
        </Button>
      </Card>

      <div className="space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">No hay pagos pendientes</p>
        )}
        {pending.map((payment) => (
          <Card key={payment.id} className="p-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                aria-label={`Completar ${payment.title}`}
                onClick={() => completePayment(payment.id)}
                className="mt-1 w-6 h-6 rounded-full border-2 border-pastel-pink-200 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{payment.title}</p>
                <p className="text-sm text-gray-600">
                  {formatMoney(payment.amount)} · {payment.due_date}
                </p>
                <p className="text-xs text-gray-600">
                  Para {MEMBER_NAMES[payment.assigned_to]} · lo creó {MEMBER_NAMES[payment.created_by]}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Eliminar ${payment.title}`}
                onClick={() => setDeleteId(payment.id)}
                className="text-gray-400 p-2"
              >
                ✕
              </button>
            </div>
          </Card>
        ))}
      </div>

      {done.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">Pagados</h3>
          {done.map((payment) => (
            <p key={payment.id} className="text-sm text-gray-600 line-through">
              {payment.title} · {formatMoney(payment.amount)}
            </p>
          ))}
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="¿Eliminar este pago?"
        message="Se quita para los dos."
        confirmText="Eliminar"
        variant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deletePayment(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
