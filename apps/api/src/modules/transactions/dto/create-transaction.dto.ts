// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tag IDs to associate with this transaction' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Mark transaction as reviewed', default: false })
  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Exclude from totals (e.g. transfers)' })
  @IsOptional()
  @IsBoolean()
  excludeFromTotals?: boolean;
}