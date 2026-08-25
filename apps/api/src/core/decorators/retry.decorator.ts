// SPDX-License-Identifier: AGPL-3.0-or-later
import { Logger } from '@nestjs/common';

import { withRetry, RetryConfig, RETRY_PRESETS } from '../utils/retry.util';

/**
 * Method decorator for automatic retry behavior
 *
 * Wraps async methods with configurable retry logic including:
 * - Exponential backoff with jitter
 * - Per-operation type presets
 * - Logging of retry attempts
 *
 * @example
 * ```typescript
 * class PlaidService {
 *   @Retry({ operationType: 'provider_sync', maxRetries: 3 })
 *   async syncAccounts(accessToken: string): Promise<Account[]> {
 *     // This method will automatically retry on transient failures
 *     return this.plaidClient.accountsGet({ access_token: accessToken });
 *   }
 *
 *   // Using preset configuration
 *   @Retry('provider_sync')
 *   async syncTransactions(accessToken: string): Promise<Transaction[]> {
 *     return this.plaidClient.transactionsSync({ access_token: accessToken });
 *   }
 * }
 * ```
 */
export function Retry(config: RetryConfig | keyof typeof RETRY_PRESETS = {}): MethodDecorator {
  return function (target: object, propertyName: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(target.constructor.name);

    // Support string preset names
    const resolvedConfig: RetryConfig =
      typeof config === 'string' ? { ...RETRY_PRESETS[config], operationType: config } : config;

    descriptor.value = async function (...args: unknown[]) {
      const className = target.constructor.name;
      const methodName = String(propertyName);

      const operationName = resolvedConfig.operationType ?? `${className}.${methodName}`;

      return withRetry(() => method.apply(this, args), {
        ...resolvedConfig,
        operationType: operationName,
        onRetry: (attempt, error, nextDelayMs) => {
          logger.warn(
            `[${operationName}] Retry attempt ${attempt}: ${error.message}. ` +
              `Next retry in ${nextDelayMs}ms`
          );

          // Call original onRetry if provided
          resolvedConfig.onRetry?.(attempt, error, nextDelayMs);
        },
      });
    };

    return descriptor;
  };
}

/**
 * Decorator that combines retry with timeout
 *
 * @example
 * ```typescript
 * class ExternalApiService {
 *   @RetryWithTimeout({
 *     timeoutMs: 5000,
 *     maxRetries: 3,
 *     operationType: 'external_api',
 *   })
 *   async fetchData(): Promise<Data> {
 *     return this.httpClient.get('/data');
 *   }
 * }
 * ```
 */
export function RetryWithTimeout(config: RetryConfig & { timeoutMs: number }): MethodDecorator {
  return function (target: object, propertyName: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: unknown[]) {
      const className = target.constructor.name;
      const methodName = String(propertyName);
      const operationName = config.operationType ?? `${className}.${methodName}`;

      const { timeoutMs, ...retryConfig } = config;

      // Wrap the method call with timeout (clearing timer to prevent leaks)
      const timedOperation = () => {
        let timeoutHandle: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            const error = new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`);
            (error as unknown as Record<string, unknown>).code = 'TIMEOUT';
            reject(error);
          }, timeoutMs);
        });

        return Promise.race([
          method.apply(this, args).then(
            (result: unknown) => {
              clearTimeout(timeoutHandle);
              return result;
            },
            (err: unknown) => {
              clearTimeout(timeoutHandle);
              throw err;
            }
          ),
          timeoutPromise,
        ]);
      };

      return withRetry(timedOperation, {
        ...retryConfig,
        operationType: operationName,
        onRetry: (attempt, error, nextDelayMs) => {
          logger.warn(
            `[${operationName}] Retry attempt ${attempt}: ${error.message}. ` +
              `Next retry in ${nextDelayMs}ms`
          );
          retryConfig.onRetry?.(attempt, error, nextDelayMs);
        },
      });
    };

    return descriptor;
  };
}

/**
 * Decorator that retries only on specific error types
 *
 * @example
 * ```typescript
 * class DatabaseService {
 *   @RetryOn({
 *     errorTypes: [PrismaClientKnownRequestError],
 *     errorCodes: ['P2002', 'P2034'], // Unique constraint, transaction conflicts
 *     maxRetries: 2,
 *   })
 *   async upsertRecord(data: Data): Promise<Record> {
 *     return this.prisma.record.upsert({ ... });
 *   }
 * }
 * ```
 */
export function RetryOn(
  config: RetryConfig & {
    errorTypes?: Array<new (...args: unknown[]) => Error>;
    errorCodes?: string[];
    errorMessages?: RegExp[];
  }
): MethodDecorator {
  return function (target: object, propertyName: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(target.constructor.name);

    const { errorTypes, errorCodes, errorMessages, ...retryConfig } = config;

    descriptor.value = async function (...args: unknown[]) {
      const className = target.constructor.name;
      const methodName = String(propertyName);
      const operationName = retryConfig.operationType ?? `${className}.${methodName}`;

      return withRetry(() => method.apply(this, args), {
        ...retryConfig,
        operationType: operationName,
        isRetryable: (error: Error) => {
          // Check error types
          if (errorTypes?.some((type) => error instanceof type)) {
            return true;
          }

          // Check error codes
          const errorCode = (error as unknown as Record<string, unknown>).code;
          if (typeof errorCode === 'string' && errorCodes?.includes(errorCode)) {
            return true;
          }

          // Check error messages
          if (errorMessages?.some((pattern) => pattern.test(error.message))) {
            return true;
          }

          return false;
        },
        onRetry: (attempt, error, nextDelayMs) => {
          logger.warn(
            `[${operationName}] Retry attempt ${attempt} for ${error.constructor.name}: ${error.message}. ` +
              `Next retry in ${nextDelayMs}ms`
          );
          retryConfig.onRetry?.(attempt, error, nextDelayMs);
        },
      });
    };

    return descriptor;
  };
}

/**
 * Decorator for operations that should not be retried
 * Provides documentation and explicit opt-out
 *
 * @example
 * ```typescript
 * class PaymentService {
 *   @NoRetry('Payment operations must not be retried to avoid double-charging')
 *   async chargeCard(paymentId: string): Promise<PaymentResult> {
 *     return this.paymentGateway.charge(paymentId);
 *   }
 * }
 * ```
 */
export function NoRetry(reason?: string): MethodDecorator {
  return function (target: object, propertyName: string | symbol, descriptor: PropertyDescriptor) {
    // This decorator is primarily for documentation
    // It doesn't modify behavior, but signals to developers that retries are intentionally disabled

    if (reason) {
      const logger = new Logger(target.constructor.name);
      logger.debug(`[${String(propertyName)}] NoRetry: ${reason}`);
    }

    return descriptor;
  };
}

/**
 * Class decorator to apply retry behavior to all async methods
 *
 * @example
 * ```typescript
 * @RetryableService({ operationType: 'database', maxRetries: 2 })
 * class DatabaseService {
 *   // All async methods will be wrapped with retry logic
 *   async findOne(id: string): Promise<Entity> { ... }
 *   async findMany(query: Query): Promise<Entity[]> { ... }
 * }
 * ```
 */
export function RetryableService(config: RetryConfig = {}): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- ClassDecorator signature requires Function
  return function <T extends Function>(target: T): T | void {
    const prototype = target.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const propertyName of propertyNames) {
      if (propertyName === 'constructor') continue;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      // Check if method is async
      const isAsync =
        descriptor.value.constructor.name === 'AsyncFunction' ||
        descriptor.value[Symbol.toStringTag] === 'AsyncFunction';

      if (!isAsync) continue;

      // Apply Retry decorator
      const decorated = Retry(config)(target, propertyName, descriptor);
      if (decorated) {
        Object.defineProperty(prototype, propertyName, decorated);
      }
    }

    return target;
  };
}
