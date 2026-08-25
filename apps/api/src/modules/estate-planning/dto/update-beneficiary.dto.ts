// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

import { AssetType } from '@db';

export class UpdateBeneficiaryDto {
  @IsEnum(AssetType)
  @IsOptional()
  assetType?: AssetType;

  @IsUUID()
  @IsOptional()
  assetId?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  percentage?: number;

  @IsOptional()
  conditions?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}
