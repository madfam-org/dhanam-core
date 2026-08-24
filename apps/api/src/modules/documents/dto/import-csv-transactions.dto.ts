// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ImportCsvTransactionsDto {
  @ApiPropertyOptional({
    description: 'Account to import transactions into (overrides the document accountId)',
  })
  @IsOptional()
  @IsString()
  accountId?: string;
}
