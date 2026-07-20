// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

export interface CategoryAllocationStatus {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  carryoverAmount: number;
  allocated: number;
  spent: number;
  available: number; // allocated + carryover - spent
  goalProgress?: number; // percentage toward goal
  isOverspent: boolean;
  goalType?: string;
  goalTarget?: number;
}

export interface AllocationStatusDto {
  month: string; // YYYY-MM format
  totalIncome: number;
  totalAllocated: number;
  unallocated: number; // "Ready to Assign"
  totalSpent: number;
  isFullyAllocated: boolean;
  categories: CategoryAllocationStatus[];
  incomeEvents: Array<{
    id: string;
    amount: number;
    source: string;
    receivedAt: Date;
    isAllocated: boolean;
  }>;
}

export interface AllocateFundsDto {
  incomeEventId?: string; // Optional - if not provided, allocates from unallocated pool
  categoryId: string;
  amount: number;
  notes?: string;
}

export interface MoveFundsDto {
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  notes?: string;
}

export interface CreateIncomeEventDto {
  amount: number;
  currency: Currency;
  source: string;
  description?: string;
  receivedAt: Date;
}

export interface SetCategoryGoalDto {
  goalType: 'monthly_spending' | 'target_balance' | 'weekly_spending' | 'percentage_income';
  targetAmount?: number;
  targetDate?: Date;
  monthlyFunding?: number;
  percentageTarget?: number;
  notes?: string;
}

@Injectable()
export class ZeroBasedService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  /**
   * Get current allocation status for a month
   * This is the core "envelope budgeting" view
   */
  async getAllocationStatus(
    userId: string,
    spaceId: string,
    month?: string
  ): Promise<AllocationStatusDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Default to current month
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const startDate = new Date(year!, monthNum! - 1, 1);
    const endDate = new Date(year!, monthNum!, 0); // Last day of month

    // Get current budget for this space
    const budget = await this.prisma.budget.findFirst({
      where: {
        spaceId,
        startDate: { lte: endDate },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
      include: {
        categories: {
          include: {
            goal: true,
            allocations: {
              where: {
                incomeEvent: {
                  receivedAt: {
                    gte: startDate,
                    lte: endDate,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return {
        month: targetMonth,
        totalIncome: 0,
        totalAllocated: 0,
        unallocated: 0,
        totalSpent: 0,
        isFullyAllocated: true,
        categories: [],
        incomeEvents: [],
      };
    }

    // Get income events for this month
    const incomeEvents = await this.prisma.incomeEvent.findMany({
      where: {
        spaceId,
        receivedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    // Get transactions for this month to calculate spent amounts
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 }, // Expenses only
        categoryId: { in: budget.categories.map((c) => c.id) },
      },
    });

    // Build category status
    const categorySpending = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.categoryId) {
        const current = categorySpending.get(tx.categoryId) || 0;
        categorySpending.set(tx.categoryId, current + Math.abs(tx.amount.toNumber()));
      }
    }

    const categoryStatuses: CategoryAllocationStatus[] = budget.categories.map((category) => {
      const allocated = category.allocations.reduce((sum, a) => sum + a.amount.toNumber(), 0);
      const spent = categorySpending.get(category.id) || 0;
      const carryover = category.carryoverAmount.toNumber();
      const available = allocated + carryover - spent;

      let goalProgress: number | undefined;
      let goalTarget: number | undefined;
      if (category.goal) {
        goalTarget = category.goal.targetAmount?.toNumber();
        if (goalTarget && goalTarget > 0) {
          goalProgress = Math.min(100, (allocated / goalTarget) * 100);
        }
      }

      return {
        categoryId: category.id,
        categoryName: category.name,
        budgetedAmount: category.budgetedAmount.toNumber(),
        carryoverAmount: carryover,
        allocated,
        spent,
        available,
        isOverspent: available < 0,
        goalProgress,
        goalType: category.goal?.goalType,
        goalTarget,
      };
    });

    const totalIncome = incomeEvents.reduce((sum, e) => sum + e.amount.toNumber(), 0);
    const totalAllocated = categoryStatuses.reduce((sum, c) => sum + c.allocated, 0);
    const totalSpent = categoryStatuses.reduce((sum, c) => sum + c.spent, 0);
    const unallocated = totalIncome - totalAllocated;

    return {
      month: targetMonth,
      totalIncome,
      totalAllocated,
      unallocated,
      totalSpent,
      isFullyAllocated: Math.abs(unallocated) < 0.01,
      categories: categoryStatuses,
      incomeEvents: incomeEvents.map((e) => ({
        id: e.id,
        amount: e.amount.toNumber(),
        source: e.source,
        receivedAt: e.receivedAt,
        isAllocated: e.isAllocated,
      })),
    };
  }

  /**
   * Create a new income event (when money comes in)
   */
  async createIncomeEvent(
    userId: string,
    spaceId: string,
    dto: CreateIncomeEventDto
  ): Promise<{ id: string; amount: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const incomeEvent = await this.prisma.incomeEvent.create({
      data: {
        spaceId,
        amount: dto.amount,
        currency: dto.currency,
        source: dto.source,
        description: dto.description,
        receivedAt: dto.receivedAt,
        isAllocated: false,
      },
    });

    return {
      id: incomeEvent.id,
      amount: incomeEvent.amount.toNumber(),
    };
  }

  /**
   * Allocate funds to a category
   */
  async allocateToCategory(
    userId: string,
    spaceId: string,
    dto: AllocateFundsDto
  ): Promise<{ success: boolean; remainingUnallocated: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify category belongs to this space's budget
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        budget: { spaceId },
      },
      include: { budget: { include: { space: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Get space currency for income event
    const spaceCurrency = category.budget.space.currency;

    // Get or create a "general" income event for this allocation
    let incomeEventId = dto.incomeEventId;

    if (!incomeEventId) {
      // Find an unallocated income event or create a manual one
      const unallocatedEvent = await this.prisma.incomeEvent.findFirst({
        where: {
          spaceId,
          isAllocated: false,
        },
        orderBy: { receivedAt: 'desc' },
      });

      if (unallocatedEvent) {
        incomeEventId = unallocatedEvent.id;
      } else {
        // Create a manual "Ready to Assign" event
        const event = await this.prisma.incomeEvent.create({
          data: {
            spaceId,
            amount: dto.amount,
            currency: spaceCurrency,
            source: 'manual_allocation',
            description: 'Manual allocation',
            receivedAt: new Date(),
            isAllocated: false,
          },
        });
        incomeEventId = event.id;
      }
    }

    // Create the allocation
    await this.prisma.incomeAllocation.create({
      data: {
        incomeEventId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        notes: dto.notes,
      },
    });

    // Update category's budgeted amount
    await this.prisma.category.update({
      where: { id: dto.categoryId },
      data: {
        budgetedAmount: {
          increment: dto.amount,
        },
      },
    });

    // Check remaining unallocated
    const status = await this.getAllocationStatus(userId, spaceId);

    return {
      success: true,
      remainingUnallocated: status.unallocated,
    };
  }

  /**
   * Move funds between categories
   */
  async moveBetweenCategories(
    userId: string,
    spaceId: string,
    dto: MoveFundsDto
  ): Promise<{ success: boolean }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Verify both categories belong to this space
    const [fromCategory, toCategory] = await Promise.all([
      this.prisma.category.findFirst({
        where: { id: dto.fromCategoryId, budget: { spaceId } },
      }),
      this.prisma.category.findFirst({
        where: { id: dto.toCategoryId, budget: { spaceId } },
      }),
    ]);

    if (!fromCategory || !toCategory) {
      throw new NotFoundException('One or both categories not found');
    }

    // Check if source category has enough allocated
    const status = await this.getAllocationStatus(userId, spaceId);
    const fromStatus = status.categories.find((c) => c.categoryId === dto.fromCategoryId);

    if (!fromStatus || fromStatus.available < dto.amount) {
      throw new BadRequestException('Insufficient funds in source category');
    }

    // Perform the transfer (update budgeted amounts)
    await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id: dto.fromCategoryId },
        data: {
          budgetedAmount: {
            decrement: dto.amount,
          },
        },
      }),
      this.prisma.category.update({
        where: { id: dto.toCategoryId },
        data: {
          budgetedAmount: {
            increment: dto.amount,
          },
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * Auto-allocate income based on category goals
   */
  async autoAllocate(
    userId: string,
    spaceId: string,
    incomeEventId?: string
  ): Promise<{
    allocations: Array<{ categoryId: string; amount: number }>;
    remainingUnallocated: number;
  }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Get categories with goals
    const categories = await this.prisma.category.findMany({
      where: {
        budget: { spaceId },
        goal: { isNot: null },
      },
      include: { goal: true },
    });

    // Get current allocation status
    const status = await this.getAllocationStatus(userId, spaceId);

    if (status.unallocated <= 0) {
      return {
        allocations: [],
        remainingUnallocated: 0,
      };
    }

    const allocations: Array<{ categoryId: string; amount: number }> = [];
    let remaining = status.unallocated;

    // Allocate based on goals (priority: monthly_spending, then target_balance, then percentage)
    for (const category of categories) {
      if (remaining <= 0) break;

      const goal = category.goal;
      if (!goal) continue;

      const currentStatus = status.categories.find((c) => c.categoryId === category.id);
      const currentAllocated = currentStatus?.allocated || 0;

      let targetAllocation = 0;

      switch (goal.goalType) {
        case 'monthly_spending':
          targetAllocation = (goal.targetAmount?.toNumber() || 0) - currentAllocated;
          break;
        case 'target_balance':
          // Divide by months remaining
          if (goal.targetDate) {
            const monthsRemaining = Math.max(
              1,
              (goal.targetDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
            );
            const totalNeeded = goal.targetAmount?.toNumber() || 0;
            targetAllocation = totalNeeded / monthsRemaining - currentAllocated;
          }
          break;
        case 'percentage_income':
          targetAllocation =
            status.totalIncome * ((goal.percentageTarget?.toNumber() || 0) / 100) -
            currentAllocated;
          break;
        case 'weekly_spending':
          targetAllocation = (goal.targetAmount?.toNumber() || 0) * 4 - currentAllocated; // 4 weeks/month
          break;
      }

      if (targetAllocation > 0) {
        const allocationAmount = Math.min(targetAllocation, remaining);
        allocations.push({ categoryId: category.id, amount: allocationAmount });
        remaining -= allocationAmount;

        // Create the allocation
        await this.allocateToCategory(userId, spaceId, {
          incomeEventId,
          categoryId: category.id,
          amount: allocationAmount,
          notes: 'Auto-allocated based on goal',
        });
      }
    }

    return {
      allocations,
      remainingUnallocated: remaining,
    };
  }

  /**
   * Handle month rollover - carry over unspent funds
   */
  async rolloverMonth(
    userId: string,
    spaceId: string,
    fromMonth: string,
    _toMonth: string
  ): Promise<{ categoriesRolledOver: number; totalCarryover: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    // Get status for the previous month
    const fromStatus = await this.getAllocationStatus(userId, spaceId, fromMonth);

    let categoriesRolledOver = 0;
    let totalCarryover = 0;

    // Rollover positive balances to next month
    for (const category of fromStatus.categories) {
      if (category.available > 0) {
        await this.prisma.category.update({
          where: { id: category.categoryId },
          data: {
            carryoverAmount: {
              increment: category.available,
            },
          },
        });

        categoriesRolledOver++;
        totalCarryover += category.available;
      }
    }

    return { categoriesRolledOver, totalCarryover };
  }

  /**
   * Set a funding goal for a category
   */
  async setCategoryGoal(
    userId: string,
    spaceId: string,
    categoryId: string,
    dto: SetCategoryGoalDto
  ): Promise<{ success: boolean }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify category belongs to this space
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, budget: { spaceId } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Upsert the goal
    await this.prisma.categoryGoal.upsert({
      where: { categoryId },
      create: {
        categoryId,
        goalType: dto.goalType,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate,
        monthlyFunding: dto.monthlyFunding,
        percentageTarget: dto.percentageTarget,
        notes: dto.notes,
      },
      update: {
        goalType: dto.goalType,
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate,
        monthlyFunding: dto.monthlyFunding,
        percentageTarget: dto.percentageTarget,
        notes: dto.notes,
      },
    });

    return { success: true };
  }

  /**
   * Get income events for a space
   */
  async getIncomeEvents(
    userId: string,
    spaceId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<
    Array<{
      id: string;
      amount: number;
      currency: Currency;
      source: string;
      description: string | null;
      receivedAt: Date;
      isAllocated: boolean;
    }>
  > {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const incomeEvents = await this.prisma.incomeEvent.findMany({
      where: {
        spaceId,
        ...(options?.startDate && { receivedAt: { gte: options.startDate } }),
        ...(options?.endDate && { receivedAt: { lte: options.endDate } }),
      },
      orderBy: { receivedAt: 'desc' },
      take: options?.limit || 50,
    });

    return incomeEvents.map((e) => ({
      id: e.id,
      amount: e.amount.toNumber(),
      currency: e.currency,
      source: e.source,
      description: e.description,
      receivedAt: e.receivedAt,
      isAllocated: e.isAllocated,
    }));
  }

  /**
   * Get category goals for a budget
   */
  async getCategoryGoals(
    userId: string,
    spaceId: string
  ): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      goalType: string;
      targetAmount: number | null;
      targetDate: Date | null;
      monthlyFunding: number | null;
      percentageTarget: number | null;
      progress: number;
    }>
  > {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const categories = await this.prisma.category.findMany({
      where: {
        budget: { spaceId },
        goal: { isNot: null },
      },
      include: { goal: true },
    });

    const status = await this.getAllocationStatus(userId, spaceId);

    return categories.map((cat) => {
      const catStatus = status.categories.find((c) => c.categoryId === cat.id);
      const goal = cat.goal!;

      let progress = 0;
      if (goal.targetAmount?.toNumber()) {
        progress = Math.min(
          100,
          ((catStatus?.allocated || 0) / goal.targetAmount.toNumber()) * 100
        );
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        goalType: goal.goalType,
        targetAmount: goal.targetAmount?.toNumber() || null,
        targetDate: goal.targetDate,
        monthlyFunding: goal.monthlyFunding?.toNumber() || null,
        percentageTarget: goal.percentageTarget?.toNumber() || null,
        progress,
      };
    });
  }
}