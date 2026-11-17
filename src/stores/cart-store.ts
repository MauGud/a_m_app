import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrocerySku, OnlinePartnerId } from '@/lib/grocery';

export interface CartLine {
  sku: GrocerySku;
  qty: number;
}

interface CartState {
  mode: 'presencial' | 'enlinea';
  partnerId: OnlinePartnerId;
  lines: CartLine[];
  setMode: (mode: 'presencial' | 'enlinea') => void;
  setPartner: (partnerId: OnlinePartnerId) => void;
  add: (sku: GrocerySku, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      mode: 'presencial',
      partnerId: 'walmart',
      lines: [],
      setMode: (mode) => set({ mode }),
      setPartner: (partnerId) => set({ partnerId, mode: 'enlinea' }),
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
      setQty: (id, qty) =>
        set((state) => ({
          lines: qty <= 0 ? state.lines.filter((line) => line.sku.id !== id) : state.lines.map((line) =>
            line.sku.id === id ? { ...line, qty } : line
          ),
        })),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, line) => sum + line.sku.priceMxn * line.qty, 0),
      count: () => get().lines.reduce((sum, line) => sum + line.qty, 0),
    }),
    { name: 'espacio-pareja-super-cart-v2' }
  )
);
