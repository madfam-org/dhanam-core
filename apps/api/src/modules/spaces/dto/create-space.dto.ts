// SPDX-License-Identifier: AGPL-3.0-or-later
import { SpaceType, Currency } from '@dhanam-core/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['personal', 'business'] })
  @IsIn(['personal', 'business'])
  type: SpaceType;

  @ApiPropertyOptional({ enum: ['MXN', 'USD', 'EUR'] })
  @IsOptional()
  @IsIn(['MXN', 'USD', 'EUR'])
  currency?: Currency;
}
