// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes, createHash } from 'crypto';

import { AUTH_DEFAULTS, TIME_UNITS } from '@dhanam-core/shared';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { InfrastructureException, SecurityException } from '@core/exceptions/domain-exceptions';
import { LoggerService } from '@core/logger/logger.service';
import { withRetry, RETRY_PRESETS } from '@core/utils/retry.util';

export interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private redis: Redis;
  private isRedisConnected = false;

  constructor(private logger: LoggerService) {
    const redisUrl = process.env.REDIS_URL;
    const redisOptions = {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        if (times > 5) {
          this.logger.error('Redis connection failed after 5 retries', '', 'SessionService');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000); // Exponential backoff up to 2s
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
    };

    // Prefer REDIS_URL (standard format) over individual env vars
    if (redisUrl) {
      this.logger.log('SessionService connecting via REDIS_URL', 'SessionService');
      this.redis = new Redis(redisUrl, redisOptions);
    } else {
      this.logger.log('SessionService connecting via REDIS_HOST/PORT', 'SessionService');
      this.redis = new Redis({
        ...redisOptions,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      });
    }

    // Track connection state
    this.redis.on('connect', () => {
      this.isRedisConnected = true;
      this.logger.log('Redis connected', 'SessionService');
    });

    this.redis.on('error', (error: Error) => {
      this.isRedisConnected = false;
      this.logger.error('Redis error', error.message, 'SessionService');
    });

    this.redis.on('close', () => {
      this.isRedisConnected = false;
      this.logger.warn('Redis connection closed', 'SessionService');
    });
  }

  /**
   * Execute Redis operation with retry and error handling
   */
  private async executeRedisOperation<T>(
    operation: string,
    redisCall: () => Promise<T>
  ): Promise<T> {
    if (!this.isRedisConnected && this.redis.status !== 'ready') {
      // Try to reconnect if disconnected
      try {
        await this.redis.ping();
        this.isRedisConnected = true;
      } catch (_pingError) {
        throw InfrastructureException.cacheError(operation, new Error('Redis not connected'));
      }
    }

    try {
      return await withRetry(redisCall, {
        ...RETRY_PRESETS.cache,
        operationType: `redis.${operation}`,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Check for specific Redis errors
      if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
        this.isRedisConnected = false;
        throw InfrastructureException.cacheError(operation, err);
      }

      throw InfrastructureException.cacheError(operation, err);
    }
  }

  async createRefreshToken(userId: string, email: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    const refreshExpirySeconds = AUTH_DEFAULTS.REFRESH_TOKEN_EXPIRY_DAYS * TIME_UNITS.DAY_SECONDS;
    const expiresAt = Date.now() + refreshExpirySeconds * 1000;

    const sessionData: SessionData = {
      userId,
      email,
      createdAt: Date.now(),
      expiresAt,
    };

    // Store in Redis with expiration (with retry and error handling)
    await this.executeRedisOperation('setex_refresh_token', () =>
      this.redis.setex(
        `refresh_token:${hashedToken}`,
        refreshExpirySeconds,
        JSON.stringify(sessionData)
      )
    );

    // Track user's active sessions
    await this.executeRedisOperation('sadd_user_sessions', async () => {
      await this.redis.sadd(`user_sessions:${userId}`, hashedToken);
      await this.redis.expire(
        `user_sessions:${userId}`,
        AUTH_DEFAULTS.REFRESH_TOKEN_EXPIRY_DAYS * TIME_UNITS.DAY_SECONDS
      );
    });

    this.logger.log(`Refresh token created for user: ${userId}`, 'SessionService');

    return token;
  }

  async validateRefreshToken(token: string): Promise<SessionData | null> {
    const hashedToken = this.hashToken(token);

    let sessionDataStr: string | null;
    try {
      sessionDataStr = await this.executeRedisOperation('get_refresh_token', () =>
        this.redis.get(`refresh_token:${hashedToken}`)
      );
    } catch (_redisError) {
      // On Redis failure, return null (graceful degradation)
      this.logger.warn('Redis unavailable during token validation', 'SessionService');
      return null;
    }

    if (!sessionDataStr) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(sessionDataStr);

      // Check if token is expired
      if (Date.now() > sessionData.expiresAt) {
        await this.revokeRefreshToken(token);
        throw SecurityException.tokenExpired();
      }

      return sessionData;
    } catch (_error) {
      if (_error instanceof SecurityException) {
        throw _error;
      }
      this.logger.error(
        'Failed to parse session data',
        (_error as Error).message,
        'SessionService'
      );
      await this.revokeRefreshToken(token);
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);

    try {
      // Get session data to remove from user's active sessions
      const sessionDataStr = await this.executeRedisOperation('get_for_revoke', () =>
        this.redis.get(`refresh_token:${hashedToken}`)
      );

      if (sessionDataStr) {
        try {
          const sessionData: SessionData = JSON.parse(sessionDataStr);
          await this.executeRedisOperation('srem_user_sessions', () =>
            this.redis.srem(`user_sessions:${sessionData.userId}`, hashedToken)
          );
        } catch (parseError) {
          this.logger.error(
            'Failed to parse session data during revocation',
            (parseError as Error).message,
            'SessionService'
          );
        }
      }

      await this.executeRedisOperation('del_refresh_token', () =>
        this.redis.del(`refresh_token:${hashedToken}`)
      );
      this.logger.log('Refresh token revoked', 'SessionService');
    } catch (error) {
      // Log but don't throw - revocation should be best-effort
      this.logger.error(
        'Failed to revoke refresh token',
        (error as Error).message,
        'SessionService'
      );
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const hashedTokens = await this.executeRedisOperation('smembers_user_sessions', () =>
        this.redis.smembers(`user_sessions:${userId}`)
      );

      const pipeline = this.redis.pipeline();

      // Remove all refresh tokens
      for (const hashedToken of hashedTokens) {
        pipeline.del(`refresh_token:${hashedToken}`);
      }

      // Remove user sessions set
      pipeline.del(`user_sessions:${userId}`);

      await this.executeRedisOperation('pipeline_exec', () => pipeline.exec());

      this.logger.log(`All sessions revoked for user: ${userId}`, 'SessionService');
    } catch (error) {
      // Log but don't throw - revocation should be best-effort
      this.logger.error(
        `Failed to revoke all sessions for user ${userId}`,
        (error as Error).message,
        'SessionService'
      );
    }
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(token);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store reset token (with retry and error handling)
    await this.executeRedisOperation('setex_password_reset', () =>
      this.redis.setex(
        `password_reset:${hashedToken}`,
        60 * 60, // 1 hour in seconds
        JSON.stringify({ userId, expiresAt })
      )
    );

    this.logger.log(`Password reset token created for user: ${userId}`, 'SessionService');

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const hashedToken = this.hashToken(token);

    let resetDataStr: string | null;
    try {
      resetDataStr = await this.executeRedisOperation('get_password_reset', () =>
        this.redis.get(`password_reset:${hashedToken}`)
      );
    } catch (_redisError) {
      // On Redis failure, return null (graceful degradation)
      this.logger.warn('Redis unavailable during password reset validation', 'SessionService');
      return null;
    }

    if (!resetDataStr) {
      return null;
    }

    try {
      const resetData = JSON.parse(resetDataStr);

      if (Date.now() > resetData.expiresAt) {
        await this.executeRedisOperation('del_expired_reset', () =>
          this.redis.del(`password_reset:${hashedToken}`)
        );
        return null;
      }

      // Single-use token - delete after validation
      await this.executeRedisOperation('del_used_reset', () =>
        this.redis.del(`password_reset:${hashedToken}`)
      );

      return resetData.userId;
    } catch (error) {
      this.logger.error(
        'Failed to parse reset token data',
        (error as Error).message,
        'SessionService'
      );
      try {
        await this.executeRedisOperation('del_invalid_reset', () =>
          this.redis.del(`password_reset:${hashedToken}`)
        );
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
}
