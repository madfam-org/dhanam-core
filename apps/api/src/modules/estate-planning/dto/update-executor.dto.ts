// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateExecutorDto {
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
