// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

import { AssetType } from '@db';

export class AddBeneficiaryDto {
  @IsUUID()
  @IsNotEmpty()
  beneficiaryId: string; // HouseholdMember ID

  @IsEnum(AssetType)
  @IsNotEmpty()
  assetType: AssetType;

  @IsUUID()
  @IsOptional()
  assetId?: string; // Optional: specific account ID

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage: number;

  @IsOptional()
  conditions?: any; // JSON conditions (age, events, etc.)

  @IsString()
  @IsOptional()
  notes?: string;
}
