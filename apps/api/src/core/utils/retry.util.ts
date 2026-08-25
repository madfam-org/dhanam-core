// SPDX-License-Identifier: AGPL-3.0-or-later
import { Logger } from '@nestjs/common';

import { isRetryableException, getRetryDelay } from '../exceptions/domain-exceptions';

/**
 * Retry Utility with Exponential Backoff
 *
 * Provides configurable retry logic for unreliable operations with:
 * - Exponential backoff with jitter
 * - Per-operation type configuration
 * - Integration with domain exceptions
 * - Circuit breaker awareness
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => plaidClient.accountsGet(request),
 *   {
 *     maxRetries: 3,
 *     baseDelayMs: 1000,
 *     operationType: 'provider_sync',
 *     onRetry: (attempt, error) => logger.warn(`Retry ${attempt}: ${error.message}`),
 *   }
 * );
 * ```
 */

export interface RetryConfig {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for exponential backoff (default: 1000)
   */
  baseDelayMs?: number;

  /**
   * Maximum delay cap in milliseconds (default: 30000)
   */
  maxDelayMs?: number;

  /**
   * Backoff multiplier (default: 2)
   */
  backoffMultiplier?: number;

  /**
   * Whether to add jitter to prevent thundering herd (default: true)
   */
  jitter?: boolean;

  /**
   * Jitter factor 0-1 for randomization (default: 0.2)
   */
  jitterFactor?: number;

  /**
   * Operation type for logging and metrics
   */
  operationType?: string;

  /**
   * Callback on each retry attempt
   */
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;

  /**
   * Custom predicate to determine if error is retryable
   */
  isRetryable?: (error: Error) => boolean;

  /**
   * Signal for aborting retries (e.g., from AbortController)
   */
  signal?: AbortSignal;
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

/**
 * Default configurations by operation type
 */
export const RETRY_PRESETS: Record<string, Partial<RetryConfig>> = {
  // Provider API calls - longer delays, more retries
  provider_sync: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },

  // Webhook processing - fewer retries, quick failures
  webhook_delivery: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },

  // Database operations - short delays
  database: {
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
  },

  // Redis operations - very short delays
  cache: {
    maxRetries: 2,
    baseDelayMs: 50,
    maxDelayMs: 500,
    backoffMultiplier: 2,
  },

  // Background jobs - can wait longer
  background_job: {
    maxRetries: 5,
    baseDelayMs: 5000,
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
  },

  // User-facing operations - quick feedback
  user_request: {
    maxRetries: 2,
    baseDelayMs: 200,
    maxDelayMs: 1000,
    backoffMultiplier: 1.5,
  },

  // Blockchain API calls - moderate retries
  blockchain: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },

  // Default provider retries
  provider_default: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
  },
};

const logger = new Logger('RetryUtil');

/**
 * Execute an operation with configurable retry logic
 *
 * @param operation - Async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to operation result
 * @throws Last error if all retries exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const result = await withRetryResult(operation, config);

  if (!result.success) {
    throw result.error;
  }

  return result.result as T;
}

/**
 * Execute an operation with retry logic, returning detailed result
 *
 * Useful when you need retry metadata even on failure.
 *
 * @param operation - Async function to execute
 * @param config - Retry configuration
 * @returns Retry result with success/failure, attempts, and duration
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  // Merge with preset if operationType specified
  const presetConfig = config.operationType ? (RETRY_PRESETS[config.operationType] ?? {}) : {};

  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    jitter = true,
    jitterFactor = 0.2,
    operationType = 'unknown',
    onRetry,
    isRetryable: customIsRetryable,
    signal,
  } = { ...presetConfig, ...config };

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= maxRetries) {
    // Check if aborted
    if (signal?.aborted) {
      return {
        success: false,
        error: new Error('Operation aborted'),
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      };
    }

    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      // Check if we should retry
      const shouldRetry = attempt <= maxRetries && isErrorRetryable(lastError, customIsRetryable);

      if (!shouldRetry) {
        break;
      }

      // Calculate delay
      const delayMs = calculateDelay({
        attempt,
        baseDelayMs,
        maxDelayMs,
        backoffMultiplier,
        jitter,
        jitterFactor,
        error: lastError,
      });

      // Log retry
      logger.warn(
        `[${operationType}] Retry ${attempt}/${maxRetries} after ${delayMs}ms: ${lastError.message}`
      );

      // Callback
      onRetry?.(attempt, lastError, delayMs);

      // Wait before retry
      await sleep(delayMs, signal);
    }
  }

  logger.error(
    `[${operationType}] All ${maxRetries} retries exhausted. Total attempts: ${attempt}`
  );

  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Calculate delay for next retry attempt
 */
function calculateDelay(options: {
  attempt: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitter: boolean;
  jitterFactor: number;
  error?: Error;
}): number {
  const { attempt, baseDelayMs, maxDelayMs, backoffMultiplier, jitter, jitterFactor, error } =
    options;

  // Check if error specifies retry delay
  if (error) {
    const errorDelay = getRetryDelay(error, 0);
    if (errorDelay > 0) {
      return Math.min(errorDelay, maxDelayMs);
    }
  }

  // Exponential backoff
  let delay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);

  // Add jitter
  if (jitter) {
    const jitterRange = delay * jitterFactor;
    delay += (Math.random() * 2 - 1) * jitterRange;
  }

  // Cap at max
  return Math.min(Math.max(delay, 0), maxDelayMs);
}

/**
 * Check if error should trigger a retry
 */
function isErrorRetryable(error: Error, customPredicate?: (error: Error) => boolean): boolean {
  // Custom predicate takes precedence
  if (customPredicate) {
    return customPredicate(error);
  }

  // Check domain exceptions
  if (isRetryableException(error)) {
    return true;
  }

  // Network errors are typically retryable
  const networkErrorPatterns = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN',
    'socket hang up',
    'network error',
    'timeout',
  ];

  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as any).code?.toLowerCase() ?? '';

  for (const pattern of networkErrorPatterns) {
    if (errorMessage.includes(pattern.toLowerCase()) || errorCode.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const statusCode = (error as any).status ?? (error as any).statusCode;

  if (statusCode && retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Sleep utility with abort support
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
      });
    }
  });
}

/**
 * Create a retry wrapper with pre-configured settings
 *
 * @example
 * ```typescript
 * const providerRetry = createRetryWrapper({
 *   operationType: 'provider_sync',
 *   onRetry: (attempt, error) => {
 *     metrics.increment('provider.retry', { attempt });
 *   },
 * });
 *
 * const result = await providerRetry(() => plaidClient.sync());
 * ```
 */
export function createRetryWrapper(
  defaultConfig: RetryConfig
): <T>(operation: () => Promise<T>, overrides?: Partial<RetryConfig>) => Promise<T> {
  return <T>(operation: () => Promise<T>, overrides?: Partial<RetryConfig>) => {
    return withRetry(operation, { ...defaultConfig, ...overrides });
  };
}

/**
 * Retry with timeout - combines retry logic with operation timeout
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  config: RetryConfig & { timeoutMs: number }
): Promise<T> {
  const { timeoutMs, ...retryConfig } = config;

  const wrappedOperation = async () => {
    let timeoutHandle: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms`);
        (error as any).code = 'TIMEOUT';
        reject(error);
      }, timeoutMs);
    });

    return Promise.race([
      operation().then(
        (result) => {
          clearTimeout(timeoutHandle!);
          return result;
        },
        (err) => {
          clearTimeout(timeoutHandle!);
          throw err;
        }
      ),
      timeoutPromise,
    ]);
  };

  return withRetry(wrappedOperation, retryConfig);
}

/**
 * Batch retry - retry multiple operations with coordinated backoff
 *
 * Useful for bulk operations where you want to retry failures together.
 */
export async function withBatchRetry<T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  config: RetryConfig & { concurrency?: number } = {}
): Promise<Array<{ item: T; result?: R; error?: Error }>> {
  const { concurrency = 5, ...retryConfig } = config;

  const results: Array<{ item: T; result?: R; error?: Error }> = [];
  const queue = [...items.map((item, index) => ({ item, index }))];

  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;

        const retryResult = await withRetryResult(
          () => operation(task.item, task.index),
          retryConfig
        );

        results[task.index] = {
          item: task.item,
          result: retryResult.result,
          error: retryResult.error,
        };
      }
    });

  await Promise.all(workers);
  return results;
}
