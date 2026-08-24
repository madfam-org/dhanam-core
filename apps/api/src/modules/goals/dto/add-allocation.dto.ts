// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import { IsUUID, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class AddAllocationDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
