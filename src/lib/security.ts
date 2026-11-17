/** PCI-style guards for a two-person vault. Never persist PAN, CVV or NIP. */

export const MAX_PAYMENT_METHODS = 20;
export const MAU_OPS_EMAIL = 'mau@nexcar.mx';

/** 13 to 19 digits with optional spaces or dashes. Last4 (4 digits) does not match. */
export const PAN_LIKE =
  /(?:^|[^\d])(\d[ \-]*){13,19}(?!\d)/;

const CVV_FIELD = /\b(cvv|cvc|cid|csc|nip|pin)\b\s*[:=]?\s*\d{3,4}\b/i;
const TRACK = /[%;][0-9]{12,19}=/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function looksLikePan(value: string | null | undefined) {
  if (!value) return false;
  const digits = digitsOnly(value);
  if (digits.length >= 13 && digits.length <= 19) return true;
  return PAN_LIKE.test(value) || TRACK.test(value);
}

export function redactSecrets(text: string) {
  return text
    .replace(/\d[ \-]{0,2}(?:\d[ \-]{0,2}){12,18}/g, '[tarjeta oculta]')
    .replace(CVV_FIELD, '$1 [oculto]')
    .replace(TRACK, '[pista oculta]');
}

export function assertSafeText(label: string, value: string) {
  if (looksLikePan(value) || CVV_FIELD.test(value) || TRACK.test(value)) {
    throw new Error(`${label} parece un dato de tarjeta. Esta app no lo guarda.`);
  }
}

export function assertLast4(value: string) {
  if (!/^\d{4}$/.test(value)) {
    throw new Error('Solo se guardan los últimos 4 dígitos.');
  }
}

export function scanForSecrets(value: unknown, path = 'root'): string[] {
  const hits: string[] = [];
  if (value == null) return hits;
  if (typeof value === 'string') {
    if (looksLikePan(value) || CVV_FIELD.test(value) || TRACK.test(value)) hits.push(path);
    return hits;
  }
  if (typeof value === 'number') {
    const asText = String(value);
    if (looksLikePan(asText)) hits.push(path);
    return hits;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => hits.push(...scanForSecrets(item, `${path}[${i}]`)));
    return hits;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(record)) {
      const lower = key.toLowerCase();
      if (['pan', 'cvv', 'cvc', 'number', 'card_number', 'cardnumber', 'nip', 'pin', 'track'].includes(lower)) {
        hits.push(`${path}.${key}`);
      }
      hits.push(...scanForSecrets(nested, `${path}.${key}`));
    }
  }
  return hits;
}

export function assertSafeToPersist(value: unknown, label = 'payload') {
  const hits = scanForSecrets(value);
  if (hits.length > 0) {
    throw new Error(`${label} contiene datos de tarjeta en ${hits.slice(0, 4).join(', ')}.`);
  }
}

export function safeLog(context: string, detail?: unknown) {
  const text =
    typeof detail === 'string'
      ? redactSecrets(detail)
      : redactSecrets(JSON.stringify(detail ?? ''));
  console.warn(`[aym] ${context}${text ? `: ${text.slice(0, 240)}` : ''}`);
}

export const FORBIDDEN_CARD_KEYS = [
  'cc-number',
  'cardNumber',
  'card_number',
  'pan',
  'cvv',
  'cvc',
  'autocomplete="cc-number"',
] as const;
