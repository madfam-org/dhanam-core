// SPDX-License-Identifier: AGPL-3.0-or-later
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class TransactionSplitItemDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SplitTransactionDto {
  @ValidateNested({ each: true })
  @Type(() => TransactionSplitItemDto)
  @ArrayMinSize(2, { message: 'At least 2 splits required' })
  splits: TransactionSplitItemDto[];
}

export class UpdateSplitDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
