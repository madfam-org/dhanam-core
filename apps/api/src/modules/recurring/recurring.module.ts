// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { RecurringDetectorService } from './recurring-detector.service';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringDetectorService],
  exports: [RecurringService, RecurringDetectorService],
})
export class RecurringModule {}
