// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';
import { addMonths, differenceInMonths } from 'date-fns';

import { PrismaService } from '@core/prisma/prisma.service';

import { MonteCarloEngine } from '../simulations/engines/monte-carlo.engine';
import { MonteCarloConfig } from '../simulations/types/simulation.types';

export interface GoalProbabilityResult {
  goalId: string;
  probability: number; // 0-100
  confidenceLow: number; // P10 value
  confidenceHigh: number; // P90 value
  currentProgress: number; // 0-100
  projectedCompletion: Date | null;
  recommendedMonthlyContribution: number;
  timeline: {
    month: number;
    median: number;
    p10: number;
    p90: number;
  }[];
}

export interface WhatIfScenario {
  monthlyContribution?: number;
  targetAmount?: number;
  targetDate?: Date;
  expectedReturn?: number;
  volatility?: number;
}

@Injectable()
export class GoalProbabilityService {
  private readonly logger = new Logger(GoalProbabilityService.name);

  constructor(
    private prisma: PrismaService,
    private monteCarloEngine: MonteCarloEngine
  ) {}

  /**
   * Calculate probability of achieving a goal using Monte Carlo simulation
   */
  async calculateGoalProbability(userId: string, goalId: string): Promise<GoalProbabilityResult> {
    this.logger.log(`Calculating probability for goal ${goalId}`);

    // Get goal with related data
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
        space: true,
        allocations: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Calculate current balance allocated to this goal
    const currentBalance = goal.allocations.reduce((sum, allocation) => {
      const accountBalance = allocation.account.balance.toNumber();
      const percentageDecimal = allocation.percentage.toNumber() / 100;
      return sum + accountBalance * percentageDecimal;
    }, 0);

    // Calculate months until target date
    const monthsUntilTarget = differenceInMonths(new Date(goal.targetDate), new Date());

    if (monthsUntilTarget <= 0) {
      // Goal is past due or due today
      const progress = (currentBalance / goal.targetAmount.toNumber()) * 100;
      return {
        goalId: goal.id,
        probability: currentBalance >= goal.targetAmount.toNumber() ? 100 : 0,
        confidenceLow: currentBalance,
        confidenceHigh: currentBalance,
        currentProgress: Math.min(100, progress),
        projectedCompletion: null,
        recommendedMonthlyContribution: 0,
        timeline: [],
      };
    }

    // Prepare Monte Carlo configuration
    const config: MonteCarloConfig = {
      initialBalance: currentBalance,
      monthlyContribution: goal.monthlyContribution?.toNumber() || 0,
      months: monthsUntilTarget,
      iterations: 10000, // High accuracy
      expectedReturn: goal.expectedReturn?.toNumber() || 0.07, // Default 7% annual
      volatility: goal.volatility?.toNumber() || 0.15, // Default 15% volatility
    };

    // Run simulation
    const result = this.monteCarloEngine.simulate(config);

    // Calculate success rate
    const targetAmount = goal.targetAmount.toNumber();
    const successRate = this.monteCarloEngine.calculateSuccessRate(
      result.finalValues,
      targetAmount
    );

    // Build timeline for visualization
    const timeline = result.timeSeries.map((snapshot) => ({
      month: snapshot.month,
      median: snapshot.median,
      p10: snapshot.p10,
      p90: snapshot.p90,
    }));

    // Calculate current progress
    const currentProgress = (currentBalance / targetAmount) * 100;

    // Find projected completion date (when median crosses target)
    let projectedCompletion: Date | null = null;
    for (const snapshot of result.timeSeries) {
      if (snapshot.median >= targetAmount) {
        projectedCompletion = addMonths(new Date(), snapshot.month);
        break;
      }
    }

    // If probability is low (<50%), calculate recommended contribution
    let recommendedContribution = config.monthlyContribution;
    if (successRate < 0.5) {
      try {
        recommendedContribution = this.monteCarloEngine.findRequiredContribution(
          config,
          targetAmount,
          0.75 // Target 75% success rate
        );
      } catch (error) {
        this.logger.warn(`Could not find required contribution: ${error.message}`);
      }
    }

    return {
      goalId: goal.id,
      probability: successRate * 100,
      confidenceLow: result.p10,
      confidenceHigh: result.p90,
      currentProgress: Math.min(100, currentProgress),
      projectedCompletion,
      recommendedMonthlyContribution: recommendedContribution,
      timeline,
    };
  }

  /**
   * Update goal with latest probability calculation
   */
  async updateGoalProbability(userId: string, goalId: string): Promise<void> {
    const result = await this.calculateGoalProbability(userId, goalId);

    // Get existing probability history
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      select: { probabilityHistory: true },
    });

    let probabilityHistory = (goal?.probabilityHistory as any[]) || [];

    // Add current probability to history
    probabilityHistory.push({
      date: new Date().toISOString(),
      probability: result.probability,
    });

    // Keep only last 90 days of history
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    probabilityHistory = probabilityHistory.filter((entry) => new Date(entry.date) > ninetyDaysAgo);

    // Update goal with new probability data
    await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        currentProbability: result.probability,
        confidenceLow: result.confidenceLow,
        confidenceHigh: result.confidenceHigh,
        currentProgress: result.currentProgress,
        projectedCompletion: result.projectedCompletion,
        lastSimulationAt: new Date(),
        probabilityHistory,
      },
    });

    this.logger.log(`Updated goal ${goalId} with probability ${result.probability.toFixed(1)}%`);
  }

  /**
   * Run what-if scenario for a goal
   */
  async runWhatIfScenario(
    userId: string,
    goalId: string,
    scenario: WhatIfScenario
  ): Promise<GoalProbabilityResult> {
    this.logger.log(`Running what-if scenario for goal ${goalId}`);

    // Get original goal
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
        allocations: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Calculate current balance
    const currentBalance = goal.allocations.reduce((sum, allocation) => {
      const accountBalance = allocation.account.balance.toNumber();
      const percentageDecimal = allocation.percentage.toNumber() / 100;
      return sum + accountBalance * percentageDecimal;
    }, 0);

    // Apply scenario modifications
    const targetDate = scenario.targetDate || goal.targetDate;
    const targetAmount = scenario.targetAmount || goal.targetAmount.toNumber();
    const monthlyContribution =
      scenario.monthlyContribution !== undefined
        ? scenario.monthlyContribution
        : goal.monthlyContribution?.toNumber() || 0;

    const monthsUntilTarget = differenceInMonths(new Date(targetDate), new Date());

    if (monthsUntilTarget <= 0) {
      throw new Error('Target date must be in the future');
    }

    // Prepare Monte Carlo configuration with scenario parameters
    const config: MonteCarloConfig = {
      initialBalance: currentBalance,
      monthlyContribution,
      months: monthsUntilTarget,
      iterations: 10000,
      expectedReturn:
        scenario.expectedReturn !== undefined
          ? scenario.expectedReturn
          : goal.expectedReturn?.toNumber() || 0.07,
      volatility:
        scenario.volatility !== undefined
          ? scenario.volatility
          : goal.volatility?.toNumber() || 0.15,
    };

    // Run simulation
    const result = this.monteCarloEngine.simulate(config);

    // Calculate success rate
    const successRate = this.monteCarloEngine.calculateSuccessRate(
      result.finalValues,
      targetAmount
    );

    // Build timeline
    const timeline = result.timeSeries.map((snapshot) => ({
      month: snapshot.month,
      median: snapshot.median,
      p10: snapshot.p10,
      p90: snapshot.p90,
    }));

    // Calculate current progress
    const currentProgress = (currentBalance / targetAmount) * 100;

    // Find projected completion
    let projectedCompletion: Date | null = null;
    for (const snapshot of result.timeSeries) {
      if (snapshot.median >= targetAmount) {
        projectedCompletion = addMonths(new Date(), snapshot.month);
        break;
      }
    }

    return {
      goalId: goal.id,
      probability: successRate * 100,
      confidenceLow: result.p10,
      confidenceHigh: result.p90,
      currentProgress: Math.min(100, currentProgress),
      projectedCompletion,
      recommendedMonthlyContribution: monthlyContribution,
      timeline,
    };
  }

  /**
   * Bulk update probabilities for all active goals in a space
   */
  async updateAllGoalProbabilities(userId: string, spaceId: string): Promise<void> {
    this.logger.log(`Updating all goal probabilities for space ${spaceId}`);

    const goals = await this.prisma.goal.findMany({
      where: {
        spaceId,
        status: 'active',
        space: {
          userSpaces: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    for (const goal of goals) {
      try {
        await this.updateGoalProbability(userId, goal.id);
      } catch (error) {
        this.logger.error(`Failed to update probability for goal ${goal.id}:`, error);
      }
    }

    this.logger.log(`Updated ${goals.length} goals for space ${spaceId}`);
  }
}
