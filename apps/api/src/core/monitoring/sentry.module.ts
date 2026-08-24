// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, Global } from '@nestjs/common';

import { SentryService } from './sentry.service';

@Global()
@Module({
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
