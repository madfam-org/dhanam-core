import posthog from 'posthog-js';

let posthogInitialized = false;

/**
 * Initialize PostHog analytics
 * Call this once in your app's entry point (layout.tsx or _app.tsx)
 */
export const initPostHog = (): void => {
  if (typeof window === 'undefined') {
    return; // Don't run on server
  }

  if (posthogInitialized) {
    return; // Already initialized
  }

  // Check cookie consent before initializing analytics
  const consentMatch = document.cookie.match(/(?:^|; )dhanam_consent=([^;]*)/);
  const consent = consentMatch ? consentMatch[1] : null;
  if (consent === 'rejected') {
    return; // User rejected analytics cookies
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('⚠️  PostHog API key not configured - analytics disabled');
    console.warn('Set NEXT_PUBLIC_POSTHOG_KEY environment variable to enable analytics');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: false, // Handled by PostHogProvider on route change
      capture_pageleave: true, // Capture when users leave pages
      persistence: 'localStorage', // Store user data in localStorage
      autocapture: false, // Disabled to reduce memory pressure; use explicit trackEvent()
      disable_session_recording: false, // Enable session recording
      session_recording: {
        maskAllInputs: true, // Mask input fields for privacy
        maskTextSelector: '.private', // Mask elements with 'private' class
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog loaded callback types the instance as any
      loaded: (posthog: any) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console -- Reason: Intentional dev-only startup confirmation
          console.log('✅ PostHog initialized');
          posthog.debug(); // Enable debug mode in development
        }
      },
    });

    posthogInitialized = true;

    // If no consent decision yet, opt out by default (will opt in when accepted)
    if (!consent) {
      posthog.opt_out_capturing();
    }
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
};

/**
 * Get the PostHog client instance
 */
export const getPostHog = () => posthog;

/**
 * Identify a user in PostHog
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog identify() accepts arbitrary user properties
export const identifyUser = (userId: string, properties?: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('Failed to identify user in PostHog:', error);
  }
};

/**
 * Track a custom event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog capture() accepts arbitrary event properties
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error(`Failed to track event ${eventName}:`, error);
  }
};

/**
 * Reset PostHog (call on logout)
 */
export const resetPostHog = (): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('Failed to reset PostHog:', error);
  }
};

/**
 * Set user properties
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog people.set() accepts arbitrary user properties
export const setUserProperties = (properties: Record<string, any>): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

/**
 * Track page view (useful for manual tracking)
 */
export const trackPageView = (pageName?: string): void => {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    if (pageName) {
      posthog.capture('$pageview', { page_name: pageName });
    } else {
      posthog.capture('$pageview');
    }
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

/**
 * Opt in to PostHog capturing (call when user accepts cookies)
 */
export const optInPostHog = (): void => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  try {
    posthog.opt_in_capturing();
  } catch (error) {
    console.error('Failed to opt in PostHog:', error);
  }
};

/**
 * Opt out of PostHog capturing (call when user rejects cookies)
 */
export const optOutPostHog = (): void => {
  if (typeof window === 'undefined' || !posthogInitialized) return;
  try {
    posthog.opt_out_capturing();
  } catch (error) {
    console.error('Failed to opt out PostHog:', error);
  }
};
