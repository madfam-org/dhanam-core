// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PostHogService } from '../analytics/posthog.service';

interface OnboardingAnalyticsEvent {
  userId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

@Injectable()
export class OnboardingAnalytics {
  private readonly logger = new Logger(OnboardingAnalytics.name);

  constructor(private readonly posthogService: PostHogService) {}

  async trackOnboardingStarted(userId: string, userEmail: string) {
    await this.track({
      userId,
      event: 'onboarding_started',
      properties: {
        user_email: userEmail,
        timestamp: new Date(),
        source: 'web',
      },
    });
  }

  async trackStepCompleted(
    userId: string,
    step: string,
    timeSpent?: number,
    metadata?: Record<string, any>
  ) {
    await this.track({
      userId,
      event: 'onboarding_step_completed',
      properties: {
        step,
        time_spent: timeSpent,
        timestamp: new Date(),
        ...metadata,
      },
    });
  }

  async trackStepSkipped(userId: string, step: string, reason?: string) {
    await this.track({
      userId,
      event: 'onboarding_step_skipped',
      properties: {
        step,
        skip_reason: reason || 'user_initiated',
        timestamp: new Date(),
      },
    });
  }

  async trackOnboardingCompleted(
    userId: string,
    totalTimeSpent?: number,
    stepsCompleted?: string[],
    stepsSkipped?: string[]
  ) {
    await this.track({
      userId,
      event: 'onboarding_completed',
      properties: {
        total_time_spent: totalTimeSpent,
        steps_completed: stepsCompleted || [],
        steps_skipped: stepsSkipped || [],
        completion_rate: stepsCompleted ? (stepsCompleted.length / 7) * 100 : 100,
        timestamp: new Date(),
      },
    });
  }

  async trackOnboardingAbandoned(userId: string, lastStep: string, timeSpent?: number) {
    await this.track({
      userId,
      event: 'onboarding_abandoned',
      properties: {
        last_step: lastStep,
        time_spent: timeSpent,
        abandonment_point: lastStep,
        timestamp: new Date(),
      },
    });
  }

  async trackEmailVerificationSent(userId: string, email: string) {
    await this.track({
      userId,
      event: 'email_verification_sent',
      properties: {
        email,
        verification_method: 'email',
        timestamp: new Date(),
      },
    });
  }

  async trackEmailVerificationCompleted(userId: string, email: string, timeToVerify?: number) {
    await this.track({
      userId,
      event: 'email_verification_completed',
      properties: {
        email,
        time_to_verify: timeToVerify,
        timestamp: new Date(),
      },
    });
  }

  async trackPreferencesUpdated(userId: string, preferences: Record<string, any>) {
    await this.track({
      userId,
      event: 'onboarding_preferences_set',
      properties: {
        ...preferences,
        timestamp: new Date(),
      },
    });
  }

  async trackProviderConnectionAttempt(
    userId: string,
    provider: string,
    success: boolean,
    error?: string
  ) {
    await this.track({
      userId,
      event: 'onboarding_provider_connection',
      properties: {
        provider,
        connection_success: success,
        error_message: error,
        timestamp: new Date(),
      },
    });
  }

  async trackBudgetCreated(userId: string, budgetData: Record<string, any>) {
    await this.track({
      userId,
      event: 'onboarding_first_budget_created',
      properties: {
        budget_period: budgetData.period,
        categories_count: budgetData.categoriesCount,
        total_amount: budgetData.totalAmount,
        currency: budgetData.currency,
        timestamp: new Date(),
      },
    });
  }

  async trackFeatureTourCompleted(userId: string, featuresViewed: string[]) {
    await this.track({
      userId,
      event: 'onboarding_feature_tour_completed',
      properties: {
        features_viewed: featuresViewed,
        total_features: featuresViewed.length,
        timestamp: new Date(),
      },
    });
  }

  // Mobile-specific events
  async trackBiometricSetupCompleted(userId: string, biometricType: string) {
    await this.track({
      userId,
      event: 'mobile_biometric_setup_completed',
      properties: {
        biometric_type: biometricType,
        platform: 'mobile',
        timestamp: new Date(),
      },
    });
  }

  async trackPushNotificationPermission(userId: string, granted: boolean) {
    await this.track({
      userId,
      event: 'mobile_push_permission',
      properties: {
        permission_granted: granted,
        platform: 'mobile',
        timestamp: new Date(),
      },
    });
  }

  private async track(event: OnboardingAnalyticsEvent) {
    try {
      await this.posthogService.capture({
        distinctId: event.userId,
        event: event.event,
        properties: event.properties,
      });
    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
    }
  }

  // Funnel analysis helper methods
  async getOnboardingFunnelData(_dateRange: { start: Date; end: Date }) {
    // This would query your analytics database/service
    // For now, return mock data structure
    return {
      total_started: 0,
      step_conversions: {
        welcome: { completed: 0, abandoned: 0 },
        email_verification: { completed: 0, abandoned: 0 },
        preferences: { completed: 0, abandoned: 0 },
        space_setup: { completed: 0, abandoned: 0 },
        connect_accounts: { completed: 0, abandoned: 0 },
        first_budget: { completed: 0, abandoned: 0 },
        feature_tour: { completed: 0, abandoned: 0 },
      },
      total_completed: 0,
      completion_rate: 0,
      average_time_to_complete: 0,
    };
  }

  async getUserOnboardingTimeline(userId: string) {
    // This would query the analytics events for a specific user
    // Return timeline of their onboarding journey
    return {
      userId,
      events: [], // Array of timestamped events
      totalTime: 0,
      completionStatus: 'in_progress',
    };
  }
}