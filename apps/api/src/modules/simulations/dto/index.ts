// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsNumber, IsOptional, IsString, IsEnum, Min, Max, IsInt } from 'class-validator';

import { SimulationType } from '@db';

export class RunSimulationDto {
  @IsEnum(SimulationType)
  type: SimulationType;

  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsString()
  goalId?: string;

  @IsNumber()
  @Min(0)
  initialBalance: number;

  @IsNumber()
  monthlyContribution: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  years: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(100000)
  iterations?: number;

  @IsNumber()
  @Min(-1)
  @Max(1)
  expectedReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  returnVolatility: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.2)
  inflationRate?: number;

  @IsOptional()
  inflationAdjustedContributions?: boolean;
}

export class RunRetirementSimulationDto {
  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsOptional()
  @IsString()
  goalId?: string;

  @IsInt()
  @Min(18)
  @Max(100)
  currentAge: number;

  @IsInt()
  @Min(50)
  @Max(80)
  retirementAge: number;

  @IsInt()
  @Min(60)
  @Max(120)
  lifeExpectancy: number;

  @IsNumber()
  @Min(0)
  currentSavings: number;

  @IsNumber()
  monthlyContribution: number;

  @IsNumber()
  @Min(0)
  monthlyWithdrawal: number;

  @IsNumber()
  @Min(-0.5)
  @Max(0.5)
  preRetirementReturn: number;

  @IsNumber()
  @Min(-0.5)
  @Max(0.5)
  postRetirementReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  returnVolatility: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(50000)
  iterations?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.2)
  inflationRate?: number;
}

export class CalculateSafeWithdrawalRateDto {
  @IsOptional()
  @IsString()
  spaceId?: string;

  @IsNumber()
  @Min(0)
  portfolioValue: number;

  @IsInt()
  @Min(1)
  @Max(50)
  yearsInRetirement: number;

  @IsNumber()
  @Min(0.5)
  @Max(0.99)
  successProbability: number;

  @IsNumber()
  @Min(-0.5)
  @Max(0.5)
  expectedReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  returnVolatility: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.2)
  inflationRate?: number;
}

export * from './analyze-scenario.dto';