// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * FX service. Mounted at `/v1/fx/*`. Provides currency conversion and rate
 * lookups (Banxico SIE and other public sources). Coexists with the
 * `/v1/fx-rates/*` module, the in-process Banxico consumer used by analytics.
 */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CoreModule } from '@core/core.module';

import { RedisFxCacheService } from './cache/redis-fx-cache.service';
import { FxController } from './fx.controller';
import { FX_PROVIDER_CHAIN, FxService } from './fx.service';
import { BanxicoSieProvider } from './providers/banxico-sie.provider';
import { ExchangerateHostProvider } from './providers/exchangerate-host.provider';
import { FakeRateProvider } from './providers/fake-rate.provider';
import { OpenExchangeRatesProvider } from './providers/openexchangerates.provider';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    HttpModule.register({
      timeout: 8000,
      maxRedirects: 2,
    }),
  ],
  controllers: [FxController],
  providers: [
    FxService,
    RedisFxCacheService,
    OpenExchangeRatesProvider,
    ExchangerateHostProvider,
    BanxicoSieProvider,
    FakeRateProvider,
    {
      // Ordered provider chain (failover) — order matters.
      provide: FX_PROVIDER_CHAIN,
      useFactory: (
        oer: OpenExchangeRatesProvider,
        host: ExchangerateHostProvider,
        banxico: BanxicoSieProvider,
        fake: FakeRateProvider
      ) => [oer, host, banxico, fake],
      inject: [
        OpenExchangeRatesProvider,
        ExchangerateHostProvider,
        BanxicoSieProvider,
        FakeRateProvider,
      ],
    },
  ],
  exports: [FxService],
})
export class FxModule {}
