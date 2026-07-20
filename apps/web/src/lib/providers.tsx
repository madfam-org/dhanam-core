'use client';

import type { Locale } from '@dhanam-core/shared';
import { I18nProvider } from '@dhanam-core/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { AuthProvider } from '~/components/auth-provider';
import { CookieConsentBanner } from '~/components/cookie-consent-banner';
import { ThemeProvider } from '~/components/theme-provider';
import { PreferencesProvider } from '~/contexts/PreferencesContext';
import PostHogProvider from '~/providers/PostHogProvider';

/**
 * Application provider tree for dhanam-core.
 *
 * Uses local JWT auth (see components/auth-provider.tsx and lib/hooks/use-auth.ts).
 * The full product wraps these in an external OIDC SSO provider; that layer is
 * not part of the open core.
 */
export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider defaultLocale={initialLocale}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: React 19 type incompatibility with PreferencesProvider children prop */}
              <PreferencesProvider>{children as any}</PreferencesProvider>
            </AuthProvider>
            <CookieConsentBanner />
          </PostHogProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
