import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/lib/types";
import { TOKEN_KEY } from "@/lib/axios";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
        set({ token, user });
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: "jt_auth",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined as unknown as Storage)),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
