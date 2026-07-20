'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Suspense, useEffect } from 'react';

/**
 * PostHog Analytics Provider for Next.js App Router
 *
 * Initializes PostHog and tracks page views automatically.
 * Respects user privacy preferences and provides opt-out capability.
 */

function getConsentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)dhanam_consent=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

if (typeof window !== 'undefined') {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const consent = getConsentCookie();

  if (apiKey && consent !== 'rejected') {
    posthog.init(apiKey, {
      api_host: host,
      // Capture pageviews automatically
      capture_pageview: false, // We'll handle this manually for better control
      // Capture performance metrics
      capture_performance: true,
      // Autocapture interactions
      autocapture: true,
      // Disable session recording by default (opt-in)
      disable_session_recording: true,
      // Respect user's privacy settings
      respect_dnt: true,
      // Secure cookie
      secure_cookie: true,
      // Cookie options
      persistence: 'localStorage+cookie',
      // Debugging (only in development)
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug();
        }
        // Respect cookie consent: opt out if user hasn't accepted
        if (consent !== 'accepted') {
          ph.opt_out_capturing();
        }
      },
    });
  }
}

function PostHogUtmCapture() {
  useEffect(() => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      posthog.people.set_once({
        first_utm_source: utmSource,
        first_utm_medium: params.get('utm_medium') || undefined,
        first_utm_campaign: params.get('utm_campaign') || undefined,
      });
    }
  }, []);

  return null;
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog.__loaded) {
      return;
    }

    // Track page views
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: React 19 type incompatibility with Suspense requires cast to any
  const SuspenseCompat = Suspense as any;
  return (
    <>
      <SuspenseCompat fallback={null}>
        <PostHogUtmCapture />
        <PostHogPageView />
      </SuspenseCompat>
      {children}
    </>
  );
}

/**
 * PostHog Analytics Hook
 *
 * Provides easy access to PostHog methods in React components.
 */
export function usePostHog() {
  if (typeof window === 'undefined' || !posthog.__loaded) {
    // Return no-op functions for SSR or when PostHog is not initialized
    return {
      capture: () => {},
      identify: () => {},
      reset: () => {},
      setPersonProperties: () => {},
      isFeatureEnabled: () => false,
    };
  }

  return {
    /**
     * Capture an analytics event
     */
    capture: (event: string, properties?: Record<string, unknown>) => {
      posthog.capture(event, properties);
    },

    /**
     * Identify the current user
     */
    identify: (userId: string, properties?: Record<string, unknown>) => {
      posthog.identify(userId, properties);
    },

    /**
     * Reset user identity (on logout)
     */
    reset: () => {
      posthog.reset();
    },

    /**
     * Set user properties
     */
    setPersonProperties: (properties: Record<string, unknown>) => {
      posthog.setPersonProperties(properties);
    },

    /**
     * Check if a feature flag is enabled
     */
    isFeatureEnabled: (featureKey: string): boolean => {
      return posthog.isFeatureEnabled(featureKey) || false;
    },

    /**
     * Get feature flag variant
     */
    getFeatureFlag: (featureKey: string): string | boolean | undefined => {
      return posthog.getFeatureFlag(featureKey);
    },

    /**
     * Start session recording (opt-in)
     */
    startSessionRecording: () => {
      posthog.startSessionRecording();
    },

    /**
     * Stop session recording
     */
    stopSessionRecording: () => {
      posthog.stopSessionRecording();
    },
  };
}

/**
 * PostHog Event Helpers
 *
 * Type-safe event tracking functions matching backend events.
 */
export const analytics = {
  /**
   * Track user registration
   */
  trackSignUp: (userId: string, properties: { email: string; name: string; locale: string }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.identify(userId, properties);
    posthog.capture('sign_up', properties);
  },

  /**
   * Track onboarding completion
   */
  trackOnboardingComplete: (properties?: { stepsCompleted: number; timeToComplete: number }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('onboarding_complete', properties);
  },

  /**
   * Track bank connection initiation
   */
  trackConnectInitiated: (properties: {
    provider: string;
    spaceId: string;
    spaceType: 'personal' | 'business';
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('connect_initiated', properties);
  },

  /**
   * Track successful bank connection
   */
  trackConnectSuccess: (properties: {
    provider: string;
    accountsLinked: number;
    spaceId: string;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('connect_success', properties);
  },

  /**
   * Track budget creation
   */
  trackBudgetCreated: (properties: {
    budgetId: string;
    spaceId: string;
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    categoriesCount: number;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('budget_created', properties);
  },

  /**
   * Track rule creation
   */
  trackRuleCreated: (properties: {
    ruleId: string;
    spaceId: string;
    matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact';
    categoryId: string;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('rule_created', properties);
  },

  /**
   * Track transaction categorization
   */
  trackTransactionCategorized: (properties: {
    transactionId: string;
    categoryId: string;
    isAutomatic: boolean;
    spaceId: string;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('txn_categorized', properties);
  },

  /**
   * Track net worth view
   */
  trackViewNetWorth: (properties: {
    spaceId: string;
    totalNetWorth: number;
    currency: string;
    accountsCount: number;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('view_net_worth', properties);
  },

  /**
   * Track data export
   */
  trackExportData: (properties: {
    exportType: 'csv' | 'pdf' | 'json';
    dataType: 'transactions' | 'budgets' | 'reports' | 'all';
    recordsExported: number;
    spaceId: string;
  }) => {
    if (typeof window === 'undefined' || !posthog.__loaded) return;
    posthog.capture('export_data', properties);
  },
};

export default PostHogProvider;
