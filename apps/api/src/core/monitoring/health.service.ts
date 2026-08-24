// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { PrismaService } from '@core/prisma/prisma.service';
import { QueueService } from '@core/queue/queue.service';
import { TIMEOUT_PRESETS } from '@core/utils/timeout.util';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    queues: HealthCheck;
    external: HealthCheck;
  };
  version: string;
  environment: string;
}

export interface BasicHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface QueueStat {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private isShuttingDown = false;
  private redisClient: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService
  ) {}

  /**
   * Mark the service as shutting down (called during graceful shutdown)
   */
  setShuttingDown(value: boolean): void {
    this.isShuttingDown = value;
  }

  async getBasicHealthStatus(): Promise<BasicHealthStatus> {
    const [dbResult, redisResult] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database: HealthCheck =
      dbResult.status === 'fulfilled' ? dbResult.value : this.createFailedCheck(dbResult.reason);
    const redis: HealthCheck =
      redisResult.status === 'fulfilled'
        ? redisResult.value
        : this.createFailedCheck(redisResult.reason);

    const status = database.status === 'up' && redis.status === 'up' ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: { database, redis },
    };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const [dbResult, redisResult, queuesResult, externalResult] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
      this.checkExternalServices(),
    ]);

    // Map core checks
    const database: HealthCheck =
      dbResult.status === 'fulfilled' ? dbResult.value : this.createFailedCheck(dbResult.reason);
    const redis: HealthCheck =
      redisResult.status === 'fulfilled'
        ? redisResult.value
        : this.createFailedCheck(redisResult.reason);
    const queues: HealthCheck =
      queuesResult.status === 'fulfilled'
        ? queuesResult.value
        : this.createFailedCheck(queuesResult.reason);
    const external: HealthCheck =
      externalResult.status === 'fulfilled'
        ? externalResult.value
        : this.createFailedCheck(externalResult.reason);

    const coreChecks: HealthCheck[] = [database, redis, queues, external];
    const overallStatus = this.determineOverallStatus(coreChecks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: {
        database,
        redis,
        queues,
        external,
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  async getReadinessStatus(): Promise<{
    ready: boolean;
    reason?: string;
    checks: Record<string, HealthCheck>;
  }> {
    // If shutting down, return not ready immediately
    if (this.isShuttingDown) {
      return {
        ready: false,
        reason: 'Service is shutting down',
        checks: {},
      };
    }

    const health = await this.getBasicHealthStatus();
    const ready = health.checks.database.status === 'up' && health.checks.redis.status === 'up';
    const failedServices = [health.checks.database, health.checks.redis]
      .filter((check) => check.status !== 'up')
      .map((check) => check.error || 'Unknown error');

    return {
      ready,
      reason: ready ? undefined : `Critical services unavailable: ${failedServices.join(', ')}`,
      checks: health.checks,
    };
  }

  async getLivenessStatus(): Promise<{ alive: boolean; uptime: number; shuttingDown: boolean }> {
    return {
      alive: !this.isShuttingDown,
      uptime: Date.now() - this.startTime,
      shuttingDown: this.isShuttingDown,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          connection: 'active',
        },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    const redisUrl = this.configService.get('REDIS_URL');

    if (!redisUrl) {
      return {
        status: 'down',
        error: 'Redis URL not configured',
      };
    }

    try {
      // Reuse shared Redis connection instead of creating a new one per health check
      if (!this.redisClient || this.redisClient.status === 'end') {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: TIMEOUT_PRESETS.health_check,
          lazyConnect: true,
        });
        await this.redisClient.connect();
      }
      await this.redisClient.ping();

      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          connection: 'active',
        },
      };
    } catch (error) {
      // Reset client on failure so next check creates a fresh connection
      if (this.redisClient) {
        try {
          this.redisClient.disconnect();
        } catch {
          // ignore disconnect errors
        }
        this.redisClient = null;
      }
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Redis check failed',
      };
    }
  }

  private async checkQueues(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const queueStats = await this.queueService.getAllQueueStats();

      const failedJobs = queueStats.reduce((sum: number, q: QueueStat) => sum + q.failed, 0);
      const failedQueues = queueStats
        .filter((queue: QueueStat) => queue.failed > 0)
        .map((queue: QueueStat) => ({ name: queue.name, failed: queue.failed }));
      const BACKPRESSURE_THRESHOLD = 1000;
      const hasBackpressure = queueStats.some(
        (queue: QueueStat) => queue.waiting > BACKPRESSURE_THRESHOLD
      );

      const status = hasBackpressure ? 'down' : failedJobs > 0 ? 'degraded' : 'up';

      return {
        status,
        responseTime: Date.now() - start,
        details: {
          queues: queueStats.length,
          totalJobs: queueStats.reduce(
            (sum: number, q: QueueStat) => sum + q.active + q.waiting + q.completed,
            0
          ),
          failedJobs,
          failedQueues,
          waitingJobs: queueStats.reduce((sum: number, q: QueueStat) => sum + q.waiting, 0),
          backpressure: hasBackpressure,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Queue check failed',
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const start = Date.now();
    const checks: Array<{ name: string; status: string; statusCode?: number; error?: string }> = [];
    const banxicoToken =
      this.configService.get<string>('BANXICO_API_TOKEN', '') ||
      this.configService.get<string>('BANXICO_SIE_TOKEN', '');

    if (!banxicoToken) {
      return {
        status: 'up',
        responseTime: Date.now() - start,
        details: {
          services: [
            {
              name: 'Banxico',
              status: 'unconfigured',
              optional: true,
            },
          ],
        },
      };
    }

    // Check the same Banxico SIE surface used by the FX providers. The old
    // unauthenticated /doc probe returns 404 and creates a false outage.
    const endpoints = [
      {
        name: 'Banxico',
        url: `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno?token=${encodeURIComponent(
          banxicoToken
        )}`,
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PRESETS.health_check);

        const response = await fetch(endpoint.url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        clearTimeout(timeoutId);

        checks.push({
          name: endpoint.name,
          status: response.ok ? 'up' : 'down',
          statusCode: response.status,
        });
      } catch (error) {
        checks.push({
          name: endpoint.name,
          status: 'down',
          error: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    }

    const allUp = checks.every((check) => check.status === 'up');

    return {
      status: allUp ? 'up' : 'down',
      responseTime: Date.now() - start,
      details: { services: checks },
    };
  }

  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const downCount = checks.filter((check) => check.status === 'down').length;
    const degradedCount = checks.filter((check) => check.status === 'degraded').length;
    const totalChecks = checks.length;
    const nonDownCount = totalChecks - downCount;

    if (downCount === 0 && degradedCount === 0) {
      return 'healthy';
    } else if (downCount === 0 || nonDownCount >= totalChecks * 0.7) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private createFailedCheck(error: unknown): HealthCheck {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}
