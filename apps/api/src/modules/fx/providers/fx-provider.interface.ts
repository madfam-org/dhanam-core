// SPDX-License-Identifier: AGPL-3.0-or-later
import { FxRateType } from '../dto/fx-rate.dto';

/**
 * The shape every upstream FX provider must return.
 *
 * `rate` is a string to preserve precision through the chain; the service formats it
 * to the API contract (decimal string, 4-6 dp) before responding.
 */
export interface FxProviderRate {
  from: string;
  to: string;
  rate: string;
  /** Stable identifier for this exact observation, e.g. `oer:2026-04-25T18:14:00Z`. */
  provider_id: string;
  /** When the provider says it captured the rate. */
  observed_at: Date;
  /** When the rate is *effective* (DOF: publication day in CDMX; spot: same as observed_at). */
  effective_at: Date;
  /** Provider name string used for `source` in the API response, e.g. `openexchangerates`. */
  source: string;
}

/**
 * Common contract for all FX providers in the chain.
 *
 * Providers SHOULD throw on transient failures so the service can fall through to
 * the next provider; they MAY return null for `unsupported pair` to skip without
 * costing failover budget.
 */
export interface FxProvider {
  /** Provider name for logging and observability. */
  readonly name: string;

  /** True if this provider can serve the requested rate type. */
  supports(type: FxRateType): boolean;

  /**
   * Fetch a single rate.
   *
   * @param from ISO 4217 source code (uppercase)
   * @param to   ISO 4217 target code (uppercase)
   * @param type Rate type — providers MUST honor `dof` semantics (no spot fallback)
   * @param at   Optional effective date for historical reads
   */
  getRate(from: string, to: string, type: FxRateType, at?: Date): Promise<FxProviderRate | null>;
}