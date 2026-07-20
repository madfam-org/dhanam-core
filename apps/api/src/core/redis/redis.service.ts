// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor() {
    // Prefer REDIS_URL (standard format) over individual env vars
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      this.logger.log('Connecting to Redis via REDIS_URL');
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
      });
    } else {
      // Fallback to individual env vars for backwards compatibility
      this.logger.log('Connecting to Redis via individual env vars (REDIS_HOST/PORT)');
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
      });
    }

    this.redis.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  getClient(): Redis {
    return this.redis;
  }

  // Expose common Redis methods
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redis.set(key, value, 'EX', ttl);
    }
    return this.redis.set(key, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async ping(): Promise<boolean> {
    const result = await this.redis.ping();
    return result === 'PONG';
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}