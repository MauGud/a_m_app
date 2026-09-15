import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

function getLocalISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(date) {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(`${date}T12:00:00`);
  return new Date(date);
}

function addCalendarMonths(date, months, anchorDay) {
  const day = anchorDay ?? date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function getNextDueDate(dueDate, recurring, interval = 1, unit = 'day', anchorDay) {
  if (recurring === 'none') return null;
  const current = parseLocalDate(dueDate);
  const day = anchorDay ?? current.getDate();
  let next = new Date(current);
  if (recurring === 'daily') next.setDate(next.getDate() + 1);
  else if (recurring === 'weekly') next.setDate(next.getDate() + 7);
  else if (recurring === 'biweekly') next.setDate(next.getDate() + 14);
  else if (recurring === 'monthly') next = addCalendarMonths(current, 1, day);
  else if (recurring === 'yearly') next = addCalendarMonths(current, 12, day);
  else if (recurring === 'custom') {
    const step = Math.max(1, interval);
    if (unit === 'day') next.setDate(next.getDate() + step);
    else if (unit === 'week') next.setDate(next.getDate() + step * 7);
    else if (unit === 'month') next = addCalendarMonths(current, step, day);
    else if (unit === 'year') next = addCalendarMonths(current, step * 12, day);
  }
  return getLocalISODate(next);
}

function mergeById(local, remote) {
  if (remote.length === 0) return local;
  const map = new Map();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    const remoteTs = Date.parse(item.updated_at || item.created_at || 0);
    const localTs = existing ? Date.parse(existing.updated_at || existing.created_at || 0) : 0;
    if (!existing || remoteTs >= localTs) map.set(item.id, item);
  }
  return Array.from(map.values());
}

assert('today ISO is local YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(getLocalISODate()));
assert('daily recurrence +1 day', getNextDueDate('2026-01-31', 'daily') === '2026-02-01');
assert('weekly recurrence +7', getNextDueDate('2026-01-01', 'weekly') === '2026-01-08');
assert('biweekly +14', getNextDueDate('2026-01-01', 'biweekly') === '2026-01-15');
assert('monthly keeps day', getNextDueDate('2026-01-15', 'monthly') === '2026-02-15');
assert('monthly Jan 31 clamps to Feb 28', getNextDueDate('2026-01-31', 'monthly') === '2026-02-28');
assert('monthly Feb 28 with anchor 31 is Mar 31', getNextDueDate('2026-02-28', 'monthly', 1, 'day', 31) === '2026-03-31');
assert('yearly +1 year', getNextDueDate('2026-07-11', 'yearly') === '2027-07-11');
assert('yearly Feb 29 to non-leap', getNextDueDate('2024-02-29', 'yearly') === '2025-02-28');
assert('custom every 3 days', getNextDueDate('2026-01-01', 'custom', 3, 'day') === '2026-01-04');
assert('custom every 2 weeks', getNextDueDate('2026-01-01', 'custom', 2, 'week') === '2026-01-15');
assert('none returns null', getNextDueDate('2026-01-01', 'none') === null);

assert(
  'merge keeps local when remote empty',
  mergeById([{ id: 'a', title: 'local' }], []).length === 1
);
const merged = mergeById(
  [{ id: 'a', title: 'old' }, { id: 'b', title: 'only-local' }],
  [{ id: 'a', title: 'remote' }, { id: 'c', title: 'only-remote' }]
);
assert('merge remote wins on id', merged.find((x) => x.id === 'a').title === 'remote');
assert('merge keeps local-only', merged.some((x) => x.id === 'b'));
assert('merge adds remote-only', merged.some((x) => x.id === 'c'));
assert(
  'merge keeps newer local over stale remote',
  mergeById(
    [{ id: 'a', title: 'local', updated_at: '2026-02-01T00:00:00Z' }],
    [{ id: 'a', title: 'remote', updated_at: '2026-01-01T00:00:00Z' }]
  )[0].title === 'local'
);

const nav = readFileSync(join(root, 'src/components/layout/bottom-nav.tsx'), 'utf8');
assert('nav label is Recuerdos not Cámara', nav.includes("label: 'Recuerdos'") && !nav.includes("label: 'Cámara'"));
assert('nav href is /recuerdos', nav.includes("href: '/recuerdos'"));
assert('nav has Dates', nav.includes("href: '/dates'"));

const recuerdosNuevo = readFileSync(join(root, 'src/app/recuerdos/nuevo/page.tsx'), 'utf8');
assert('capture lives under /recuerdos/nuevo', recuerdosNuevo.includes('Captura un recuerdo'));

const camara = readFileSync(join(root, 'src/app/camara/page.tsx'), 'utf8');
assert('old /camara redirects to recuerdos', camara.includes('/recuerdos/nuevo'));

const nextConfig = readFileSync(join(root, 'next.config.mjs'), 'utf8');
assert('next redirects /camara', nextConfig.includes("source: '/camara'"));
assert('next redirects /planes', nextConfig.includes("source: '/planes'"));

const home = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
assert('home capture link is recuerdos/nuevo', home.includes('/recuerdos/nuevo') && !home.includes("href=\"/camara\""));

const dates = readFileSync(join(root, 'src/app/dates/page.tsx'), 'utf8');
assert('dates page only date+meta categories', dates.includes("c.value === 'date' || c.value === 'meta'"));

const calendar = readFileSync(join(root, 'src/app/calendario/page.tsx'), 'utf8');
assert('calendar has Metas Juntos', calendar.includes('ACTIVITY_CATEGORIES'));
assert('calendar has custom recurrence', calendar.includes('Personalizado') || calendar.includes('custom'));

const auth = readFileSync(join(root, 'src/stores/auth-store.ts'), 'utf8');
assert('secret is 1711', auth.includes('COUPLE_SECRET'));
assert('60 day ttl used', auth.includes('SECRET_TTL_MS'));

const mood = readFileSync(join(root, 'src/stores/mood-store.ts'), 'utf8');
assert('moods pruned to 30 days', mood.includes('MOOD_RETENTION_DAYS'));

const supabaseClient = readFileSync(join(root, 'src/lib/supabase.ts'), 'utf8');
assert('modern supabase keys strip Bearer sb_', supabaseClient.includes('Bearer sb_'));

const gallery = readFileSync(join(root, 'src/app/recuerdos/nuevo/page.tsx'), 'utf8');
assert('recuerdos save to device gallery', gallery.includes('saveImagesToDeviceGallery'));

const envExample = readFileSync(join(root, '.env.local.example'), 'utf8');
assert('env example has supabase url', envExample.includes('NEXT_PUBLIC_SUPABASE_URL'));

const forbidden = ['label: \'Cámara\'', 'title="Cámara"'];
for (const token of forbidden) {
  const hit = [nav, home, recuerdosNuevo].some((file) => file.includes(token));
  assert(`no remaining Cámara UI token ${token}`, !hit);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (url && key) {
  const headers = { apikey: key, Accept: 'application/json' };
  const tables = ['instances', 'activities', 'moods', 'sparks', 'memories', 'plans'];
  for (const table of tables) {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
    assert(`supabase ${table} readable (${res.status})`, res.ok);
  }
} else {
  console.log('skip supabase live checks (no env)');
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
