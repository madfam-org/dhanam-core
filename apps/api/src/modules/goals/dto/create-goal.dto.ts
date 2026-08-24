// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

import { GoalType, Currency } from '@db';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalType)
  @IsNotEmpty()
  type: GoalType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  targetAmount: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsDateString()
  @IsNotEmpty()
  targetDate: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  @Type(() => Number)
  priority?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
