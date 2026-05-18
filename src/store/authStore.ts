import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        setAuth: (user, accessToken) =>
          set({ user, accessToken, isAuthenticated: true }),
        logout: () =>
          set({ user: null, accessToken: null, isAuthenticated: false }),
      }),
      { name: "shoply-auth" },
    ),
    { name: "AuthStore" },
  ),
);
