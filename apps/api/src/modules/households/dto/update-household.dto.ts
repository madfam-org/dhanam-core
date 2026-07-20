// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsString, IsEnum, IsOptional } from 'class-validator';

import { HouseholdType, Currency } from '@db';

export class UpdateHouseholdDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(HouseholdType)
  @IsOptional()
  type?: HouseholdType;

  @IsEnum(Currency)
  @IsOptional()
  baseCurrency?: Currency;

  @IsString()
  @IsOptional()
  description?: string;
}