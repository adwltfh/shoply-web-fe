import { create } from "zustand";

export interface WishlistItem {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  discountPercentage: number;
  rating: number;
}

interface WishlistState {
  items: WishlistItem[];
  userId: number | null;
  loadForUser: (userId: number) => void;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  clearWishlist: () => void;
  isWishlisted: (id: number) => boolean;
}

function storageKey(userId: number) {
  return `shoply-wishlist-${userId}`;
}

function saveToStorage(userId: number, items: WishlistItem[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
}

function loadFromStorage(userId: number): WishlistItem[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  userId: null,

  loadForUser: (userId) => {
    const items = loadFromStorage(userId);
    set({ items, userId });
  },

  toggleItem: (item) => {
    const { items, userId } = get();
    if (!userId) return;
    const exists = items.some((i) => i.id === item.id);
    const next = exists
      ? items.filter((i) => i.id !== item.id)
      : [...items, item];
    set({ items: next });
    saveToStorage(userId, next);
  },

  removeItem: (id) => {
    const { items, userId } = get();
    if (!userId) return;
    const next = items.filter((i) => i.id !== id);
    set({ items: next });
    saveToStorage(userId, next);
  },

  clearWishlist: () => set({ items: [], userId: null }),

  isWishlisted: (id) => get().items.some((i) => i.id === id),
}));
