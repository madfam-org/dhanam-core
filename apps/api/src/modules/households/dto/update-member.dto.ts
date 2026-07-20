// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsEnum, IsBoolean, IsOptional, IsDateString, IsString } from 'class-validator';

import { RelationshipType } from '@db';

export class UpdateMemberDto {
  @IsEnum(RelationshipType)
  @IsOptional()
  relationship?: RelationshipType;

  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;

  @IsDateString()
  @IsOptional()
  accessStartDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}