// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

/** Generic pagination query parameters shared across list endpoints. */
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

/** Generic paginated response envelope. */
export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
