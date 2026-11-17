import { listText, type GrocerySku, type NearbyStore, type PriceBook } from '@/lib/grocery';
import { assertSafeToPersist } from './security';

export function buildListText(
  lines: Array<{ sku: GrocerySku; qty: number }>,
  store: NearbyStore,
  book: PriceBook
) {
  const text = listText(lines, store, book);
  assertSafeToPersist({ text }, 'pedido');
  return text;
}

export function whatsappListUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
