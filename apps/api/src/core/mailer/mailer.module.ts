// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from '@nestjs/common';

import { MailerService } from './mailer.service';

/**
 * Global mailer module. Provides the no-op {@link MailerService} stub described
 * in mailer.service.ts. Global so any module can inject MailerService without an
 * explicit import.
 */
@Global()
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
