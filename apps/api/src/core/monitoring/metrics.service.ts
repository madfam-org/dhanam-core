// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';
import { QueueService } from '@core/queue/queue.service';

export interface SystemMetrics {
  database: {
    totalUsers: number;
    totalSpaces: number;
    totalAccounts: number;
    totalTransactions: number;
    connectionsByProvider: Record<string, number>;
  };
  jobs: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    queuesByType: Array<{
      name: string;
      active: number;
      waiting: number;
      completed: number;
      failed: number;
    }>;
  };
  performance: {
    avgTransactionSyncTime: number;
    avgCategorizationTime: number;
    uptime: number;
  };
  usage: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    transactionsToday: number;
    transactionsThisWeek: number;
    transactionsThisMonth: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService
  ) {}

  async getSystemMetrics(): Promise<SystemMetrics> {
    const [database, jobs, usage] = await Promise.all([
      this.getDatabaseMetrics(),
      this.getJobMetrics(),
      this.getUsageMetrics(),
    ]);

    const performance = this.getPerformanceMetrics();

    return {
      database,
      jobs,
      performance,
      usage,
    };
  }

  private async getDatabaseMetrics() {
    const [totalUsers, totalSpaces, totalAccounts, totalTransactions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.space.count(),
      this.prisma.account.count(),
      this.prisma.transaction.count(),
    ]);

    return {
      totalUsers,
      totalSpaces,
      totalAccounts,
      totalTransactions,
      // Automatic provider connections (open-banking / exchange aggregation) are
      // not part of dhanam-core, so there are no connections to break down here.
      connectionsByProvider: {} as Record<string, number>,
    };
  }

  private async getJobMetrics() {
    try {
      const queueStats = await this.queueService.getAllQueueStats();

      const totalJobs = queueStats.reduce(
        (sum: number, q) => sum + q.active + q.waiting + q.completed + q.failed,
        0
      );
      const activeJobs = queueStats.reduce((sum: number, q) => sum + q.active, 0);
      const completedJobs = queueStats.reduce((sum: number, q) => sum + q.completed, 0);
      const failedJobs = queueStats.reduce((sum: number, q) => sum + q.failed, 0);

      return {
        totalJobs,
        activeJobs,
        completedJobs,
        failedJobs,
        queuesByType: queueStats,
      };
    } catch (error) {
      this.logger.error('Failed to get job metrics:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        queuesByType: [],
      };
    }
  }

  private getPerformanceMetrics() {
    // In a real implementation, these would be tracked in a metrics store
    // For now, return mock data
    return {
      avgTransactionSyncTime: 250, // ms
      avgCategorizationTime: 50, // ms
      uptime: Date.now() - this.startTime,
    };
  }

  private async getUsageMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      transactionsToday,
      transactionsThisWeek,
      transactionsThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          updatedAt: { gte: today },
        },
      }),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: thisWeek },
        },
      }),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: thisMonth },
        },
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: { gte: thisWeek },
        },
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: { gte: thisMonth },
        },
      }),
    ]);

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      transactionsToday,
      transactionsThisWeek,
      transactionsThisMonth,
    };
  }

  // Custom metrics tracking
  async recordSyncMetrics(provider: string, duration: number, success: boolean) {
    // In a real implementation, this would store metrics in a time-series database
    this.logger.log(
      `Sync metrics: ${provider} - ${duration}ms - ${success ? 'success' : 'failure'}`
    );
  }

  async recordCategorizationMetrics(
    transactionCount: number,
    categorized: number,
    duration: number
  ) {
    this.logger.log(
      `Categorization metrics: ${categorized}/${transactionCount} transactions - ${duration}ms`
    );
  }

  // System resource metrics
  getResourceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
      },
    };
  }
}