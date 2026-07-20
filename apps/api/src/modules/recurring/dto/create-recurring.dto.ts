// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

import { Currency, RecurrenceFrequency } from '@db';

export class CreateRecurringDto {
  @ApiProperty({ description: 'Merchant name for the recurring transaction' })
  @IsString()
  merchantName: string;

  @ApiPropertyOptional({ description: 'Regex pattern for matching merchant names' })
  @IsOptional()
  @IsString()
  merchantPattern?: string;

  @ApiProperty({ description: 'Expected amount for each occurrence' })
  @IsNumber()
  @Type(() => Number)
  expectedAmount: number;

  @ApiPropertyOptional({ description: 'Allowed variance in amount (0.0 to 1.0)', default: 0.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  amountVariance?: number;

  @ApiProperty({ enum: Currency, description: 'Currency for the transaction' })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ enum: RecurrenceFrequency, description: 'How often the transaction recurs' })
  @IsEnum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  frequency: RecurrenceFrequency;

  @ApiPropertyOptional({ description: 'Category ID to assign to matched transactions' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Days before expected date to send alert', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  @Type(() => Number)
  alertBeforeDays?: number;

  @ApiPropertyOptional({ description: 'Whether to send alerts', default: true })
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}