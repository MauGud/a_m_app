import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DESIGNATED_WEEKLY, type GrocerySku, type TripKind } from '@/lib/grocery';

export interface CartLine {
  sku: GrocerySku;
  qty: number;
}

interface CartState {
  trip: TripKind;
  designatedStoreId: string;
  lines: CartLine[];
  setTrip: (trip: TripKind) => void;
  setDesignatedStore: (storeId: string) => void;
  add: (sku: GrocerySku, qty?: number) => void;
  addMany: (skus: GrocerySku[]) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      trip: 'semana',
      designatedStoreId: DESIGNATED_WEEKLY.id,
      lines: [],
      setTrip: (trip) => set({ trip }),
      setDesignatedStore: (storeId) => set({ designatedStoreId: storeId }),
      add: (sku, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.sku.id === sku.id);
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.sku.id === sku.id ? { ...line, qty: line.qty + qty } : line
              ),
            };
          }
          return { lines: [...state.lines, { sku, qty }] };
        }),
      addMany: (skus) => {
        for (const sku of skus) get().add(sku);
      },
      setQty: (id, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((line) => line.sku.id !== id)
              : state.lines.map((line) => (line.sku.id === id ? { ...line, qty } : line)),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((sum, line) => sum + line.qty, 0),
    }),
    { name: 'espacio-pareja-super-cart-v3' }
  )
);
