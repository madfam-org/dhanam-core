// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { FxRateType } from '../dto/fx-rate.dto';

import { FxProvider, FxProviderRate } from './fx-provider.interface';

interface OpenExchangeRatesLatestResponse {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

/**
 * OpenExchangeRates provider — primary spot source.
 *
 *   - If `OPENEXCHANGERATES_APP_ID` is not set, this provider opts out of the chain
 *     by returning null from every call.
 *   - The HTTP path below is implemented and unit-testable; it just won't fire in
 *     environments without the API key.
 */
@Injectable()
export class OpenExchangeRatesProvider implements FxProvider {
  readonly name = 'openexchangerates';
  private readonly logger = new Logger(OpenExchangeRatesProvider.name);
  private readonly appId: string;
  private readonly baseUrl = 'https://openexchangerates.org/api';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService
  ) {
    this.appId = this.config.get<string>('OPENEXCHANGERATES_APP_ID', '') ?? '';
    if (!this.appId) {
      this.logger.warn(
        'OPENEXCHANGERATES_APP_ID not configured — provider stubbed (returns null).'
      );
    }
  }

  supports(type: FxRateType): boolean {
    // OER is a spot provider only. DOF must come from Banxico, settled from Dhanam itself.
    return type === FxRateType.spot;
  }

  async getRate(
    from: string,
    to: string,
    type: FxRateType,
    _at?: Date
  ): Promise<FxProviderRate | null> {
    if (!this.supports(type)) return null;
    if (!this.appId) return null;

    try {
      const url = `${this.baseUrl}/latest.json?app_id=${this.appId}&base=${from}&symbols=${to}`;
      const resp = await firstValueFrom(
        this.http.get<OpenExchangeRatesLatestResponse>(url, {
          timeout: 5000,
          headers: { Accept: 'application/json' },
        })
      );
      const rate = resp.data?.rates?.[to];
      if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        this.logger.warn(`OER returned no rate for ${from}->${to}`);
        return null;
      }
      const observedAt = new Date(resp.data.timestamp * 1000);
      return {
        from,
        to,
        rate: rate.toString(),
        provider_id: `oer:${observedAt.toISOString()}`,
        observed_at: observedAt,
        effective_at: observedAt,
        source: this.name,
      };
    } catch (err) {
      // Throw so the service falls through to the next provider in the chain.
      this.logger.warn(`OER fetch failed for ${from}->${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
