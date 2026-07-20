// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, Global } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { FxRatesModule } from '../fx-rates/fx-rates.module';
import { SpacesModule } from '../spaces/spaces.module';

import { AnalyticsQueryService } from './analytics-query.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnomalyService } from './anomaly.service';
import { LongTermForecastService } from './long-term-forecast.service';
import { PostHogService } from './posthog.service';
import { ReportArchiveService } from './report-archive.service';
import { ReportCollaborationService } from './report-collaboration.service';
import { ReportShareTokenService } from './report-share-token.service';
import { ReportSharingController } from './report-sharing.controller';
import { ReportService } from './report.service';
import { ReportsController } from './reports.controller';
import { SavedReportService } from './saved-report.service';
import { SavedReportsController } from './saved-reports.controller';
import { WealthAnalytics } from './wealth.analytics';

@Global() // Make analytics services available globally without importing
@Module({
  imports: [PrismaModule, SpacesModule, FxRatesModule, AuditModule],
  controllers: [
    AnalyticsController,
    ReportsController,
    SavedReportsController,
    ReportSharingController,
  ],
  providers: [
    AnalyticsQueryService,
    AnalyticsService,
    ReportService,
    PostHogService,
    WealthAnalytics,
    AnomalyService,
    LongTermForecastService,
    SavedReportService,
    ReportArchiveService,
    ReportCollaborationService,
    ReportShareTokenService,
  ],
  exports: [
    AnalyticsService,
    ReportService,
    PostHogService,
    WealthAnalytics,
    AnomalyService,
    LongTermForecastService,
    SavedReportService,
    ReportArchiveService,
    ReportCollaborationService,
    ReportShareTokenService,
  ],
})
export class AnalyticsModule {}