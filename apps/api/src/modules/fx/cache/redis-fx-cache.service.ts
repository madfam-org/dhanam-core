// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '@core/redis/redis.service';

import { FxRateType } from '../dto/fx-rate.dto';
import { FxProviderRate } from '../providers/fx-provider.interface';

/**
 * Per-rate-type TTLs.
 *
 *   spot     →  60s  (provider chain refreshes every minute)
 *   dof      →  24h  (Banxico publishes once daily ~12:00 CDMX)
 *   settled  →  none — a point-in-time fact recorded post-hoc; reads bypass the cache
 */
export const FX_TTL_SECONDS: Record<FxRateType, number> = {
  [FxRateType.spot]: 60,
  [FxRateType.dof]: 24 * 60 * 60,
  [FxRateType.settled]: 0,
};

/**
 * Wraps `RedisService` with the FX-specific key shape and TTL semantics.
 *
 * Cache shape:
 *   key   = `fx:{type}:{from}:{to}:{at|latest}`
 *   value = JSON-serialized {@link FxProviderRate} plus the source provider name
 *
 * All errors are caught and logged at WARN — cache is best-effort and must never
 * block the request path.
 */
@Injectable()
export class RedisFxCacheService {
  private readonly logger = new Logger(RedisFxCacheService.name);
  private readonly KEY_PREFIX = 'fx';

  constructor(private readonly redis: RedisService) {}

  buildKey(type: FxRateType, from: string, to: string, at?: Date): string {
    const stamp = at ? at.toISOString().slice(0, 10) : 'latest';
    return `${this.KEY_PREFIX}:${type}:${from}:${to}:${stamp}`;
  }

  async get(type: FxRateType, from: string, to: string, at?: Date): Promise<FxProviderRate | null> {
    if (type === FxRateType.settled) return null;
    try {
      const key = this.buildKey(type, from, to, at);
      const raw = await this.redis.get(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Omit<FxProviderRate, 'observed_at' | 'effective_at'> & {
        observed_at: string;
        effective_at: string;
      };
      return {
        ...parsed,
        observed_at: new Date(parsed.observed_at),
        effective_at: new Date(parsed.effective_at),
      };
    } catch (err) {
      this.logger.warn(`Cache GET failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(type: FxRateType, value: FxProviderRate, at?: Date): Promise<void> {
    if (type === FxRateType.settled) return;
    try {
      const key = this.buildKey(type, value.from, value.to, at);
      const ttl = FX_TTL_SECONDS[type];
      if (!ttl) return;
      const payload = JSON.stringify({
        ...value,
        observed_at: value.observed_at.toISOString(),
        effective_at: value.effective_at.toISOString(),
      });
      await this.redis.set(key, payload, ttl);
    } catch (err) {
      this.logger.warn(`Cache SET failed: ${(err as Error).message}`);
    }
  }
}