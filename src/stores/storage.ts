import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Persisted-store storage. Static web rendering runs without `window`, so it
 * gets a no-op storage and renders the empty initial state.
 */
export const persistStorage = createJSONStorage(() =>
  typeof window === 'undefined' ? noopStorage : AsyncStorage,
);

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/**
 * True once a persisted store has loaded from storage. Use it to avoid flashing
 * an empty state, and to keep the static HTML identical to the first client render.
 */
export function useHydrated(persist: PersistApi) {
  // Server snapshot is always false, so web hydration matches the static HTML.
  return useSyncExternalStore(persist.onFinishHydration, persist.hasHydrated, () => false);
}
