// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain Exception Base Classes
 *
 * Provides consistent, type-safe exception hierarchy for business logic errors.
 * All domain exceptions extend BaseException which integrates with the global
 * exception filter for standardized error responses.
 *
 * @example
 * ```typescript
 * // In service code:
 * throw new ProviderException('PLAID_SYNC_FAILED', 'Failed to sync transactions', {
 *   provider: 'plaid',
 *   itemId: 'item_123',
 *   retryable: true,
 * });
 *
 * // Response format:
 * {
 *   success: false,
 *   error: {
 *     code: 'PLAID_SYNC_FAILED',
 *     message: 'Failed to sync transactions',
 *     details: { provider: 'plaid', itemId: 'item_123', retryable: true }
 *   }
 * }
 * ```
 */

/**
 * Error codes for consistent error identification across the API
 */
export enum ErrorCode {
  // Provider errors (P-xxx)
  PROVIDER_UNAVAILABLE = 'P001',
  PROVIDER_AUTH_FAILED = 'P002',
  PROVIDER_RATE_LIMITED = 'P003',
  PROVIDER_SYNC_FAILED = 'P004',
  PROVIDER_WEBHOOK_INVALID = 'P005',
  PROVIDER_CONNECTION_EXPIRED = 'P006',
  PROVIDER_TIMEOUT = 'P007',
  PROVIDER_CIRCUIT_OPEN = 'P008',

  // Validation errors (V-xxx)
  VALIDATION_FAILED = 'V001',
  INVALID_INPUT = 'V002',
  INVALID_STATE = 'V003',
  CONSTRAINT_VIOLATION = 'V004',
  DUPLICATE_ENTRY = 'V005',

  // Business logic errors (B-xxx)
  INSUFFICIENT_FUNDS = 'B001',
  BUDGET_EXCEEDED = 'B002',
  QUOTA_EXCEEDED = 'B003',
  OPERATION_NOT_ALLOWED = 'B004',
  RESOURCE_NOT_FOUND = 'B005',
  RESOURCE_CONFLICT = 'B006',
  ACCOUNT_DISABLED = 'B007',

  // Security errors (S-xxx)
  AUTH_FAILED = 'S001',
  TOKEN_EXPIRED = 'S002',
  TOKEN_INVALID = 'S003',
  INSUFFICIENT_PERMISSIONS = 'S004',
  TOTP_REQUIRED = 'S005',
  TOTP_INVALID = 'S006',
  SESSION_EXPIRED = 'S007',
  RATE_LIMITED = 'S008',

  // Infrastructure errors (I-xxx)
  DATABASE_ERROR = 'I001',
  CACHE_ERROR = 'I002',
  EXTERNAL_SERVICE_ERROR = 'I003',
  ENCRYPTION_ERROR = 'I004',
  CONFIGURATION_ERROR = 'I005',
  QUEUE_ERROR = 'I006',

  // Generic errors
  INTERNAL_ERROR = 'E001',
  UNKNOWN_ERROR = 'E999',
}

/**
 * Base interface for exception metadata
 */
export interface ExceptionDetails {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  retryable?: boolean;
  retryAfterMs?: number;
}

/**
 * Base exception class for all domain errors
 */
export abstract class BaseException extends HttpException {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly retryable: boolean;
  public readonly retryAfterMs?: number;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode | string,
    message: string,
    status: HttpStatus,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
      retryAfterMs?: number;
    }
  ) {
    super(
      {
        code,
        message,
        details: options?.details,
        retryable: options?.retryable ?? false,
        retryAfterMs: options?.retryAfterMs,
      },
      status,
      { cause: options?.cause }
    );

    this.code = code;
    this.details = options?.details;
    this.retryable = options?.retryable ?? false;
    this.retryAfterMs = options?.retryAfterMs;
    this.timestamp = new Date();

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Include cause in stack if provided
    if (options?.cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }
  }

  /**
   * Convert to plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      status: this.getStatus(),
      details: this.details,
      retryable: this.retryable,
      retryAfterMs: this.retryAfterMs,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Provider-related exceptions (Plaid, Belvo, Bitso, etc.)
 *
 * Use for all external financial data provider errors.
 */
export class ProviderException extends BaseException {
  public readonly provider: string;
  public readonly operation?: string;

  constructor(
    code: ErrorCode | string,
    message: string,
    options: {
      provider: string;
      operation?: string;
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
      retryAfterMs?: number;
      status?: HttpStatus;
    }
  ) {
    super(code, message, options.status ?? HttpStatus.BAD_GATEWAY, {
      details: {
        ...options.details,
        provider: options.provider,
        operation: options.operation,
      },
      cause: options.cause,
      retryable: options.retryable ?? true, // Provider errors are often retryable
      retryAfterMs: options.retryAfterMs,
    });

    this.provider = options.provider;
    this.operation = options.operation;
  }

  static unavailable(provider: string, cause?: Error): ProviderException {
    return new ProviderException(
      ErrorCode.PROVIDER_UNAVAILABLE,
      `Provider ${provider} is currently unavailable`,
      { provider, cause, retryable: true, retryAfterMs: 30000 }
    );
  }

  static authFailed(provider: string, cause?: Error): ProviderException {
    return new ProviderException(
      ErrorCode.PROVIDER_AUTH_FAILED,
      `Authentication with ${provider} failed`,
      { provider, cause, retryable: false, status: HttpStatus.UNAUTHORIZED }
    );
  }

  static rateLimited(provider: string, retryAfterMs?: number): ProviderException {
    return new ProviderException(ErrorCode.PROVIDER_RATE_LIMITED, `Rate limited by ${provider}`, {
      provider,
      retryable: true,
      retryAfterMs: retryAfterMs ?? 60000,
    });
  }

  static syncFailed(provider: string, operation: string, cause?: Error): ProviderException {
    return new ProviderException(
      ErrorCode.PROVIDER_SYNC_FAILED,
      `Sync operation failed for ${provider}`,
      { provider, operation, cause, retryable: true }
    );
  }

  static timeout(provider: string, operation?: string): ProviderException {
    return new ProviderException(ErrorCode.PROVIDER_TIMEOUT, `Request to ${provider} timed out`, {
      provider,
      operation,
      retryable: true,
      retryAfterMs: 5000,
      status: HttpStatus.GATEWAY_TIMEOUT,
    });
  }

  static circuitOpen(provider: string): ProviderException {
    return new ProviderException(
      ErrorCode.PROVIDER_CIRCUIT_OPEN,
      `Circuit breaker open for ${provider}. Service temporarily unavailable.`,
      { provider, retryable: true, retryAfterMs: 60000, status: HttpStatus.SERVICE_UNAVAILABLE }
    );
  }
}

/**
 * Validation exceptions for input and state validation errors
 */
export class ValidationException extends BaseException {
  public readonly field?: string;
  public readonly violations?: Array<{ field: string; message: string; value?: unknown }>;

  constructor(
    message: string,
    options?: {
      code?: ErrorCode | string;
      field?: string;
      violations?: Array<{ field: string; message: string; value?: unknown }>;
      details?: Record<string, unknown>;
    }
  ) {
    super(options?.code ?? ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST, {
      details: {
        ...options?.details,
        field: options?.field,
        violations: options?.violations,
      },
      retryable: false,
    });

    this.field = options?.field;
    this.violations = options?.violations;
  }

  static invalidInput(field: string, message: string, value?: unknown): ValidationException {
    return new ValidationException(`Invalid input for field: ${field}`, {
      code: ErrorCode.INVALID_INPUT,
      field,
      violations: [{ field, message, value }],
    });
  }

  static invalidState(message: string, details?: Record<string, unknown>): ValidationException {
    return new ValidationException(message, {
      code: ErrorCode.INVALID_STATE,
      details,
    });
  }

  static constraintViolation(
    violations: Array<{ field: string; message: string }>
  ): ValidationException {
    return new ValidationException('Validation constraints violated', {
      code: ErrorCode.CONSTRAINT_VIOLATION,
      violations,
    });
  }

  static duplicateEntry(field: string, value?: unknown): ValidationException {
    return new ValidationException(`Duplicate entry for ${field}`, {
      code: ErrorCode.DUPLICATE_ENTRY,
      field,
      violations: [{ field, message: 'Value already exists', value }],
    });
  }
}

/**
 * Business rule exceptions for domain logic violations
 */
export class BusinessRuleException extends BaseException {
  public readonly rule?: string;

  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      rule?: string;
      details?: Record<string, unknown>;
      status?: HttpStatus;
    }
  ) {
    super(code, message, options?.status ?? HttpStatus.UNPROCESSABLE_ENTITY, {
      details: {
        ...options?.details,
        rule: options?.rule,
      },
      retryable: false,
    });

    this.rule = options?.rule;
  }

  static insufficientFunds(
    required: number,
    available: number,
    currency: string
  ): BusinessRuleException {
    return new BusinessRuleException(
      ErrorCode.INSUFFICIENT_FUNDS,
      'Insufficient funds for operation',
      {
        details: { required, available, currency },
        rule: 'balance_check',
      }
    );
  }

  static budgetExceeded(budget: string, limit: number, attempted: number): BusinessRuleException {
    return new BusinessRuleException(
      ErrorCode.BUDGET_EXCEEDED,
      `Budget limit exceeded for ${budget}`,
      {
        details: { budget, limit, attempted },
        rule: 'budget_limit',
      }
    );
  }

  static quotaExceeded(resource: string, limit: number): BusinessRuleException {
    return new BusinessRuleException(ErrorCode.QUOTA_EXCEEDED, `Quota exceeded for ${resource}`, {
      details: { resource, limit },
      rule: 'quota_check',
    });
  }

  static operationNotAllowed(operation: string, reason: string): BusinessRuleException {
    return new BusinessRuleException(ErrorCode.OPERATION_NOT_ALLOWED, reason, {
      details: { operation },
      rule: 'operation_check',
      status: HttpStatus.FORBIDDEN,
    });
  }

  static resourceNotFound(resource: string, identifier: string): BusinessRuleException {
    return new BusinessRuleException(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, {
      details: { resource, identifier },
      status: HttpStatus.NOT_FOUND,
    });
  }

  static resourceConflict(resource: string, reason: string): BusinessRuleException {
    return new BusinessRuleException(ErrorCode.RESOURCE_CONFLICT, reason, {
      details: { resource },
      status: HttpStatus.CONFLICT,
    });
  }
}

/**
 * Security-related exceptions for auth and access control
 */
export class SecurityException extends BaseException {
  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      status?: HttpStatus;
    }
  ) {
    super(code, message, options?.status ?? HttpStatus.UNAUTHORIZED, {
      details: options?.details,
      retryable: false,
    });
  }

  static authFailed(reason?: string): SecurityException {
    return new SecurityException(ErrorCode.AUTH_FAILED, reason ?? 'Authentication failed');
  }

  static tokenExpired(): SecurityException {
    return new SecurityException(ErrorCode.TOKEN_EXPIRED, 'Token has expired');
  }

  static tokenInvalid(): SecurityException {
    return new SecurityException(ErrorCode.TOKEN_INVALID, 'Invalid token');
  }

  static insufficientPermissions(resource?: string): SecurityException {
    return new SecurityException(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions to access this resource',
      { details: { resource }, status: HttpStatus.FORBIDDEN }
    );
  }

  static totpRequired(): SecurityException {
    return new SecurityException(ErrorCode.TOTP_REQUIRED, 'TOTP verification required', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  static totpInvalid(): SecurityException {
    return new SecurityException(ErrorCode.TOTP_INVALID, 'Invalid TOTP token');
  }

  static sessionExpired(): SecurityException {
    return new SecurityException(ErrorCode.SESSION_EXPIRED, 'Session has expired');
  }

  static rateLimited(retryAfterSeconds?: number): SecurityException {
    return new SecurityException(ErrorCode.RATE_LIMITED, 'Too many requests', {
      details: { retryAfterSeconds },
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}

/**
 * Infrastructure exceptions for system-level errors
 */
export class InfrastructureException extends BaseException {
  public readonly service?: string;

  constructor(
    code: ErrorCode | string,
    message: string,
    options?: {
      service?: string;
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
      retryAfterMs?: number;
    }
  ) {
    super(code, message, HttpStatus.INTERNAL_SERVER_ERROR, {
      details: {
        ...options?.details,
        service: options?.service,
      },
      cause: options?.cause,
      retryable: options?.retryable ?? true,
      retryAfterMs: options?.retryAfterMs,
    });

    this.service = options?.service;
  }

  static databaseError(operation: string, cause?: Error): InfrastructureException {
    return new InfrastructureException(ErrorCode.DATABASE_ERROR, 'Database operation failed', {
      service: 'database',
      details: { operation },
      cause,
      retryable: true,
      retryAfterMs: 1000,
    });
  }

  static cacheError(operation: string, cause?: Error): InfrastructureException {
    return new InfrastructureException(ErrorCode.CACHE_ERROR, 'Cache operation failed', {
      service: 'redis',
      details: { operation },
      cause,
      retryable: true,
      retryAfterMs: 500,
    });
  }

  static externalServiceError(service: string, cause?: Error): InfrastructureException {
    return new InfrastructureException(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      {
        service,
        cause,
        retryable: true,
        retryAfterMs: 5000,
      }
    );
  }

  static encryptionError(operation: string, cause?: Error): InfrastructureException {
    return new InfrastructureException(ErrorCode.ENCRYPTION_ERROR, 'Encryption operation failed', {
      service: 'crypto',
      details: { operation },
      cause,
      retryable: false,
    });
  }

  static configurationError(setting: string): InfrastructureException {
    return new InfrastructureException(
      ErrorCode.CONFIGURATION_ERROR,
      `Configuration error: ${setting}`,
      {
        details: { setting },
        retryable: false,
      }
    );
  }

  static queueError(operation: string, cause?: Error): InfrastructureException {
    return new InfrastructureException(ErrorCode.QUEUE_ERROR, 'Queue operation failed', {
      service: 'bullmq',
      details: { operation },
      cause,
      retryable: true,
      retryAfterMs: 1000,
    });
  }
}

/**
 * Type guard to check if an error is a domain exception
 */
export function isDomainException(error: unknown): error is BaseException {
  return error instanceof BaseException;
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableException(error: unknown): boolean {
  if (error instanceof BaseException) {
    return error.retryable;
  }
  return false;
}

/**
 * Get retry delay from error or default
 */
export function getRetryDelay(error: unknown, defaultMs: number = 1000): number {
  if (error instanceof BaseException && error.retryAfterMs) {
    return error.retryAfterMs;
  }
  return defaultMs;
}
