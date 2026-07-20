// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, Global } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';

import { PostHogService } from './posthog.service';

/**
 * Global Analytics Module
 *
 * Provides analytics services (PostHog) throughout the application.
 * Marked as @Global() so it's available without importing in every module.
 */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [PostHogService],
  exports: [PostHogService],
})
export class AnalyticsModule {}