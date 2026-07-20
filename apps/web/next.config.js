const { withSentryConfig } = require('@sentry/nextjs');
const { z } = require('zod');

const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
const defaultBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const envSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

if (
  process.env.NODE_ENV !== 'development' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.SKIP_ENV_VALIDATION !== 'true'
) {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_BASE_URL: defaultBaseUrl,
    NEXT_PUBLIC_API_URL: defaultApiUrl,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables in non-development environment:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables for production build');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@dhanam-core/shared', '@dhanam-core/ui'],

  env: {
    NEXT_PUBLIC_API_URL: defaultApiUrl,
    NEXT_PUBLIC_BASE_URL: defaultBaseUrl,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Content-Security-Policy is set at runtime in middleware.
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
