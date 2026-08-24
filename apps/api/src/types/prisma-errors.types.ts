// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Type definitions and type guards for Prisma errors
 * This file provides type-safe error handling for Prisma operations
 */

/**
 * Prisma error codes
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export enum PrismaErrorCode {
  // Common errors
  UniqueConstraintViolation = 'P2002',
  ForeignKeyConstraintViolation = 'P2003',
  RecordNotFound = 'P2025',
  RecordRequiredButNotFound = 'P2018',

  // Query errors
  ValueTooLong = 'P2000',
  RecordDoesNotExist = 'P2001',
  InvalidValue = 'P2007',

  // Connection errors
  AuthenticationFailed = 'P1000',
  CannotReachDatabase = 'P1001',
  ConnectionTimeout = 'P1002',
  DatabaseDoesNotExist = 'P1003',

  // Migration errors
  MigrationFailed = 'P3000',
  MigrationNotApplied = 'P3001',

  // Other errors
  UnknownError = 'P5000',
}

/**
 * Prisma error interface
 */
export interface PrismaError extends Error {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
    table?: string;
    column?: string;
    constraint?: string;
    model_name?: string;
    [key: string]: any;
  };
  clientVersion?: string;
}

/**
 * Type guard to check if an error is a Prisma error
 */
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    (error as any).code.startsWith('P')
  );
}

/**
 * Type guard to check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: unknown): error is PrismaError {
  return isPrismaError(error) && error.code === PrismaErrorCode.UniqueConstraintViolation;
}

/**
 * Type guard to check if error is a foreign key constraint violation
 */
export function isForeignKeyError(error: unknown): error is PrismaError {
  return isPrismaError(error) && error.code === PrismaErrorCode.ForeignKeyConstraintViolation;
}

/**
 * Type guard to check if error is a record not found error
 */
export function isRecordNotFoundError(error: unknown): error is PrismaError {
  return (
    isPrismaError(error) &&
    (error.code === PrismaErrorCode.RecordNotFound ||
      error.code === PrismaErrorCode.RecordRequiredButNotFound ||
      error.code === PrismaErrorCode.RecordDoesNotExist)
  );
}

/**
 * Type guard to check if error is a connection error
 */
export function isConnectionError(error: unknown): error is PrismaError {
  return (
    isPrismaError(error) &&
    (error.code === PrismaErrorCode.AuthenticationFailed ||
      error.code === PrismaErrorCode.CannotReachDatabase ||
      error.code === PrismaErrorCode.ConnectionTimeout ||
      error.code === PrismaErrorCode.DatabaseDoesNotExist)
  );
}

/**
 * Extract the target fields from a unique constraint violation
 */
export function getUniqueConstraintFields(error: PrismaError): string[] {
  return error.meta?.target || [];
}

/**
 * Get a user-friendly error message for a Prisma error
 */
export function getPrismaErrorMessage(error: PrismaError): string {
  switch (error.code) {
    case PrismaErrorCode.UniqueConstraintViolation: {
      const fields = getUniqueConstraintFields(error);
      return `A record with this ${fields.join(', ')} already exists.`;
    }

    case PrismaErrorCode.ForeignKeyConstraintViolation:
      return 'Cannot perform this operation due to related records.';

    case PrismaErrorCode.RecordNotFound:
    case PrismaErrorCode.RecordRequiredButNotFound:
    case PrismaErrorCode.RecordDoesNotExist:
      return 'The requested record was not found.';

    case PrismaErrorCode.AuthenticationFailed:
      return 'Database authentication failed.';

    case PrismaErrorCode.CannotReachDatabase:
      return 'Cannot connect to the database.';

    case PrismaErrorCode.ConnectionTimeout:
      return 'Database connection timed out.';

    case PrismaErrorCode.ValueTooLong:
      return 'The provided value is too long.';

    default:
      return 'A database error occurred.';
  }
}
