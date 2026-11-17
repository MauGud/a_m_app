import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    instanceId?: string;
    member?: 'MEMBER_A' | 'MEMBER_B';
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!body.instanceId || !body.member || !body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 503 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      instance_id: body.instanceId,
      member: body.member,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
