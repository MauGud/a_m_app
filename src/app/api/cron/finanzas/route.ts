import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FINANZAS_ARTIFACT_URL, parseMirrorPayload } from '@/lib/finanzas';
import { safeLog } from '@/lib/security';

function allowed(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  if (!allowed(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    return NextResponse.json({ ok: false, reason: 'no-supabase' }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: instance } = await supabase.from('instances').select('id').limit(1).maybeSingle();
  if (!instance?.id) {
    return NextResponse.json({ ok: false, reason: 'no-instance' });
  }

  let imported = false;
  const artifact = process.env.FINANZAS_ARTIFACT_URL || FINANZAS_ARTIFACT_URL;
  try {
    const res = await fetch(artifact, {
      headers: { Accept: 'application/json', 'User-Agent': 'A-and-M-finanzas-twin/1.0' },
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      const snapshot = parseMirrorPayload(json);
      const now = new Date().toISOString();
      await supabase.from('finanzas_snapshots').upsert({
        instance_id: instance.id,
        snapshot,
        source: 'artifact',
        updated_at: now,
        heartbeat_at: now,
      });
      imported = true;
    }
  } catch (err) {
    safeLog('cron artifact', err);
  }

  const now = new Date().toISOString();
  await supabase
    .from('finanzas_snapshots')
    .update({ heartbeat_at: now })
    .eq('instance_id', instance.id);

  const { data } = await supabase
    .from('finanzas_snapshots')
    .select('updated_at,source,heartbeat_at')
    .eq('instance_id', instance.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    imported,
    source: data?.source || null,
    updatedAt: data?.updated_at || null,
    heartbeatAt: data?.heartbeat_at || now,
  });
}
