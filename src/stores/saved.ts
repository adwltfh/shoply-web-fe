import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage, useHydrated } from './storage';

type SavedState = {
  slugs: string[];
  toggle: (slug: string) => void;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set) => ({
      slugs: [],
      toggle: (slug) =>
        set(({ slugs }) => ({
          slugs: slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [slug, ...slugs],
        })),
    }),
    { name: 'loose-thread-saved', storage: persistStorage },
  ),
);

export function useIsSaved(slug: string) {
  return useSavedStore((s) => s.slugs.includes(slug));
}

export function useSavedHydrated() {
  return useHydrated(useSavedStore.persist);
}
