// SPDX-License-Identifier: AGPL-3.0-or-later
import { BudgetPeriod } from '@dhanam-core/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsDate, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period?: BudgetPeriod;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Enable automatic rollover of unspent funds' })
  @IsOptional()
  @IsBoolean()
  rolloverEnabled?: boolean;
}