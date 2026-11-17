import type { NextRequest } from 'next/server';

export function cronAllowed(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const cron = request.headers.get('x-vercel-cron');
  if (cron === '1') return true;
  if (secret && auth === `Bearer ${secret}`) return true;
  if (process.env.NODE_ENV !== 'production' && request.nextUrl.searchParams.get('dev') === '1') {
    return true;
  }
  return false;
}
