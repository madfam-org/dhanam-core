// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { MailerModule } from '@core/mailer/mailer.module';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

import { EstatePlanningController } from './estate-planning.controller';
import { EstatePlanningService } from './estate-planning.service';
import { ExecutorAccessService } from './executor-access.service';

@Module({
  imports: [PrismaModule, AuditModule, MailerModule],
  controllers: [EstatePlanningController],
  providers: [EstatePlanningService, ExecutorAccessService],
  exports: [EstatePlanningService, ExecutorAccessService],
})
export class EstatePlanningModule {}
