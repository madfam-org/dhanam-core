// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';
import { GoalShareRole, GoalShareStatus, GoalActivityAction } from '@db';

export interface ShareGoalInput {
  goalId: string;
  shareWithEmail: string;
  role: GoalShareRole;
  message?: string;
}

export interface UpdateShareRoleInput {
  shareId: string;
  newRole: GoalShareRole;
}

export interface GoalShareWithUser {
  id: string;
  goalId: string;
  role: GoalShareRole;
  status: GoalShareStatus;
  message?: string | null;
  acceptedAt?: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GoalActivityWithUser {
  id: string;
  action: GoalActivityAction;
  metadata?: any;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class GoalCollaborationService {
  private readonly logger = new Logger(GoalCollaborationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Share a goal with another user
   */
  async shareGoal(userId: string, input: ShareGoalInput): Promise<GoalShareWithUser> {
    this.logger.log(`User ${userId} sharing goal ${input.goalId} with ${input.shareWithEmail}`);

    // Verify user has permission to share this goal
    const _goal = await this.verifyGoalAccess(userId, input.goalId, [
      GoalShareRole.manager,
      GoalShareRole.editor,
    ]);

    // Find user to share with
    const shareWithUser = await this.prisma.user.findUnique({
      where: { email: input.shareWithEmail },
      select: { id: true, name: true, email: true },
    });

    if (!shareWithUser) {
      throw new NotFoundException(`User with email ${input.shareWithEmail} not found`);
    }

    // Check if already shared
    const existingShare = await this.prisma.goalShare.findUnique({
      where: {
        goalId_sharedWith: {
          goalId: input.goalId,
          sharedWith: shareWithUser.id,
        },
      },
    });

    if (existingShare) {
      throw new BadRequestException('Goal already shared with this user');
    }

    // Create share
    const share = await this.prisma.goalShare.create({
      data: {
        goalId: input.goalId,
        sharedWith: shareWithUser.id,
        role: input.role,
        invitedBy: userId,
        message: input.message,
        status: GoalShareStatus.pending,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Mark goal as shared
    await this.prisma.goal.update({
      where: { id: input.goalId },
      data: {
        isShared: true,
        sharedWithMessage: input.message,
      },
    });

    // Create activity
    await this.createActivity(input.goalId, userId, GoalActivityAction.shared, {
      sharedWith: shareWithUser.email,
      role: input.role,
    });

    this.logger.log(`Goal ${input.goalId} shared successfully with ${input.shareWithEmail}`);
    return share;
  }

  /**
   * Accept a goal share invitation
   */
  async acceptShare(userId: string, shareId: string): Promise<GoalShareWithUser> {
    const share = await this.prisma.goalShare.findUnique({
      where: { id: shareId },
      include: {
        goal: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Share invitation not found');
    }

    if (share.sharedWith !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (share.status !== GoalShareStatus.pending) {
      throw new BadRequestException(`Cannot accept invitation with status: ${share.status}`);
    }

    const updatedShare = await this.prisma.goalShare.update({
      where: { id: shareId },
      data: {
        status: GoalShareStatus.accepted,
        acceptedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity
    await this.createActivity(share.goalId, userId, GoalActivityAction.share_accepted, { shareId });

    this.logger.log(`User ${userId} accepted share ${shareId} for goal ${share.goalId}`);
    return updatedShare;
  }

  /**
   * Decline a goal share invitation
   */
  async declineShare(userId: string, shareId: string): Promise<void> {
    const share = await this.prisma.goalShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share invitation not found');
    }

    if (share.sharedWith !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (share.status !== GoalShareStatus.pending) {
      throw new BadRequestException(`Cannot decline invitation with status: ${share.status}`);
    }

    await this.prisma.goalShare.update({
      where: { id: shareId },
      data: {
        status: GoalShareStatus.declined,
      },
    });

    // Create activity
    await this.createActivity(share.goalId, userId, GoalActivityAction.share_declined, { shareId });

    this.logger.log(`User ${userId} declined share ${shareId} for goal ${share.goalId}`);
  }

  /**
   * Revoke a goal share
   */
  async revokeShare(userId: string, shareId: string): Promise<void> {
    const share = await this.prisma.goalShare.findUnique({
      where: { id: shareId },
      include: { goal: true },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Verify user has permission to revoke
    await this.verifyGoalAccess(userId, share.goalId, [GoalShareRole.manager]);

    await this.prisma.goalShare.update({
      where: { id: shareId },
      data: {
        status: GoalShareStatus.revoked,
      },
    });

    this.logger.log(`User ${userId} revoked share ${shareId} for goal ${share.goalId}`);
  }

  /**
   * Update share role
   */
  async updateShareRole(userId: string, input: UpdateShareRoleInput): Promise<GoalShareWithUser> {
    const share = await this.prisma.goalShare.findUnique({
      where: { id: input.shareId },
      include: { goal: true },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Verify user has permission to update roles
    await this.verifyGoalAccess(userId, share.goalId, [GoalShareRole.manager]);

    const updatedShare = await this.prisma.goalShare.update({
      where: { id: input.shareId },
      data: {
        role: input.newRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(`Updated share ${input.shareId} role to ${input.newRole}`);
    return updatedShare;
  }

  /**
   * Get all shares for a goal
   */
  async getGoalShares(userId: string, goalId: string): Promise<GoalShareWithUser[]> {
    // Verify access
    await this.verifyGoalAccess(userId, goalId, [
      GoalShareRole.viewer,
      GoalShareRole.contributor,
      GoalShareRole.editor,
      GoalShareRole.manager,
    ]);

    const shares = await this.prisma.goalShare.findMany({
      where: { goalId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  }

  /**
   * Get all goals shared with a user
   */
  async getSharedGoals(userId: string) {
    const shares = await this.prisma.goalShare.findMany({
      where: {
        sharedWith: userId,
        status: GoalShareStatus.accepted,
      },
      include: {
        goal: {
          include: {
            space: true,
            allocations: {
              include: {
                account: true,
              },
            },
          },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return shares.map((share) => ({
      ...share.goal,
      shareRole: share.role,
      sharedBy: share.inviter,
    }));
  }

  /**
   * Get activity feed for a goal
   */
  async getGoalActivities(
    userId: string,
    goalId: string,
    limit = 50
  ): Promise<GoalActivityWithUser[]> {
    // Verify access
    await this.verifyGoalAccess(userId, goalId, [
      GoalShareRole.viewer,
      GoalShareRole.contributor,
      GoalShareRole.editor,
      GoalShareRole.manager,
    ]);

    const activities = await this.prisma.goalActivity.findMany({
      where: { goalId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities;
  }

  /**
   * Create an activity record
   */
  async createActivity(
    goalId: string,
    userId: string,
    action: GoalActivityAction,
    metadata?: any
  ): Promise<void> {
    await this.prisma.goalActivity.create({
      data: {
        goalId,
        userId,
        action,
        metadata,
      },
    });
  }

  /**
   * Verify user has access to a goal with specific roles
   */
  private async verifyGoalAccess(userId: string, goalId: string, requiredRoles: GoalShareRole[]) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        space: {
          userSpaces: {
            some: { userId },
          },
        },
      },
      include: {
        shares: {
          where: {
            sharedWith: userId,
            status: GoalShareStatus.accepted,
          },
        },
      },
    });

    if (!goal) {
      // Check if user has access via share
      const share = await this.prisma.goalShare.findFirst({
        where: {
          goalId,
          sharedWith: userId,
          status: GoalShareStatus.accepted,
        },
        include: { goal: true },
      });

      if (!share) {
        throw new NotFoundException('Goal not found');
      }

      if (!requiredRoles.includes(share.role)) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredRoles.join(', ')}, You have: ${share.role}`
        );
      }

      return share.goal;
    }

    return goal;
  }

  /**
   * Check if user can perform action on goal
   */
  async canUserAccessGoal(
    userId: string,
    goalId: string
  ): Promise<{
    canAccess: boolean;
    role?: GoalShareRole;
    isOwner: boolean;
  }> {
    // Check ownership via space
    const ownedGoal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        space: {
          userSpaces: {
            some: { userId },
          },
        },
      },
    });

    if (ownedGoal) {
      return { canAccess: true, role: GoalShareRole.manager, isOwner: true };
    }

    // Check via share
    const share = await this.prisma.goalShare.findFirst({
      where: {
        goalId,
        sharedWith: userId,
        status: GoalShareStatus.accepted,
      },
    });

    if (share) {
      return { canAccess: true, role: share.role, isOwner: false };
    }

    return { canAccess: false, isOwner: false };
  }
}