import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_FINANZAS, parseMirrorPayload, snapshotToMirror } from '@/lib/finanzas';
import { COUPLE_SECRET } from '@/lib/constants';
import { assertSafeToPersist, redactSecrets } from '@/lib/security';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function authorized(request: NextRequest) {
  const token = request.headers.get('x-finanzas-token') || request.nextUrl.searchParams.get('token') || '';
  const expected = process.env.FINANZAS_MIRROR_TOKEN;
  if (expected) return Boolean(token) && token === expected;
  return process.env.NODE_ENV !== 'production' && token === COUPLE_SECRET;
}

async function instanceId() {
  const supabase = client();
  if (!supabase) return null;
  const { data } = await supabase.from('instances').select('id').limit(1).maybeSingle();
  return data?.id || null;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  const supabase = client();
  const id = await instanceId();
  if (!supabase || !id) {
    return NextResponse.json(snapshotToMirror(DEFAULT_FINANZAS, { source: 'seed' }));
  }
  const { data } = await supabase
    .from('finanzas_snapshots')
    .select('snapshot,source,updated_at,heartbeat_at')
    .eq('instance_id', id)
    .maybeSingle();
  if (!data?.snapshot) {
    return NextResponse.json(snapshotToMirror(DEFAULT_FINANZAS, { source: 'seed' }));
  }
  try {
    const snapshot = parseMirrorPayload(data.snapshot);
    return NextResponse.json(
      snapshotToMirror(snapshot, { updatedAt: data.updated_at, source: data.source })
    );
  } catch (err) {
    return NextResponse.json({ error: redactSecrets(String(err)) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  const supabase = client();
  const id = await instanceId();
  if (!supabase || !id) {
    return NextResponse.json({ error: 'sin supabase' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const snapshot = parseMirrorPayload(body);
    assertSafeToPersist(snapshot, 'finanzas');
    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from('finanzas_snapshots').upsert({
      instance_id: id,
      snapshot,
      source: 'artifact',
      updated_at: updatedAt,
      heartbeat_at: updatedAt,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(snapshotToMirror(snapshot, { updatedAt, source: 'artifact' }));
  } catch (err) {
    return NextResponse.json({ error: redactSecrets(String(err)) }, { status: 400 });
  }
}
