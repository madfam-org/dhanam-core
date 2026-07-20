// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { ActivityTrackerService } from './activity-tracker.service';
import { GdprController } from './gdpr.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UsersController, GdprController],
  providers: [UsersService, ActivityTrackerService],
  exports: [UsersService, ActivityTrackerService],
})
export class UsersModule {}