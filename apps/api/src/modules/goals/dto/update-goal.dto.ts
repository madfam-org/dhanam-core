// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';

import { GoalType, GoalStatus, Currency } from '@db';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalType)
  @IsOptional()
  type?: GoalType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  targetAmount?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  @Type(() => Number)
  priority?: number;

  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}