// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

import { RecurrenceFrequency } from '@db';

export class UpdateRecurringDto {
  @ApiPropertyOptional({ description: 'Merchant name for the recurring transaction' })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiPropertyOptional({ description: 'Regex pattern for matching merchant names' })
  @IsOptional()
  @IsString()
  merchantPattern?: string;

  @ApiPropertyOptional({ description: 'Expected amount for each occurrence' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expectedAmount?: number;

  @ApiPropertyOptional({ description: 'Allowed variance in amount (0.0 to 1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  amountVariance?: number;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Category ID to assign to matched transactions' })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ description: 'Days before expected date to send alert' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @Type(() => Number)
  alertBeforeDays?: number;

  @ApiPropertyOptional({ description: 'Whether to send alerts' })
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmRecurringDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Category ID to assign to matched transactions' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Whether to send alerts' })
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;
}
