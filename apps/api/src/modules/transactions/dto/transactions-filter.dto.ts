// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsUUID,
  IsDate,
  IsNumber,
  IsIn,
  Min,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class TransactionsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: "Filter by budget (transactions in this budget's categories)",
  })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag IDs (transactions with ANY of these tags)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by review status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  reviewed?: boolean;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ enum: ['amount', 'date', 'createdAt'], default: 'date' })
  @IsOptional()
  @IsIn(['amount', 'date', 'createdAt'])
  sortBy?: 'amount' | 'date' | 'createdAt' = 'date';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  merchant?: string;

  @ApiPropertyOptional({ description: 'Filter by exclude from totals flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  excludeFromTotals?: boolean;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Transform(({ value }) => Math.min(value, 100))
  limit?: number = 20;
}