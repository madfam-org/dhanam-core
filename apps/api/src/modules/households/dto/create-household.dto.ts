// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

import { HouseholdType, Currency } from '@db';

export class CreateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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
