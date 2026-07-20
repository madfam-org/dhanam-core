// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import type { SentryService } from '@core/monitoring/sentry.service';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from '@db';

import { isDomainException, ErrorCode } from '../exceptions/domain-exceptions';
import { TimeoutError } from '../utils/timeout.util';

import { isPrismaKnownRequestError } from './prisma-error.guard';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
    retryAfterMs?: number;
  };
  meta: {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    correlationId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Optional() @Inject('SentryService') private readonly sentryService?: SentryService
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResponse = this.createErrorResponse(exception, request);

    // Log error with context
    this.logError(exception, request, errorResponse);

    // Capture in Sentry for 5xx errors
    if (errorResponse.meta.status >= 500 && this.sentryService) {
      this.captureInSentry(exception, request, errorResponse);
    }

    response.status(errorResponse.meta.status || 500).send(errorResponse);
  }

  private captureInSentry(
    exception: unknown,
    request: FastifyRequest,
    errorResponse: ErrorResponse & { meta: { status: number; correlationId?: string } }
  ) {
    if (!this.sentryService) return;

    const user = (request as unknown as Record<string, unknown>).user as
      | Record<string, unknown>
      | undefined;
    if (user) {
      this.sentryService.setUser(user);
    }

    // Set request context
    this.sentryService.setContext('request', {
      url: request.url,
      method: request.method,
      headers: this.sanitizeHeaders(request.headers),
      query: request.query,
      params: request.params,
      requestId: errorResponse.meta.requestId,
      correlationId: errorResponse.meta.correlationId,
    });

    // Set error context
    this.sentryService.setContext('error', {
      code: errorResponse.error.code,
      retryable: errorResponse.error.retryable,
      details: errorResponse.error.details,
    });

    // Set tags for filtering and grouping
    this.sentryService.setTags({
      errorCode: errorResponse.error.code,
      statusCode: errorResponse.meta.status.toString(),
      path: request.url,
      method: request.method,
      retryable: String(errorResponse.error.retryable ?? false),
    });

    // Add domain exception-specific context
    if (isDomainException(exception)) {
      this.sentryService.setContext('domainException', {
        exceptionType: exception.constructor.name,
        code: exception.code,
        retryable: exception.retryable,
        retryAfterMs: exception.retryAfterMs,
        timestamp: exception.timestamp.toISOString(),
      });

      // Tag for easier filtering
      this.sentryService.setTags({
        exceptionType: exception.constructor.name,
      });
    }

    // Add Prisma-specific context
    if (isPrismaKnownRequestError(exception)) {
      this.sentryService.setContext('prisma', {
        code: exception.code,
        meta: exception.meta,
        clientVersion: exception.clientVersion,
      });
      this.sentryService.setTags({
        prismaCode: exception.code,
      });
    }

    if (exception instanceof Error) {
      this.sentryService.captureException(exception);
    } else {
      this.sentryService.captureMessage(
        `Non-Error exception: ${JSON.stringify(exception)}`,
        'error'
      );
    }
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  private createErrorResponse(
    exception: unknown,
    request: FastifyRequest
  ): ErrorResponse & {
    meta: {
      status: number;
      timestamp: string;
      path: string;
      method: string;
      requestId?: string;
      correlationId?: string;
    };
  } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> | undefined = undefined;
    let retryable = false;
    let retryAfterMs: number | undefined = undefined;

    // Handle domain exceptions (highest priority)
    if (isDomainException(exception)) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
      retryable = exception.retryable;
      retryAfterMs = exception.retryAfterMs;
    }
    // Handle timeout errors
    else if (exception instanceof TimeoutError) {
      status = HttpStatus.GATEWAY_TIMEOUT;
      code = ErrorCode.PROVIDER_TIMEOUT;
      message = exception.message;
      retryable = true;
      retryAfterMs = 5000;
      details = {
        operationName: exception.operationName,
        timeoutMs: exception.timeoutMs,
      };
    }
    // Handle standard NestJS HttpExceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        code = this.getCodeFromStatus(status);
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        code = (responseObj.code as string) || this.getCodeFromStatus(status);
        details = responseObj.details as Record<string, unknown>;
        retryable = (responseObj.retryable as boolean) ?? false;
        retryAfterMs = responseObj.retryAfterMs as number | undefined;
      }
    }
    // Handle Prisma errors
    else if (this.isPrismaError(exception)) {
      const prismaResult = this.handlePrismaError(exception);
      status = prismaResult.status;
      code = prismaResult.code;
      message = prismaResult.message;
      details = prismaResult.details;
      retryable = prismaResult.retryable;
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      // Check for common error patterns
      const errorInfo = this.classifyGenericError(exception);
      status = errorInfo.status;
      code = errorInfo.code;
      message = this.sanitizeErrorMessage(exception.message);
      retryable = errorInfo.retryable;
    }

    return {
      success: false,
      error: {
        code,
        message,
        details,
        retryable: retryable || undefined,
        retryAfterMs: retryAfterMs || undefined,
      },
      meta: {
        status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.headers['x-request-id'] as string,
        correlationId: request.headers['x-correlation-id'] as string,
      },
    };
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(error: unknown): boolean {
    return (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientValidationError ||
      error instanceof PrismaClientRustPanicError ||
      error instanceof PrismaClientInitializationError ||
      error instanceof PrismaClientUnknownRequestError
    );
  }

  /**
   * Handle all types of Prisma errors
   */
  private handlePrismaError(error: unknown): {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
  } {
    // PrismaClientKnownRequestError - most common
    if (error instanceof PrismaClientKnownRequestError) {
      return this.mapPrismaKnownError(error);
    }

    // PrismaClientValidationError - query validation failures
    if (error instanceof PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Invalid database query',
        details: { validationError: true },
        retryable: false,
      };
    }

    // PrismaClientRustPanicError - internal Prisma engine error
    if (error instanceof PrismaClientRustPanicError) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database engine error',
        details: { enginePanic: true },
        retryable: true, // May be transient
      };
    }

    // PrismaClientInitializationError - connection/setup errors
    if (error instanceof PrismaClientInitializationError) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database connection unavailable',
        details: { initError: true },
        retryable: true,
      };
    }

    // PrismaClientUnknownRequestError - unknown errors
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.DATABASE_ERROR,
      message: 'Database operation failed',
      retryable: true,
    };
  }

  /**
   * Map PrismaClientKnownRequestError codes to appropriate responses
   */
  private mapPrismaKnownError(error: PrismaClientKnownRequestError): {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
  } {
    const baseDetails = {
      prismaCode: error.code,
      target: error.meta?.target,
    };

    switch (error.code) {
      // Unique constraint violation
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.DUPLICATE_ENTRY,
          message: `Duplicate entry: ${(error.meta?.target as string[])?.join(', ') || 'unique constraint violated'}`,
          details: baseDetails,
          retryable: false,
        };

      // Foreign key constraint failure
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: 'Related record not found',
          details: { ...baseDetails, field: error.meta?.field_name },
          retryable: false,
        };

      // Required relation not found
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: 'Required relation constraint violated',
          details: baseDetails,
          retryable: false,
        };

      // Record not found
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Record not found',
          details: baseDetails,
          retryable: false,
        };

      // Value too long for column
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Value too long for column',
          details: { ...baseDetails, column: error.meta?.column_name },
          retryable: false,
        };

      // Query interpretation error
      case 'P2016':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Query interpretation error',
          details: baseDetails,
          retryable: false,
        };

      // Records for relation not connected
      case 'P2017':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: 'Records for relation not connected',
          details: baseDetails,
          retryable: false,
        };

      // Table does not exist
      case 'P2021':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database schema error',
          details: baseDetails,
          retryable: false,
        };

      // Column does not exist
      case 'P2022':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database schema error',
          details: baseDetails,
          retryable: false,
        };

      // Transaction timeout
      case 'P2024':
        return {
          status: HttpStatus.GATEWAY_TIMEOUT,
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database operation timed out',
          details: baseDetails,
          retryable: true,
        };

      // Write conflict (optimistic locking)
      case 'P2034':
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'Write conflict occurred',
          details: baseDetails,
          retryable: true,
        };

      // Connection pool timeout
      case 'P2028':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database connection pool exhausted',
          details: baseDetails,
          retryable: true,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCode.DATABASE_ERROR,
          message: `Database error: ${this.sanitizeErrorMessage(error.message)}`,
          details: baseDetails,
          retryable: true,
        };
    }
  }

  /**
   * Classify generic errors by common patterns
   */
  private classifyGenericError(error: Error): {
    status: number;
    code: string;
    retryable: boolean;
  } {
    const message = error.message.toLowerCase();
    const statusCode = (error as unknown as Record<string, unknown>).statusCode;
    const errorCode =
      ((error as unknown as Record<string, unknown>).code as string)?.toLowerCase() ?? '';

    // Fastify plugin errors are plain Error instances with statusCode attached,
    // so map rate-limit errors before they fall through to INTERNAL_ERROR.
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS || message.includes('rate limit exceeded')) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ErrorCode.RATE_LIMITED,
        retryable: true,
      };
    }

    // Network errors
    if (
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('socket hang up') ||
      errorCode.includes('econnreset') ||
      errorCode.includes('econnrefused')
    ) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        retryable: true,
      };
    }

    // Timeout errors
    if (message.includes('timeout') || errorCode === 'timeout') {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        code: ErrorCode.PROVIDER_TIMEOUT,
        retryable: true,
      };
    }

    // DNS errors
    if (message.includes('enotfound') || errorCode.includes('enotfound')) {
      return {
        status: HttpStatus.BAD_GATEWAY,
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        retryable: true,
      };
    }

    // Default
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      retryable: false,
    };
  }

  /**
   * Sanitize error messages to prevent leaking sensitive information
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive patterns
    const sensitivePatterns = [
      /password[=:]\s*['"][^'"]*['"]/gi,
      /secret[=:]\s*['"][^'"]*['"]/gi,
      /api[_-]?key[=:]\s*['"][^'"]*['"]/gi,
      /token[=:]\s*['"][^'"]*['"]/gi,
      /auth[=:]\s*['"][^'"]*['"]/gi,
      /bearer\s+[a-zA-Z0-9._-]+/gi,
    ];

    let sanitized = message;
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Truncate very long messages
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...';
    }

    return sanitized;
  }

  private logError(
    exception: unknown,
    request: FastifyRequest,
    errorResponse: ErrorResponse & { meta: { status: number } }
  ) {
    const { status } = errorResponse.meta;
    const logData = {
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (
        (request as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined
      )?.id,
      errorCode: errorResponse.error.code,
      statusCode: status,
    };

    if (status >= 500) {
      this.logger.error(
        `${errorResponse.error.code}: ${errorResponse.error.message}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        JSON.stringify(logData)
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${errorResponse.error.code}: ${errorResponse.error.message}`,
        JSON.stringify(logData)
      );
    }
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}