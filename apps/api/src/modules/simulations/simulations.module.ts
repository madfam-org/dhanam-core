// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';

import { MonteCarloEngine } from './engines/monte-carlo.engine';
import { SimulationsController } from './simulations.controller';
import { SimulationsService } from './simulations.service';

@Module({
  imports: [PrismaModule],
  controllers: [SimulationsController],
  providers: [SimulationsService, MonteCarloEngine],
  exports: [SimulationsService, MonteCarloEngine],
})
export class SimulationsModule {}
