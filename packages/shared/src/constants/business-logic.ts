/**
 * Business-logic constants — named values replacing magic numbers.
 * Grouped by domain. All values are compile-time constants.
 */

// ── Time Units (seconds) ─────────────────────────────────────────────────────

export const TIME_UNITS = {
  MINUTE_SECONDS: 60,
  HOUR_SECONDS: 3_600,
  DAY_SECONDS: 86_400,
} as const;

// ── Anomaly Detection ────────────────────────────────────────────────────────

export const ANOMALY_DETECTION = {
  ZSCORE_THRESHOLD: 2.5,
  SPENDING_SPIKE_MULTIPLIER: 1.5,
  LARGE_TRANSACTION_USD: 500,
  MIN_HISTORY_DAYS: 30,
  DUPLICATE_WINDOW_HOURS: 48,
  MIN_DATA_POINTS: 3,
  AMOUNT_MULTIPLIER: 100,
  SEASONAL_LOOKBACK_PERIODS: 2,
  HIGH_FREQUENCY_THRESHOLD: 4,
  MINIMUM_CATEGORY_COUNT: 3,
} as const;

// ── Storage Limits ───────────────────────────────────────────────────────────

export const STORAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_SPACE_STORAGE_BYTES: 500 * 1024 * 1024,
  CSV_PREVIEW_THRESHOLD_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 50,
} as const;

// ── ML Thresholds ────────────────────────────────────────────────────────────

export const ML_THRESHOLDS = {
  FUZZY_MATCH_SCORE: 0.7,
  CATEGORIZATION_CONFIDENCE: 0.5,
  RECENCY_DAYS: 90,
  WEIGHT_DECAY_FACTOR: 0.5,
  MIN_CORRECTIONS_FOR_LEARNING: 10,
  MIN_CATEGORIZATION_CONFIDENCE: 0.5,
  MAX_MERCHANT_VARIANTS: 5,
} as const;

// ── Goal & Projection Thresholds ─────────────────────────────────────────────

export const GOAL_THRESHOLDS = {
  SUCCESS_PROBABILITY: 0.75,
  LOW_PROBABILITY: 0.35,
  RETENTION_DAYS: 90,
  WEEKLY_RATE_DIVISOR: 0.263,
  MIN_PROJECTION_YEARS: 5,
  MAX_PROJECTION_YEARS: 50,
  MIN_AGE: 18,
  MAX_AGE: 100,
  DEFAULT_INTEREST_RATE: 0.05,
} as const;

// ── Financial Defaults (Simulations & Projections) ───────────────────────

export const FINANCIAL_DEFAULTS = {
  EXPECTED_RETURN: 0.07,
  VOLATILITY: 0.15,
  INFLATION_RATE: 0.03,
  RETIREMENT_RETURN_FACTOR: 0.85,
  SAFE_WITHDRAWAL_RATE: 0.04,
  MONTE_CARLO_ITERATIONS: 10_000,
  BINARY_SEARCH_TOLERANCE: 0.001,
  BINARY_SEARCH_MAX_ITERATIONS: 20,
} as const;

// ── ESG Thresholds ───────────────────────────────────────────────────────────

export const ESG_THRESHOLDS = {
  MODERATE_SCORE: 50,
  GOOD_ENVIRONMENTAL: 80,
  GOOD_GOVERNANCE: 80,
} as const;

// ── ESG Cache ────────────────────────────────────────────────────────────────

export const ESG_CACHE = {
  TTL_SECONDS: 3_600,
  MAX_ENTRIES: 500,
  SYMBOL_SLICE_LENGTH: 4,
} as const;

// ── Provider Health ──────────────────────────────────────────────────────────

export const PROVIDER_HEALTH = {
  DEGRADED_HOURS: 48,
  WARNING_HOURS: 24,
  RECENT_CONNECTION_DAYS: 30,
} as const;

// ── Analytics ────────────────────────────────────────────────────────────────

export const ANALYTICS = {
  HISTORY_DAYS: 90,
  PDF_PAGE_BREAK_Y: 700,
  SHARE_TOKEN_MAX_HOURS: 720,
  AMOUNT_DISPLAY_MULTIPLIER: 10_000,
} as const;

// ── Search ───────────────────────────────────────────────────────────────────

export const SEARCH_DEFAULTS = {
  MAX_RESULTS: 20,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_PERIOD_DAYS: 90,
} as const;

// ── Estate Planning ──────────────────────────────────────────────────────────

export const ESTATE_PLANNING = {
  EXECUTOR_ACCESS_EXPIRY_DAYS: 30,
} as const;

// ── Subscription ─────────────────────────────────────────────────────────────

export const SUBSCRIPTION = {
  ANNUAL_COST_WARNING_USD: 100,
} as const;
