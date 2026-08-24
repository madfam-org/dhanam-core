// SPDX-License-Identifier: AGPL-3.0-or-later
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  BusinessRuleException,
  ProviderException,
  ValidationException,
  ErrorCode,
} from '@core/exceptions/domain-exceptions';
import { PrismaService } from '@core/prisma/prisma.service';

import { RedisFxCacheService, FX_TTL_SECONDS } from './cache/redis-fx-cache.service';
import {
  FxHistoryEntry,
  FxHistoryResponse,
  FxRateProvenance,
  FxRateResponse,
  FxRatesBatchResponse,
  FxRateType,
} from './dto/fx-rate.dto';
import { FxProvider, FxProviderRate } from './providers/fx-provider.interface';

/**
 * DI token for injecting the ordered provider chain (failover order matters):
 *
 *   1. OpenExchangeRates  (paid spot)
 *   2. exchangerate.host  (free spot)
 *   3. Banxico SIE        (DOF only)
 *
 * A manual override, when present, is applied at the service layer ahead of the
 * chain. The FAKE_RATE provider opts itself in via `FX_FAKE_PROVIDER_ENABLED=true`
 * and is registered last so it never overrides a real provider.
 */
export const FX_PROVIDER_CHAIN = 'FX_PROVIDER_CHAIN';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisFxCacheService,
    @Inject(FX_PROVIDER_CHAIN) private readonly providers: FxProvider[]
  ) {}

  // ── Public API surface (consumed by the controller) ────────────────────

  async getRate(params: {
    from: string;
    to: string;
    type: FxRateType;
    at?: Date;
    paymentId?: string;
    allowStale?: boolean;
  }): Promise<FxRateResponse> {
    const from = normalizeCurrency(params.from);
    const to = normalizeCurrency(params.to);
    const { type, at, paymentId, allowStale } = params;

    if (type === FxRateType.settled) {
      return this.getSettledRate(from, to, paymentId);
    }

    // An active manual override beats the chain.
    const override = await this.findActiveOverride(from, to, type, at);
    if (override) {
      return this.formatResponse(
        {
          from,
          to,
          rate: override.rate.toString(),
          provider_id: `override:${override.id}`,
          observed_at: override.createdAt,
          effective_at: at ?? override.createdAt,
          source: 'manual_override',
        },
        type,
        false,
        `override active until ${override.expiresAt?.toISOString() ?? 'expiry-not-set'}`
      );
    }

    // Cache hit fast path.
    const cached = await this.cache.get(type, from, to, at);
    if (cached) {
      return this.formatResponse(cached, type, false);
    }

    // Provider chain.
    const result = await this.runProviderChain(from, to, type, at);
    if (result) {
      await this.recordObservation(result, type);
      await this.cache.set(type, result, at);
      // Persist DOF rows to the publications table for SAT-defensible history.
      if (type === FxRateType.dof) {
        await this.recordPublication(result);
      }
      return this.formatResponse(result, type, result.source !== this.providers[0]?.name);
    }

    // Provider chain exhausted. Surface a degraded last-known-good if asked,
    // otherwise fail closed.
    if (allowStale) {
      const stale = await this.findLastKnownGood(from, to, type);
      if (stale) {
        return this.formatResponse(
          stale,
          type,
          true,
          'serving last_known_good (provider chain exhausted)'
        );
      }
    }
    throw new ProviderException(
      ErrorCode.PROVIDER_UNAVAILABLE,
      `No FX provider could serve ${from}->${to} (${type})`,
      { provider: 'fx_chain', retryable: true, retryAfterMs: 30_000 }
    );
  }

  async getRatesBatch(params: {
    base: string;
    targets: string[];
    type: FxRateType;
    at?: Date;
  }): Promise<FxRatesBatchResponse> {
    if (params.type === FxRateType.settled) {
      throw ValidationException.invalidInput(
        'type',
        'Batch rate lookup does not support type=settled (settled is per-payment).'
      );
    }
    const base = normalizeCurrency(params.base);
    const targets = params.targets.map(normalizeCurrency);
    const observedAt = new Date();
    const rates: FxRatesBatchResponse['rates'] = {};

    for (const target of targets) {
      try {
        const r = await this.getRate({ from: base, to: target, type: params.type, at: params.at });
        rates[target] = {
          rate: r.rate,
          source: r.source,
          effective_at: r.effective_at,
          stale_after: r.stale_after,
          provenance: r.provenance,
        };
      } catch (err) {
        this.logger.warn(`Batch rate skipped ${base}->${target}: ${(err as Error).message}`);
        // Skip silently — batch is best-effort. Caller can re-issue per-pair to get the error envelope.
      }
    }

    return {
      base,
      type: params.type,
      observed_at: observedAt.toISOString(),
      rates,
    };
  }

  async getHistory(params: {
    from: string;
    to: string;
    type: FxRateType;
    fromDate: Date;
    toDate: Date;
  }): Promise<FxHistoryResponse> {
    if (params.type === FxRateType.settled) {
      throw ValidationException.invalidInput(
        'type',
        'History does not support type=settled (settled is per-payment).'
      );
    }
    if (params.fromDate > params.toDate) {
      throw ValidationException.invalidInput('from_date', 'from_date must be <= to_date');
    }
    const from = normalizeCurrency(params.from);
    const to = normalizeCurrency(params.to);

    if (params.type === FxRateType.dof) {
      const rows = await this.prisma.fxRatePublication.findMany({
        where: {
          fromCurrency: from,
          toCurrency: to,
          effectiveDate: { gte: params.fromDate, lte: params.toDate },
        },
        orderBy: { effectiveDate: 'asc' },
      });
      return {
        from,
        to,
        type: params.type,
        from_date: params.fromDate.toISOString(),
        to_date: params.toDate.toISOString(),
        count: rows.length,
        entries: rows.map<FxHistoryEntry>((r) => ({
          effective_date: r.effectiveDate.toISOString(),
          rate: r.rate.toString(),
          source: r.source,
          provider_id: r.providerId,
        })),
      };
    }

    // spot history reads from the observations table — every value the chain has seen.
    const rows = await this.prisma.fxRateObservation.findMany({
      where: {
        fromCurrency: from,
        toCurrency: to,
        rateType: params.type,
        effectiveAt: { gte: params.fromDate, lte: params.toDate },
      },
      orderBy: { effectiveAt: 'asc' },
    });
    return {
      from,
      to,
      type: params.type,
      from_date: params.fromDate.toISOString(),
      to_date: params.toDate.toISOString(),
      count: rows.length,
      entries: rows.map<FxHistoryEntry>((r) => ({
        effective_date: r.effectiveAt.toISOString(),
        rate: r.rate.toString(),
        source: r.source,
        provider_id: r.providerId,
      })),
    };
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private async runProviderChain(
    from: string,
    to: string,
    type: FxRateType,
    at?: Date
  ): Promise<FxProviderRate | null> {
    for (const provider of this.providers) {
      if (!provider.supports(type)) continue;
      try {
        const r = await provider.getRate(from, to, type, at);
        if (r) {
          this.logger.debug(`FX provider ${provider.name} served ${from}->${to} (${type})`);
          return r;
        }
      } catch (err) {
        this.logger.warn(
          `FX provider ${provider.name} threw for ${from}->${to} (${type}): ${(err as Error).message}`
        );
        // Fall through to the next provider.
      }
    }
    return null;
  }

  private async getSettledRate(
    from: string,
    to: string,
    paymentId?: string
  ): Promise<FxRateResponse> {
    if (!paymentId) {
      throw ValidationException.invalidInput(
        'payment_id',
        'payment_id is required for type=settled'
      );
    }
    // Settlement rates are recorded post-hoc by an external settlement producer
    // and surfaced read-only here. If no row has been recorded for this payment,
    // we return not-found rather than papering over the gap.
    const obs = await this.prisma.fxRateObservation.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: to,
        rateType: FxRateType.settled,
        paymentId,
      },
      orderBy: { effectiveAt: 'desc' },
    });
    if (!obs) {
      throw BusinessRuleException.resourceNotFound('fx_rate.settled', paymentId);
    }
    return this.formatResponse(
      {
        from,
        to,
        rate: obs.rate.toString(),
        provider_id: obs.providerId ?? `settled:${paymentId}`,
        observed_at: obs.observedAt,
        effective_at: obs.effectiveAt,
        source: obs.source,
      },
      FxRateType.settled,
      false
    );
  }

  private async findActiveOverride(
    from: string,
    to: string,
    type: FxRateType,
    _at?: Date
  ): Promise<{ id: string; rate: string; createdAt: Date; expiresAt: Date | null } | null> {
    const now = new Date();
    const row = await this.prisma.fxRateOverride.findFirst({
      where: {
        fromCurrency: from,
        toCurrency: to,
        rateType: type,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return {
      id: row.id,
      rate: row.rate.toString(),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    };
  }

  private async findLastKnownGood(
    from: string,
    to: string,
    type: FxRateType
  ): Promise<FxProviderRate | null> {
    const obs = await this.prisma.fxRateObservation.findFirst({
      where: { fromCurrency: from, toCurrency: to, rateType: type },
      orderBy: { observedAt: 'desc' },
    });
    if (!obs) return null;
    return {
      from,
      to,
      rate: obs.rate.toString(),
      provider_id: obs.providerId ?? `db:lkg:${obs.id}`,
      observed_at: obs.observedAt,
      effective_at: obs.effectiveAt,
      source: obs.source,
    };
  }

  private async recordObservation(value: FxProviderRate, type: FxRateType): Promise<void> {
    try {
      await this.prisma.fxRateObservation.create({
        data: {
          fromCurrency: value.from,
          toCurrency: value.to,
          rateType: type,
          rate: value.rate,
          source: value.source,
          providerId: value.provider_id,
          observedAt: value.observed_at,
          effectiveAt: value.effective_at,
        },
      });
    } catch (err) {
      // Storage is best-effort. A duplicate-key race on (provider_id) is fine.
      this.logger.warn(`Failed to record FX observation: ${(err as Error).message}`);
    }
  }

  private async recordPublication(value: FxProviderRate): Promise<void> {
    try {
      const effectiveDate = startOfUtcDay(value.effective_at);
      await this.prisma.fxRatePublication.upsert({
        where: {
          fromCurrency_toCurrency_effectiveDate: {
            fromCurrency: value.from,
            toCurrency: value.to,
            effectiveDate,
          },
        },
        update: {
          rate: value.rate,
          source: value.source,
          providerId: value.provider_id,
          publishedAt: value.observed_at,
        },
        create: {
          fromCurrency: value.from,
          toCurrency: value.to,
          effectiveDate,
          rate: value.rate,
          source: value.source,
          providerId: value.provider_id,
          publishedAt: value.observed_at,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record FX publication: ${(err as Error).message}`);
    }
  }

  private formatResponse(
    value: FxProviderRate,
    type: FxRateType,
    fallbackChainUsed: boolean,
    note?: string
  ): FxRateResponse {
    const ttl = FX_TTL_SECONDS[type] ?? 0;
    const provenance: FxRateProvenance = {
      provider_id: value.provider_id,
      fallback_chain_used: fallbackChainUsed,
      ...(note ? { note } : {}),
    };
    return {
      from: value.from,
      to: value.to,
      rate: value.rate,
      type,
      source: value.source,
      observed_at: value.observed_at.toISOString(),
      effective_at: value.effective_at.toISOString(),
      stale_after: new Date(value.observed_at.getTime() + ttl * 1000).toISOString(),
      provenance,
    };
  }
}

function normalizeCurrency(raw: string): string {
  if (!raw || raw.length !== 3) {
    throw ValidationException.invalidInput('currency', 'Must be a 3-letter ISO 4217 code', raw);
  }
  return raw.toUpperCase();
}

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
