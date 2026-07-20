// SPDX-License-Identifier: AGPL-3.0-or-later
import { RATE_LIMIT_WINDOWS } from '@dhanam-core/shared';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

import { RedisModule } from '@core/redis/redis.module';

export { SubscriptionThrottleGuard } from './guards/subscription-throttle.guard';

/**
 * Redis-backed rate limiting storage for distributed deployments.
 * SOC 2 Control: Distributed rate limiting across multiple API instances.
 */
class RedisThrottlerStorage implements ThrottlerStorage {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      keyPrefix: 'throttle:',
      maxRetriesPerRequest: 1,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.pttl(key);
    const results = await multi.exec();

    const totalHits = (results?.[0]?.[1] as number) || 1;
    let timeToExpire = (results?.[1]?.[1] as number) || -1;

    if (timeToExpire < 0) {
      await this.redis.pexpire(key, ttl);
      timeToExpire = ttl;
    }

    const isBlocked = totalHits > limit;
    const timeToBlockExpire = isBlocked ? blockDuration : 0;

    if (isBlocked && blockDuration > 0) {
      await this.redis.pexpire(key, blockDuration);
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: RATE_LIMIT_WINDOWS.SHORT * 1000,
            limit: 60,
          },
          {
            name: 'medium',
            ttl: RATE_LIMIT_WINDOWS.MEDIUM * 1000,
            limit: 300,
          },
          {
            name: 'long',
            ttl: RATE_LIMIT_WINDOWS.LONG * 1000,
            limit: 1000,
          },
        ],
        storage: configService.get('REDIS_URL') ? new RedisThrottlerStorage() : undefined,
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}