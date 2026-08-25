// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Logger, Req, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@core/types/authenticated-request';

import { EventsService, SseMessage } from './events.service';

/**
 * SSE endpoint for real-time updates.
 *
 * GET /v1/events/stream
 *
 * The client opens a long-lived HTTP connection and receives
 * server-sent events whenever provider syncs complete, balances
 * change, new transactions arrive, or budget alerts fire.
 *
 * Authentication is via the standard Bearer JWT in the Authorization
 * header.  For browser EventSource (which cannot set custom headers),
 * the web client should use a fetch-based SSE implementation or a
 * polyfill that supports headers.
 */
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@Req() req: AuthenticatedRequest): Observable<SseMessage> {
    const userId: string = req.user.id ?? req.user.userId;
    this.logger.log(`SSE connection opened for user ${userId}`);
    return this.eventsService.subscribe(userId);
  }
}
