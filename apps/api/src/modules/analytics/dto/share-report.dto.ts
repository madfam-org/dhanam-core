// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ShareReportDto {
  @IsEmail()
  @IsNotEmpty()
  shareWithEmail: string;

  @IsEnum(['viewer', 'editor', 'manager'])
  @IsNotEmpty()
  role: 'viewer' | 'editor' | 'manager';

  @IsString()
  @IsOptional()
  message?: string;
}

export class UpdateShareRoleDto {
  @IsEnum(['viewer', 'editor', 'manager'])
  @IsNotEmpty()
  role: 'viewer' | 'editor' | 'manager';
}