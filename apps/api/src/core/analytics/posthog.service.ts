// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PostHog } from 'posthog-node';

import { LoggerService } from '@core/logger/logger.service';

/**
 * PostHog Analytics Service
 *
 * Tracks user behavior and product analytics events using PostHog.
 * Implements privacy-first analytics with opt-in tracking.
 *
 * Key Events:
 * - sign_up: User registration
 * - onboarding_complete: User completed onboarding
 * - connect_initiated: User started bank connection
 * - connect_success: Bank connection succeeded
 * - sync_success: Account sync completed
 * - budget_created: Budget created
 * - rule_created: Categorization rule created
 * - txn_categorized: Transaction categorized
 * - alert_fired: Budget alert triggered
 * - view_net_worth: User viewed wealth tracking
 * - export_data: User exported data
 */
@Injectable()
export class PostHogService implements OnModuleDestroy {
  private client: PostHog;
  private isEnabled: boolean;

  constructor(private logger: LoggerService) {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!apiKey) {
      this.logger.warn('PostHog API key not configured. Analytics disabled.', 'PostHogService');
      this.isEnabled = false;
      return;
    }

    this.client = new PostHog(apiKey, {
      host,
      // Flush events every 10 seconds or 20 events (whichever comes first)
      flushAt: 20,
      flushInterval: 10000,
    });

    this.isEnabled = true;
    this.logger.log('PostHog analytics initialized', 'PostHogService');
  }

  /**
   * Capture a generic analytics event
   */
  async capture(userId: string, event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      this.client.capture({
        distinctId: userId,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(`Event captured: ${event} for user: ${userId}`, 'PostHogService');
    } catch (error) {
      this.logger.error('Failed to capture event', (error as Error).message, 'PostHogService');
    }
  }

  /**
   * Identify a user with their properties
   */
  async identify(
    userId: string,
    properties: {
      email?: string;
      name?: string;
      locale?: string;
      timezone?: string;
      createdAt?: string;
      [key: string]: string | number | boolean | undefined;
    }
  ): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      this.client.identify({
        distinctId: userId,
        properties,
      });

      this.logger.log(`User identified: ${userId}`, 'PostHogService');
    } catch (error) {
      this.logger.error('Failed to identify user', (error as Error).message, 'PostHogService');
    }
  }

  /**
   * Track user registration (sign_up event)
   */
  async trackSignUp(
    userId: string,
    properties?: {
      email: string;
      name: string;
      locale: string;
      registrationMethod?: 'email' | 'oauth';
    }
  ): Promise<void> {
    await this.capture(userId, 'sign_up', properties);
  }

  /**
   * Track onboarding completion
   */
  async trackOnboardingComplete(
    userId: string,
    properties?: {
      stepsCompleted: number;
      timeToComplete: number; // milliseconds
    }
  ): Promise<void> {
    await this.capture(userId, 'onboarding_complete', properties);
  }

  /**
   * Track bank connection initiation
   */
  async trackConnectInitiated(
    userId: string,
    properties: {
      provider: string;
      spaceId: string;
      spaceType: 'personal' | 'business';
    }
  ): Promise<void> {
    await this.capture(userId, 'connect_initiated', properties);
  }

  /**
   * Track successful bank connection
   */
  async trackConnectSuccess(
    userId: string,
    properties: {
      provider: string;
      accountsLinked: number;
      spaceId: string;
    }
  ): Promise<void> {
    await this.capture(userId, 'connect_success', properties);
  }

  /**
   * Track successful account sync
   */
  async trackSyncSuccess(
    userId: string,
    properties: {
      provider: string;
      accountId: string;
      transactionsAdded: number;
      syncDuration: number; // milliseconds
    }
  ): Promise<void> {
    await this.capture(userId, 'sync_success', properties);
  }

  /**
   * Track budget creation
   */
  async trackBudgetCreated(
    userId: string,
    properties: {
      budgetId: string;
      spaceId: string;
      period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      categoriesCount: number;
      totalAmount: number;
      currency: string;
    }
  ): Promise<void> {
    await this.capture(userId, 'budget_created', properties);
  }

  /**
   * Track categorization rule creation
   */
  async trackRuleCreated(
    userId: string,
    properties: {
      ruleId: string;
      spaceId: string;
      matchType: 'contains' | 'starts_with' | 'ends_with' | 'exact';
      categoryId: string;
    }
  ): Promise<void> {
    await this.capture(userId, 'rule_created', properties);
  }

  /**
   * Track transaction categorization
   */
  async trackTransactionCategorized(
    userId: string,
    properties: {
      transactionId: string;
      categoryId: string;
      isAutomatic: boolean;
      spaceId: string;
    }
  ): Promise<void> {
    await this.capture(userId, 'txn_categorized', properties);
  }

  /**
   * Track budget alert firing
   */
  async trackAlertFired(
    userId: string,
    properties: {
      budgetId: string;
      categoryId: string;
      spaceId: string;
      percentageUsed: number;
      alertType: 'warning' | 'exceeded';
    }
  ): Promise<void> {
    await this.capture(userId, 'alert_fired', properties);
  }

  /**
   * Track wealth tracking view
   */
  async trackViewNetWorth(
    userId: string,
    properties: {
      spaceId: string;
      totalNetWorth: number;
      currency: string;
      accountsCount: number;
    }
  ): Promise<void> {
    await this.capture(userId, 'view_net_worth', properties);
  }

  /**
   * Track data export
   */
  async trackExportData(
    userId: string,
    properties: {
      exportType: 'csv' | 'pdf' | 'json';
      dataType: 'transactions' | 'budgets' | 'reports' | 'all';
      recordsExported: number;
      spaceId: string;
    }
  ): Promise<void> {
    await this.capture(userId, 'export_data', properties);
  }

  /**
   * Create an alias for user (e.g., when merging accounts)
   */
  async alias(userId: string, alias: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      this.client.alias({
        distinctId: userId,
        alias,
      });

      this.logger.log(`Alias created: ${alias} for user: ${userId}`, 'PostHogService');
    } catch (error) {
      this.logger.error('Failed to create alias', (error as Error).message, 'PostHogService');
    }
  }

  /**
   * Flush all pending events immediately
   */
  async flush(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      await this.client.flush();
      this.logger.log('PostHog events flushed', 'PostHogService');
    } catch (error) {
      this.logger.error('Failed to flush events', (error as Error).message, 'PostHogService');
    }
  }

  /**
   * Shutdown PostHog client gracefully
   */
  async onModuleDestroy() {
    if (!this.isEnabled) {
      return;
    }

    try {
      await this.client.shutdown();
      this.logger.log('PostHog client shut down', 'PostHogService');
    } catch (error) {
      this.logger.error(
        'Failed to shut down PostHog client',
        (error as Error).message,
        'PostHogService'
      );
    }
  }
}
