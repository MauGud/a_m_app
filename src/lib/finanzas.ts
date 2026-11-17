import { z } from 'zod';
import { assertSafeToPersist } from './security';

export const FINANZAS_CARDS = ['HEY', 'BBVA', 'NU', 'LIVERPOOL'] as const;
export type FinanceCardName = (typeof FINANZAS_CARDS)[number];

export interface FinanceCard {
  name: FinanceCardName;
  debt: number;
  spendable: number;
  note?: string;
}

export interface FinanceCaja {
  id: string;
  name: string;
  balance: number;
  goal?: number;
}

export interface FinanceFixedExpense {
  id: string;
  name: string;
  amount: number;
  card: FinanceCardName;
}

export interface FinanceQuincenaRow {
  id: string;
  concept: string;
  day15: number;
  day30: number;
}

export interface FinanceSnapshot {
  cards: FinanceCard[];
  cajas: FinanceCaja[];
  fixedExpenses: FinanceFixedExpense[];
  quincena: FinanceQuincenaRow[];
  weeklyLeft: number;
  monthlyVariableLeft: number;
}

export const DEFAULT_FINANZAS: FinanceSnapshot = {
  cards: [
    { name: 'HEY', debt: 0, spendable: 0 },
    { name: 'BBVA', debt: 0, spendable: 0 },
    { name: 'NU', debt: 0, spendable: 0 },
    { name: 'LIVERPOOL', debt: 0, spendable: 0 },
  ],
  cajas: [],
  fixedExpenses: [],
  quincena: [],
  weeklyLeft: 0,
  monthlyVariableLeft: 0,
};

export const ASSISTANT_CHIPS = [
  '¿Cuánto debo en Nu?',
  'Registrar un gasto',
  'Aportar a una caja',
  '¿Cuál es la dirección del depto?',
] as const;

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cardStatus(card: FinanceCard) {
  if (card.debt <= 0) return 'Liquidada';
  return formatMoney(card.debt);
}

export function currentQuincenaLabel(date = new Date()) {
  const day = date.getDate();
  const month = date.toLocaleDateString('es-MX', { month: 'long' });
  const cap = month.charAt(0).toUpperCase() + month.slice(1);
  if (day <= 15) return `${cap} · quincena del 1 al 15`;
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${cap} · quincena del 16 al ${last}`;
}

const SnapshotSchema = z.object({
  cards: z
    .array(
      z.object({
        name: z.enum(FINANZAS_CARDS),
        debt: z.number().finite(),
        spendable: z.number().finite(),
        note: z.string().max(160).optional(),
      })
    )
    .min(1)
    .max(8),
  cajas: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        balance: z.number().finite(),
        goal: z.number().finite().optional(),
      })
    )
    .max(20),
  fixedExpenses: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        amount: z.number().finite(),
        card: z.enum(FINANZAS_CARDS),
      })
    )
    .max(40),
  quincena: z
    .array(
      z.object({
        id: z.string(),
        concept: z.string(),
        day15: z.number().finite(),
        day30: z.number().finite(),
      })
    )
    .max(40),
  weeklyLeft: z.number().finite(),
  monthlyVariableLeft: z.number().finite(),
});

export function parseFinanceSnapshot(raw: unknown): FinanceSnapshot {
  const parsed = SnapshotSchema.parse(raw);
  assertSafeToPersist(parsed, 'finanzas');
  return parsed;
}

export function snapshotToMirror(snapshot: FinanceSnapshot, extra?: { updatedAt?: string; source?: string }) {
  return {
    twin: 'finanzas-mau',
    updatedAt: extra?.updatedAt || new Date().toISOString(),
    source: extra?.source || 'app',
    snapshot,
  };
}

export function parseMirrorPayload(raw: unknown): FinanceSnapshot {
  if (raw && typeof raw === 'object' && 'snapshot' in (raw as object)) {
    return parseFinanceSnapshot((raw as { snapshot: unknown }).snapshot);
  }
  return parseFinanceSnapshot(raw);
}
