// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';

export class UpdateManualAssetDto {
  @ApiProperty({ description: 'Asset name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Asset description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Current market value', required: false })
  @IsNumber()
  @IsOptional()
  currentValue?: number;

  @ApiProperty({ description: 'Currency', enum: ['MXN', 'USD', 'EUR'], required: false })
  @IsEnum(['MXN', 'USD', 'EUR'])
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Date of acquisition', required: false })
  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @ApiProperty({ description: 'Original purchase price', required: false })
  @IsNumber()
  @IsOptional()
  acquisitionCost?: number;

  @ApiProperty({ description: 'Asset-specific metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddValuationDto {
  @ApiProperty({ description: 'Valuation date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Asset value on this date' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Currency', enum: ['MXN', 'USD', 'EUR'] })
  @IsEnum(['MXN', 'USD', 'EUR'])
  currency: string;

  @ApiProperty({ description: 'Valuation source', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
