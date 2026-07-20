// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * Payload for connecting an externally-aggregated account.
 *
 * dhanam-core does not bundle any account-aggregation connectors, so this
 * endpoint is a compatibility stub. The shape is preserved for self-hosters who
 * wire their own provider(s).
 */
export class ConnectAccountDto {
  @ApiProperty({ description: 'Identifier of the aggregation provider' })
  @IsString()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;
}
