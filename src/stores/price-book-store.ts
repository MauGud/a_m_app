import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { priceBookKey, type PriceBook } from '@/lib/grocery';

interface PriceBookState {
  book: PriceBook;
  setPrice: (storeId: string, skuId: string, price: number) => void;
  clearPrice: (storeId: string, skuId: string) => void;
}

export const usePriceBookStore = create<PriceBookState>()(
  persist(
    (set) => ({
      book: {},
      setPrice: (storeId, skuId, price) => {
        if (!Number.isFinite(price) || price <= 0) return;
        set((state) => ({
          book: {
            ...state.book,
            [priceBookKey(storeId, skuId)]: {
              price: Math.round(price * 100) / 100,
              seenAt: new Date().toISOString(),
            },
          },
        }));
      },
      clearPrice: (storeId, skuId) =>
        set((state) => {
          const next = { ...state.book };
          delete next[priceBookKey(storeId, skuId)];
          return { book: next };
        }),
    }),
    { name: 'espacio-pareja-price-book-v1' }
  )
);
