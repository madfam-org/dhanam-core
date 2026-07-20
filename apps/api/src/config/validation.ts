// SPDX-License-Identifier: AGPL-3.0-or-later
import Joi from 'joi';

const jwtDuration = Joi.string().pattern(/^\d+(?:\.\d+)?(?:ms|s|m|h|d|w|y)$/);

/**
 * Environment validation schema for dhanam-core.
 *
 * Only the variables the open core actually consumes are validated here.
 * Proprietary integrations (SSO, billing/payment processors, account
 * aggregation providers, CRM relays) are not part of dhanam-core and have no
 * configuration surface.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(4000),

  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  // Auth (local JWT)
  JWT_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required().min(32),
    otherwise: Joi.string().optional().allow(''),
  }),
  JWT_EXPIRES_IN: jwtDuration.default('15m'),
  JWT_ACCESS_EXPIRY: jwtDuration.default('15m'),
  JWT_REFRESH_EXPIRY: jwtDuration.default('30d'),

  ENCRYPTION_KEY: Joi.string().required().length(32),

  // FX rates (Banxico SIE, optional)
  BANXICO_API_TOKEN: Joi.string().optional().allow(''),

  // Email (SMTP) — the open core ships a no-op mailer; these are consumed only
  // if a self-hoster wires their own transport.
  SMTP_HOST: Joi.string().optional().allow('').default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASSWORD: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().default('Dhanam <noreply@example.com>'),
  SUPPORT_EMAIL: Joi.string().email().default('support@example.com'),

  // Object storage (Cloudflare R2 / S3-compatible), optional — document uploads
  // are disabled when unset.
  UNSUBSCRIBE_SECRET: Joi.string().optional().allow(''),

  // Product analytics (PostHog), optional — analytics disabled when unset.
  POSTHOG_API_KEY: Joi.string().optional(),
  POSTHOG_HOST: Joi.string().uri().default('https://us.i.posthog.com'),

  // Application URLs
  WEB_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().default('http://localhost:3000'),
  }),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  API_URL: Joi.string().uri().default('http://localhost:4000'),
  CORS_ORIGINS: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('http://localhost:3000'),
  }),
});
