// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

interface CaptureEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
}

interface IdentifyEvent {
  distinctId: string;
  properties: Record<string, any>;
}

@Injectable()
export class PostHogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;
  private isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = !!this.configService.get('POSTHOG_API_KEY');
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.warn('⚠️  PostHog not configured - analytics disabled');
      this.logger.warn('Set POSTHOG_API_KEY environment variable to enable analytics');
      return;
    }

    try {
      this.client = new PostHog(this.configService.get('POSTHOG_API_KEY')!, {
        host: this.configService.get('POSTHOG_HOST') || 'https://us.i.posthog.com',
        flushAt: 20, // Flush every 20 events
        flushInterval: 10000, // Or every 10 seconds
      });

      this.logger.log('✅ PostHog analytics initialized');
      this.logger.log(
        `PostHog Host: ${this.configService.get('POSTHOG_HOST') || 'https://us.i.posthog.com'}`
      );
    } catch (error) {
      this.logger.error('Failed to initialize PostHog:', error);
      this.isEnabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('Shutting down PostHog client...');
      await this.client.shutdown();
    }
  }

  /**
   * Capture an analytics event
   */
  async capture(event: CaptureEvent): Promise<void> {
    if (!this.isEnabled || !this.client) {
      this.logger.debug(`[Analytics Disabled] Event: ${event.event}`, event.properties);
      return;
    }

    try {
      this.client.capture({
        distinctId: event.distinctId,
        event: event.event,
        properties: {
          ...event.properties,
          $lib: 'dhanam-api',
          $lib_version: '0.1.0',
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.debug(`📊 Event tracked: ${event.event}`, {
        distinctId: event.distinctId,
        properties: event.properties,
      });
    } catch (error) {
      this.logger.error(`Failed to capture event: ${event.event}`, error);
    }
  }

  /**
   * Identify a user with properties
   */
  async identify(event: IdentifyEvent): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      this.client.identify({
        distinctId: event.distinctId,
        properties: event.properties,
      });

      this.logger.debug(`👤 User identified: ${event.distinctId}`);
    } catch (error) {
      this.logger.error(`Failed to identify user: ${event.distinctId}`, error);
    }
  }

  /**
   * Set properties for a user
   */
  async setPersonProperties(userId: string, properties: Record<string, any>): Promise<void> {
    await this.identify({
      distinctId: userId,
      properties: {
        ...properties,
        $set: properties, // Set properties on the person
      },
    });
  }

  /**
   * Set properties for a user only once (won't override existing values)
   */
  async setPersonPropertiesOnce(userId: string, properties: Record<string, any>): Promise<void> {
    await this.identify({
      distinctId: userId,
      properties: {
        $set_once: properties,
      },
    });
  }

  /**
   * Group a user into a group (e.g., company, team)
   */
  async group(
    userId: string,
    groupType: string,
    groupKey: string,
    groupProperties?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      this.client.groupIdentify({
        groupType,
        groupKey,
        properties: groupProperties || {},
      });

      this.logger.debug(`👥 Group identified: ${groupType}/${groupKey}`);
    } catch (error) {
      this.logger.error(`Failed to identify group: ${groupType}/${groupKey}`, error);
    }
  }

  /**
   * Track a feature flag evaluation
   */
  async captureFeatureFlagCalled(
    userId: string,
    featureFlag: string,
    value: unknown
  ): Promise<void> {
    await this.capture({
      distinctId: userId,
      event: '$feature_flag_called',
      properties: {
        $feature_flag: featureFlag,
        $feature_flag_response: value,
      },
    });
  }

  /**
   * Flush all pending events immediately
   */
  async flush(): Promise<void> {
    if (this.client) {
      await this.client.flush();
    }
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled && this.client !== null;
  }
}