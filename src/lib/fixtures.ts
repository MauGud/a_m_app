export function isFixtureCaption(caption?: string | null) {
  const text = (caption || '').trim();
  if (!text) return false;
  if (/^recuerdo \d{10,}$/i.test(text)) return true;
  if (/\[(e2e|live)\]/i.test(text)) return true;
  if (text.startsWith('__probe')) return true;
  return false;
}

export function isRemoteMediaUrl(value?: string | null) {
  return typeof value === 'string' && /^https:\/\//i.test(value.trim());
}
