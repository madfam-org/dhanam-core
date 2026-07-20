// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PostHogService } from './posthog.service';

@Injectable()
export class WealthAnalytics {
  private readonly logger = new Logger(WealthAnalytics.name);

  constructor(private readonly posthogService: PostHogService) {}

  /**
   * Track when user views their net worth
   */
  async trackNetWorthViewed(
    userId: string,
    netWorth: number,
    currency: string,
    change?: {
      amount: number;
      percentage: number;
      period: string;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'view_net_worth',
        properties: {
          net_worth: netWorth,
          currency,
          change_amount: change?.amount,
          change_percentage: change?.percentage,
          change_period: change?.period,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track net worth viewed:', error);
    }
  }

  /**
   * Track when user exports data
   */
  async trackDataExported(
    userId: string,
    exportType: 'transactions' | 'budgets' | 'accounts' | 'full' | 'net_worth' | 'tax_report',
    format: 'csv' | 'pdf' | 'json' | 'xlsx'
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'export_data',
        properties: {
          export_type: exportType,
          format,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track data export:', error);
    }
  }

  /**
   * Track when user views asset allocation
   */
  async trackAssetAllocationViewed(
    userId: string,
    allocations: {
      cash: number;
      investments: number;
      crypto: number;
      other: number;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'asset_allocation_viewed',
        properties: {
          cash_percentage: allocations.cash,
          investments_percentage: allocations.investments,
          crypto_percentage: allocations.crypto,
          other_percentage: allocations.other,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track asset allocation viewed:', error);
    }
  }

  /**
   * Track when user views wealth trends
   */
  async trackWealthTrendsViewed(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year' | 'all'
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'wealth_trends_viewed',
        properties: {
          period,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track wealth trends viewed:', error);
    }
  }

  /**
   * Track when user views portfolio analysis
   */
  async trackPortfolioAnalysisViewed(
    userId: string,
    analysisType: 'performance' | 'allocation' | 'risk'
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'portfolio_analysis_viewed',
        properties: {
          analysis_type: analysisType,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track portfolio analysis viewed:', error);
    }
  }

  /**
   * Track when user runs a Monte Carlo simulation
   */
  async trackMonteCarloSimulation(
    userId: string,
    simulationType: 'retirement' | 'goal' | 'general',
    iterations: number,
    yearsProjected: number,
    probabilityOfSuccess?: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'monte_carlo_simulation',
        properties: {
          simulation_type: simulationType,
          iterations,
          years_projected: yearsProjected,
          probability_of_success: probabilityOfSuccess,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track Monte Carlo simulation:', error);
    }
  }

  /**
   * Track when user views goal progress
   */
  async trackGoalProgressViewed(
    userId: string,
    goalId: string,
    currentProgress: number,
    targetAmount: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'goal_progress_viewed',
        properties: {
          goal_id: goalId,
          current_progress: currentProgress,
          target_amount: targetAmount,
          progress_percentage: (currentProgress / targetAmount) * 100,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track goal progress viewed:', error);
    }
  }

  /**
   * Track when user creates a financial goal
   */
  async trackGoalCreated(
    userId: string,
    goal: {
      type: string;
      targetAmount: number;
      targetDate: Date;
      currency: string;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'goal_created',
        properties: {
          goal_type: goal.type,
          target_amount: goal.targetAmount,
          target_date: goal.targetDate.toISOString(),
          currency: goal.currency,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track goal created:', error);
    }
  }

  /**
   * Track cashflow forecast generation
   */
  async trackCashflowForecastViewed(
    userId: string,
    forecastDays: number,
    confidence: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'cashflow_forecast_viewed',
        properties: {
          forecast_days: forecastDays,
          confidence_level: confidence,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track cashflow forecast viewed:', error);
    }
  }
}