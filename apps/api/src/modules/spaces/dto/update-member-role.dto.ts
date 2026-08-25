// SPDX-License-Identifier: AGPL-3.0-or-later
import { SpaceRole } from '@dhanam-core/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['owner', 'admin', 'member', 'viewer'] })
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role: SpaceRole;
}
