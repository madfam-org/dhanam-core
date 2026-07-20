// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { DocumentCategory, DocumentStatus } from '@db';

import { PaginationDto } from '../../../common/pagination.dto';

export class ListDocumentsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by document category', enum: DocumentCategory })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @ApiPropertyOptional({ description: 'Filter by document status', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Filter by content type (e.g. text/csv)' })
  @IsOptional()
  @IsString()
  contentType?: string;
}