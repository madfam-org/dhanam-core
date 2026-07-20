// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { FxRateType } from '../dto/fx-rate.dto';

import { FxProvider, FxProviderRate } from './fx-provider.interface';

interface ExchangerateHostResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * exchangerate.host — free fallback for spot rates.
 *
 * Live (no API key required) but rate-limited; treat as best-effort. If the
 * upstream is unreachable, the provider throws and the service falls through
 * to the next link in the chain.
 */
@Injectable()
export class ExchangerateHostProvider implements FxProvider {
  readonly name = 'exchangerate_host';
  private readonly logger = new Logger(ExchangerateHostProvider.name);
  private readonly baseUrl = 'https://api.exchangerate.host';

  constructor(private readonly http: HttpService) {}

  supports(type: FxRateType): boolean {
    return type === FxRateType.spot;
  }

  async getRate(
    from: string,
    to: string,
    type: FxRateType,
    _at?: Date
  ): Promise<FxProviderRate | null> {
    if (!this.supports(type)) return null;

    try {
      const url = `${this.baseUrl}/latest?base=${from}&symbols=${to}`;
      const resp = await firstValueFrom(
        this.http.get<ExchangerateHostResponse>(url, {
          timeout: 5000,
          headers: { Accept: 'application/json' },
        })
      );
      const rate = resp.data?.rates?.[to];
      if (typeof rate !== 'number' || !Number.isFinite(rate)) {
        return null;
      }
      const observedAt = resp.data.timestamp ? new Date(resp.data.timestamp * 1000) : new Date();
      return {
        from,
        to,
        rate: rate.toString(),
        provider_id: `exchangerate_host:${observedAt.toISOString()}`,
        observed_at: observedAt,
        effective_at: observedAt,
        source: this.name,
      };
    } catch (err) {
      this.logger.warn(
        `exchangerate.host fetch failed for ${from}->${to}: ${(err as Error).message}`
      );
      throw err;
    }
  }
}