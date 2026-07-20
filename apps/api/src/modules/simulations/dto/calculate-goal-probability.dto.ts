// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, IsOptional, Min, Max } from 'class-validator';

export class CalculateGoalProbabilityDto {
  @IsUUID()
  goalId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentValue: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  targetAmount: number;

  @IsNumber()
  @Min(1)
  @Max(1200)
  @Type(() => Number)
  monthsRemaining: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyContribution: number;

  @IsNumber()
  @Min(-0.5)
  @Max(0.5)
  @Type(() => Number)
  expectedReturn: number;

  @IsNumber()
  @Min(0)
  @Max(1.0)
  @Type(() => Number)
  volatility: number;

  @IsNumber()
  @Min(100)
  @Max(50000)
  @IsOptional()
  @Type(() => Number)
  iterations?: number;
}