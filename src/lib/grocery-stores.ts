import { APARTMENT } from '@/lib/apartment';

export type ChainId = 'walmart' | 'chedraui' | 'soriana' | 'costco' | 'sams';
export type TripKind = 'semana' | 'quincena' | 'mes';

export interface NearbyStore {
  id: string;
  chain: ChainId;
  name: string;
  address: string;
  lat: number;
  lng: number;
  trip: TripKind;
  membership?: boolean;
  mapsUrl: string;
}

function maps(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export const CHAINS: { id: ChainId; name: string; trip: TripKind }[] = [
  { id: 'walmart', name: 'Walmart', trip: 'semana' },
  { id: 'chedraui', name: 'Chedraui', trip: 'semana' },
  { id: 'soriana', name: 'Soriana', trip: 'semana' },
  { id: 'costco', name: 'Costco', trip: 'mes' },
  { id: 'sams', name: "Sam's Club", trip: 'mes' },
];

export const NEARBY_STORES: NearbyStore[] = [
  {
    id: 'walmart-express-division',
    chain: 'walmart',
    name: 'Walmart Express División del Norte',
    address: 'Av. División del Norte 3651-Loc 3, San Pablo Tepetlapa, Coyoacán, 04620',
    lat: 19.32088,
    lng: -99.1393,
    trip: 'semana',
    mapsUrl: maps(19.32088, -99.1393),
  },
  {
    id: 'walmart-naval',
    chain: 'walmart',
    name: 'Walmart Escuela Naval Militar',
    address: 'Av. H. Escuela Naval Militar 753, Coyoacán, 04830',
    lat: 19.3177,
    lng: -99.12523,
    trip: 'semana',
    mapsUrl: maps(19.3177, -99.12523),
  },
  {
    id: 'chedraui-coapa',
    chain: 'chedraui',
    name: 'Chedraui Coapa',
    address: 'Del Hueso 670, Col. Los Girasoles I, Coyoacán, 04870',
    lat: 19.3048,
    lng: -99.1268,
    trip: 'semana',
    mapsUrl: maps(19.3048, -99.1268),
  },
  {
    id: 'chedraui-americas',
    chain: 'chedraui',
    name: 'Chedraui Plaza Américas',
    address: 'División del Norte, Barrio Los Olivos, Coyoacán',
    lat: 19.3274,
    lng: -99.1438,
    trip: 'semana',
    mapsUrl: maps(19.3274, -99.1438),
  },
  {
    id: 'soriana-miramontes',
    chain: 'soriana',
    name: 'Soriana Híper Miramontes',
    address: 'Canal de Miramontes 2600, Ex-Hacienda San Antonio Coapa, Coyoacán, 04850',
    lat: 19.3142,
    lng: -99.1225,
    trip: 'semana',
    mapsUrl: maps(19.3142, -99.1225),
  },
  {
    id: 'soriana-cantil',
    chain: 'soriana',
    name: 'Soriana Plaza Cantil',
    address: 'Aztecas 270, Los Reyes, Coyoacán',
    lat: 19.3336,
    lng: -99.1624,
    trip: 'semana',
    mapsUrl: maps(19.3336, -99.1624),
  },
  {
    id: 'costco-coapa',
    chain: 'costco',
    name: 'Costco Villa Coapa',
    address: 'Puente 186, Villa Coapa, Tlalpan',
    lat: 19.2925,
    lng: -99.1248,
    trip: 'mes',
    membership: true,
    mapsUrl: maps(19.2925, -99.1248),
  },
  {
    id: 'sams-acoxpa',
    chain: 'sams',
    name: "Sam's Club Acoxpa",
    address: 'Calz. Acoxpa 438, Coapa, Tlalpan, 14300',
    lat: 19.29765,
    lng: -99.13617,
    trip: 'mes',
    membership: true,
    mapsUrl: maps(19.29765, -99.13617),
  },
];

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function storeDistanceKm(store: NearbyStore, origin = APARTMENT) {
  return haversineKm({ lat: origin.lat, lng: origin.lng }, { lat: store.lat, lng: store.lng });
}

export function storesForTrip(trip: TripKind) {
  if (trip === 'mes') return NEARBY_STORES.filter((store) => store.trip === 'mes');
  return NEARBY_STORES.filter((store) => store.trip === 'semana');
}

export function nearestStore(trip: TripKind = 'semana', origin = APARTMENT) {
  return [...storesForTrip(trip)].sort((a, b) => storeDistanceKm(a, origin) - storeDistanceKm(b, origin))[0];
}

export const DESIGNATED_WEEKLY = nearestStore('semana');
export const DESIGNATED_MONTHLY = nearestStore('mes');
