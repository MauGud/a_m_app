export const MERGE_PENDING_MS = 45_000;

function timestampOf(item: { updated_at?: string; created_at?: string }): number {
  const raw = item.updated_at || item.created_at;
  const t = raw ? Date.parse(raw) : 0;
  return Number.isFinite(t) ? t : 0;
}

export function mergeById<T extends { id: string; updated_at?: string; created_at?: string }>(
  local: T[],
  remote: T[],
  now = Date.now()
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    const remoteItem = map.get(item.id);
    if (remoteItem) {
      if (timestampOf(item) > timestampOf(remoteItem)) map.set(item.id, item);
      continue;
    }
    if (timestampOf(item) >= now - MERGE_PENDING_MS) map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function mergeByKey<T extends { updated_at?: string; created_at?: string }>(
  local: T[],
  remote: T[],
  keyOf: (item: T) => string,
  now = Date.now()
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(keyOf(item), item);
  for (const item of local) {
    const key = keyOf(item);
    const remoteItem = map.get(key);
    if (remoteItem) {
      if (timestampOf(item) > timestampOf(remoteItem)) map.set(key, item);
      continue;
    }
    if (timestampOf(item) >= now - MERGE_PENDING_MS) map.set(key, item);
  }
  return Array.from(map.values());
}
