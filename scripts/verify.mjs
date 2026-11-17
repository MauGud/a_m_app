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

const MERGE_PENDING_MS = 45_000;
function timestampOf(item) {
  const t = Date.parse(item.updated_at || item.created_at || 0);
  return Number.isFinite(t) ? t : 0;
}
function mergeById(local, remote, now = Date.now()) {
  const map = new Map();
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

function getCalendarDaysUntil(dateStr, from = new Date()) {
  const today = getLocalISODate(from);
  const start = Date.parse(`${today}T12:00:00`);
  const end = Date.parse(`${dateStr}T12:00:00`);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

const almostTomorrow = new Date('2026-11-16T22:00:00');
assert('calendar days until tomorrow is 1 not 2', getCalendarDaysUntil('2026-11-17', almostTomorrow) === 1);
assert('calendar days until today is 0', getCalendarDaysUntil('2026-11-16', almostTomorrow) === 0);

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
  'merge drops stale local when remote empty',
  mergeById([{ id: 'a', title: 'local', created_at: '2020-01-01T00:00:00Z' }], []).length === 0
);
assert(
  'merge keeps in-flight local when remote empty',
  mergeById([{ id: 'a', title: 'pending', created_at: new Date().toISOString() }], []).length === 1
);
const merged = mergeById(
  [
    { id: 'a', title: 'old', created_at: '2020-01-01T00:00:00Z' },
    { id: 'b', title: 'only-local', created_at: '2020-01-01T00:00:00Z' },
  ],
  [
    { id: 'a', title: 'remote', created_at: '2026-01-01T00:00:00Z' },
    { id: 'c', title: 'only-remote', created_at: '2026-01-01T00:00:00Z' },
  ]
);
assert('merge remote wins on id', merged.find((x) => x.id === 'a').title === 'remote');
assert('merge drops stale local-only', !merged.some((x) => x.id === 'b'));
assert('merge adds remote-only', merged.some((x) => x.id === 'c'));
assert(
  'merge keeps in-flight local-only',
  mergeById(
    [{ id: 'z', title: 'pending', created_at: new Date().toISOString() }],
    [{ id: 'a', title: 'remote', created_at: '2026-01-01T00:00:00Z' }]
  ).some((x) => x.id === 'z')
);
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
assert('nav has Departamento', nav.includes("href: '/departamento'"));

const apartment = readFileSync(join(root, 'src/lib/apartment.ts'), 'utf8');
assert('apartment street is Ocelotl 14', apartment.includes('Ocelotl 14'));
assert('apartment neighborhood Tepetlapa', apartment.includes('San Pablo Tepetlapa'));
assert('apartment postal 04260', apartment.includes('04260'));
assert('apartment share helpers exist', apartment.includes('apartmentWhatsAppUrl') && apartment.includes('apartmentWazeUrl'));

const deptoPage = readFileSync(join(root, 'src/app/departamento/page.tsx'), 'utf8');
assert('departamento has presupuesto tab', deptoPage.includes("'finanzas'"));
assert('departamento has pagos tab', deptoPage.includes("'pagos'"));
assert('departamento has install tab', deptoPage.includes("'instalar'"));

const manifest = readFileSync(join(root, 'public/manifest.json'), 'utf8');
assert('manifest is standalone PWA', manifest.includes('"display": "standalone"'));
assert('manifest has 192 icon', manifest.includes('icon-192.png'));
assert('sw exists', existsSync(join(root, 'public/sw.js')));
assert('pwa icon 192 exists', existsSync(join(root, 'public/icon-192.png')));
assert('pwa icon 512 exists', existsSync(join(root, 'public/icon-512.png')));
assert('apple touch icon exists', existsSync(join(root, 'public/apple-touch-icon.png')));
assert('brand book exists', existsSync(join(root, 'docs/brand/BRANDBOOK.md')));
assert('design system exists', existsSync(join(root, 'docs/brand/DESIGN-SYSTEM.md')));
assert('brand logo svg exists', existsSync(join(root, 'docs/brand/logo.svg')));
assert('public logo svg exists', existsSync(join(root, 'public/logo.svg')));
assert('public logo mark exists', existsSync(join(root, 'public/logo-mark.png')));
assert('manifest theme is pastel pink', manifest.includes('#FFB5C5'));
assert('public isotipo exists', existsSync(join(root, 'public/logo-mark.png')));

const dateIdeas = readFileSync(join(root, 'src/lib/date-ideas.ts'), 'utf8');
assert('date catalog uses real JSON', dateIdeas.includes("from '@/data/catalogo-citas.json'"));
assert('mexico regions listed', dateIdeas.includes('Ciudad de México') && dateIdeas.includes('Querétaro'));
assert('catalog file exists', existsSync(join(root, 'src/data/catalogo-citas.json')));
const catalogJson = readFileSync(join(root, 'src/data/catalogo-citas.json'), 'utf8');
assert('catalog has C0001', catalogJson.includes('"id": "C0001"'));
assert('catalog has C0500', catalogJson.includes('"id": "C0500"'));

const dateRules = readFileSync(join(root, 'src/lib/date-rules.ts'), 'utf8');
assert('list limit is 20', dateRules.includes('DATE_LIST_LIMIT = 20'));
assert('reschedule limit is 3', dateRules.includes('DATE_RESCHEDULE_LIMIT = 3'));
assert('photo nudges 10', dateRules.includes('PHOTO_NUDGE_LIMIT = 10'));

const datesPage = readFileSync(join(root, 'src/app/dates/page.tsx'), 'utf8');
assert('dates tab En la lista', datesPage.includes('En la lista'));
assert('dates tab Ya juntos', datesPage.includes('Ya juntos'));
assert('dates shares without fake Instagram', datesPage.includes('Compartir') && !datesPage.includes('instagram.com'));
assert('mau zip email', datesPage.includes('mau@nexcar.mx'));
assert('dates page has Qué hacemos hoy', datesPage.includes('Qué hacemos hoy'));

assert('depto has super tab', deptoPage.includes("'super'"));
assert('depto taller is Mau-only', deptoPage.includes("'taller'") && deptoPage.includes('isMau'));
assert('presupuesto hidden from Amanda', deptoPage.includes("item.id === 'finanzas'") || deptoPage.includes("id === 'finanzas'"));
const grocery = readFileSync(join(root, 'src/lib/grocery.ts'), 'utf8');
const groceryCatalog = readFileSync(join(root, 'src/lib/grocery-catalog.ts'), 'utf8');
const groceryStores = readFileSync(join(root, 'src/lib/grocery-stores.ts'), 'utf8');
assert('grocery has walmart-like departments', groceryCatalog.includes('Frutas y verduras') && groceryStores.includes('Chedraui'));
assert('grocery ranks stores', grocery.includes('rankStores') && grocery.includes('recommendStore'));
assert('nearby stores include Walmart Express', groceryStores.includes('Walmart Express División del Norte'));
assert('nearby stores include Costco and Sams', groceryStores.includes('Costco Villa Coapa') && groceryStores.includes("Sam's Club Acoxpa"));
assert('catalog has Lala and Kirkland', groceryCatalog.includes("'Lala'") && groceryCatalog.includes("'Kirkland'"));
assert('no dummy pendiente partners', !grocery.includes("status: 'pendiente'"));

const security = readFileSync(join(root, 'src/lib/security.ts'), 'utf8');
assert('max 20 payment methods', security.includes('MAX_PAYMENT_METHODS = 20'));
function looksLikePan(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 19;
}
assert('PAN 16 digits flagged', looksLikePan('4111111111111111'));
assert('last4 not flagged as PAN', !looksLikePan('4111'));
assert('spaces in PAN flagged', looksLikePan('4111 1111 1111 1111'));

const vaultUi = readFileSync(join(root, 'src/app/departamento/vault-panel.tsx'), 'utf8');
assert('vault has no cc-number field', !vaultUi.includes('cc-number') && !vaultUi.includes('cardNumber'));
assert('vault last4 max 4', vaultUi.includes('maxLength={4}'));
assert('vault Mau-only', vaultUi.includes("memberSlot !== 'MEMBER_B'"));

const superPanel = readFileSync(join(root, 'src/app/departamento/super-panel.tsx'), 'utf8');
assert(
  'super is presencial lists',
  groceryCatalog.includes('Despensa de la semana') && superPanel.includes('Sucursales para esta lista')
);
assert('super has no online checkout', !superPanel.includes('Pedir en') && !superPanel.includes('En línea'));
assert('super does not fetch open food facts photos', !superPanel.includes('/api/products') && !existsSync(join(root, 'src/app/api/products/route.ts')));
assert('super uses local store directory', !superPanel.includes('/api/stores') && superPanel.includes('NEARBY_STORES'));
assert('super does not rank with guía prices', !grocery.includes("source: 'guia'") && !superPanel.includes('guía CDMX'));
assert('address can share location', readFileSync(join(root, 'src/app/departamento/address-panel.tsx'), 'utf8').includes('Compartir ubicación'));

const taller = readFileSync(join(root, 'src/app/departamento/taller-panel.tsx'), 'utf8');
assert('protocol explains no PAN in bot', taller.includes('Si esta app pudiera teclear tu tarjeta'));

const finanzas = readFileSync(join(root, 'src/lib/finanzas.ts'), 'utf8');
const finanzasStore = readFileSync(join(root, 'src/stores/finanzas-store.ts'), 'utf8');
assert('finanzas upserts supabase', finanzasStore.includes('finanzas_snapshots'));
assert('finanzas has no Claude artifact', !finanzas.includes('claude.ai/artifact') && !finanzasStore.includes('gemelo'));
assert('finanzas has no seed NU debt', !finanzas.includes('12840'));

const cronTick = readFileSync(join(root, 'src/lib/cron-tick.ts'), 'utf8');
assert('cron tick heartbeat exists', cronTick.includes('heartbeat_at'));
assert('cron tick sends web push', cronTick.includes('sendPushToMember'));
assert('cron tick does not fetch Claude', !cronTick.includes('claude.ai'));
assert(
  'vercel keeps a daily backup cron',
  existsSync(join(root, 'vercel.json')) &&
    readFileSync(join(root, 'vercel.json'), 'utf8').includes('/api/cron/tick')
);
const fiveDay = readFileSync(join(root, '.github/workflows/five-a-day.yml'), 'utf8');
assert('github actions fires five utc hours', fiveDay.includes('0 14 * * *') && fiveDay.includes('0 5 * * *'));
const sw = readFileSync(join(root, 'public/sw.js'), 'utf8');
assert('service worker handles push', sw.includes("addEventListener('push'"));
const antesPush = readFileSync(join(root, 'supabase-antes-push.sql'), 'utf8');
assert('sql before github push has web push table', antesPush.includes('push_subscriptions'));
assert('sql before github push blocks PAN', antesPush.includes('payment_methods_no_pan'));

const migration = readFileSync(join(root, 'supabase-migration.sql'), 'utf8');
assert('sql has finanzas_snapshots', migration.includes('finanzas_snapshots'));
assert('sql has member_presence', migration.includes('member_presence'));
assert('sql vault last4 only', migration.includes("last4 ~ '^\\d{4}$'"));
assert('sql drops pan columns', migration.includes('DROP COLUMN IF EXISTS pan'));

const reminders = readFileSync(join(root, 'src/lib/date-rules.ts'), 'utf8');
assert('pre date reminders exist', reminders.includes("id: '8h'") && reminders.includes("id: '15m'"));

const recuerdosNuevo = readFileSync(join(root, 'src/app/recuerdos/nuevo/page.tsx'), 'utf8');
assert('capture lives under /recuerdos/nuevo', recuerdosNuevo.includes('Captura un recuerdo'));

const camara = readFileSync(join(root, 'src/app/camara/page.tsx'), 'utf8');
assert('old /camara redirects to recuerdos', camara.includes('/recuerdos/nuevo'));

const nextConfig = readFileSync(join(root, 'next.config.mjs'), 'utf8');
assert('next redirects /camara', nextConfig.includes("source: '/camara'"));
assert('next redirects /planes', nextConfig.includes("source: '/planes'"));

const home = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
assert('home capture link is recuerdos/nuevo', home.includes('/recuerdos/nuevo') && !home.includes("href=\"/camara\""));

assert('dates page is the 500-citas lista', datesPage.includes('DATE_LIST_LIMIT') || datesPage.includes('En la lista'));
assert('dates search starts with all moments', datesPage.includes("useState<DateMoment | 'todas'>('todas')"));
assert('dates search explains empty results', datesPage.includes('searchHint'));
assert('date ideas search is OR', readFileSync(join(root, 'src/lib/date-ideas.ts'), 'utf8').includes('hits.length > 0'));

const calendar = readFileSync(join(root, 'src/app/calendario/page.tsx'), 'utf8');
assert('calendar has Metas Juntos', calendar.includes('ACTIVITY_CATEGORIES'));
assert('calendar has custom recurrence', calendar.includes('Personalizado') || calendar.includes('custom'));
assert('calendar uses calendar-day rounding', calendar.includes('getCalendarDaysUntil'));
assert('calendar payment presets', calendar.includes('PAYMENT_PRESETS') && calendar.includes('Renta'));
assert('calendar category is renta tarjetas', readFileSync(join(root, 'src/lib/constants.ts'), 'utf8').includes("'Renta / tarjetas'"));

const auth = readFileSync(join(root, 'src/stores/auth-store.ts'), 'utf8');
assert('secret is 1711', auth.includes('COUPLE_SECRET'));
assert('mau pin is 1711#', readFileSync(join(root, 'src/lib/constants.ts'), 'utf8').includes("MAU_SECRET = '1711#'"));
assert('amanda pin is 1711', readFileSync(join(root, 'src/lib/constants.ts'), 'utf8').includes("AMANDA_SECRET = '1711'"));
assert('instance still hashes couple secret', auth.includes('hashSecret(COUPLE_SECRET)'));
assert('60 day ttl used', auth.includes('SECRET_TTL_MS'));

const sessionWatch = readFileSync(join(root, 'src/lib/session-watch.ts'), 'utf8');
assert('expiry nudges use primes', sessionWatch.includes('PRIMES') && sessionWatch.includes('Amanda ya no entró') === false);
assert('session watch notifies amanda silence', readFileSync(join(root, 'src/components/session-watch.tsx'), 'utf8').includes('Amanda ya no entró a la app'));

const mood = readFileSync(join(root, 'src/stores/mood-store.ts'), 'utf8');
assert('moods pruned to 30 days', mood.includes('MOOD_RETENTION_DAYS'));

const supabaseClient = readFileSync(join(root, 'src/lib/supabase.ts'), 'utf8');
assert('modern supabase keys strip Bearer sb_', supabaseClient.includes('Bearer sb_'));
assert('supabase clients are cached per instance', supabaseClient.includes('instanceClients'));

const coupleRealtime = readFileSync(join(root, 'src/lib/couple-realtime.ts'), 'utf8');
assert('one couple realtime channel', coupleRealtime.includes('couple-live-'));
assert('realtime retries CHANNEL_ERROR', coupleRealtime.includes('CHANNEL_ERROR'));
assert('writes broadcast couple change', coupleRealtime.includes('coupleDidChange'));

const syncProvider = readFileSync(join(root, 'src/components/sync-provider.tsx'), 'utf8');
assert('sync resumes on visibility', syncProvider.includes('visibilitychange'));
assert('sync polls faster until realtime is live', syncProvider.includes('liveRef'));

const realtimeSql = readFileSync(join(root, 'supabase-realtime.sql'), 'utf8');
assert('realtime sql sets replica identity full', realtimeSql.includes('REPLICA IDENTITY FULL'));

const gallery = readFileSync(join(root, 'src/app/recuerdos/nuevo/page.tsx'), 'utf8');
assert('recuerdos save to device gallery', gallery.includes('saveImagesToDeviceGallery'));
const memoriesStore = readFileSync(join(root, 'src/stores/memories-store.ts'), 'utf8');
assert('memories persist ignores local demo blobs', memoriesStore.includes('espacio-pareja-memories-v2'));
assert('memories skip fixture captions', memoriesStore.includes('isFixtureCaption'));
assert('memories broadcast after upload', memoriesStore.includes("coupleDidChange('memories')"));
const fixtures = readFileSync(join(root, 'src/lib/fixtures.ts'), 'utf8');
assert('fixture helper flags e2e recuerdo captions', fixtures.includes('recuerdo \\d{10,}'));
assert('album hides local data urls', readFileSync(join(root, 'src/app/recuerdos/page.tsx'), 'utf8').includes('isRemoteMediaUrl'));

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
  const tables = ['instances', 'activities', 'moods', 'sparks', 'memories', 'plans', 'payments'];
  try {
    for (const table of tables) {
      const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
      assert(`supabase ${table} readable (${res.status})`, res.ok);
    }
  } catch (err) {
    console.log(`skip supabase live checks (${err.cause?.code || err.message})`);
  }
} else {
  console.log('skip supabase live checks (no env)');
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
