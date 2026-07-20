// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { FxRateType } from '../dto/fx-rate.dto';

import { FxProvider, FxProviderRate } from './fx-provider.interface';

interface BanxicoSieResponse {
  bmx: {
    series: Array<{
      idSerie: string;
      titulo: string;
      datos: Array<{ fecha: string; dato: string }>;
    }>;
  };
}

/**
 * Banxico SIE provider — DOF only (the SAT-defensible rate).
 *
 *   - If `BANXICO_SIE_TOKEN` is not set, this provider opts out by returning null.
 *   - The series ID `SF60653` is the official DOF reference series for USD/MXN.
 *
 * Note: the separate `fx-rates` module reads its own `BANXICO_API_TOKEN`. This
 * provider uses a distinct env var (`BANXICO_SIE_TOKEN`) so the two can be
 * rotated independently.
 */
@Injectable()
export class BanxicoSieProvider implements FxProvider {
  readonly name = 'banxico_sie';
  private readonly logger = new Logger(BanxicoSieProvider.name);
  private readonly token: string;
  private readonly baseUrl = 'https://www.banxico.org.mx/SieAPIRest/service/v1/series';
  // SF60653 is the official DOF reference series for USD/MXN.
  private readonly DOF_USD_MXN_SERIES = 'SF60653';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService
  ) {
    // Accept either the new SIE-specific token or the legacy BANXICO_API_TOKEN as fallback.
    this.token =
      this.config.get<string>('BANXICO_SIE_TOKEN', '') ||
      this.config.get<string>('BANXICO_API_TOKEN', '') ||
      '';
    if (!this.token) {
      this.logger.warn('BANXICO_SIE_TOKEN not configured — provider stubbed (returns null).');
    }
  }

  supports(type: FxRateType): boolean {
    return type === FxRateType.dof;
  }

  async getRate(
    from: string,
    to: string,
    type: FxRateType,
    at?: Date
  ): Promise<FxProviderRate | null> {
    if (!this.supports(type)) return null;
    if (!this.token) return null;

    // Banxico DOF reference is published only for USD/MXN. Other pairs are not
    // supported for `type=dof` — the service-level error envelope handles the empty result.
    if (!(from === 'USD' && to === 'MXN')) {
      return null;
    }

    try {
      const dateStr = at ? at.toISOString().slice(0, 10) : 'oportuno';
      const url = `${this.baseUrl}/${this.DOF_USD_MXN_SERIES}/datos/${dateStr}/${dateStr}?token=${this.token}`;
      const resp = await firstValueFrom(
        this.http.get<BanxicoSieResponse>(url, {
          timeout: 8000,
          headers: { Accept: 'application/json' },
        })
      );
      const series = resp.data?.bmx?.series?.[0];
      const datum = series?.datos?.[series.datos.length - 1];
      if (!datum?.dato) {
        // No publication available for the requested date — caller decides
        // whether to use yesterday (handled in the service layer).
        return null;
      }
      const rate = datum.dato;
      // Banxico reports `fecha` in DD/MM/YYYY (CDMX day boundary).
      const effective = parseFechaCdmx(datum.fecha) ?? at ?? new Date();
      return {
        from,
        to,
        rate,
        provider_id: `banxico_sie:${this.DOF_USD_MXN_SERIES}:${datum.fecha}`,
        observed_at: new Date(),
        effective_at: effective,
        source: this.name,
      };
    } catch (err) {
      this.logger.warn(`Banxico SIE fetch failed for ${from}->${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}

function parseFechaCdmx(fecha: string): Date | null {
  // Banxico's `fecha` is "DD/MM/YYYY" in CDMX (UTC-6, no DST since 2022).
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  // 12:00 CDMX = 18:00 UTC; we anchor at noon CDMX so DST-naive consumers don't slip a day.
  return new Date(`${yyyy}-${mm}-${dd}T18:00:00Z`);
}