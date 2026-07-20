// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Dhanam API configuration.
 *
 * dhanam-core runs standalone with local JWT auth. Proprietary integrations
 * (account-aggregation providers, billing, SSO) are not part of the open core,
 * so their configuration blocks are intentionally absent.
 */
export const configuration = () => ({
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4300', 10),

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  // Local JWT auth (standalone mode).
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  external: {
    banxico: {
      apiToken: process.env.BANXICO_API_TOKEN,
    },
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'Dhanam <noreply@example.com>',
  },

  monitoring: {
    posthog: {
      apiKey: process.env.POSTHOG_API_KEY,
      host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    },
  },

  cors: {
    origins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  },
});
