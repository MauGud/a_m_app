'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFinanzasStore } from '@/stores/finanzas-store';
import { usePaymentsStore } from '@/stores/payments-store';
import { useAuthStore } from '@/stores/auth-store';
import { answerFinanzas } from '@/lib/finanzas-assistant';
import {
  ASSISTANT_CHIPS,
  cardStatus,
  currentQuincenaLabel,
  formatMoney,
} from '@/lib/finanzas';
import { FINANZAS_REFRESH_MS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function FinanzasPanel() {
  const { memberSlot } = useAuthStore();
  const snapshot = useFinanzasStore((s) => s.snapshot);
  const updatedAt = useFinanzasStore((s) => s.updatedAt);
  const heartbeatAt = useFinanzasStore((s) => s.heartbeatAt);
  const messages = useFinanzasStore((s) => s.messages);
  const pendingActionLabel = useFinanzasStore((s) => s.pendingActionLabel);
  const addMessage = useFinanzasStore((s) => s.addMessage);
  const confirmPending = useFinanzasStore((s) => s.confirmPending);
  const dismissPending = useFinanzasStore((s) => s.dismissPending);
  const newConversation = useFinanzasStore((s) => s.newConversation);
  const fetchFromSupabase = useFinanzasStore((s) => s.fetchFromSupabase);
  const payments = usePaymentsStore((s) => s.payments);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isMau = memberSlot === 'MEMBER_B';

  useEffect(() => {
    if (!isMau) return;
    fetchFromSupabase();
    const hour = window.setInterval(() => {
      fetchFromSupabase();
    }, FINANZAS_REFRESH_MS);
    const onFocus = () => fetchFromSupabase();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(hour);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchFromSupabase, isMau]);

  if (!isMau) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-600">Este apartado lo ve solo Mau.</p>
      </Card>
    );
  }

  const ask = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    addMessage({ role: 'user', text: cleaned });
    try {
      const reply = answerFinanzas(cleaned, snapshot, payments);
      addMessage({
        role: 'assistant',
        text: reply.text,
        pendingLabel: reply.pendingAction?.label,
        apply: reply.pendingAction?.apply,
      });
    } catch (err) {
      console.warn('Assistant error, recovered:', err);
      addMessage({
        role: 'assistant',
        text: 'Se trabó una consulta. Intenta otra vez, yo sigo aquí.',
      });
    }
    setDraft('');
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Finanzas Mau</h3>
            <p className="text-xs text-gray-600">
              Guardado aquí · {new Date(updatedAt).toLocaleString('es-MX')}
              {heartbeatAt ? ` · pulso ${new Date(heartbeatAt).toLocaleTimeString('es-MX')}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={newConversation}>
            Conversación nueva
          </Button>
        </div>

        <div ref={listRef} className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
                message.role === 'assistant'
                  ? 'bg-pastel-blue-50 text-gray-800'
                  : 'bg-pastel-pink-50 text-gray-800 ml-6'
              )}
            >
              {message.text}
            </div>
          ))}
        </div>

        {pendingActionLabel && (
          <div className="flex gap-2">
            <Button className="flex-1" onClick={confirmPending}>
              Confirmar: {pendingActionLabel}
            </Button>
            <Button variant="ghost" onClick={dismissPending}>
              No
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ASSISTANT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => ask(chip)}
              className="text-xs px-3 py-1.5 rounded-full bg-pastel-blue-50 text-gray-800 hover:bg-pastel-blue-100"
            >
              {chip}
            </button>
          ))}
        </div>

        <Textarea
          rows={2}
          value={draft}
          placeholder="Pregunta, registra un gasto o aporta a una caja"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(draft);
            }
          }}
        />
        <Button className="w-full" onClick={() => ask(draft)} disabled={!draft.trim()}>
          Enviar
        </Button>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold">Cuánto puedes gastar con cada tarjeta</h3>
          <p className="text-xs text-gray-600">{currentQuincenaLabel()}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {snapshot.cards.map((card) => (
            <div key={card.name} className="rounded-2xl bg-pastel-blue-50 p-3">
              <p className="text-xs text-gray-600">{card.name}</p>
              <p className="font-semibold">{formatMoney(card.spendable)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Deuda en tus tarjetas</h3>
        <div className="grid grid-cols-2 gap-2">
          {snapshot.cards.map((card) => (
            <div key={card.name} className="rounded-2xl border border-pastel-pink-200 p-3">
              <p className="text-xs text-gray-600">{card.name}</p>
              <p className={cn('font-semibold', card.debt <= 0 ? 'text-green-600' : 'text-gray-800')}>
                {cardStatus(card)}
              </p>
              {card.note && <p className="text-[11px] text-gray-400">{card.note}</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Cuánto te queda por gastar</h3>
        <p className="text-sm text-gray-600">Esta semana: {formatMoney(snapshot.weeklyLeft)}</p>
        <p className="text-sm text-gray-600">
          Este mes, gastos variables: {formatMoney(snapshot.monthlyVariableLeft)}
        </p>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Gastos fijos del mes</h3>
        {snapshot.fixedExpenses.length === 0 ? (
          <p className="text-sm text-gray-600">Sin gastos fijos cargados aún.</p>
        ) : (
          snapshot.fixedExpenses.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>{formatMoney(item.amount)}</span>
            </div>
          ))
        )}
      </Card>

      <Card className="p-4 space-y-2 overflow-x-auto">
        <h3 className="font-semibold">Tu quincena</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pb-2">Concepto</th>
              <th className="pb-2">15</th>
              <th className="pb-2">30</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.quincena.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-gray-400">
                  Vacía por ahora
                </td>
              </tr>
            ) : (
              snapshot.quincena.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2">{row.concept}</td>
                  <td>{formatMoney(row.day15)}</td>
                  <td>{formatMoney(row.day30)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold">Cajas</h3>
        {snapshot.cajas.length === 0 && (
          <p className="text-sm text-gray-600">Aún no hay cajas. Pídele al chat que cree una.</p>
        )}
        {snapshot.cajas.map((caja) => (
          <div key={caja.id} className="flex justify-between text-sm">
            <span>{caja.name}</span>
            <span>
              {formatMoney(caja.balance)}
              {caja.goal ? ` / ${formatMoney(caja.goal)}` : ''}
            </span>
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-1">Cómo manejar tus tarjetas</h3>
        <p className="text-sm text-gray-600">
          Pregunta antes de gastar. Si algo cambia un saldo, te pide confirmación. Los ceros significan
          que aún no hay un número registrado, no un saldo inventado.
        </p>
      </Card>
    </div>
  );
}
