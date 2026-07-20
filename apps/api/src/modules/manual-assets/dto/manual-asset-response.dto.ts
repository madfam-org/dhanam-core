// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';

export class ManualAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  spaceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
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
  type: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  currentValue: number;

  @ApiProperty({ enum: ['MXN', 'USD', 'EUR'] })
  currency: string;

  @ApiProperty({ required: false, nullable: true })
  acquisitionDate: string | null;

  @ApiProperty({ required: false, nullable: true })
  acquisitionCost: number | null;

  @ApiProperty({ required: false, nullable: true })
  metadata: any;

  @ApiProperty({ required: false, nullable: true })
  documents: any;

  @ApiProperty({ required: false, nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: 'array', required: false })
  valuationHistory?: ManualAssetValuationDto[];
}

export class ManualAssetValuationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  assetId: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ required: false, nullable: true })
  source: string | null;

  @ApiProperty({ required: false, nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: string;
}

export class ManualAssetSummaryDto {
  @ApiProperty()
  totalAssets: number;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  byType: Record<string, { count: number; value: number }>;

  @ApiProperty()
  unrealizedGain: number;
}