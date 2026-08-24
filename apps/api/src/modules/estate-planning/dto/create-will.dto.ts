// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateWillDto {
  @IsUUID()
  @IsNotEmpty()
  householdId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  legalDisclaimer?: boolean;
}
