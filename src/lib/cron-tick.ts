import { createClient } from '@supabase/supabase-js';
import { sendPushToMember } from '@/lib/web-push-server';
import { shouldNudgeAmandaSilence, shouldNudgeExpiry } from '@/lib/session-watch';
import { AMANDA_SILENCE_DAYS, type MemberSlot } from '@/lib/constants';

function mexicoToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function asMember(value: string | null | undefined): MemberSlot | null {
  if (value === 'MEMBER_A' || value === 'MEMBER_B') return value;
  return null;
}

export async function runCoupleTick() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return { ok: false, reason: 'no-supabase' };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: instances } = await supabase.from('instances').select('id');
  const ids = (instances || []).map((row) => row.id);
  const today = mexicoToday();
  let payments = 0;
  let silence = 0;
  let expiry = 0;
  for (const instanceId of ids) {
    await supabase
      .from('finanzas_snapshots')
      .update({ heartbeat_at: new Date().toISOString() })
      .eq('instance_id', instanceId);

    const { data: due } = await supabase
      .from('payments')
      .select('id,title,amount,assigned_to,due_date,notified_at')
      .eq('instance_id', instanceId)
      .eq('status', 'pending')
      .lte('due_date', today);

    for (const payment of due || []) {
      const member = asMember(payment.assigned_to);
      if (!member) continue;
      if (payment.notified_at && String(payment.notified_at).slice(0, 10) === today) continue;
      const result = await sendPushToMember(instanceId, member, {
        title: `Pago de ${payment.title}`,
        body: `Vence ${payment.due_date === today ? 'hoy' : payment.due_date}`,
        url: '/departamento?tab=pagos',
        tag: `pago-${payment.id}`,
      });
      if (result.sent > 0) {
        payments += result.sent;
        await supabase
          .from('payments')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', payment.id);
      }
    }

    const { data: presence } = await supabase
      .from('member_presence')
      .select('member,last_seen,last_secret_at,expiry_nudged_at,silence_nudged_at')
      .eq('instance_id', instanceId);

    const amanda = presence?.find((row) => row.member === 'MEMBER_A');
    if (shouldNudgeAmandaSilence(amanda?.last_seen, amanda?.silence_nudged_at ?? null)) {
      const result = await sendPushToMember(instanceId, 'MEMBER_B', {
        title: 'A & M',
        body: 'Amanda ya no entró a la app',
        url: '/',
        tag: `silence-${today}`,
      });
      if (result.sent > 0) {
        silence += result.sent;
        await supabase
          .from('member_presence')
          .update({ silence_nudged_at: new Date().toISOString() })
          .eq('instance_id', instanceId)
          .eq('member', 'MEMBER_A');
      }
    }

    for (const row of presence || []) {
      const member = asMember(row.member);
      if (!member || !row.last_secret_at) continue;
      const last = Date.parse(row.last_secret_at);
      if (!Number.isFinite(last) || !shouldNudgeExpiry(last, row.expiry_nudged_at ?? null)) continue;
      const result = await sendPushToMember(instanceId, member, {
        title: 'A & M · código',
        body: 'El código caduca o ya caducó. Entra otra vez con Entrar.',
        url: '/setup',
        tag: `expiry-${member}-${today}`,
      });
      if (result.sent > 0) {
        expiry += result.sent;
        await supabase
          .from('member_presence')
          .update({ expiry_nudged_at: new Date().toISOString() })
          .eq('instance_id', instanceId)
          .eq('member', member);
      }
    }
  }

  return {
    ok: true,
    instances: ids.length,
    payments,
    silence,
    expiry,
    silenceWindowDays: AMANDA_SILENCE_DAYS,
  };
}
