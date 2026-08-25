// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

/**
 * FX rate types — explicit at the API boundary.
 *
 * - `spot`     : Provider chain (OpenExchangeRates → exchangerate.host → fallback). Caller-facing pricing.
 * - `dof`      : Banxico SIE `SF60653` series. SAT-defensible CFDI emission.
 * - `settled`  : A settlement rate recorded post-hoc — the rate actually used when a payment settled.
 *
 * spot ≠ dof ≠ settled — they legitimately differ. Caller MUST pick.
 */
export enum FxRateType {
  spot = 'spot',
  dof = 'dof',
  settled = 'settled',
}

const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export class GetFxRateQueryDto {
  @ApiProperty({ description: 'ISO 4217 source currency code', example: 'USD' })
  @IsString()
  @Length(3, 3)
  from!: string;

  @ApiProperty({ description: 'ISO 4217 target currency code', example: 'MXN' })
  @IsString()
  @Length(3, 3)
  to!: string;

  @ApiProperty({ description: 'Rate type', enum: FxRateType, example: FxRateType.spot })
  @IsEnum(FxRateType)
  type!: FxRateType;

  @ApiPropertyOptional({
    description:
      'Effective date (ISO 8601). For type=dof returns the DOF in effect on that date. Required-ish for type=settled (replaced by payment_id).',
  })
  @IsOptional()
  @IsDateString()
  at?: string;

  @ApiPropertyOptional({
    description: 'Settlement payment id. Required for type=settled.',
  })
  @IsOptional()
  @IsString()
  payment_id?: string;

  @ApiPropertyOptional({
    description:
      'When true, allow returning a stale cached value if the provider chain is exhausted. Defaults to true.',
  })
  @IsOptional()
  @IsBooleanString()
  allow_stale?: string;
}

export class GetFxRatesBatchQueryDto {
  @ApiProperty({ description: 'ISO 4217 base currency code', example: 'USD' })
  @IsString()
  @Length(3, 3)
  base!: string;

  @ApiProperty({
    description: 'Comma-separated ISO 4217 target currency codes',
    example: 'MXN,EUR,BRL',
  })
  @IsString()
  targets!: string;

  @ApiProperty({ description: 'Rate type', enum: FxRateType, example: FxRateType.spot })
  @IsEnum(FxRateType)
  type!: FxRateType;

  @ApiPropertyOptional({ description: 'Effective date (ISO 8601), only honored for type=dof.' })
  @IsOptional()
  @IsDateString()
  at?: string;

  /**
   * Helper: parse + validate the comma-separated `targets` field.
   * Throws nothing — returns trimmed uppercase codes that pass the ISO 4217 shape regex.
   */
  static parseTargets(targets: string): string[] {
    return targets
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter((t) => CURRENCY_CODE_REGEX.test(t));
  }
}

export class GetFxHistoryQueryDto {
  @ApiProperty({ description: 'ISO 4217 source currency code', example: 'USD' })
  @IsString()
  @Length(3, 3)
  from!: string;

  @ApiProperty({ description: 'ISO 4217 target currency code', example: 'MXN' })
  @IsString()
  @Length(3, 3)
  to!: string;

  @ApiProperty({ description: 'Rate type', enum: FxRateType, example: FxRateType.dof })
  @IsEnum(FxRateType)
  type!: FxRateType;

  @ApiProperty({ description: 'Range start date (ISO 8601, inclusive)' })
  @IsISO8601()
  from_date!: string;

  @ApiProperty({ description: 'Range end date (ISO 8601, inclusive)' })
  @IsISO8601()
  to_date!: string;
}

/**
 * Provenance block — for DOF responses, includes the Banxico publication id
 * for auditable provenance.
 */
export interface FxRateProvenance {
  /** Stable identifier for the upstream observation, e.g. `oer:2026-04-25T18:14:00Z`. */
  provider_id: string;
  /** True if a non-primary provider supplied the rate. */
  fallback_chain_used: boolean;
  /** Optional human-readable note (e.g. "DOF not yet published, returning yesterday"). */
  note?: string;
}

export interface FxRateResponse {
  from: string;
  to: string;
  rate: string;
  type: FxRateType;
  source: string;
  observed_at: string;
  effective_at: string;
  stale_after: string;
  provenance: FxRateProvenance;
}

export interface FxRatesBatchResponse {
  base: string;
  type: FxRateType;
  observed_at: string;
  rates: Record<
    string,
    Pick<FxRateResponse, 'rate' | 'source' | 'effective_at' | 'stale_after' | 'provenance'>
  >;
}

export interface FxHistoryEntry {
  effective_date: string;
  rate: string;
  source: string;
  provider_id: string | null;
}

export interface FxHistoryResponse {
  from: string;
  to: string;
  type: FxRateType;
  from_date: string;
  to_date: string;
  count: number;
  entries: FxHistoryEntry[];
}
