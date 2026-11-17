import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseWithInstance, isSupabaseConfigured } from '@/lib/supabase';

export const COUPLE_TABLES = [
  'moods',
  'memories',
  'sparks',
  'spark_submissions',
  'activities',
  'payments',
  'finanzas_snapshots',
  'payment_methods',
  'member_presence',
] as const;

export type CoupleTable = (typeof COUPLE_TABLES)[number];

type ChangeListener = (table: CoupleTable) => void;
type StatusListener = (live: boolean) => void;

const listeners = new Set<ChangeListener>();
const statusListeners = new Set<StatusListener>();
const debounce = new Map<CoupleTable, ReturnType<typeof setTimeout>>();

let live = false;
let generation = 0;
let retryDelay = 1000;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let current: {
  instanceId: string;
  client: SupabaseClient;
  channel: RealtimeChannel;
} | null = null;

export function isCoupleRealtimeLive() {
  return live;
}

export function onCoupleRealtimeStatus(listener: StatusListener) {
  statusListeners.add(listener);
  listener(live);
  return () => {
    statusListeners.delete(listener);
  };
}

function setLive(next: boolean) {
  if (live === next) return;
  live = next;
  statusListeners.forEach((listener) => listener(next));
}

function emit(table: CoupleTable) {
  const prev = debounce.get(table);
  if (prev) clearTimeout(prev);
  debounce.set(
    table,
    setTimeout(() => {
      debounce.delete(table);
      listeners.forEach((listener) => listener(table));
    }, 60)
  );
}

function isCoupleTable(value: unknown): value is CoupleTable {
  return typeof value === 'string' && (COUPLE_TABLES as readonly string[]).includes(value);
}

export function coupleDidChange(table: CoupleTable) {
  if (!current) return;
  void current.channel.send({
    type: 'broadcast',
    event: 'change',
    payload: { table, at: Date.now() },
  });
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function dropCoupleChannels(client: SupabaseClient) {
  for (const channel of client.getChannels()) {
    const topic = String(channel.topic || '');
    if (topic.includes('couple-live-')) {
      void client.removeChannel(channel);
    }
  }
}

function join(instanceId: string, client: SupabaseClient) {
  const gen = ++generation;
  clearRetry();
  dropCoupleChannels(client);

  let channel = client.channel(`couple-live-${instanceId}`, {
    config: { broadcast: { ack: false, self: false } },
  });

  for (const table of COUPLE_TABLES) {
    const filter = table === 'spark_submissions' ? undefined : `instance_id=eq.${instanceId}`;
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      (payload) => {
        const fromPayload = isCoupleTable(payload.table) ? payload.table : table;
        emit(fromPayload);
      }
    );
  }

  channel = channel.on('broadcast', { event: 'change' }, (message) => {
    const table = (message as { payload?: { table?: unknown } }).payload?.table;
    if (isCoupleTable(table)) emit(table);
  });

  channel.subscribe((status) => {
    if (gen !== generation) return;
    if (status === 'SUBSCRIBED') {
      retryDelay = 1000;
      setLive(true);
      return;
    }
    if (status !== 'CHANNEL_ERROR' && status !== 'TIMED_OUT' && status !== 'CLOSED') return;
    setLive(false);
    if (listeners.size === 0) return;
    clearRetry();
    retryTimer = setTimeout(() => {
      if (gen !== generation || listeners.size === 0) return;
      void client.removeChannel(channel);
      join(instanceId, client);
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 12_000);
  });

  current = { instanceId, client, channel };
}

export function stopCoupleRealtime() {
  generation += 1;
  clearRetry();
  debounce.forEach((timer) => clearTimeout(timer));
  debounce.clear();
  if (current) {
    dropCoupleChannels(current.client);
    current = null;
  }
  setLive(false);
}

export function startCoupleRealtime(instanceId: string, onChange: ChangeListener) {
  listeners.add(onChange);

  if (!isSupabaseConfigured()) {
    return () => {
      listeners.delete(onChange);
    };
  }

  if (current?.instanceId !== instanceId) {
    const client = getSupabaseWithInstance(instanceId);
    if (client) join(instanceId, client);
  }

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) stopCoupleRealtime();
  };
}

export function listenCoupleTable(
  instanceId: string | null | undefined,
  tables: CoupleTable | CoupleTable[],
  refetch: () => void
) {
  if (!instanceId) return () => {};
  const wanted = new Set(Array.isArray(tables) ? tables : [tables]);
  return startCoupleRealtime(instanceId, (table) => {
    if (wanted.has(table)) refetch();
  });
}
