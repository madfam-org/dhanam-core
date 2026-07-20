// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * FX module entity placeholders.
 *
 * The canonical Prisma models live in `apps/api/prisma/schema.prisma` and are
 * accessed throughout the module via `PrismaService` (e.g. `prisma.fxRateObservation`).
 * This file documents the row shapes that match the migration so consumers (and
 * future SDK generators) have a reference without taking a hard compile-time
 * dependency on the regenerated Prisma client.
 *
 * The module uses three tables:
 *   - `fx_rate_observations`  — every rate the service has *seen* from any provider
 *   - `fx_rate_publications`  — official daily DOF rows; one per (currency-pair, effective_date)
 *   - `fx_rate_overrides`     — manually-issued rate overrides
 */

export interface FxRateObservationRow {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateType: 'spot' | 'dof' | 'settled';
  rate: string; // Decimal serialized as string
  source: string;
  providerId: string | null;
  paymentId: string | null;
  observedAt: Date;
  effectiveAt: Date;
  createdAt: Date;
}

export interface FxRatePublicationRow {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  effectiveDate: Date;
  rate: string;
  source: string;
  providerId: string | null;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FxRateOverrideRow {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateType: 'spot' | 'dof' | 'settled';
  rate: string;
  rationale: string;
  issuedBy: string;
  approvedBy: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  createdAt: Date;
}