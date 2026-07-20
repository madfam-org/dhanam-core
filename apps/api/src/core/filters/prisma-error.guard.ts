// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Type-guard for Prisma error narrowing.
 *
 * The `@db` barrel re-exports the Prisma error classes as `const value` +
 * adjacent `type alias`, which TypeScript can't always thread through an
 * `instanceof` narrow on an `unknown`-typed variable — the inferred narrow
 * ends up as `unknown` again, and `.code`/`.meta`/`.clientVersion` accesses
 * fail TS2339.
 *
 * These predicates fix the narrow with one shape definition each, shared
 * across every catch-block in the codebase that needs to identify a Prisma
 * error and pull `code`/`meta` off it.
 */
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from '@db';

export interface PrismaKnownRequestErrorShape {
  code: string;
  meta?: Record<string, unknown> & { target?: string | string[] };
  clientVersion: string;
  message: string;
  name: string;
  stack?: string;
}

export function isPrismaKnownRequestError(e: unknown): e is PrismaKnownRequestErrorShape {
  return e instanceof PrismaClientKnownRequestError;
}

export function isPrismaValidationError(e: unknown): e is Error {
  return e instanceof PrismaClientValidationError;
}

export function isPrismaRustPanicError(e: unknown): e is Error {
  return e instanceof PrismaClientRustPanicError;
}

export function isPrismaInitializationError(e: unknown): e is Error {
  return e instanceof PrismaClientInitializationError;
}

export function isPrismaUnknownRequestError(e: unknown): e is Error {
  return e instanceof PrismaClientUnknownRequestError;
}

/**
 * True if `e` is any flavor of Prisma client error. Useful for catch-blocks
 * that want to handle "any DB layer error" uniformly before reaching for
 * the type-specific narrowed handlers.
 */
export function isPrismaError(e: unknown): boolean {
  return (
    isPrismaKnownRequestError(e) ||
    isPrismaValidationError(e) ||
    isPrismaRustPanicError(e) ||
    isPrismaInitializationError(e) ||
    isPrismaUnknownRequestError(e)
  );
}