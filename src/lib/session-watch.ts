import { AMANDA_SILENCE_DAYS, SECRET_TTL_MS } from '@/lib/constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const PRIMES = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];

export function expiryNudgeOffsets(): number[] {
  const days = [0, 1, 2];
  let cursor = 2;
  for (const prime of PRIMES) {
    for (let i = 0; i < 3; i += 1) {
      cursor += prime;
      days.push(cursor);
    }
  }
  return days;
}

const OFFSETS = expiryNudgeOffsets();

function sameLocalDay(a: number, b: number) {
  const left = new Date(a);
  const right = new Date(b);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function daysUntilSecretExpiry(lastVerifiedAt: number, now = Date.now()) {
  return Math.ceil((lastVerifiedAt + SECRET_TTL_MS - now) / DAY_MS);
}

export function shouldNudgeExpiry(
  lastVerifiedAt: number | null,
  lastNudgeAt: string | null,
  now = Date.now()
) {
  if (!lastVerifiedAt) return false;
  if (lastNudgeAt && sameLocalDay(Date.parse(lastNudgeAt), now)) return false;

  const expiresAt = lastVerifiedAt + SECRET_TTL_MS;
  if (now < expiresAt) {
    const remaining = Math.ceil((expiresAt - now) / DAY_MS);
    return remaining >= 1 && remaining <= 3;
  }

  const daysAfter = Math.floor((now - expiresAt) / DAY_MS);
  return OFFSETS.includes(daysAfter);
}

export function shouldNudgeAmandaSilence(
  lastSeenAmanda: string | null | undefined,
  lastNudgeAt: string | null,
  now = Date.now()
) {
  if (!lastSeenAmanda) return false;
  const silentFor = now - Date.parse(lastSeenAmanda);
  if (!Number.isFinite(silentFor) || silentFor < AMANDA_SILENCE_DAYS * DAY_MS) return false;
  if (lastNudgeAt && now - Date.parse(lastNudgeAt) < DAY_MS) return false;
  return true;
}

export function expiryNudgeCopy(lastVerifiedAt: number, now = Date.now()) {
  const remaining = daysUntilSecretExpiry(lastVerifiedAt, now);
  if (remaining > 0) {
    return remaining === 1
      ? 'El código caduca mañana. Toca Entrar otra vez para seguir dentro.'
      : `El código caduca en ${remaining} días. Toca Entrar otra vez para seguir dentro.`;
  }
  return 'El código ya caducó. Entra otra vez con tu código para seguir en A & M.';
}
