// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    spaceId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  metadata?: Record<string, any>;
}

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async reportError(
    error: Error | string,
    context: ErrorReport['context'] = {},
    metadata: Record<string, any> = {},
    level: 'error' | 'warn' | 'info' = 'error'
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const report: Omit<ErrorReport, 'id'> = {
      timestamp: new Date(),
      level,
      message: errorMessage,
      stack,
      context,
      metadata,
    };

    // Log locally
    this.logError(report);

    // Store critical errors in database for analysis
    if (level === 'error') {
      try {
        await this.storeError(report);
      } catch (dbError) {
        this.logger.error('Failed to store error in database:', dbError);
      }
    }

    // In production, this could also send to external monitoring services
    // like Sentry, DataDog, or custom analytics
  }

  async getErrorStats(timeframe: 'hour' | 'day' | 'week' = 'day') {
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    try {
      const errorCounts = await this.prisma.errorLog.groupBy({
        by: ['level'],
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        _count: {
          level: true,
        },
      });

      const topErrors = await this.prisma.errorLog.groupBy({
        by: ['message'],
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        _count: {
          message: true,
        },
        _max: {
          timestamp: true,
        },
        orderBy: {
          _count: {
            message: 'desc',
          },
        },
        take: 10,
      });

      return {
        timeframe,
        period: { start: startTime, end: now },
        counts: errorCounts,
        topErrors,
      };
    } catch (error) {
      this.logger.error('Failed to get error stats:', error);
      return {
        timeframe,
        period: { start: startTime, end: now },
        counts: [],
        topErrors: [],
      };
    }
  }

  private logError(report: Omit<ErrorReport, 'id'>) {
    const logMessage = `${report.message} - Context: ${JSON.stringify(report.context)}`;

    switch (report.level) {
      case 'error':
        this.logger.error(logMessage, report.stack);
        break;
      case 'warn':
        this.logger.warn(logMessage);
        break;
      case 'info':
        this.logger.log(logMessage);
        break;
    }
  }

  private async storeError(report: Omit<ErrorReport, 'id'>) {
    try {
      await this.prisma.errorLog.create({
        data: {
          timestamp: report.timestamp,
          level: report.level,
          message: report.message,
          stack: report.stack,
          context: report.context,
          metadata: report.metadata,
        },
      });
    } catch {
      // If error_logs table doesn't exist, we'll just log locally
      this.logger.debug('Error logs table not available, using local logging only');
    }
  }

  // Predefined error types for consistent reporting
  async reportProviderError(
    provider: string,
    operation: string,
    error: Error,
    userId?: string,
    connectionId?: string
  ) {
    await this.reportError(
      error,
      {
        userId,
        endpoint: `providers/${provider}/${operation}`,
      },
      {
        provider,
        operation,
        connectionId,
      }
    );
  }

  async reportJobError(jobType: string, jobId: string, error: Error, payload?: unknown) {
    await this.reportError(
      error,
      {
        endpoint: `jobs/${jobType}`,
      },
      {
        jobType,
        jobId,
        payload: payload ? JSON.stringify(payload) : undefined,
      }
    );
  }

  async reportValidationError(
    endpoint: string,
    validationErrors: Array<{ message: string }>,
    userId?: string
  ) {
    await this.reportError(
      `Validation failed: ${validationErrors.map((e) => e.message).join(', ')}`,
      {
        userId,
        endpoint,
      },
      {
        validationErrors,
      },
      'warn'
    );
  }

  async reportSecurityEvent(event: string, details: string, userId?: string, ip?: string) {
    await this.reportError(
      `Security event: ${event} - ${details}`,
      {
        userId,
        ip,
        endpoint: 'security',
      },
      {
        securityEvent: event,
        details,
      },
      'warn'
    );
  }
}