// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from '@nestjs/common';

import { FxRateType } from '../dto/fx-rate.dto';

import { FxProvider, FxProviderRate } from './fx-provider.interface';

/**
 * FAKE_RATE provider — used in:
 *   - Smoke tests (so the chain returns a deterministic value without network)
 *   - Local dev when no provider env vars are configured
 *
 * Active only when `FX_FAKE_PROVIDER_ENABLED=true`. Returns constant sample
 * values (e.g. 20.5 USD/MXN spot, 20.4521 DOF) so golden-file tests are
 * deterministic.
 *
 * NEVER enabled in production — guarded by env flag, not by NODE_ENV, so staging
 * smoke can opt in explicitly.
 */
@Injectable()
export class FakeRateProvider implements FxProvider {
  readonly name = 'fake_rate';
  private readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.FX_FAKE_PROVIDER_ENABLED === 'true';
  }

  supports(_type: FxRateType): boolean {
    return this.enabled;
  }

  async getRate(
    from: string,
    to: string,
    type: FxRateType,
    at?: Date
  ): Promise<FxProviderRate | null> {
    if (!this.enabled) return null;

    // Deterministic table; covers the pairs the smoke tests touch. Anything else: 1.0.
    const rate = lookupFake(from, to, type);
    const now = at ?? new Date();
    return {
      from,
      to,
      rate: rate.toString(),
      provider_id: `fake_rate:${type}:${from}-${to}:${now.toISOString()}`,
      observed_at: now,
      effective_at: now,
      source: this.name,
    };
  }
}

function lookupFake(from: string, to: string, type: FxRateType): string {
  const key = `${from}-${to}`;
  if (type === FxRateType.dof) {
    if (key === 'USD-MXN') return '20.4521';
    return '1.0';
  }
  // spot + settled
  const table: Record<string, string> = {
    'USD-MXN': '20.5103',
    'MXN-USD': '0.0488',
    'EUR-MXN': '22.1500',
    'USD-EUR': '0.9259',
    'EUR-USD': '1.0800',
  };
  return table[key] ?? '1.0';
}
