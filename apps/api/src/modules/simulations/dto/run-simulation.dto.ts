// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RunSimulationDto {
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
  @Max(1200) // Max 100 years
  @Type(() => Number)
  months: number;

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
  volatility: number;

  @IsNumber()
  @Min(0)
  @Max(0.2)
  @IsOptional()
  @Type(() => Number)
  inflationRate?: number;
}
