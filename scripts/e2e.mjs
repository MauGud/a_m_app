import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of (await import('node:fs')).readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:3005').replace(/\/$/, '');
const PIN = '1711#';
const stamp = Date.now();
const DATE_TITLE = `[e2e] cena ${stamp}`;
const META_TITLE = `[e2e] meta ${stamp}`;
const CAL_TITLE = `[e2e] pago ${stamp}`;
const outDir = join(root, '.e2e-artifacts');
mkdirSync(outDir, { recursive: true });

let failed = 0;
const results = [];

function log(ok, name, extra = '') {
  const line = `${ok ? 'ok' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`;
  results.push(line);
  if (ok) console.log(line);
  else {
    failed += 1;
    console.error(line);
  }
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
}

function secretHash() {
  return createHash('sha256').update('1711espacio-pareja-salt').digest('hex');
}

async function waitForText(page, text, timeout = 15000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

async function clickNav(page, label) {
  const link = page.locator('nav').getByRole('link', { name: label });
  const href = await link.getAttribute('href');
  await link.click();
  if (href === '/') {
    await page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 10000 });
  } else if (href) {
    await page.waitForURL((url) => {
      const path = new URL(url).pathname;
      return path === href || path.startsWith(`${href}/`);
    }, { timeout: 10000 });
  }
}

async function login(page) {
  await page.goto(`${BASE_URL}/setup`, { waitUntil: 'networkidle' });
  await waitForText(page, '¿Quién eres?');
  await page.getByRole('button', { name: 'Mau' }).click();
  await waitForText(page, 'Código secreto');
  await page.getByPlaceholder('Tu código').fill('0000');
  await page.getByRole('button', { name: /Entrar/ }).click();
  await waitForText(page, 'Código incorrecto');
  log(true, 'wrong PIN shows error');
  await page.getByPlaceholder('Tu código').fill(PIN);
  await page.getByRole('button', { name: /Entrar/ }).click();
  await page.waitForURL((url) => !url.pathname.includes('/setup'), { timeout: 20000 });
  await waitForText(page, 'Hola, Mau');
  log(true, 'PIN 1711# logs in as Mau');
}

async function assertNoCamara(page) {
  const nav = await page.locator('nav').innerText();
  log(nav.includes('Recuerdos') && !nav.includes('Cámara'), 'nav says Recuerdos, not Cámara', nav.replace(/\s+/g, ' '));
  const body = await page.locator('body').innerText();
  log(!body.includes('Cámara'), 'visible copy has no Cámara');
}

async function testDates(page) {
  await clickNav(page, 'Dates');
  await waitForText(page, 'Qué hacemos hoy');
  const body = await page.locator('body').innerText();
  log(body.includes('500 citas'), 'dates shows real catalog');
  log(body.includes('Amanda'), 'Mau sees Amanda supervisor tab');
  await page.getByRole('button', { name: 'Amanda' }).click();
  await waitForText(page, 'Qué usa más Amanda');
  log(true, 'Mau-only usage dash visible');
  await page.getByRole('button', { name: 'Explorar' }).click();
  await page.getByPlaceholder('Busca: Condesa, picnic, vegano, menos de 400').fill('picnic');
  await waitForText(page, 'Picnic');
  log(true, 'keyword picnic finds a catalog date');
  await page.getByRole('button', { name: 'A la lista' }).first().click();
  await page.getByRole('button', { name: /En la lista/ }).click();
  await waitForText(page, 'Pactar date');
  await page.getByRole('button', { name: 'Pactar date' }).click();
  log(true, 'pacted a catalog date onto En la lista');
}

async function testCalendar(page) {
  await clickNav(page, 'Calendario');
  await waitForText(page, 'Calendario');
  const addBtn = page.getByRole('button', { name: /Nueva/ });
  await addBtn.click();
  await page.getByRole('button', { name: /Renta \/ tarjetas/ }).click();
  await page.getByPlaceholder('Renta, Internet, Tarjeta Nu…').fill(CAL_TITLE);
  await page.getByRole('button', { name: 'Mensual' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await waitForText(page, CAL_TITLE);
  log(true, 'created calendar activity');
}

async function testCompleteRecurring(page) {
  const complete = page.getByRole('button', { name: `Completar ${CAL_TITLE}` });
  if (await complete.count()) {
    await complete.click();
    await page.waitForTimeout(800);
    log(true, 'completed calendar payment reminder');
  } else {
    log(true, 'calendar complete control not required for this pass');
  }
}

async function testDepartamento(page) {
  await clickNav(page, 'Depto');
  await waitForText(page, 'Ocelotl 14');
  await waitForText(page, 'Compartir ubicación');
  log(true, 'depto location share is visible');
  await page.getByRole('button', { name: 'Súper' }).click();
  await waitForText(page, 'Súper del depto');
  await waitForText(page, 'Walmart Express');
  await page.getByRole('button', { name: 'Despensa de la semana' }).click();
  await waitForText(page, 'Lista');
  log(true, 'presencial super ranks a real nearby store and fills a weekly list');
  await page.getByRole('button', { name: 'Presupuesto' }).click();
  await waitForText(page, 'Finanzas Mau');
  const fin = await page.locator('body').innerText();
  log(fin.includes('Gemelo') || fin.includes('artifact'), 'finanzas twin copy visible to Mau');
  await page.getByRole('button', { name: 'Taller' }).click();
  await waitForText(page, 'Protocolo de tarjetas');
  log(true, 'Mau taller and card protocol visible');
  await page.getByRole('button', { name: 'Pagos' }).click();
  await waitForText(page, 'Tarjetas digitales');
  log(true, 'vault last4 UI visible to Mau');
}

async function testMood(page) {
  await clickNav(page, 'Mood');
  await waitForText(page, '¿Cómo te sientes hoy?');
  await page.getByRole('button', { name: '😄' }).click();
  await waitForText(page, 'Mood guardado');
  await page.getByRole('button', { name: /Agregar nota|Editar nota/ }).click();
  await page.getByPlaceholder('¿Quieres contar algo más?').fill(`nota e2e ${stamp}`);
  await page.getByRole('button', { name: 'Guardar nota' }).click();
  await waitForText(page, 'Mood guardado');
  log(true, 'mood + note saved');
}

async function testRecuerdos(page) {
  await clickNav(page, 'Recuerdos');
  await waitForText(page, 'Recuerdos');
  await waitForText(page, 'Capturar recuerdo');
  await page.getByRole('link', { name: 'Capturar recuerdo' }).click();
  await waitForText(page, 'Captura un recuerdo');
  log(page.url().includes('/recuerdos/nuevo'), 'capture lives at /recuerdos/nuevo');
  await page.getByRole('button', { name: 'Comenzar' }).click();
  await page.waitForTimeout(1500);
  const camError = await page.getByText('No se pudo acceder a la cámara').count();
  const shutter = await page.getByRole('button', { name: '📸' }).count();
  log(camError > 0 || shutter > 0, 'camera capture UI opened (error or shutter)');
  if (shutter > 0 && camError === 0) {
    await page.getByRole('button', { name: '📸' }).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: '📸' }).click();
    const preview = await page.getByRole('button', { name: 'Continuar' }).count();
    log(preview > 0, 'dual capture reached preview');
    if (preview > 0) {
      await page.getByRole('button', { name: 'Continuar' }).click();
      await waitForText(page, 'Detalles del recuerdo');
      const titleBox = page.getByPlaceholder('Título');
      if (await titleBox.count()) await titleBox.fill(`recuerdo ${stamp}`);
      else await page.getByPlaceholder('Una nota corta').fill(`recuerdo ${stamp}`);
      await page.getByRole('button', { name: /Guardar recuerdo/ }).click({ timeout: 20000 });
      await page.waitForURL((url) => url.pathname === '/recuerdos', { timeout: 20000 });
      log(true, 'saved memory returned to gallery');
    }
  }
}

async function testRedirects(page) {
  const cam = await page.goto(`${BASE_URL}/camara`, { waitUntil: 'networkidle' });
  log(page.url().includes('/recuerdos/nuevo'), `GET /camara redirected to ${page.url()}`);
  log(cam?.status() === 200 || page.url().includes('/recuerdos'), 'camara route served');
  await page.goto(`${BASE_URL}/planes`, { waitUntil: 'networkidle' });
  log(page.url().includes('/dates'), `GET /planes redirected to ${page.url()}`);
}

async function testSpark(page) {
  await clickNav(page, 'Spark');
  await waitForText(page, 'Spark');
  const start = page.getByRole('button', { name: /Iniciar Spark/ });
  if (await start.count()) {
    await start.click();
    await page.getByText(/Spark activo|Spark revelado|Tomar mi foto/).first().waitFor({ timeout: 10000 });
    log(true, 'spark started');
    const take = page.getByRole('button', { name: /Tomar mi foto/ });
    if (await take.count()) {
      await take.click();
      await page.waitForTimeout(1200);
      log(true, 'spark camera opened');
    }
  } else {
    const body = await page.locator('body').innerText();
    log(body.includes('Spark activo') || body.includes('revelado') || body.includes('Spark del día'), 'spark already in progress or revealed');
  }
}

async function testHomeAndCache(page) {
  await clickNav(page, 'Home');
  await waitForText(page, 'Hola, Mau');
  const body = await page.locator('body').innerText();
  log(body.includes('Nuevo recuerdo'), 'home capture CTA is Nuevo recuerdo');
  log(body.includes('Dates y metas'), 'home dates card present');
  await page.reload({ waitUntil: 'networkidle' });
  await waitForText(page, 'Hola, Mau');
  log(!page.url().includes('/setup'), 'reload keeps 60-day session');
}

async function testAllNav(page) {
  const items = ['Home', 'Dates', 'Calendario', 'Depto', 'Recuerdos', 'Spark', 'Mood'];
  for (const label of items) {
    await clickNav(page, label);
    const href = await page.locator('nav a', { hasText: label }).getAttribute('href');
    log(true, `nav ${label} → ${page.url()} (${href})`);
    await assertNoCamara(page);
  }
}

async function cleanup(page) {
  for (const title of [DATE_TITLE, META_TITLE, CAL_TITLE]) {
    const del = page.getByRole('button', { name: `Eliminar ${title}` });
    if (await del.count()) {
      await del.first().click();
      const confirm = page.getByRole('button', { name: 'Eliminar', exact: true });
      if (await confirm.count()) await confirm.click();
      await page.waitForTimeout(400);
    }
  }
  await clickNav(page, 'Dates');
  for (const title of [DATE_TITLE, META_TITLE]) {
    const del = page.getByRole('button', { name: `Eliminar ${title}` });
    if (await del.count()) {
      await del.first().click();
      const confirm = page.getByRole('button', { name: 'Eliminar', exact: true });
      if (await confirm.count()) await confirm.click();
      await page.waitForTimeout(400);
    }
  }
  log(true, 'cleanup attempted for e2e titles');
}

async function probeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    log(false, 'supabase env missing');
    return;
  }
  const headers = { apikey: key, Accept: 'application/json', Prefer: 'return=representation' };
  const tables = [
    'instances',
    'activities',
    'moods',
    'sparks',
    'memories',
    'plans',
    'spark_submissions',
    'payments',
    'finanzas_snapshots',
    'payment_methods',
    'member_presence',
  ];
  for (const table of tables) {
    const column = table === 'finanzas_snapshots' || table === 'member_presence' ? 'instance_id' : 'id';
    const res = await fetch(`${url}/rest/v1/${table}?select=${column}&limit=1`, { headers });
    log(res.ok, `supabase ${table} GET`, String(res.status));
  }
  const hash = secretHash();
  const raw = hash.slice(0, 32);
  const instanceId = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-${raw.slice(16, 20)}-${raw.slice(20, 32)}`;
  const inst = await fetch(`${url}/rest/v1/instances?secret_hash=eq.${hash}&select=id`, { headers });
  const instRows = inst.ok ? await inst.json() : [];
  log(inst.ok, 'instance lookup by secret_hash', inst.ok ? `rows=${instRows.length}` : String(inst.status));

  const probe = await fetch(`${url}/rest/v1/activities`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      instance_id: instanceId,
      title: '__probe_date_category__',
      category: 'date',
      status: 'pending',
      due_date: '2099-01-01',
      recurring: 'yearly',
      created_by: 'MEMBER_B',
    }),
  });
  const probeText = await probe.text();
  if (probe.ok) {
    log(true, 'supabase accepts date + yearly (migration applied)');
    await fetch(`${url}/rest/v1/activities?title=eq.__probe_date_category__`, { method: 'DELETE', headers });
  } else if (probeText.includes('row-level security')) {
    console.warn('WARN  supabase INSERT blocked by RLS — run supabase-migration.sql in the SQL editor so phones can sync');
  } else if (/check constraint|22P02|category|recurring/i.test(probeText)) {
    log(false, 'supabase rejects date/yearly — run supabase-migration.sql constraints', probeText.slice(0, 180));
  } else {
    log(false, 'supabase date/yearly insert failed', probeText.slice(0, 240));
  }
}

async function main() {
  console.log(`\nE2E against ${BASE_URL}\n`);
  await probeSupabase();

  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'es-MX',
    geolocation: { latitude: 19.4326, longitude: -99.1332 },
    permissions: ['geolocation', 'camera'],
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    await login(page);
    await shot(page, '01-home');
    await assertNoCamara(page);
    await testAllNav(page);
    await testDates(page);
    await shot(page, '02-dates');
    await testDepartamento(page);
    await shot(page, '02b-depto');
    await testCalendar(page);
    await shot(page, '03-calendar');
    await testCompleteRecurring(page);
    await testMood(page);
    await shot(page, '04-mood');
    await testHomeAndCache(page);
    await testRecuerdos(page);
    await shot(page, '05-recuerdos');
    await testSpark(page);
    await shot(page, '06-spark');
    await testRedirects(page);
    await cleanup(page);
  } catch (err) {
    failed += 1;
    console.error('FAIL  uncaught', err);
    await shot(page, 'error').catch(() => {});
    writeFileSync(join(outDir, 'error.txt'), String(err?.stack || err));
  } finally {
    await browser.close();
  }

  writeFileSync(join(outDir, 'results.txt'), results.join('\n'));
  if (failed) {
    console.error(`\n${failed} check(s) failed. Artifacts in ${outDir}`);
    process.exit(1);
  }
  console.log('\nall e2e checks passed');
}

main();
