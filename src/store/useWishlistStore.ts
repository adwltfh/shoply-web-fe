import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export interface WishlistItem {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  discountPercentage: number;
  rating: number;
}

interface WishlistState {
  /** Persisted: wishlist items keyed by userId */
  itemsByUser: Record<number, WishlistItem[]>;
  /** In-memory: items for the currently active user */
  items: WishlistItem[];
  userId: number | null;
  /** Call on login to hydrate items from persisted data */
  setUser: (userId: number) => void;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  /** Call on logout: clears in-memory state, preserves persisted data */
  clearWishlist: () => void;
  isWishlisted: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  devtools(
    persist(
      (set, get) => ({
        itemsByUser: {},
        items: [],
        userId: null,

        setUser: (userId) =>
          set((state) => ({
            userId,
            items: state.itemsByUser[userId] ?? [],
          })),

        toggleItem: (item) =>
          set((state) => {
            if (!state.userId) return {};
            const exists = state.items.some((i) => i.id === item.id);
            const next = exists
              ? state.items.filter((i) => i.id !== item.id)
              : [...state.items, item];
            return {
              items: next,
              itemsByUser: { ...state.itemsByUser, [state.userId]: next },
            };
          }),

        removeItem: (id) =>
          set((state) => {
            if (!state.userId) return {};
            const next = state.items.filter((i) => i.id !== id);
            return {
              items: next,
              itemsByUser: { ...state.itemsByUser, [state.userId]: next },
            };
          }),

        clearWishlist: () => set({ items: [], userId: null }),

        isWishlisted: (id) => get().items.some((i) => i.id === id),
      }),
      {
        name: "shoply-wishlist",
        // Only persist the per-user map; in-memory fields are re-hydrated via setUser
        partialize: (state) => ({ itemsByUser: state.itemsByUser }),
      },
    ),
    { name: "WishlistStore" },
  ),
);
