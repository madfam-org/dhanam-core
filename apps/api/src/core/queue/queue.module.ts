// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from '@nestjs/common';

import { QueueService } from './queue.service';

/** Global queue module providing the no-op {@link QueueService} stub. */
@Global()
@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
