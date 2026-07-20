import { User } from '@dhanam-core/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, tokens: { accessToken: string }) => void;
  setTokens: (accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, tokens) => {
        set({
          user,
          accessToken: tokens.accessToken,
          isAuthenticated: true,
        });
      },

      setTokens: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        // Clear the auth cookie marker for middleware
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-storage=; path=/; max-age=0; SameSite=Lax';
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);
