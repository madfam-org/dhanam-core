// SPDX-License-Identifier: AGPL-3.0-or-later
import { SpaceRole } from '@dhanam-core/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['admin', 'member', 'viewer'] })
  @IsIn(['admin', 'member', 'viewer'])
  role: Exclude<SpaceRole, 'owner'>;
}