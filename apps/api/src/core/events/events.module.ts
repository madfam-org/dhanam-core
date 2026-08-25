// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from '@nestjs/common';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';

/**
 * Global events module providing real-time SSE push to connected clients.
 *
 * Marked @Global() so any module can inject EventsService without
 * explicitly importing EventsModule in its own imports array.
 *
 * The module also registers EventEmitterModule.forRoot() so that
 * NestJS internal event-emitter infrastructure is available if needed
 * in the future for decoupled intra-service communication.
 */
@Global()
@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
