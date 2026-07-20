// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { ZeroBasedController } from './zero-based.controller';
import { ZeroBasedService } from './zero-based.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [BudgetsController, ZeroBasedController],
  providers: [BudgetsService, ZeroBasedService],
  exports: [BudgetsService, ZeroBasedService],
})
export class BudgetsModule {}