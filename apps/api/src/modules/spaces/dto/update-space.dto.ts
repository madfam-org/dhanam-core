// SPDX-License-Identifier: AGPL-3.0-or-later
import { Currency } from '@dhanam-core/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['MXN', 'USD', 'EUR'] })
  @IsOptional()
  @IsIn(['MXN', 'USD', 'EUR'])
  currency?: Currency;
}
