// SPDX-License-Identifier: AGPL-3.0-or-later
import { ANALYTICS } from '@dhanam-core/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateShareTokenDto {
  @IsInt()
  @Min(1)
  @Max(ANALYTICS.SHARE_TOKEN_MAX_HOURS) // 30 days max
  @IsOptional()
  @Type(() => Number)
  expiresInHours?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxAccess?: number;

  @IsString()
  @IsOptional()
  generatedReportId?: string;
}
