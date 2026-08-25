// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PostHogService } from '../analytics/posthog.service';

export enum AlertType {
  BUDGET_LIMIT = 'budget_limit',
  UNUSUAL_SPENDING = 'unusual_spending',
  LARGE_TRANSACTION = 'large_transaction',
  LOW_BALANCE = 'low_balance',
  BILL_DUE = 'bill_due',
}

@Injectable()
export class BudgetsAnalytics {
  private readonly logger = new Logger(BudgetsAnalytics.name);

  constructor(private readonly posthogService: PostHogService) {}

  /**
   * Track when a budget is created
   */
  async trackBudgetCreated(
    userId: string,
    budget: {
      period: string;
      categoriesCount: number;
      totalAmount: number;
      currency: string;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'budget_created',
        properties: {
          budget_period: budget.period,
          categories_count: budget.categoriesCount,
          total_amount: budget.totalAmount,
          currency: budget.currency,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track budget created:', error);
    }
  }

  /**
   * Track when a budget is updated
   */
  async trackBudgetUpdated(userId: string, budgetId: string, changes: string[]): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'budget_updated',
        properties: {
          budget_id: budgetId,
          changes,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track budget updated:', error);
    }
  }

  /**
   * Track when a budget is deleted
   */
  async trackBudgetDeleted(userId: string, budgetId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'budget_deleted',
        properties: {
          budget_id: budgetId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track budget deleted:', error);
    }
  }

  /**
   * Track when a categorization rule is created
   */
  async trackRuleCreated(
    userId: string,
    rule: {
      ruleType: string;
      categoryName: string;
      conditions: number;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'rule_created',
        properties: {
          rule_type: rule.ruleType,
          category_name: rule.categoryName,
          conditions_count: rule.conditions,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track rule created:', error);
    }
  }

  /**
   * Track when a rule is updated
   */
  async trackRuleUpdated(userId: string, ruleId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'rule_updated',
        properties: {
          rule_id: ruleId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track rule updated:', error);
    }
  }

  /**
   * Track when a rule is deleted
   */
  async trackRuleDeleted(userId: string, ruleId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'rule_deleted',
        properties: {
          rule_id: ruleId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track rule deleted:', error);
    }
  }

  /**
   * Track when an alert is fired
   */
  async trackAlertFired(
    userId: string,
    alert: {
      type: AlertType | string;
      categoryName?: string;
      amount?: number;
      threshold?: number;
      percentUsed?: number;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'alert_fired',
        properties: {
          alert_type: alert.type,
          category_name: alert.categoryName,
          amount: alert.amount,
          threshold: alert.threshold,
          percent_used: alert.percentUsed,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track alert fired:', error);
    }
  }

  /**
   * Track when user acknowledges an alert
   */
  async trackAlertAcknowledged(userId: string, alertId: string, alertType: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'alert_acknowledged',
        properties: {
          alert_id: alertId,
          alert_type: alertType,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track alert acknowledged:', error);
    }
  }

  /**
   * Track when a category is created
   */
  async trackCategoryCreated(
    userId: string,
    categoryName: string,
    budgetedAmount?: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'category_created',
        properties: {
          category_name: categoryName,
          budgeted_amount: budgetedAmount,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track category created:', error);
    }
  }

  /**
   * Track budget overspend
   */
  async trackBudgetOverspend(
    userId: string,
    categoryName: string,
    budgeted: number,
    spent: number,
    overspend: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'budget_overspend',
        properties: {
          category_name: categoryName,
          budgeted_amount: budgeted,
          spent_amount: spent,
          overspend_amount: overspend,
          percent_over: ((overspend / budgeted) * 100).toFixed(2),
        },
      });
    } catch (error) {
      this.logger.error('Failed to track budget overspend:', error);
    }
  }

  /**
   * Track when user views budget dashboard
   */
  async trackBudgetDashboardViewed(userId: string, period: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'budget_dashboard_viewed',
        properties: {
          period,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track budget dashboard viewed:', error);
    }
  }
}
