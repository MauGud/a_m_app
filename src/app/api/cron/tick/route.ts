import { NextRequest, NextResponse } from 'next/server';
import { cronAllowed } from '@/lib/cron-auth';
import { runCoupleTick } from '@/lib/cron-tick';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!cronAllowed(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await runCoupleTick();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : 'tick-failed' },
      { status: 503 }
    );
  }
}
