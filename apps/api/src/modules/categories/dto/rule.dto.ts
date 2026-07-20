// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsIn,
  IsDefined,
} from 'class-validator';

export class RuleConditionDto {
  @ApiProperty({ enum: ['description', 'merchant', 'amount', 'account'] })
  @IsString()
  @IsIn(['description', 'merchant', 'amount', 'account'])
  field: 'description' | 'merchant' | 'amount' | 'account';

  @ApiProperty({
    enum: ['contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'between'],
  })
  @IsString()
  @IsIn(['contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'between'])
  operator:
    | 'contains'
    | 'equals'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'between';

  @ApiProperty()
  @IsDefined()
  value: string | number;

  @ApiProperty({ required: false })
  @IsOptional()
  valueEnd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  caseInsensitive?: boolean;
}

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [RuleConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions: RuleConditionDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class UpdateRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: [RuleConditionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}