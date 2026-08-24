// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class SimulateRetirementDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialBalance: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monthlyContribution: number;

  @IsNumber()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  currentAge: number;

  @IsNumber()
  @Min(50)
  @Max(100)
  @Type(() => Number)
  retirementAge: number;

  @IsNumber()
  @Min(60)
  @Max(120)
  @Type(() => Number)
  lifeExpectancy: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  monthlyExpenses?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  socialSecurityIncome?: number;

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

  @IsBoolean()
  @IsOptional()
  inflationAdjusted?: boolean;
}
