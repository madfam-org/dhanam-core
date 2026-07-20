// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { Household, HouseholdMember } from '@db';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

import { CreateHouseholdDto, UpdateHouseholdDto, AddMemberDto, UpdateMemberDto } from './dto';

@Injectable()
export class HouseholdsService {
  private readonly logger = new Logger(HouseholdsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  /**
   * Create a new household
   */
  async create(dto: CreateHouseholdDto, userId: string): Promise<Household> {
    const household = await this.prisma.household.create({
      data: {
        name: dto.name,
        type: dto.type || 'family',
        baseCurrency: dto.baseCurrency || 'USD',
        description: dto.description,
        members: {
          create: {
            userId,
            relationship: 'other', // Creator can update this later
            isMinor: false,
          },
        },
      },
      include: {
        members: true,
      },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_CREATED',
      resource: 'household',
      resourceId: household.id,
      severity: 'low',
      metadata: {
        householdName: household.name,
        householdType: household.type,
      },
    });

    this.logger.log(`Household created: ${household.id} by user ${userId}`);

    return household;
  }

  /**
   * Find household by ID (with access check)
   */
  async findById(householdId: string, userId: string): Promise<Household> {
    const household = await this.prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                dateOfBirth: true,
              },
            },
          },
        },
        spaces: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        goals: {
          select: {
            id: true,
            name: true,
            type: true,
            targetAmount: true,
            currency: true,
            targetDate: true,
            status: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found or you do not have access');
    }

    return household;
  }

  /**
   * Find all households for a user
   */
  async findByUser(userId: string): Promise<Household[]> {
    return this.prisma.household.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                dateOfBirth: true,
              },
            },
          },
        },
        _count: {
          select: {
            spaces: true,
            goals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update a household
   */
  async update(householdId: string, dto: UpdateHouseholdDto, userId: string): Promise<Household> {
    // Verify access
    await this.findById(householdId, userId);

    const updated = await this.prisma.household.update({
      where: { id: householdId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.baseCurrency && { baseCurrency: dto.baseCurrency }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_UPDATED',
      resource: 'household',
      resourceId: householdId,
      severity: 'low',
      metadata: { changes: Object.keys(dto) },
    });

    this.logger.log(`Household updated: ${householdId} by user ${userId}`);

    return updated;
  }

  /**
   * Delete a household
   */
  async delete(householdId: string, userId: string): Promise<void> {
    // Verify access
    await this.findById(householdId, userId);

    // Check if household has any spaces or goals
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        _count: {
          select: {
            spaces: true,
            goals: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    if (household._count.spaces > 0 || household._count.goals > 0) {
      throw new BadRequestException(
        'Cannot delete household with associated spaces or goals. Please remove them first.'
      );
    }

    await this.prisma.household.delete({
      where: { id: householdId },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_DELETED',
      resource: 'household',
      resourceId: householdId,
      severity: 'medium',
      metadata: { householdName: household.name },
    });

    this.logger.log(`Household deleted: ${householdId} by user ${userId}`);
  }

  /**
   * Add a member to a household
   */
  async addMember(
    householdId: string,
    dto: AddMemberDto,
    userId: string
  ): Promise<HouseholdMember> {
    // Verify access to household
    await this.findById(householdId, userId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existing = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this household');
    }

    const member = await this.prisma.householdMember.create({
      data: {
        householdId,
        userId: dto.userId,
        relationship: dto.relationship,
        isMinor: dto.isMinor || false,
        accessStartDate: dto.accessStartDate ? new Date(dto.accessStartDate) : null,
        notes: dto.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            dateOfBirth: true,
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_MEMBER_ADDED',
      resource: 'household',
      resourceId: householdId,
      severity: 'medium',
      metadata: {
        memberId: member.id,
        memberUserId: dto.userId,
        relationship: dto.relationship,
      },
    });

    this.logger.log(`Member added to household: ${householdId} by user ${userId}`);

    return member;
  }

  /**
   * Update a household member
   */
  async updateMember(
    householdId: string,
    memberId: string,
    dto: UpdateMemberDto,
    userId: string
  ): Promise<HouseholdMember> {
    // Verify access to household
    await this.findById(householdId, userId);

    // Verify member exists in this household
    const member = await this.prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId,
      },
    });

    if (!member) {
      throw new NotFoundException('Household member not found');
    }

    const updated = await this.prisma.householdMember.update({
      where: { id: memberId },
      data: {
        ...(dto.relationship && { relationship: dto.relationship }),
        ...(dto.isMinor !== undefined && { isMinor: dto.isMinor }),
        ...(dto.accessStartDate !== undefined && {
          accessStartDate: dto.accessStartDate ? new Date(dto.accessStartDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            dateOfBirth: true,
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_MEMBER_UPDATED',
      resource: 'household',
      resourceId: householdId,
      severity: 'low',
      metadata: {
        memberId,
        changes: Object.keys(dto),
      },
    });

    this.logger.log(`Household member updated: ${memberId} by user ${userId}`);

    return updated;
  }

  /**
   * Remove a member from a household
   */
  async removeMember(householdId: string, memberId: string, userId: string): Promise<void> {
    // Verify access to household
    await this.findById(householdId, userId);

    // Verify member exists in this household
    const member = await this.prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId,
      },
    });

    if (!member) {
      throw new NotFoundException('Household member not found');
    }

    // Don't allow removing the last member
    const memberCount = await this.prisma.householdMember.count({
      where: { householdId },
    });

    if (memberCount <= 1) {
      throw new BadRequestException(
        'Cannot remove the last member of a household. Delete the household instead.'
      );
    }

    await this.prisma.householdMember.delete({
      where: { id: memberId },
    });

    await this.audit.log({
      userId,
      action: 'HOUSEHOLD_MEMBER_REMOVED',
      resource: 'household',
      resourceId: householdId,
      severity: 'medium',
      metadata: {
        memberId,
        memberUserId: member.userId,
      },
    });

    this.logger.log(`Member removed from household: ${householdId} by user ${userId}`);
  }

  /**
   * Get household-level net worth aggregation
   */
  async getNetWorth(
    householdId: string,
    userId: string
  ): Promise<{
    totalNetWorth: number;
    bySpace: Array<{
      spaceId: string;
      spaceName: string;
      netWorth: number;
      assets: number;
      liabilities: number;
    }>;
    byCurrency: Record<string, number>;
  }> {
    // Verify access
    await this.findById(householdId, userId);

    // Get all spaces in the household
    const spaces = await this.prisma.space.findMany({
      where: { householdId },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            balance: true,
          },
        },
      },
    });

    let totalNetWorth = 0;
    const bySpace: Array<{
      spaceId: string;
      spaceName: string;
      netWorth: number;
      assets: number;
      liabilities: number;
    }> = [];
    const byCurrency: Record<string, number> = {};

    for (const space of spaces) {
      let spaceAssets = 0;
      let spaceLiabilities = 0;

      for (const account of space.accounts) {
        const balance = Number(account.balance);

        // Asset accounts have positive balances, liabilities have negative
        if (account.type === 'credit') {
          spaceLiabilities += Math.abs(balance);
        } else {
          spaceAssets += balance;
        }

        // Aggregate by currency
        const currency = account.currency;
        if (!byCurrency[currency]) {
          byCurrency[currency] = 0;
        }
        byCurrency[currency] += balance;
      }

      const spaceNetWorth = spaceAssets - spaceLiabilities;
      totalNetWorth += spaceNetWorth;

      bySpace.push({
        spaceId: space.id,
        spaceName: space.name,
        netWorth: spaceNetWorth,
        assets: spaceAssets,
        liabilities: spaceLiabilities,
      });
    }

    return {
      totalNetWorth,
      bySpace,
      byCurrency,
    };
  }

  /**
   * Get household-level goal summary
   */
  async getGoalSummary(
    householdId: string,
    userId: string
  ): Promise<{
    totalGoals: number;
    activeGoals: number;
    achievedGoals: number;
    totalTargetAmount: number;
    byType: Record<string, number>;
  }> {
    // Verify access
    await this.findById(householdId, userId);

    const goals = await this.prisma.goal.findMany({
      where: { householdId },
    });

    const summary = {
      totalGoals: goals.length,
      activeGoals: goals.filter((g) => g.status === 'active').length,
      achievedGoals: goals.filter((g) => g.status === 'achieved').length,
      totalTargetAmount: goals.reduce((sum, g) => sum + Number(g.targetAmount), 0),
      byType: {} as Record<string, number>,
    };

    // Aggregate by goal type
    for (const goal of goals) {
      if (!summary.byType[goal.type]) {
        summary.byType[goal.type] = 0;
      }
      summary.byType[goal.type] += 1;
    }

    return summary;
  }
}