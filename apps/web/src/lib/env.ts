import { z } from 'zod';

const envSchemaBase = z.object({
  // API
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

  // Analytics (PostHog) — optional; analytics are disabled when unset.
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Error monitoring (Sentry) — optional.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),

  // Localization
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['en', 'es', 'pt']).default('en'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const envSchema = envSchemaBase;

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function shouldSkipEnvValidation(): boolean {
  const flag = process.env.SKIP_ENV_VALIDATION;
  return flag === '1' || flag === 'true';
}

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  if (shouldSkipEnvValidation()) {
    cachedEnv = envSchemaBase.partial().parse(process.env) as Env;
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`[dhanam-web] Invalid environment variables:\n${message}`);
  }
  cachedEnv = parsed.data;

  return cachedEnv;
}

export function getEnvUnsafe(): Partial<Env> {
  return envSchemaBase.partial().parse(process.env);
}
