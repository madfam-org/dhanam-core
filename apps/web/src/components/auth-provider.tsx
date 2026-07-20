'use client';

import { useEffect } from 'react';

import { AUTH_CONSTANTS } from '~/lib/constants';
import { useAuth } from '~/lib/hooks/use-auth';

/**
 * Accepts only same-origin relative paths beginning with a single '/' and
 * not '//' (protocol-relative). Rejects absolute URLs, `javascript:` URIs,
 * and anything URL-encoded that would parse to an external origin.
 */
function isSafeRedirectPath(value: string | null | undefined): value is string {
  if (!value || typeof value !== 'string') return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith('/\\')) return false;
  return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated, setAuth, refreshTokens, clearAuth } = useAuth();

  // Bootstrap: if auth tokens exist in localStorage but Zustand store is empty,
  // hydrate the store directly. Polls briefly after mount to catch tokens stored
  // by the auth flow (which may store tokens asynchronously).
  useEffect(() => {
    if (isAuthenticated) return;

    const tryBootstrap = () => {
      if (useAuth.getState().isAuthenticated) return true;
      const accessToken = localStorage.getItem('dhanam_access_token');
      if (!accessToken) return false;

      try {
        const parts = accessToken.split('.');
        if (parts.length !== 3 || !parts[1]) return false;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.sub || !payload.exp) return false;
        if (payload.exp * 1000 < Date.now()) return false;

        setAuth(
          {
            id: payload.sub,
            email: payload.email || '',
            name: payload.name || payload.email?.split('@')[0] || 'User',
            locale: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            totpEnabled: false,
            emailVerified: payload.email_verified || true,
            onboardingCompleted: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            spaces: [],
          },
          {
            accessToken: accessToken,
            refreshToken: localStorage.getItem('dhanam_refresh_token') || '',
            expiresIn: payload.exp - Math.floor(Date.now() / 1000),
          }
        );

        document.cookie = 'auth-storage=authenticated; path=/; max-age=86400; SameSite=Lax; Secure';
        return true;
      } catch {
        return false;
      }
    };

    // Try immediately (covers page reload with existing tokens)
    if (tryBootstrap()) return;

    // Intercept localStorage.setItem to detect when the auth flow stores tokens
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key: string, value: string) {
      originalSetItem(key, value);
      if (key === 'dhanam_access_token') {
        const bootstrapped = tryBootstrap();
        if (bootstrapped) {
          // Redirect after successful login (middleware only fires on navigation)
          const path = window.location.pathname;
          if (path === '/login' || path === '/register') {
            const from = new URLSearchParams(window.location.search).get('from');
            // Only allow same-origin relative paths. Rejects `javascript:`,
            // `//evil.com`, `https://evil.com`, and protocol-relative URLs
            // that would otherwise be honored as open-redirect / XSS sinks.
            window.location.href = isSafeRedirectPath(from) ? from : '/dashboard';
          }
        }
      }
    };

    // Also listen for storage events (cross-tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dhanam_access_token' && e.newValue) {
        tryBootstrap();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      localStorage.setItem = originalSetItem;
      window.removeEventListener('storage', onStorage);
    };
  }, [isAuthenticated, setAuth]);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    // Parse JWT to get expiry time
    try {
      const tokenParts = tokens.accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payloadPart = tokenParts[1];
      if (!payloadPart) {
        throw new Error('Invalid JWT: missing payload');
      }
      const payload = JSON.parse(atob(payloadPart));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Refresh token before expiry
      const refreshTime = Math.max(
        timeUntilExpiry - AUTH_CONSTANTS.TOKEN_REFRESH_BUFFER_MS,
        AUTH_CONSTANTS.MINIMUM_REFRESH_INTERVAL_MS
      );

      if (refreshTime > 0) {
        const refreshTimer = setTimeout(async () => {
          try {
            await refreshTokens();
          } catch (error) {
            // Don't immediately clear auth — the access token might still be valid
            // Let the next API call handle re-authentication
            console.warn('Auto token refresh failed, will retry on next API call:', error);
          }
        }, refreshTime);

        return () => clearTimeout(refreshTimer);
      } else {
        // Token already expired or expires very soon, try to refresh immediately
        refreshTokens().catch(() => {
          // Don't clear auth here — let the next API call handle it
          console.warn('Token refresh failed, will retry on next API call');
        });
        return;
      }
    } catch (error) {
      console.error('Failed to parse JWT token:', error);
      clearAuth();
      return;
    }
  }, [tokens?.accessToken, refreshTokens, clearAuth]);

  return <>{children}</>;
}
