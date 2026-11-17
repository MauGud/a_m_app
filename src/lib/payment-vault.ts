import { MAX_PAYMENT_METHODS, assertLast4, assertSafeText } from './security';
import type { MemberSlot } from './constants';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'carnet' | 'otro';
export type Processor = 'local';

export interface VaultedMethod {
  id: string;
  alias: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  owner: MemberSlot;
  processor: Processor;
  processorRef: string;
  createdAt: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export const CARD_BRANDS: Array<{ id: CardBrand; label: string }> = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'amex', label: 'Amex' },
  { id: 'carnet', label: 'Carnet' },
  { id: 'otro', label: 'Otra' },
];

export function canAddMethod(count: number) {
  return count < MAX_PAYMENT_METHODS;
}

export function buildVaultedMethod(input: {
  alias: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  owner: MemberSlot;
}): VaultedMethod {
  const alias = input.alias.trim();
  if (!alias) throw new Error('Ponle un apodo a la tarjeta, por ejemplo Nu Mau.');
  assertSafeText('apodo', alias);
  assertLast4(input.last4);
  if (input.expMonth < 1 || input.expMonth > 12) throw new Error('El mes no es válido.');
  const year = input.expYear < 100 ? 2000 + input.expYear : input.expYear;
  if (year < 2025 || year > 2045) throw new Error('El año no es válido.');
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    alias,
    brand: input.brand,
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: year,
    owner: input.owner,
    processor: 'local',
    processorRef: `local_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    created_at: now,
    updated_at: now,
  };
}

export function displayMethod(method: VaultedMethod) {
  return `${method.alias} · ${method.brand} ·••${method.last4}`;
}
