// SPDX-License-Identifier: AGPL-3.0-or-later
import { Logger } from '@nestjs/common';

/**
 * Timeout Utility
 *
 * Provides configurable timeout wrappers for async operations to prevent
 * hanging requests and ensure bounded response times.
 *
 * @example
 * ```typescript
 * // Simple timeout
 * const result = await withTimeout(
 *   () => externalApi.fetch(),
 *   { timeoutMs: 5000, operationName: 'external_api_fetch' }
 * );
 *
 * // With cleanup on timeout
 * const result = await withTimeout(
 *   () => slowOperation(),
 *   {
 *     timeoutMs: 10000,
 *     onTimeout: () => cancelPendingRequest(),
 *   }
 * );
 * ```
 */

export interface TimeoutConfig {
  /**
   * Timeout duration in milliseconds
   */
  timeoutMs: number;

  /**
   * Operation name for logging
   */
  operationName?: string;

  /**
   * Custom timeout error message
   */
  errorMessage?: string;

  /**
   * Callback when timeout occurs (for cleanup)
   */
  onTimeout?: () => void | Promise<void>;
}

/**
 * Timeout error with operation context
 */
export class TimeoutError extends Error {
  public readonly code = 'TIMEOUT';
  public readonly operationName?: string;
  public readonly timeoutMs: number;

  constructor(message: string, operationName?: string, timeoutMs?: number) {
    super(message);
    this.name = 'TimeoutError';
    this.operationName = operationName;
    this.timeoutMs = timeoutMs ?? 0;

    // Maintain proper stack trace
    Error.captureStackTrace(this, TimeoutError);
  }
}

/**
 * Default timeouts by operation category
 */
export const TIMEOUT_PRESETS: Record<string, number> = {
  // External provider API calls
  provider_api: 30000, // 30 seconds

  // Internal service calls
  internal_service: 10000, // 10 seconds

  // Database operations
  database_query: 15000, // 15 seconds
  database_transaction: 30000, // 30 seconds

  // Background job operations
  background_job: 300000, // 5 minutes

  // User-facing quick operations
  user_request: 5000, // 5 seconds

  // Webhook processing
  webhook_handler: 10000, // 10 seconds

  // Cache operations
  cache_operation: 2000, // 2 seconds

  // File upload/download
  file_operation: 60000, // 1 minute

  // Email operations
  email_send: 30000, // 30 seconds
  email_batch: 60000, // 1 minute
  email_template_fetch: 10000, // 10 seconds

  // Health checks
  health_check: 5000, // 5 seconds

  // Blockchain queries
  blockchain_query: 10000, // 10 seconds

  // Circuit breaker retry window
  circuit_breaker_retry: 60000, // 1 minute
};

const logger = new Logger('TimeoutUtil');

/**
 * Execute an operation with a timeout
 *
 * @param operation - Async function to execute
 * @param config - Timeout configuration
 * @returns Promise resolving to operation result
 * @throws TimeoutError if operation exceeds timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeoutMs, operationName = 'unknown', errorMessage, onTimeout } = config;

  let timeoutId: ReturnType<typeof setTimeout>;
  let isTimedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(async () => {
      isTimedOut = true;

      logger.warn(`[${operationName}] Operation timed out after ${timeoutMs}ms`);

      // Run cleanup callback
      if (onTimeout) {
        try {
          await Promise.resolve(onTimeout());
        } catch (cleanupError) {
          logger.error(`[${operationName}] Timeout cleanup failed:`, cleanupError);
        }
      }

      reject(
        new TimeoutError(
          errorMessage ?? `Operation '${operationName}' timed out after ${timeoutMs}ms`,
          operationName,
          timeoutMs
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation(), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    if (!isTimedOut) {
      clearTimeout(timeoutId!);
    }
    throw error;
  }
}

/**
 * Execute an operation with timeout, returning null on timeout
 *
 * Useful when timeout is acceptable and you want graceful degradation.
 *
 * @param operation - Async function to execute
 * @param config - Timeout configuration
 * @returns Result or null if timed out
 */
export async function withTimeoutOrNull<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T | null> {
  try {
    return await withTimeout(operation, config);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return null;
    }
    throw error;
  }
}

/**
 * Execute an operation with timeout, returning default value on timeout
 *
 * @param operation - Async function to execute
 * @param config - Timeout configuration with default value
 * @returns Result or default value if timed out
 */
export async function withTimeoutOrDefault<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig & { defaultValue: T }
): Promise<T> {
  try {
    return await withTimeout(operation, config);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return config.defaultValue;
    }
    throw error;
  }
}

/**
 * Create a timeout wrapper with pre-configured settings
 *
 * @example
 * ```typescript
 * const providerTimeout = createTimeoutWrapper({
 *   timeoutMs: 30000,
 *   operationName: 'provider_api',
 * });
 *
 * const result = await providerTimeout(() => plaidClient.accountsGet());
 * ```
 */
export function createTimeoutWrapper(
  defaultConfig: TimeoutConfig
): <T>(operation: () => Promise<T>, overrides?: Partial<TimeoutConfig>) => Promise<T> {
  return <T>(operation: () => Promise<T>, overrides?: Partial<TimeoutConfig>) => {
    return withTimeout(operation, { ...defaultConfig, ...overrides });
  };
}

/**
 * Execute multiple operations with independent timeouts
 *
 * @param operations - Array of operations with their configs
 * @returns Array of results or errors
 */
export async function withParallelTimeouts<T>(
  operations: Array<{
    operation: () => Promise<T>;
    config: TimeoutConfig;
  }>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const promises = operations.map(async ({ operation, config }) => {
    try {
      const result = await withTimeout(operation, config);
      return { success: true as const, result };
    } catch (error) {
      return { success: false as const, error: error as Error };
    }
  });

  return Promise.all(promises);
}

/**
 * Execute an operation that must complete within multiple deadline tiers
 *
 * @example
 * ```typescript
 * const result = await withDeadlines(
 *   () => slowOperation(),
 *   {
 *     deadlines: [
 *       { ms: 1000, onDeadline: () => logger.warn('Slow operation') },
 *       { ms: 5000, onDeadline: () => metrics.increment('slow_ops') },
 *       { ms: 10000 }, // Final hard timeout
 *     ],
 *     operationName: 'slow_operation',
 *   }
 * );
 * ```
 */
export async function withDeadlines<T>(
  operation: () => Promise<T>,
  config: {
    deadlines: Array<{ ms: number; onDeadline?: () => void | Promise<void> }>;
    operationName?: string;
  }
): Promise<T> {
  const { deadlines, operationName = 'unknown' } = config;
  const startTime = Date.now();

  // Sort deadlines by time
  const sortedDeadlines = [...deadlines].sort((a, b) => a.ms - b.ms);

  if (sortedDeadlines.length === 0) {
    return operation();
  }

  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  // Set up deadline callbacks (except the last one which is the hard timeout)
  for (let i = 0; i < sortedDeadlines.length - 1; i++) {
    const deadline = sortedDeadlines[i];
    if (deadline.onDeadline) {
      const timeoutId = setTimeout(async () => {
        logger.debug(`[${operationName}] Deadline ${i + 1} reached at ${deadline.ms}ms`);
        try {
          await Promise.resolve(deadline.onDeadline!());
        } catch (error) {
          logger.error(`[${operationName}] Deadline callback failed:`, error);
        }
      }, deadline.ms);
      timeoutIds.push(timeoutId);
    }
  }

  // Last deadline is the hard timeout
  const lastDeadline = sortedDeadlines[sortedDeadlines.length - 1];

  try {
    const result = await withTimeout(operation, {
      timeoutMs: lastDeadline.ms,
      operationName,
      onTimeout: () => {
        logger.warn(
          `[${operationName}] Hard timeout reached at ${lastDeadline.ms}ms (elapsed: ${Date.now() - startTime}ms)`
        );
        if (lastDeadline.onDeadline) {
          return Promise.resolve(lastDeadline.onDeadline());
        }
      },
    });

    // Clear all pending deadline timeouts
    timeoutIds.forEach(clearTimeout);

    return result;
  } catch (error) {
    // Clear all pending deadline timeouts on error
    timeoutIds.forEach(clearTimeout);
    throw error;
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError || (error as any)?.code === 'TIMEOUT';
}

/**
 * Create an AbortController with automatic timeout
 *
 * Useful for fetch operations that support AbortSignal.
 *
 * @example
 * ```typescript
 * const { controller, cleanup } = createTimeoutController(5000);
 *
 * try {
 *   const response = await fetch(url, { signal: controller.signal });
 *   cleanup();
 *   return response;
 * } catch (error) {
 *   cleanup();
 *   throw error;
 * }
 * ```
 */
export function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}