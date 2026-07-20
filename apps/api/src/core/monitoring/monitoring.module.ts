// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, Global, forwardRef } from '@nestjs/common';

import { PrismaModule } from '@core/prisma/prisma.module';
import { QueueModule } from '@core/queue/queue.module';

import { DeploymentMonitorService } from './deployment-monitor.service';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';
import { SentryService } from './sentry.service';

// forwardRef on the QueueModule edge breaks a circular dependency between
// MonitoringModule and QueueModule: QueueModule is constructed first and
// transitively reaches back into MonitoringModule, which would re-enter
// QueueModule mid-construction. forwardRef defers the reference until both
// modules are constructed.
@Global()
@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [MonitoringController],
  providers: [
    HealthService,
    MetricsService,
    SentryService,
    DeploymentMonitorService,
    {
      provide: 'SentryService',
      useExisting: SentryService,
    },
  ],
  exports: [HealthService, MetricsService, SentryService, DeploymentMonitorService],
})
export class MonitoringModule {}