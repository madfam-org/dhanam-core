import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  integrations: [Sentry.replayIntegration()],

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
