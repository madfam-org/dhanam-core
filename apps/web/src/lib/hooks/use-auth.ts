'use client';

import type { AuthTokens, UserProfile, Locale } from '@dhanam-core/shared';
import posthog from 'posthog-js';
import { create } from 'zustand';

import { authApi } from '../api/auth';
import { apiClient } from '../api/client';

const ACCESS_TOKEN_KEY = 'dhanam_access_token';
const REFRESH_TOKEN_KEY = 'dhanam_refresh_token';
const PROFILE_KEY = 'dhanam_user_profile';

/**
 * AuthState — the public interface consumed across the app.
 *
 * dhanam-core uses local JWT auth: the access token is issued by the API
 * (`/auth/login`, `/auth/register`, `/auth/guest`) and stored in localStorage
 * for optimistic UI hydration. It is NOT a trust boundary — every request is
 * validated server-side by the NestJS JwtAuthGuard, and a 401 clears the store.
 */
interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
  setHasHydrated: (state: boolean) => void;
}

// Optimistic hydration from a stored JWT. Decodes (does NOT verify) the payload
// to pre-populate the store and avoid a UI flash. Not a security control.
function getInitialAuthState(): Pick<AuthState, 'user' | 'tokens' | 'token' | 'isAuthenticated'> {
  if (typeof window === 'undefined') {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }

  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3 || !parts[1]) throw new Error('bad format');

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.sub || !payload.exp || payload.exp * 1000 < Date.now()) {
      throw new Error('invalid or expired');
    }

    let cachedProfile: Partial<UserProfile> = {};
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.id === payload.sub) {
          cachedProfile = parsed;
        }
      }
    } catch {
      // ignore parse errors
    }

    const user: UserProfile = {
      id: payload.sub,
      email: payload.email || '',
      name: cachedProfile.name || payload.name || payload.email?.split('@')[0] || 'User',
      locale: (cachedProfile.locale || (payload.locale?.startsWith('es') ? 'es' : 'en')) as Locale,
      timezone: cachedProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      totpEnabled: cachedProfile.totpEnabled ?? payload.totpEnabled ?? false,
      emailVerified: cachedProfile.emailVerified ?? payload.email_verified ?? true,
      onboardingCompleted: cachedProfile.onboardingCompleted ?? true,
      isAdmin: cachedProfile.isAdmin,
      createdAt: cachedProfile.createdAt || new Date().toISOString(),
      updatedAt: cachedProfile.updatedAt || new Date().toISOString(),
      spaces: cachedProfile.spaces || [],
    };

    const tokens: AuthTokens = {
      accessToken,
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      expiresIn: payload.exp - Math.floor(Date.now() / 1000),
    };

    apiClient.setTokens(tokens);

    return { user, tokens, token: accessToken, isAuthenticated: true };
  } catch {
    return { user: null, tokens: null, token: null, isAuthenticated: false };
  }
}

const initialAuth = getInitialAuthState();

export const useAuth = create<AuthState>()((set, get) => ({
  ...initialAuth,
  isLoading: false,
  _hasHydrated: true,

  setHasHydrated: (state) => {
    set({ _hasHydrated: state });
  },

  setAuth: (user, tokens) => {
    apiClient.setTokens(tokens);
    set({ user, tokens, token: tokens.accessToken, isAuthenticated: true });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        }
        if (user) {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
        }
      } catch {
        // quota exceeded — ignore
      }
    }

    if (typeof window !== 'undefined' && user?.id && posthog.__loaded) {
      posthog.identify(user.id, { email: user.email, name: user.name });
    }

    // Cookie marker for middleware detection (prevents redirect flash)
    if (typeof document !== 'undefined') {
      const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth-storage=authenticated; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
    }
  },

  clearAuth: () => {
    apiClient.clearTokens();
    set({ user: null, tokens: null, token: null, isAuthenticated: false });

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        /* ignore */
      }
    }

    if (typeof document !== 'undefined') {
      const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth-storage=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
    }
  },

  logout: async () => {
    const { tokens, clearAuth } = get();
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearAuth();
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  },

  refreshTokens: async () => {
    const { tokens, setAuth, clearAuth } = get();
    if (!tokens?.refreshToken) {
      clearAuth();
      return;
    }

    try {
      const response = await authApi.refresh(tokens.refreshToken);
      setAuth(response.user, response.tokens);
    } catch (error) {
      clearAuth();
      throw error;
    }
  },

  refreshUser: async () => {
    const { tokens, setAuth } = get();
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const userProfile: UserProfile = data.data || data;
        setAuth(userProfile, tokens);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  getToken: async () => {
    const { tokens } = get();
    return tokens?.accessToken || null;
  },
}));
