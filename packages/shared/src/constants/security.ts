/**
 * Security-related constants with sensible defaults.
 * Security & rate-limit values are designed to be overridden via environment
 * variables through the API's SecurityConfig service.
 */

// ── Authentication Defaults ──────────────────────────────────────────────────

export const AUTH_DEFAULTS = {
  JWT_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_MINUTES: 15,
  PASSWORD_BREACH_CHECK_TIMEOUT_MS: 5_000,
  DEMO_ACCESS_TOKEN_EXPIRY: '2h',
  DEMO_REFRESH_TOKEN_EXPIRY: '4h',
  DEMO_ACCESS_TOKEN_EXPIRY_SECONDS: 7_200,
} as const;

// ── Rate Limit Presets ───────────────────────────────────────────────────────

export interface RateLimitConfig {
  readonly limit: number;
  readonly ttl: number;
}

export const RATE_LIMIT_WINDOWS = {
  SHORT: 60,
  MEDIUM: 900,
  LONG: 3_600,
} as const;

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  registration: { limit: 5, ttl: RATE_LIMIT_WINDOWS.SHORT },
  login: { limit: 10, ttl: RATE_LIMIT_WINDOWS.SHORT },
  token_refresh: { limit: 20, ttl: RATE_LIMIT_WINDOWS.SHORT },
  logout: { limit: 30, ttl: RATE_LIMIT_WINDOWS.SHORT },
  password_reset_request: { limit: 3, ttl: RATE_LIMIT_WINDOWS.LONG },
  password_reset_confirm: { limit: 5, ttl: RATE_LIMIT_WINDOWS.LONG },
  totp_enable: { limit: 5, ttl: RATE_LIMIT_WINDOWS.MEDIUM },
  totp_verify: { limit: 10, ttl: RATE_LIMIT_WINDOWS.MEDIUM },
  totp_disable: { limit: 5, ttl: RATE_LIMIT_WINDOWS.MEDIUM },
  totp_backup_codes: { limit: 5, ttl: RATE_LIMIT_WINDOWS.MEDIUM },
  demo_login: { limit: 120, ttl: RATE_LIMIT_WINDOWS.SHORT },
} as const;

// ── Security Headers ─────────────────────────────────────────────────────────

export const SECURITY_HEADERS = {
  HSTS_MAX_AGE_SECONDS: 63_072_000,
} as const;

// ── Graceful Shutdown ────────────────────────────────────────────────────────

export const SHUTDOWN_TIMEOUT_MS = 5_000;
