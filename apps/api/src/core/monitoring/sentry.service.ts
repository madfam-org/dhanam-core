// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import type { User } from '@db';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isEnabled = !!this.configService.get('SENTRY_DSN');
  }

  onModuleInit() {
    if (!this.isEnabled) {
      this.logger.warn('Sentry not configured - error monitoring disabled');
      return;
    }

    const dsn = this.configService.get('SENTRY_DSN');
    const environment = this.configService.get('NODE_ENV', 'development');
    const release = this.configService.get('SENTRY_RELEASE') || 'dhanam-api@dev';

    Sentry.init({
      dsn,
      environment,
      release,

      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      integrations: [
        nodeProfilingIntegration(),
        Sentry.httpIntegration(),
        Sentry.onUncaughtExceptionIntegration(),
        Sentry.onUnhandledRejectionIntegration(),
      ],

      // Error filtering
      beforeSend(event, hint) {
        // Don't send errors in test environment
        if (process.env.NODE_ENV === 'test') {
          return null;
        }

        // Filter out expected errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't send validation errors (user mistakes)
          if (error.message.includes('Validation failed')) {
            return null;
          }

          // Don't send authentication errors (expected)
          if (
            error.message.includes('Unauthorized') ||
            error.message.includes('Invalid credentials')
          ) {
            return null;
          }
        }

        return event;
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Don't log sensitive data in breadcrumbs
        if (breadcrumb.category === 'http' && breadcrumb.data) {
          // Remove sensitive headers
          if (breadcrumb.data.headers) {
            delete breadcrumb.data.headers.authorization;
            delete breadcrumb.data.headers.cookie;
          }

          // Remove sensitive query params
          if (breadcrumb.data.url) {
            const url = new URL(breadcrumb.data.url);
            url.searchParams.delete('token');
            url.searchParams.delete('password');
            breadcrumb.data.url = url.toString();
          }
        }

        return breadcrumb;
      },
    });

    this.logger.log(`Sentry initialized for ${environment} environment`);
  }

  /**
   * Capture an exception with additional context
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture a message (for non-error events)
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>
  ) {
    if (!this.isEnabled) return;

    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: Partial<User> | null) {
    if (!this.isEnabled) return;

    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, data?: Record<string, any>, category = 'custom') {
    if (!this.isEnabled) return;

    Sentry.addBreadcrumb({
      message,
      data,
      category,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string) {
    if (!this.isEnabled) return null;

    return Sentry.startSpan({ name, op }, (span) => span);
  }

  /**
   * Add tags to current scope
   */
  setTags(tags: Record<string, string>) {
    if (!this.isEnabled) return;

    Sentry.setTags(tags);
  }

  /**
   * Add context to current scope
   */
  setContext(name: string, context: Record<string, any>) {
    if (!this.isEnabled) return;

    Sentry.setContext(name, context);
  }

  /**
   * Flush pending events (useful before shutdown)
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.isEnabled) return true;

    return Sentry.flush(timeout);
  }

  /**
   * Close the Sentry client
   */
  async close(timeout = 2000): Promise<boolean> {
    if (!this.isEnabled) return true;

    return Sentry.close(timeout);
  }

  /**
   * Check if Sentry is enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }
}
