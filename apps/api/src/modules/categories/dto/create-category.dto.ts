// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsUUID()
  budgetId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  budgetedAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Mark as income category' })
  @IsOptional()
  @IsBoolean()
  isIncome?: boolean;

  @ApiPropertyOptional({ description: 'Exclude from budget calculations' })
  @IsOptional()
  @IsBoolean()
  excludeFromBudget?: boolean;

  @ApiPropertyOptional({ description: 'Exclude from totals (e.g. transfers)' })
  @IsOptional()
  @IsBoolean()
  excludeFromTotals?: boolean;

  @ApiPropertyOptional({ description: 'Category group name for hierarchy' })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ description: 'Sort order within group' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}