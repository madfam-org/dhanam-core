// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

/**
 * Scenario types for stress testing
 */
export enum ScenarioTypeDto {
  JOB_LOSS = 'job_loss',
  MARKET_CRASH = 'market_crash',
  RECESSION = 'recession',
  MEDICAL_EMERGENCY = 'medical_emergency',
  INFLATION_SPIKE = 'inflation_spike',
  DISABILITY = 'disability',
  MARKET_CORRECTION = 'market_correction',
}

/**
 * DTO for scenario analysis request
 */
export class AnalyzeScenarioDto {
  @IsEnum(ScenarioTypeDto)
  scenarioType: ScenarioTypeDto;

  // Baseline simulation configuration
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialBalance: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyContribution: number;

  @IsNumber()
  @Min(1)
  @Max(100) // Max 100 years
  @Type(() => Number)
  years: number;

  @IsNumber()
  @Min(100)
  @Max(50000)
  @IsOptional()
  @Type(() => Number)
  iterations?: number;

  @IsNumber()
  @Min(-0.5)
  @Max(0.5)
  @Type(() => Number)
  expectedReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1.0)
  @Type(() => Number)
  returnVolatility: number;

  @IsNumber()
  @Min(0)
  @Max(0.2)
  @IsOptional()
  @Type(() => Number)
  inflationRate?: number;
}
