// SPDX-License-Identifier: AGPL-3.0-or-later
import { BudgetPeriod } from '@dhanam-core/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsDate, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period: BudgetPeriod;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Enable automatic rollover of unspent funds',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rolloverEnabled?: boolean;
}