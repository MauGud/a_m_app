import { APARTMENT_ADDRESS_FULL } from './apartment';
import {
  type FinanceSnapshot,
  formatMoney,
  cardStatus,
} from './finanzas';
interface PaymentHint {
  title: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed';
}

export interface AssistantReply {
  text: string;
  pendingAction?: {
    label: string;
    apply: (snapshot: FinanceSnapshot) => FinanceSnapshot;
  };
}

function findCard(snapshot: FinanceSnapshot, text: string) {
  const upper = text.toUpperCase();
  return snapshot.cards.find((c) => upper.includes(c.name));
}

function parseAmount(text: string): number | null {
  const match = text.replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function answerFinanzas(
  raw: string,
  snapshot: FinanceSnapshot,
  payments: PaymentHint[]
): AssistantReply {
  const text = raw.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return { text: 'Dime qué quieres consultar o registrar 💕' };
  }

  if (/direcci[oó]n|depto|departamento|ocelotl|d[oó]nde viven/.test(lower)) {
    return {
      text: `La dirección del departamento es:\n${APARTMENT_ADDRESS_FULL}`,
    };
  }

  if (/deuda|debo|liquid/.test(lower)) {
    const lines = snapshot.cards
      .map((c) => `• ${c.name}: ${cardStatus(c)}${c.note ? ` (${c.note})` : ''}`)
      .join('\n');
    return { text: `Deuda en tus tarjetas:\n${lines}` };
  }

  if (/cu[aá]nto puedo gastar|spendable|con cada tarjeta/.test(lower)) {
    const lines = snapshot.cards
      .map((c) => `• ${c.name}: ${formatMoney(c.spendable)}`)
      .join('\n');
    return { text: `Cuánto puedes gastar con cada tarjeta:\n${lines}` };
  }

  if (/queda|semana|mes|variable/.test(lower) && /gast/.test(lower)) {
    return {
      text: `Te queda por gastar:\n• Esta semana: ${formatMoney(snapshot.weeklyLeft)}\n• Este mes, gastos variables: ${formatMoney(snapshot.monthlyVariableLeft)}`,
    };
  }

  if (/caja|muebles|ahorrar/.test(lower)) {
    const lines =
      snapshot.cajas.length === 0
        ? 'Aún no hay cajas.'
        : snapshot.cajas
            .map(
              (c) =>
                `• ${c.name}: ${formatMoney(c.balance)}${c.goal ? ` de ${formatMoney(c.goal)}` : ''}`
            )
            .join('\n');
    if (/ahorrar más para muebles/.test(lower)) {
      return {
        text: `Para ahorrar más a Muebles, cada quincena pueden mover un monto fijo a esa caja. Hoy tiene ${formatMoney(snapshot.cajas.find((c) => /mueble/i.test(c.name))?.balance || 0)}. ¿Quieres registrar una aportación? Dime el monto, por ejemplo: "aportar 500 a muebles".`,
      };
    }
    if (/aport/.test(lower)) {
      const amount = parseAmount(text);
      const caja =
        snapshot.cajas.find((c) => lower.includes(c.name.toLowerCase())) || snapshot.cajas[0];
      if (amount && caja) {
        return {
          text: `¿Registro ${formatMoney(amount)} en la caja ${caja.name}?`,
          pendingAction: {
            label: `Aportar ${formatMoney(amount)} a ${caja.name}`,
            apply: (current) => ({
              ...current,
              cajas: current.cajas.map((c) =>
                c.id === caja.id ? { ...c, balance: c.balance + amount } : c
              ),
            }),
          },
        };
      }
      return { text: `Cajas:\n${lines}\nPara aportar, escribe: "aportar 500 a muebles".` };
    }
    return { text: `Cajas:\n${lines}` };
  }

  if (/msi|meses sin intereses/.test(lower)) {
    return {
      text: 'Compra a MSI: úsala solo si el pago mensual cabe en la quincena del 15 o del 30 sin tocar la caja de emergencia. Dime el monto y en cuántas MSI para anotarlo.',
    };
  }

  if (/gastar m[aá]s en nu/.test(lower)) {
    const nu = snapshot.cards.find((c) => c.name === 'NU');
    return {
      text: `Nu está ${cardStatus(nu || { name: 'NU', debt: 0, spendable: 0 })}. Puedes gastar hasta ${formatMoney(nu?.spendable || 0)} en esta quincena sin pasar el techo. Si registras un gasto, escribe: "gasté 200 en nu".`,
    };
  }

  if (/gast[eé]|registr/.test(lower)) {
    const amount = parseAmount(text);
    const card = findCard(snapshot, text) || snapshot.cards.find((c) => c.name === 'NU');
    if (amount && card) {
      return {
        text: `¿Registro un gasto de ${formatMoney(amount)} en ${card.name}? Se resta de lo que puedes gastar.`,
        pendingAction: {
          label: `Gasto ${formatMoney(amount)} en ${card.name}`,
          apply: (current) => ({
            ...current,
            cards: current.cards.map((c) =>
              c.name === card.name
                ? { ...c, spendable: Math.max(0, c.spendable - amount), debt: c.debt }
                : c
            ),
            monthlyVariableLeft: Math.max(0, current.monthlyVariableLeft - amount),
            weeklyLeft: Math.max(0, current.weeklyLeft - amount),
          }),
        },
      };
    }
  }

  if (/pago|recordatorio|luz|agua|renta|internet/.test(lower)) {
    const pending = payments.filter((p) => p.status === 'pending');
    if (pending.length === 0) {
      return { text: 'No hay recordatorios de pago pendientes. Puedes crear uno en la pestaña Pagos.' };
    }
    const lines = pending
      .map((p) => `• ${p.title} · ${formatMoney(p.amount)} · ${p.due_date}`)
      .join('\n');
    return { text: `Pagos pendientes:\n${lines}` };
  }

  if (/quincena|15|30/.test(lower) && /plan|tabla/.test(lower)) {
    if (snapshot.quincena.length === 0) {
      return { text: 'La tabla de quincena está vacía. Puedes ir llenándola con tus conceptos del 15 y del 30.' };
    }
    const lines = snapshot.quincena
      .map((row) => `• ${row.concept}: 15 ${formatMoney(row.day15)} / 30 ${formatMoney(row.day30)}`)
      .join('\n');
    return { text: `Tu quincena:\n${lines}` };
  }

  return {
    text: 'Puedo consultar deudas, cuánto gastar por tarjeta, cajas, la dirección del depto y los pagos. También registro gastos si me dices "gasté 200 en nu".',
  };
}
