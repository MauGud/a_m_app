import { sendNotification, setVapidDetails } from 'web-push';
import { createClient } from '@supabase/supabase-js';
import type { MemberSlot } from '@/lib/constants';
import { MAU_OPS_EMAIL } from '@/lib/security';

export function vapidReady() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  if (!publicKey || !privateKey) return false;
  setVapidDetails(`mailto:${MAU_OPS_EMAIL}`, publicKey, privateKey);
  return true;
}

export async function sendPushToMember(
  instanceId: string,
  member: MemberSlot | 'BOTH',
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  try {
    if (!configure()) return { sent: 0, reason: 'no-vapid' as const };
    const supabase = client();
    if (!supabase) return { sent: 0, reason: 'no-supabase' as const };

    let query = supabase.from('push_subscriptions').select('id,endpoint,p256dh,auth,member').eq('instance_id', instanceId);
    if (member !== 'BOTH') query = query.eq('member', member);
    const { data, error } = await query;
    if (error || !data?.length) return { sent: 0, reason: error?.message || 'no-subs' };

    let sent = 0;
    for (const row of data) {
      try {
        await sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
        }
      }
    }
    return { sent, reason: null };
  } catch (err) {
    return { sent: 0, reason: err instanceof Error ? err.message : 'push-failed' };
  }
}
