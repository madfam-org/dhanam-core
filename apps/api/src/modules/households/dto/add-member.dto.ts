// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  IsUUID,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';

import { RelationshipType } from '@db';

export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(RelationshipType)
  @IsNotEmpty()
  relationship: RelationshipType;

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
