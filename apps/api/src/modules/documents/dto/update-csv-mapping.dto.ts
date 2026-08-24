// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCsvMappingDto {
  @ApiProperty({
    description: 'Column mapping object: { csvColumn: dhanamField }',
    example: { Date: 'date', Amount: 'amount', Description: 'description' },
  })
  @IsObject()
  @IsNotEmpty()
  mapping: Record<string, string>;

  @ApiPropertyOptional({ description: 'Date format string (e.g. MM/DD/YYYY)' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ description: 'Delimiter override (auto-detected if omitted)' })
  @IsOptional()
  @IsString()
  delimiter?: string;
}
