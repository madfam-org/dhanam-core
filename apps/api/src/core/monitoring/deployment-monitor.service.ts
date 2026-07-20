// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SentryService } from './sentry.service';

export interface ErrorRateMetrics {
  windowStart: Date;
  windowEnd: Date;
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  errorsByType: Record<string, number>;
}

export interface DeploymentHealth {
  healthy: boolean;
  errorRate: number;
  threshold: number;
  windowMinutes: number;
  lastChecked: Date;
  alerts: string[];
}

@Injectable()
export class DeploymentMonitorService implements OnModuleInit {
  private readonly logger = new Logger(DeploymentMonitorService.name);

  // Configurable thresholds
  private readonly ERROR_RATE_THRESHOLD: number;
  private readonly MONITORING_WINDOW_MINUTES: number;
  private readonly CHECK_INTERVAL_MS: number;

  // In-memory metrics tracking
  private requestCount = 0;
  private errorCount = 0;
  private errorsByType: Record<string, number> = {};
  private windowStart = new Date();
  private checkInterval: NodeJS.Timeout | null = null;
  private deploymentTimestamp: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly sentryService: SentryService
  ) {
    // Default: 5% error rate threshold
    this.ERROR_RATE_THRESHOLD = parseFloat(
      this.configService.get('DEPLOYMENT_ERROR_THRESHOLD', '0.05')
    );
    // Default: 5 minute window
    this.MONITORING_WINDOW_MINUTES = parseInt(
      this.configService.get('DEPLOYMENT_MONITOR_WINDOW_MINUTES', '5'),
      10
    );
    // Default: check every 30 seconds
    this.CHECK_INTERVAL_MS = parseInt(
      this.configService.get('DEPLOYMENT_MONITOR_INTERVAL_MS', '30000'),
      10
    );
  }

  onModuleInit() {
    // Start monitoring
    this.startMonitoring();
    this.logger.log(
      `Deployment monitor started (threshold: ${this.ERROR_RATE_THRESHOLD * 100}%, window: ${this.MONITORING_WINDOW_MINUTES}min)`
    );
  }

  /**
   * Mark the start of a new deployment for enhanced monitoring
   */
  markDeploymentStart(): void {
    this.deploymentTimestamp = new Date();
    this.resetMetrics();
    this.logger.log('Deployment marked - enhanced monitoring active');
  }

  /**
   * Record a successful request
   */
  recordRequest(): void {
    this.requestCount++;
  }

  /**
   * Record an error with optional categorization
   */
  recordError(errorType = 'unknown'): void {
    this.requestCount++;
    this.errorCount++;
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
  }

  /**
   * Get current error rate metrics
   */
  getMetrics(): ErrorRateMetrics {
    const now = new Date();
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

    return {
      windowStart: this.windowStart,
      windowEnd: now,
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      errorRate,
      errorsByType: { ...this.errorsByType },
    };
  }

  /**
   * Get deployment health status
   */
  getDeploymentHealth(): DeploymentHealth {
    const metrics = this.getMetrics();
    const alerts: string[] = [];

    // Check if error rate exceeds threshold
    if (metrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      alerts.push(
        `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold ${(this.ERROR_RATE_THRESHOLD * 100).toFixed(2)}%`
      );
    }

    // Check for specific error patterns
    const highErrorTypes = Object.entries(this.errorsByType)
      .filter(([_, count]) => count > 10)
      .map(([type]) => type);

    if (highErrorTypes.length > 0) {
      alerts.push(`High error counts for: ${highErrorTypes.join(', ')}`);
    }

    // Check if we're in post-deployment monitoring window
    const isPostDeployment =
      this.deploymentTimestamp &&
      new Date().getTime() - this.deploymentTimestamp.getTime() <
        this.MONITORING_WINDOW_MINUTES * 2 * 60 * 1000;

    if (isPostDeployment && metrics.errorRate > this.ERROR_RATE_THRESHOLD * 0.5) {
      alerts.push('Warning: Elevated error rate detected shortly after deployment');
    }

    return {
      healthy: metrics.errorRate <= this.ERROR_RATE_THRESHOLD && alerts.length === 0,
      errorRate: metrics.errorRate,
      threshold: this.ERROR_RATE_THRESHOLD,
      windowMinutes: this.MONITORING_WINDOW_MINUTES,
      lastChecked: new Date(),
      alerts,
    };
  }

  /**
   * Check if deployment should be rolled back based on error rate
   */
  shouldTriggerRollback(): boolean {
    const metrics = this.getMetrics();

    // Only consider rollback if we have enough data
    if (this.requestCount < 100) {
      return false;
    }

    // Trigger rollback if error rate is significantly above threshold
    return metrics.errorRate > this.ERROR_RATE_THRESHOLD * 2;
  }

  private startMonitoring(): void {
    // Periodic check and reset
    this.checkInterval = setInterval(() => {
      this.checkAndRotateWindow();
    }, this.CHECK_INTERVAL_MS);
  }

  private checkAndRotateWindow(): void {
    const metrics = this.getMetrics();
    const health = this.getDeploymentHealth();

    // Log metrics periodically
    if (this.requestCount > 0) {
      this.logger.debug(
        `Metrics: ${this.requestCount} requests, ${this.errorCount} errors (${(metrics.errorRate * 100).toFixed(2)}%)`
      );
    }

    // Alert on unhealthy state
    if (!health.healthy) {
      this.logger.warn(`Deployment health alert: ${health.alerts.join('; ')}`);

      // Report to Sentry
      this.sentryService.captureMessage('Deployment health degraded', 'warning', {
        metrics,
        health,
      });
    }

    // Check for rollback condition
    if (this.shouldTriggerRollback()) {
      this.logger.error(
        `CRITICAL: Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds rollback threshold`
      );

      this.sentryService.captureMessage('Rollback condition detected', 'error', {
        metrics,
        health,
        recommendation: 'Consider rolling back to previous version',
      });
    }

    // Rotate window if it exceeds the configured duration
    const windowDurationMs = new Date().getTime() - this.windowStart.getTime();
    if (windowDurationMs > this.MONITORING_WINDOW_MINUTES * 60 * 1000) {
      this.resetMetrics();
    }
  }

  private resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.errorsByType = {};
    this.windowStart = new Date();
  }

  /**
   * Stop monitoring (called during shutdown)
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.logger.log('Deployment monitor stopped');
  }
}