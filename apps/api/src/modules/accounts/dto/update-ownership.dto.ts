// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { AccountOwnership } from '@db';

export class UpdateOwnershipDto {
  @IsEnum(AccountOwnership)
  ownership: AccountOwnership;

  @IsOptional()
  @IsUUID()
  ownerId?: string; // Required for 'individual', null for 'joint' or 'trust'
}