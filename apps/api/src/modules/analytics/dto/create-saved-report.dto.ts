// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';

import { ReportFormat } from '@db';

export class CreateSavedReportDto {
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsOptional()
  filters?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
