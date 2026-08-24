// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { SpaceGuard } from './guards/space.guard';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [SpacesController],
  providers: [SpacesService, SpaceGuard],
  exports: [SpacesService, SpaceGuard],
})
export class SpacesModule {}
