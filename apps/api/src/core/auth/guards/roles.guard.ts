// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '@core/prisma/prisma.service';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Global admin check
    if (requiredRoles.includes('ADMIN') && user.isAdmin === true) {
      return true;
    }

    // Space-scoped RBAC: check user's role in the target space
    const spaceId = request.params?.spaceId || request.body?.spaceId || request.query?.spaceId;

    if (!spaceId) {
      // No space context - fall back to global admin check
      return user.isAdmin === true;
    }

    const userSpace = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: {
          userId: user.userId || user.sub,
          spaceId,
        },
      },
    });

    if (!userSpace) return false;

    // Map SpaceRole to required roles
    const roleHierarchy: Record<string, number> = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3,
    };

    const userRoleLevel = roleHierarchy[userSpace.role] ?? -1;
    const requiredLevel = Math.min(
      ...requiredRoles.filter((r) => r !== 'ADMIN').map((r) => roleHierarchy[r.toLowerCase()] ?? 99)
    );

    return userRoleLevel >= requiredLevel;
  }
}
