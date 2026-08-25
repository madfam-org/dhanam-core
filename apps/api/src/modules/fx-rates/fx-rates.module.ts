// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CoreModule } from '@core/core.module';

import { FxRatesController } from './fx-rates.controller';
import { FxRatesService } from './fx-rates.service';

@Module({
  imports: [CoreModule, HttpModule],
  providers: [FxRatesService],
  controllers: [FxRatesController],
  exports: [FxRatesService],
})
export class FxRatesModule {}
