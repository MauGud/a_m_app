function timestampOf(item: { updated_at?: string; created_at?: string }): number {
  const raw = item.updated_at || item.created_at;
  const t = raw ? Date.parse(raw) : 0;
  return Number.isFinite(t) ? t : 0;
}

export function mergeById<T extends { id: string; updated_at?: string; created_at?: string }>(
  local: T[],
  remote: T[]
): T[] {
  if (remote.length === 0) return local;
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || timestampOf(item) >= timestampOf(existing)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
