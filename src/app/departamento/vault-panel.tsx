'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/stores/vault-store';
import { useAuthStore } from '@/stores/auth-store';
import { CARD_BRANDS, displayMethod, type CardBrand } from '@/lib/payment-vault';
import { MAX_PAYMENT_METHODS } from '@/lib/security';
import { MEMBER_NAMES, type MemberSlot } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function VaultPanel() {
  const { memberSlot } = useAuthStore();
  const methods = useVaultStore((s) => s.methods);
  const addMethod = useVaultStore((s) => s.addMethod);
  const removeMethod = useVaultStore((s) => s.removeMethod);
  const [alias, setAlias] = useState('');
  const [brand, setBrand] = useState<CardBrand>('visa');
  const [last4, setLast4] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [owner, setOwner] = useState<MemberSlot>(memberSlot || 'MEMBER_B');
  const [error, setError] = useState('');

  if (memberSlot !== 'MEMBER_B') return null;

  const submit = () => {
    setError('');
    try {
      addMethod({
        alias,
        brand,
        last4,
        expMonth: Number(expMonth),
        expYear: Number(expYear),
        owner,
      });
      setAlias('');
      setLast4('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se guardó.');
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold">Tarjetas digitales · máximo {MAX_PAYMENT_METHODS}</h3>
      <p className="text-sm text-gray-600">
        Solo apodo y los últimos 4. Nunca los 16 dígitos ni el CVV. El súper cobra en su propia caja.
      </p>
      {methods.map((method) => (
        <div key={method.id} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {displayMethod(method)} · {MEMBER_NAMES[method.owner]}
          </span>
          <button type="button" className="text-gray-400 p-2" onClick={() => removeMethod(method.id)}>
            Quitar
          </button>
        </div>
      ))}
      {methods.length < MAX_PAYMENT_METHODS && (
        <div className="space-y-2">
          <Input
            placeholder="Apodo, ejemplo Nu Mau"
            value={alias}
            autoComplete="off"
            onChange={(e) => setAlias(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto">
            {CARD_BRANDS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setBrand(item.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs',
                  brand === item.id ? 'bg-pastel-blue-100' : 'bg-gray-100'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="Últimos 4"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <Input
              inputMode="numeric"
              maxLength={2}
              placeholder="MM"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
            <Input
              inputMode="numeric"
              maxLength={2}
              placeholder="AA"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
            />
          </div>
          <div className="flex gap-2">
            {(['MEMBER_A', 'MEMBER_B'] as MemberSlot[]).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setOwner(slot)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm',
                  owner === slot ? 'bg-pastel-pink-100' : 'bg-gray-100'
                )}
              >
                {MEMBER_NAMES[slot]}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={submit}
            disabled={last4.length !== 4 || !alias.trim() || expMonth.length < 1 || expYear.length < 2}
          >
            Guardar método
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
