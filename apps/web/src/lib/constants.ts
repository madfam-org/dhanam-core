/**
 * Shared constants for the web application to prevent magic numbers.
 */

// Time durations in milliseconds
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Time durations in seconds (useful for cookies)
export const TIME_S = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  YEAR: 365 * 24 * 60 * 60,
} as const;

// Auth specific constants
export const AUTH_CONSTANTS = {
  TOKEN_REFRESH_BUFFER_MS: 2 * TIME_MS.MINUTE,
  MINIMUM_REFRESH_INTERVAL_MS: 30 * TIME_MS.SECOND,
  DEMO_COOKIE_MAX_AGE_S: 2 * TIME_S.HOUR,
  GEO_COOKIE_MAX_AGE_S: TIME_S.YEAR,
  // Token-gated geo override cookie lifetime (~30d): long enough for a testing
  // session across devices, short enough to expire on its own if forgotten.
  GEO_OVERRIDE_COOKIE_MAX_AGE_S: 30 * TIME_S.DAY,
} as const;

// API Fetch constants
export const API_CONSTANTS = {
  DEFAULT_TIMEOUT_MS: 30 * TIME_MS.SECOND,
} as const;
