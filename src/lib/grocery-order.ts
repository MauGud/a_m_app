import type { CartLine } from '@/stores/cart-store';
import { ONLINE_PARTNERS, type OnlinePartnerId } from './grocery';
import { APARTMENT_ADDRESS_FULL } from './apartment';
import { assertSafeToPersist } from './security';

export interface GroceryHandoff {
  partnerId: OnlinePartnerId;
  partnerName: string;
  listText: string;
  searchUrl: string;
  extraUrls: string[];
  openedAt: string;
}

export function buildListText(lines: CartLine[], partnerName: string) {
  const items = lines
    .map((line) => `• ${line.qty} ${line.sku.unit} ${line.sku.name} (${line.sku.brand})`)
    .join('\n');
  return [
    `Lista A & M para ${partnerName}`,
    `Entrega: ${APARTMENT_ADDRESS_FULL}`,
    '',
    items || 'Carrito vacío',
    '',
    'Paga en el sitio del súper. Esta app no envía números de tarjeta.',
  ].join('\n');
}

export function buildHandoff(lines: CartLine[], partnerId: OnlinePartnerId): GroceryHandoff {
  const partner = ONLINE_PARTNERS.find((item) => item.id === partnerId);
  if (!partner) throw new Error('Ese súper no está en la lista.');
  const queries = lines.slice(0, 4).map((line) => line.sku.query || line.sku.name);
  const primary = queries[0] || 'despensa';
  const handoff: GroceryHandoff = {
    partnerId,
    partnerName: partner.name,
    listText: buildListText(lines, partner.name),
    searchUrl: partner.searchUrl(primary),
    extraUrls: queries.slice(1).map((query) => partner.searchUrl(query)),
    openedAt: new Date().toISOString(),
  };
  assertSafeToPersist(handoff, 'pedido');
  return handoff;
}
