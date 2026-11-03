import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getProduct } from '@/lib/catalog';

import { persistStorage, useHydrated } from './storage';

export type CartLine = {
  slug: string;
  /** `null` for one-size items. */
  size: string | null;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (slug: string, size: string | null) => void;
  setQty: (slug: string, size: string | null, qty: number) => void;
  remove: (slug: string, size: string | null) => void;
  clear: () => void;
};

export const MAX_QTY = 9;

const sameLine = (line: CartLine, slug: string, size: string | null) =>
  line.slug === slug && line.size === size;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (slug, size) =>
        set(({ lines }) =>
          lines.some((l) => sameLine(l, slug, size))
            ? {
                lines: lines.map((l) =>
                  sameLine(l, slug, size) ? { ...l, qty: Math.min(l.qty + 1, MAX_QTY) } : l,
                ),
              }
            : { lines: [...lines, { slug, size, qty: 1 }] },
        ),
      setQty: (slug, size, qty) =>
        set(({ lines }) => ({
          lines:
            qty < 1
              ? lines.filter((l) => !sameLine(l, slug, size))
              : lines.map((l) => (sameLine(l, slug, size) ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
        })),
      remove: (slug, size) =>
        set(({ lines }) => ({ lines: lines.filter((l) => !sameLine(l, slug, size)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'loose-thread-cart', storage: persistStorage },
  ),
);

/** Free shipping threshold and flat rate, in cents. */
export const FREE_SHIPPING_FROM = 5000;
export const FLAT_SHIPPING = 500;

export function useCartCount() {
  return useCartStore((s) => s.lines.reduce((n, l) => n + l.qty, 0));
}

export function useCartSubtotal() {
  return useCartStore((s) =>
    s.lines.reduce((sum, l) => sum + (getProduct(l.slug)?.price ?? 0) * l.qty, 0),
  );
}

export function shippingFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : FLAT_SHIPPING;
}

export function useCartHydrated() {
  return useHydrated(useCartStore.persist);
}
