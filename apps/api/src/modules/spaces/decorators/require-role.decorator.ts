// SPDX-License-Identifier: AGPL-3.0-or-later
import { SpaceRole } from '@dhanam-core/shared';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: SpaceRole[]) => SetMetadata(ROLES_KEY, roles);