import { APARTMENT } from '@/lib/apartment';
import {
  GROCERY_CATEGORIES,
  GROCERY_DEPARTMENTS,
  GROCERY_SKUS,
  LIST_TEMPLATES,
  type GrocerySku,
} from '@/lib/grocery-catalog';
import {
  CHAINS,
  DESIGNATED_WEEKLY,
  NEARBY_STORES,
  nearestStore,
  storeDistanceKm,
  storesForTrip,
  type ChainId,
  type NearbyStore,
  type TripKind,
} from '@/lib/grocery-stores';

export type { GrocerySku, ChainId, NearbyStore, TripKind };
export {
  CHAINS,
  DESIGNATED_WEEKLY,
  GROCERY_CATEGORIES,
  GROCERY_DEPARTMENTS,
  GROCERY_SKUS,
  LIST_TEMPLATES,
  NEARBY_STORES,
  nearestStore,
  storeDistanceKm,
  storesForTrip,
};

export type PriceBook = Record<string, { price: number; seenAt: string }>;

export function foldText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function priceBookKey(storeId: string, skuId: string) {
  return `${storeId}:${skuId}`;
}

export function skuFitsTrip(sku: GrocerySku, trip: TripKind) {
  if (trip === 'mes') return sku.trip === 'mes' || sku.prices.costco > 0 || sku.prices.sams > 0;
  if (trip === 'quincena') return sku.trip !== 'mes';
  return sku.trip === 'semana' || sku.trip === 'quincena';
}

export function searchGrocery(query: string, department?: string, category?: string, trip?: TripKind) {
  const q = foldText(query.trim());
  const tokens = q.split(/\s+/).filter((token) => token.length > 1);
  return GROCERY_SKUS.filter((sku) => {
    if (department && sku.department !== department) return false;
    if (category && sku.category !== category) return false;
    if (trip && !skuFitsTrip(sku, trip) && tokens.length === 0) return false;
    if (!tokens.length) return true;
    const hay = foldText(`${sku.name} ${sku.brand} ${sku.department} ${sku.category} ${sku.query}`);
    return tokens.every((token) => hay.includes(token));
  });
}

export function templateSkus(trip: TripKind) {
  const template = LIST_TEMPLATES.find((item) => item.id === trip);
  if (!template) return [];
  return template.queries
    .map((query) => searchGrocery(query)[0])
    .filter((sku): sku is GrocerySku => Boolean(sku));
}

export function guidePrice(sku: GrocerySku, chain: ChainId) {
  return sku.prices[chain] || 0;
}

export function unitPrice(sku: GrocerySku, store: NearbyStore, book: PriceBook) {
  const captured = book[priceBookKey(store.id, sku.id)];
  if (captured?.price) {
    return { price: captured.price, source: 'caja' as const, seenAt: captured.seenAt };
  }
  const guide = guidePrice(sku, store.chain);
  if (guide > 0) return { price: guide, source: 'guia' as const, seenAt: null };
  return { price: 0, source: 'faltante' as const, seenAt: null };
}

export interface StoreRank {
  store: NearbyStore;
  km: number;
  subtotal: number;
  coverage: number;
  missing: number;
  sourceMix: { caja: number; guia: number };
}

export function rankStores(
  lines: Array<{ sku: GrocerySku; qty: number }>,
  trip: TripKind,
  book: PriceBook,
  origin = APARTMENT
): StoreRank[] {
  return storesForTrip(trip)
    .map((store) => {
      let subtotal = 0;
      let priced = 0;
      let caja = 0;
      let guia = 0;
      for (const line of lines) {
        const unit = unitPrice(line.sku, store, book);
        if (unit.price <= 0) continue;
        subtotal += unit.price * line.qty;
        priced += 1;
        if (unit.source === 'caja') caja += 1;
        else guia += 1;
      }
      return {
        store,
        km: storeDistanceKm(store, origin),
        subtotal,
        coverage: lines.length === 0 ? 0 : priced / lines.length,
        missing: Math.max(0, lines.length - priced),
        sourceMix: { caja, guia },
      };
    })
    .sort((a, b) => b.coverage - a.coverage || a.subtotal - b.subtotal || a.km - b.km);
}

export function recommendStore(
  lines: Array<{ sku: GrocerySku; qty: number }>,
  trip: TripKind,
  book: PriceBook,
  designatedId?: string | null
) {
  const ranked = rankStores(lines, trip, book);
  const cheapest = ranked[0];
  const designated =
    ranked.find((row) => row.store.id === designatedId)?.store ||
    NEARBY_STORES.find((store) => store.id === designatedId && storesForTrip(trip).some((item) => item.id === store.id));
  const pick = designated || cheapest?.store || nearestStore(trip);
  if (lines.length === 0) {
    return { pick, ranked, reason: `${pick.name} · ${storeDistanceKm(pick).toFixed(1)} km de casa` };
  }
  if (!cheapest) return { pick, ranked, reason: 'Más cerca de casa' };
  const cheaperThanNext = ranked[1] && cheapest.subtotal > 0 && ranked[1].subtotal - cheapest.subtotal >= 15;
  const reason =
    pick.id === cheapest.store.id
      ? cheaperThanNext
        ? `La lista sale más barata aquí (${Math.round(ranked[1].subtotal - cheapest.subtotal)} pesos menos)`
        : cheapest.km <= (ranked[1]?.km || cheapest.km)
          ? 'El más cercano con esta lista'
          : 'Mejor precio de la lista'
      : `${cheapest.store.name} sale más barato para esta lista`;
  return { pick, ranked, reason };
}

export function listText(lines: Array<{ sku: GrocerySku; qty: number }>, store: NearbyStore, book: PriceBook) {
  const items = lines
    .map((line) => {
      const unit = unitPrice(line.sku, store, book);
      const price = unit.price ? ` · $${unit.price}` : '';
      return `• ${line.qty} ${line.sku.unit} ${line.sku.name} (${line.sku.brand})${price}`;
    })
    .join('\n');
  return [
    `Lista A & M · ${store.name}`,
    store.address,
    '',
    items || 'Lista vacía',
    '',
    'Guía de pasillo. El precio de caja se anota al ver el ticket.',
  ].join('\n');
}
