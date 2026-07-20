// SPDX-License-Identifier: AGPL-3.0-or-later
import { Space, SpaceMember, SpaceRole, Currency } from '@dhanam-core/shared';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { Currency as PrismaCurrency } from '@db';

import { CreateSpaceDto } from './dto/create-space.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  private accessCache = new Map<string, { role: string; expiresAt: number }>();
  private readonly ACCESS_CACHE_TTL = 30_000; // 30 seconds
  private readonly ACCESS_CACHE_MAX = 1000;

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  async listUserSpaces(userId: string): Promise<Space[]> {
    const userSpaces = await this.prisma.userSpace.findMany({
      where: { userId },
      include: { space: true },
    });

    return userSpaces.map((us) => ({
      ...us.space,
      currency: us.space.currency as unknown as Currency,
      role: us.role,
      createdAt: us.space.createdAt.toISOString(),
      updatedAt: us.space.updatedAt.toISOString(),
    }));
  }

  async createSpace(userId: string, dto: CreateSpaceDto): Promise<Space> {
    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        type: dto.type,
        currency: (dto.currency as unknown as PrismaCurrency) || 'MXN',
        userSpaces: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    this.logger.log(`Space created: ${space.id} by user: ${userId}`, 'SpacesService');

    return {
      ...space,
      currency: space.currency as unknown as Currency,
      createdAt: space.createdAt.toISOString(),
      updatedAt: space.updatedAt.toISOString(),
      role: 'owner' as SpaceRole,
    };
  }

  async getSpace(spaceId: string): Promise<Space> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return {
      ...space,
      currency: space.currency as unknown as Currency,
      createdAt: space.createdAt.toISOString(),
      updatedAt: space.updatedAt.toISOString(),
    };
  }

  async updateSpace(spaceId: string, dto: UpdateSpaceDto): Promise<Space> {
    const space = await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        name: dto.name,
        currency: dto.currency as unknown as PrismaCurrency,
      },
    });

    this.logger.log(`Space updated: ${spaceId}`, 'SpacesService');

    return {
      ...space,
      currency: space.currency as unknown as Currency,
      createdAt: space.createdAt.toISOString(),
      updatedAt: space.updatedAt.toISOString(),
    };
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.prisma.space.delete({
      where: { id: spaceId },
    });

    this.logger.log(`Space deleted: ${spaceId}`, 'SpacesService');
  }

  async listMembers(spaceId: string): Promise<SpaceMember[]> {
    const members = await this.prisma.userSpace.findMany({
      where: { spaceId },
      include: { user: true },
    });

    return members.map((member) => ({
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
    }));
  }

  async inviteMember(spaceId: string, dto: InviteMemberDto): Promise<SpaceMember> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: {
          userId: user.id,
          spaceId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const userSpace = await this.prisma.userSpace.create({
      data: {
        userId: user.id,
        spaceId,
        role: dto.role,
      },
      include: { user: true },
    });

    this.logger.log(
      `Member invited: ${user.id} to space: ${spaceId} with role: ${dto.role}`,
      'SpacesService'
    );

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: userSpace.role,
      joinedAt: userSpace.createdAt.toISOString(),
    };
  }

  async updateMemberRole(
    spaceId: string,
    userId: string,
    dto: UpdateMemberRoleDto
  ): Promise<SpaceMember> {
    const member = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner' && dto.role !== 'owner') {
      const ownerCount = await this.prisma.userSpace.count({
        where: { spaceId, role: 'owner' },
      });

      if (ownerCount === 1) {
        throw new BadRequestException('Space must have at least one owner');
      }
    }

    const updated = await this.prisma.userSpace.update({
      where: {
        userId_spaceId: { userId, spaceId },
      },
      data: { role: dto.role },
      include: { user: true },
    });

    this.logger.log(
      `Member role updated: ${userId} in space: ${spaceId} to role: ${dto.role}`,
      'SpacesService'
    );

    return {
      userId: updated.user.id,
      email: updated.user.email,
      name: updated.user.name,
      role: updated.role,
      joinedAt: updated.createdAt.toISOString(),
    };
  }

  async removeMember(spaceId: string, userId: string, currentUserId: string): Promise<void> {
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    const member = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      const ownerCount = await this.prisma.userSpace.count({
        where: { spaceId, role: 'owner' },
      });

      if (ownerCount === 1) {
        throw new BadRequestException('Cannot remove the only owner');
      }
    }

    await this.prisma.userSpace.delete({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    this.logger.log(`Member removed: ${userId} from space: ${spaceId}`, 'SpacesService');
  }

  async getUserRoleInSpace(userId: string, spaceId: string): Promise<SpaceRole | null> {
    const userSpace = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    return userSpace?.role || null;
  }

  async verifyUserAccess(userId: string, spaceId: string, requiredRole: SpaceRole): Promise<void> {
    const roleHierarchy: Record<SpaceRole, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1,
    };

    const cacheKey = `${userId}:${spaceId}`;
    const cached = this.accessCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      const userRoleLevel = roleHierarchy[cached.role as SpaceRole];
      const requiredRoleLevel = roleHierarchy[requiredRole];
      if (userRoleLevel < requiredRoleLevel) {
        throw new ForbiddenException(
          `Access denied. Required role: ${requiredRole}, user role: ${cached.role}`
        );
      }
      return;
    }

    const userSpace = await this.prisma.userSpace.findUnique({
      where: {
        userId_spaceId: { userId, spaceId },
      },
    });

    if (!userSpace) {
      throw new NotFoundException('Space not found or access denied');
    }

    // Cache the result with TTL, evict oldest if at capacity
    if (this.accessCache.size >= this.ACCESS_CACHE_MAX) {
      const firstKey = this.accessCache.keys().next().value;
      if (firstKey) this.accessCache.delete(firstKey);
    }
    this.accessCache.set(cacheKey, {
      role: userSpace.role,
      expiresAt: Date.now() + this.ACCESS_CACHE_TTL,
    });

    const userRoleLevel = roleHierarchy[userSpace.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRole}, user role: ${userSpace.role}`
      );
    }
  }
}