// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { Goal, GoalAllocation, Prisma } from '@db';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

import { CreateGoalDto, UpdateGoalDto, AddAllocationDto } from './dto';
import {
  GoalProgress,
  GoalAllocationProgress,
  GoalSummary,
} from './interfaces/goal-progress.interface';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  /**
   * Create a new goal
   */
  async create(dto: CreateGoalDto, userId: string): Promise<Goal> {
    // Verify user has access to the space
    const userSpace = await this.prisma.userSpace.findFirst({
      where: {
        userId,
        spaceId: dto.spaceId,
      },
    });

    if (!userSpace) {
      throw new NotFoundException('Space not found or you do not have access');
    }

    const goal = await this.prisma.goal.create({
      data: {
        spaceId: dto.spaceId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        targetAmount: dto.targetAmount,
        currency: dto.currency || 'USD',
        targetDate: new Date(dto.targetDate),
        priority: dto.priority || 1,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      userId,
      action: 'GOAL_CREATED',
      resource: 'goal',
      resourceId: goal.id,
      severity: 'low',
      metadata: {
        goalName: goal.name,
        goalType: goal.type,
        targetAmount: goal.targetAmount.toString(),
      },
    });

    this.logger.log(`Goal created: ${goal.id} by user ${userId}`);

    return goal;
  }

  /**
   * Update an existing goal
   */
  async update(goalId: string, dto: UpdateGoalDto, userId: string): Promise<Goal> {
    await this.findByIdWithAccess(goalId, userId);

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.targetDate && { targetDate: new Date(dto.targetDate) }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    await this.audit.log({
      userId,
      action: 'GOAL_UPDATED',
      resource: 'goal',
      resourceId: goalId,
      severity: 'low',
      metadata: { changes: Object.keys(dto) },
    });

    this.logger.log(`Goal updated: ${goalId} by user ${userId}`);

    return updated;
  }

  /**
   * Delete a goal
   */
  async delete(goalId: string, userId: string): Promise<void> {
    const goal = await this.findByIdWithAccess(goalId, userId);

    await this.prisma.goal.delete({
      where: { id: goalId },
    });

    await this.audit.log({
      userId,
      action: 'GOAL_DELETED',
      resource: 'goal',
      resourceId: goalId,
      severity: 'medium',
      metadata: { goalName: goal.name },
    });

    this.logger.log(`Goal deleted: ${goalId} by user ${userId}`);
  }

  /**
   * Get a single goal by ID
   */
  async findById(
    goalId: string,
    userId: string
  ): Promise<
    Prisma.GoalGetPayload<{
      include: {
        allocations: {
          include: {
            account: {
              select: {
                id: true;
                name: true;
                balance: true;
                currency: true;
                type: true;
              };
            };
          };
        };
      };
    }>
  > {
    await this.findByIdWithAccess(goalId, userId);

    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        allocations: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                balance: true,
                currency: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  /**
   * Get all goals for a space
   */
  async findBySpace(spaceId: string, userId: string, options?: { skip?: number; take?: number }) {
    // Verify user has access to the space
    const userSpace = await this.prisma.userSpace.findFirst({
      where: {
        userId,
        spaceId,
      },
    });

    if (!userSpace) {
      throw new NotFoundException('Space not found or you do not have access');
    }

    const take = options?.take ?? 50;
    const skip = options?.skip ?? 0;

    return this.prisma.goal.findMany({
      where: { spaceId },
      include: {
        allocations: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                balance: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
      skip,
      take,
    });
  }

  /**
   * Add an allocation to a goal
   */
  async addAllocation(
    goalId: string,
    dto: AddAllocationDto,
    userId: string
  ): Promise<GoalAllocation> {
    const goal = await this.findByIdWithAccess(goalId, userId);

    // Verify account exists and belongs to the same space
    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
        spaceId: goal.spaceId,
      },
    });

    if (!account) {
      throw new BadRequestException('Account not found or does not belong to this space');
    }

    // Check if allocation already exists
    const existing = await this.prisma.goalAllocation.findUnique({
      where: {
        goalId_accountId: {
          goalId,
          accountId: dto.accountId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Allocation already exists for this account');
    }

    // Validate total percentage doesn't exceed 100%
    const currentAllocations = await this.prisma.goalAllocation.findMany({
      where: { goalId },
    });

    const totalPercentage = currentAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.percentage),
      0
    );

    if (totalPercentage + dto.percentage > 100) {
      throw new BadRequestException(
        `Total allocation percentage would exceed 100% (current: ${totalPercentage}%)`
      );
    }

    const allocation = await this.prisma.goalAllocation.create({
      data: {
        goalId,
        accountId: dto.accountId,
        percentage: dto.percentage,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      userId,
      action: 'GOAL_ALLOCATION_ADDED',
      resource: 'goal_allocation',
      resourceId: allocation.id,
      severity: 'low',
      metadata: {
        goalId,
        accountId: dto.accountId,
        percentage: dto.percentage,
      },
    });

    return allocation;
  }

  /**
   * Remove an allocation from a goal
   */
  async removeAllocation(goalId: string, accountId: string, userId: string): Promise<void> {
    await this.findByIdWithAccess(goalId, userId);

    const allocation = await this.prisma.goalAllocation.findUnique({
      where: {
        goalId_accountId: {
          goalId,
          accountId,
        },
      },
    });

    if (!allocation) {
      throw new NotFoundException('Allocation not found');
    }

    await this.prisma.goalAllocation.delete({
      where: {
        goalId_accountId: {
          goalId,
          accountId,
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'GOAL_ALLOCATION_REMOVED',
      resource: 'goal_allocation',
      resourceId: allocation.id,
      severity: 'low',
      metadata: { goalId, accountId },
    });
  }

  /**
   * Calculate progress for a goal
   */
  async calculateProgress(goalId: string, userId: string): Promise<GoalProgress> {
    const goal = await this.findById(goalId, userId);

    // Calculate current value from allocated accounts
    let currentValue = 0;
    const allocationProgress: GoalAllocationProgress[] = [];

    for (const allocation of goal.allocations as any[]) {
      const contributedValue =
        Number(allocation.account.balance) * (Number(allocation.percentage) / 100);
      currentValue += contributedValue;

      allocationProgress.push({
        accountId: allocation.account.id,
        accountName: allocation.account.name,
        percentage: Number(allocation.percentage),
        contributedValue,
      });
    }

    // Calculate time progress
    const now = new Date();
    const startDate = new Date(goal.createdAt);
    const targetDate = new Date(goal.targetDate);
    const totalTime = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const timeProgress = Math.min(Math.max((elapsed / totalTime) * 100, 0), 100);

    // Calculate value progress
    const targetAmount = Number(goal.targetAmount);
    const percentComplete = (currentValue / targetAmount) * 100;

    // Determine if on track (current value >= expected value for time elapsed)
    const expectedValue = targetAmount * (timeProgress / 100);
    const onTrack = currentValue >= expectedValue * 0.9; // Within 10% tolerance

    // Calculate monthly contribution needed
    const monthsRemaining = Math.max(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
      0
    );
    const remainingAmount = Math.max(targetAmount - currentValue, 0);
    const monthlyContributionNeeded = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;

    // Project completion date (simple linear projection)
    let projectedCompletion: Date | null = null;
    if (currentValue > 0 && currentValue < targetAmount) {
      const monthlyRate =
        currentValue /
        Math.max((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30), 1);
      if (monthlyRate > 0) {
        const monthsToCompletion = remainingAmount / monthlyRate;
        projectedCompletion = new Date(
          now.getTime() + monthsToCompletion * 30 * 24 * 60 * 60 * 1000
        );
      }
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount,
      currency: goal.currency,
      currentValue,
      percentComplete: Math.min(percentComplete, 100),
      timeProgress,
      projectedCompletion,
      onTrack,
      monthlyContributionNeeded,
      allocations: allocationProgress,
    };
  }

  /**
   * Get summary of all goals for a space
   */
  async getSummary(spaceId: string, userId: string): Promise<GoalSummary> {
    const goals = await this.findBySpace(spaceId, userId);

    let totalTargetAmount = 0;
    let totalCurrentValue = 0;

    for (const goal of goals) {
      totalTargetAmount += Number(goal.targetAmount);

      // Calculate current value for this goal
      for (const allocation of goal.allocations) {
        const contributedValue =
          Number(allocation.account.balance) * (Number(allocation.percentage) / 100);
        totalCurrentValue += contributedValue;
      }
    }

    const activeGoals = goals.filter((g) => g.status === 'active').length;
    const achievedGoals = goals.filter((g) => g.status === 'achieved').length;
    const overallProgress =
      totalTargetAmount > 0 ? (totalCurrentValue / totalTargetAmount) * 100 : 0;

    return {
      totalGoals: goals.length,
      activeGoals,
      achievedGoals,
      totalTargetAmount,
      totalCurrentValue,
      overallProgress: Math.min(overallProgress, 100),
    };
  }

  /**
   * Helper: Find goal by ID and verify user access
   */
  private async findByIdWithAccess(goalId: string, userId: string): Promise<Goal> {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Verify user has access to the space
    const userSpace = await this.prisma.userSpace.findFirst({
      where: {
        userId,
        spaceId: goal.spaceId,
      },
    });

    if (!userSpace) {
      throw new NotFoundException('Goal not found or you do not have access');
    }

    return goal;
  }
}
