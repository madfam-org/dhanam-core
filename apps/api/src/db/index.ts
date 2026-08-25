// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Database client barrel export
 *
 * Re-exports the generated Prisma client with runtime types available
 * as top-level named exports for convenience.
 */

// Re-export everything from the generated Prisma client
export * from '../../generated/prisma';

// Re-export Prisma namespace
// export { Prisma } from '../../generated/prisma';

// Re-export runtime types as both values and types
import { Prisma } from '../../generated/prisma';

// Error classes (value + type)
export const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = InstanceType<
  typeof Prisma.PrismaClientKnownRequestError
>;

export const PrismaClientUnknownRequestError = Prisma.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = InstanceType<
  typeof Prisma.PrismaClientUnknownRequestError
>;

export const PrismaClientRustPanicError = Prisma.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = InstanceType<typeof Prisma.PrismaClientRustPanicError>;

export const PrismaClientInitializationError = Prisma.PrismaClientInitializationError;
export type PrismaClientInitializationError = InstanceType<
  typeof Prisma.PrismaClientInitializationError
>;

export const PrismaClientValidationError = Prisma.PrismaClientValidationError;
export type PrismaClientValidationError = InstanceType<typeof Prisma.PrismaClientValidationError>;

// Decimal (value + type)
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

// Type-only exports
export type InputJsonValue = Prisma.InputJsonValue;
