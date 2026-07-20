// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateManualAssetDto {
  @ApiProperty({ description: 'Asset name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Asset type',
    enum: [
      'real_estate',
      'vehicle',
      'domain',
      'private_equity',
      'angel_investment',
      'collectible',
      'art',
      'jewelry',
      'other',
    ],
  })
  @IsEnum([
    'real_estate',
    'vehicle',
    'domain',
    'private_equity',
    'angel_investment',
    'collectible',
    'art',
    'jewelry',
    'other',
  ])
  type: string;

  @ApiProperty({ description: 'Asset description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Current market value' })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ description: 'Currency', enum: ['MXN', 'USD', 'EUR'] })
  @IsEnum(['MXN', 'USD', 'EUR'])
  currency: string;

  @ApiProperty({ description: 'Date of acquisition', required: false })
  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @ApiProperty({ description: 'Original purchase price', required: false })
  @IsNumber()
  @IsOptional()
  acquisitionCost?: number;

  @ApiProperty({
    description: 'Asset-specific metadata (JSON object)',
    required: false,
    example: {
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      sqft: 2500,
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}