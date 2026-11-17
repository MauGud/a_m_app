import catalog from '@/data/catalogo-citas.json';

export type PriceBand = 'gratis' | 'bajo' | 'medio' | 'alto' | 'lujo';
export type DateMood =
  | 'Romántico'
  | 'Tranqui'
  | 'Aventura'
  | 'Cultural'
  | 'Foodie'
  | 'Fiesta'
  | 'Naturaleza'
  | 'Bienestar';
export type DateMoment = 'Amanecer' | 'Mañana' | 'Tarde' | 'Noche';
export type DateDuration = 'lt1' | 'h1a2' | 'h2a4' | 'medio' | 'dia' | 'finde';
export type DateDistance = 'pie' | 'cerca' | 'ciudad' | 'escapada';

export interface DateSource {
  fuente: string;
  url: string;
}

export interface DateIdea {
  id: string;
  title: string;
  blurb: string;
  kind: string;
  subCode: string;
  city: string;
  state: string;
  country: string;
  priceMxn: number;
  priceMin: number;
  priceMax: number;
  band: PriceBand;
  momentos: DateMoment[];
  dias: string[];
  seasonNote: string;
  weekdayNight: boolean;
  vegan: 'V' | 'v' | '-';
  veganLabel: string;
  durationHours: number;
  moods: DateMood[];
  driveHours: number;
  lat: number;
  lng: number;
  maps: string;
  sources: DateSource[];
  tags: string[];
}

type RawCita = {
  id: string;
  region: string;
  subcategoria: string;
  sub_code: string;
  zona: string;
  nombre: string;
  por_que_vale_la_pena: string;
  presupuesto_pareja_min_mxn: number;
  presupuesto_pareja_max_mxn: number;
  rango_presupuesto: string;
  momento: DateMoment[];
  dias: string[];
  temporada_o_nota_de_fecha: string;
  ideal_martes_a_jueves_noche: boolean;
  opcion_vegana: string;
  veg_code: 'V' | 'v' | '-';
  duracion_horas: number;
  mood: DateMood[];
  manejo_desde_cdmx_horas: number;
  lat_aprox_zona: number;
  lng_aprox_zona: number;
  google_maps: string;
  nota_especifica?: string;
  fuentes: DateSource[];
  origen: string;
};

export const DATE_SUBCATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: 'Café y desayuno', label: 'Café', emoji: '☕' },
  { value: 'Comida y cena', label: 'Comida', emoji: '🍽️' },
  { value: 'Mercados y comida callejera', label: 'Mercados', emoji: '🌮' },
  { value: 'Bares y coctelería', label: 'Bares', emoji: '🍸' },
  { value: 'Música en vivo y baile', label: 'Música', emoji: '🎶' },
  { value: 'Museos y arte', label: 'Museos', emoji: '🖼️' },
  { value: 'Historia, arquitectura y zonas arqueológicas', label: 'Historia', emoji: '🏛️' },
  { value: 'Paseos por barrios y pueblos', label: 'Paseos', emoji: '🚶' },
  { value: 'Parques, naturaleza y senderismo', label: 'Parques', emoji: '🌿' },
  { value: 'Miradores, amaneceres y atardeceres', label: 'Miradores', emoji: '🌅' },
  { value: 'Experiencias y talleres', label: 'Talleres', emoji: '🎨' },
  { value: 'Bienestar', label: 'Bienestar', emoji: '🕯️' },
  { value: 'Aventura', label: 'Aventura', emoji: '🧗' },
  { value: 'Hospedaje con experiencia', label: 'Hospedaje', emoji: '🏡' },
  { value: 'Eventos de temporada y recurrentes', label: 'Eventos', emoji: '🎉' },
];

export const DATE_KINDS = DATE_SUBCATEGORIES;
export type DateKind = string;

export const PRICE_BANDS: { value: PriceBand; label: string; max: number }[] = [
  { value: 'gratis', label: 'Gratis', max: 0 },
  { value: 'bajo', label: 'Hasta $300', max: 300 },
  { value: 'medio', label: '$300 a $1,000', max: 1000 },
  { value: 'alto', label: '$1,000 a $3,000', max: 3000 },
  { value: 'lujo', label: 'Más de $3,000', max: Infinity },
];

export const DATE_MOODS: { value: DateMood; emoji: string }[] = [
  { value: 'Romántico', emoji: '💕' },
  { value: 'Tranqui', emoji: '😌' },
  { value: 'Aventura', emoji: '🧗' },
  { value: 'Cultural', emoji: '🏛️' },
  { value: 'Foodie', emoji: '🍽️' },
  { value: 'Fiesta', emoji: '🎉' },
  { value: 'Naturaleza', emoji: '🌿' },
  { value: 'Bienestar', emoji: '🕯️' },
];

export const DATE_MOMENTS: DateMoment[] = ['Amanecer', 'Mañana', 'Tarde', 'Noche'];

export const DATE_DURATIONS: { value: DateDuration; label: string }[] = [
  { value: 'lt1', label: 'Menos de 1 h' },
  { value: 'h1a2', label: '1 a 2 h' },
  { value: 'h2a4', label: '2 a 4 h' },
  { value: 'medio', label: 'Medio día' },
  { value: 'dia', label: 'Día completo' },
  { value: 'finde', label: 'Fin de semana' },
];

export const DATE_DISTANCES: { value: DateDistance; label: string; km: number }[] = [
  { value: 'pie', label: 'A pie', km: 1.5 },
  { value: 'cerca', label: 'Cerca', km: 5 },
  { value: 'ciudad', label: 'En la ciudad', km: 25 },
  { value: 'escapada', label: 'Escapada', km: 250 },
];

export const DATE_REGIONS = [
  'Ciudad de México',
  'Estado de México',
  'Morelos',
  'Puebla',
  'Hidalgo',
  'Tlaxcala',
  'Querétaro',
  'Guerrero',
] as const;

export const MEXICO_STATES = DATE_REGIONS;
export const SEASONS: { value: string; label: string }[] = [];
export type Season = string;

export const CDMX_CENTER = { lat: 19.4326, lng: -99.1332 };

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function bandFor(min: number, max: number, label: string): PriceBand {
  if (label.toLowerCase().includes('gratis') || max <= 0) return 'gratis';
  if (max <= 300) return 'bajo';
  if (max <= 1000) return 'medio';
  if (max <= 3000) return 'alto';
  return 'lujo';
}

function mapCita(raw: RawCita): DateIdea {
  return {
    id: raw.id,
    title: raw.nombre,
    blurb: raw.por_que_vale_la_pena,
    kind: raw.subcategoria,
    subCode: raw.sub_code,
    city: raw.zona,
    state: raw.region,
    country: 'México',
    priceMxn: raw.presupuesto_pareja_max_mxn,
    priceMin: raw.presupuesto_pareja_min_mxn,
    priceMax: raw.presupuesto_pareja_max_mxn,
    band: bandFor(raw.presupuesto_pareja_min_mxn, raw.presupuesto_pareja_max_mxn, raw.rango_presupuesto),
    momentos: raw.momento,
    dias: raw.dias,
    seasonNote: raw.temporada_o_nota_de_fecha || '',
    weekdayNight: raw.ideal_martes_a_jueves_noche,
    vegan: raw.veg_code,
    veganLabel: raw.opcion_vegana,
    durationHours: raw.duracion_horas,
    moods: raw.mood,
    driveHours: raw.manejo_desde_cdmx_horas || 0,
    lat: raw.lat_aprox_zona,
    lng: raw.lng_aprox_zona,
    maps: raw.google_maps,
    sources: raw.fuentes || [],
    tags: [
      raw.nombre,
      raw.zona,
      raw.region,
      raw.subcategoria,
      ...(raw.mood || []),
      ...(raw.momento || []),
      raw.veg_code,
      raw.origen,
    ].map((item) => item.toLowerCase()),
  };
}

export const DATE_IDEAS: DateIdea[] = (catalog.citas as RawCita[]).map(mapCita);

export const CATALOG_LIMIT = catalog.limite_catalogo || 2000;

export function mexicoNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
}

export function currentWeekday(from = mexicoNow()) {
  return WEEKDAYS[from.getDay()];
}

export function currentMoment(from = mexicoNow()): DateMoment {
  const hour = from.getHours();
  if (hour < 8) return 'Amanecer';
  if (hour < 12) return 'Mañana';
  if (hour < 18) return 'Tarde';
  return 'Noche';
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function matchesDuration(hours: number, duration?: DateDuration | 'todas') {
  if (!duration || duration === 'todas') return true;
  if (duration === 'lt1') return hours < 1;
  if (duration === 'h1a2') return hours >= 1 && hours <= 2;
  if (duration === 'h2a4') return hours > 2 && hours <= 4;
  if (duration === 'medio') return hours > 4 && hours <= 8;
  if (duration === 'dia') return hours > 8 && hours < 16;
  return hours >= 16;
}

function matchesDistance(idea: DateIdea, distance: DateDistance | 'todas' | undefined, origin?: { lat: number; lng: number }) {
  if (!distance || distance === 'todas') return true;
  if (distance === 'escapada') return idea.driveHours > 0 && idea.driveHours <= 3;
  if (!origin) return idea.driveHours === 0;
  const km = haversineKm(origin, { lat: idea.lat, lng: idea.lng });
  const cap = DATE_DISTANCES.find((item) => item.value === distance)?.km || 25;
  return km <= cap && idea.driveHours === 0;
}

export function filterDateIdeas(input: {
  query?: string;
  kind?: string | 'todas';
  country?: string;
  state?: string;
  city?: string;
  band?: PriceBand | 'todas';
  season?: string | 'todas';
  maxPrice?: number;
  mood?: DateMood | 'todas';
  moment?: DateMoment | 'todas';
  duration?: DateDuration | 'todas';
  distance?: DateDistance | 'todas';
  origin?: { lat: number; lng: number };
  veganOnly?: boolean;
  weekdayNight?: boolean;
  todayOnly?: boolean;
}) {
  const q = (input.query || '').trim().toLowerCase();
  const now = mexicoNow();
  const weekday = currentWeekday(now);
  return DATE_IDEAS.filter((idea) => {
    if (input.kind && input.kind !== 'todas' && idea.kind !== input.kind) return false;
    if (input.state && idea.state !== input.state) return false;
    if (input.city && !idea.city.toLowerCase().includes(input.city.toLowerCase())) return false;
    if (input.band && input.band !== 'todas' && idea.band !== input.band) return false;
    if (typeof input.maxPrice === 'number' && !Number.isNaN(input.maxPrice) && idea.priceMin > input.maxPrice) return false;
    if (input.mood && input.mood !== 'todas' && !idea.moods.includes(input.mood)) return false;
    if (input.moment && input.moment !== 'todas' && !idea.momentos.includes(input.moment)) return false;
    if (!matchesDuration(idea.durationHours, input.duration)) return false;
    if (!matchesDistance(idea, input.distance, input.origin)) return false;
    if (input.veganOnly && idea.vegan === '-') return false;
    if (input.weekdayNight && !idea.weekdayNight) return false;
    if (input.todayOnly && !idea.dias.includes(weekday)) return false;
    if (input.season && input.season !== 'todas' && idea.seasonNote) {
      if (!idea.seasonNote.toLowerCase().includes(String(input.season).toLowerCase())) return false;
    }
    if (!q) return true;
    const hay = `${idea.title} ${idea.blurb} ${idea.city} ${idea.state} ${idea.kind} ${idea.tags.join(' ')}`.toLowerCase();
    const tokens = q.split(/\s+/).filter((token) => token.length > 1);
    return tokens.every((token) => hay.includes(token));
  });
}

export function recommendToday(input: Parameters<typeof filterDateIdeas>[0], limit = 12) {
  const origin = input.origin || CDMX_CENTER;
  const ranked = filterDateIdeas({
    ...input,
    todayOnly: true,
    moment: input.moment && input.moment !== 'todas' ? input.moment : currentMoment(),
  }).slice();
  ranked.sort((a, b) => {
    const aKm = haversineKm(origin, { lat: a.lat, lng: a.lng });
    const bKm = haversineKm(origin, { lat: b.lat, lng: b.lng });
    const nightBoost = (idea: DateIdea) => (idea.weekdayNight ? 0 : 1);
    return nightBoost(a) - nightBoost(b) || aKm - bKm || a.priceMax - b.priceMax;
  });
  const used = new Map<string, number>();
  const picked: DateIdea[] = [];
  for (const idea of ranked) {
    const count = used.get(idea.kind) || 0;
    if (count >= 3) continue;
    used.set(idea.kind, count + 1);
    picked.push(idea);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function formatPriceRange(idea: DateIdea) {
  if (idea.band === 'gratis' || idea.priceMax <= 0) return 'Gratis';
  if (idea.priceMin === idea.priceMax) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(
      idea.priceMax
    );
  }
  const money = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
  return `${money(idea.priceMin)} a ${money(idea.priceMax)}`;
}
