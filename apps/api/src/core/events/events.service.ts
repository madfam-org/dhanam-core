// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, filter, map, finalize } from 'rxjs';

/**
 * Supported real-time event types emitted to connected clients.
 *
 * - sync.complete   Provider sync finished (success or failure)
 * - balance.updated Account balance changed after sync
 * - transaction.new New transactions ingested
 * - budget.alert    Budget threshold exceeded
 */
export type RealtimeEventType =
  'sync.complete' | 'balance.updated' | 'transaction.new' | 'budget.alert';

/**
 * Payload shape sent over the SSE stream.
 */
export interface RealtimeEvent {
  /** Target user id */
  userId: string;
  /** Event type discriminator */
  type: RealtimeEventType;
  /** Arbitrary event-specific payload */
  data: Record<string, unknown>;
  /** ISO-8601 timestamp */
  timestamp: string;
}

/**
 * SSE-compatible message envelope expected by NestJS @Sse() endpoints.
 */
export interface SseMessage {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}

/**
 * EventsService
 *
 * Manages per-user SSE streams using rxjs Subjects.
 * Any service can inject EventsService and call `emit()` to push
 * real-time updates to the connected user's browser.
 *
 * Lifecycle:
 *  1. Client opens GET /v1/events/stream  (EventsController)
 *  2. Controller calls subscribe(userId)  -> Observable<SseMessage>
 *  3. Backend services call emit(userId, type, data) at any point
 *  4. On disconnect the stream finalizer removes the Subject from the map
 */
@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  /**
   * One Subject per connected user.  When no client is connected the
   * entry does not exist, so emit() calls for offline users are no-ops.
   */
  private readonly streams = new Map<string, Subject<RealtimeEvent>>();

  // ------------------------------------------------------------------ public

  /**
   * Push an event to the user's SSE stream (if connected).
   *
   * Safe to call even when the user has no active connection -- the event
   * is silently dropped in that case.
   */
  emit(userId: string, type: RealtimeEventType, data: Record<string, unknown>): void {
    const subject = this.streams.get(userId);
    if (!subject) {
      this.logger.debug(`No active stream for user ${userId}, dropping ${type} event`);
      return;
    }

    const event: RealtimeEvent = {
      userId,
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Emitting ${type} to user ${userId}`);
    subject.next(event);
  }

  /**
   * Create (or reuse) an SSE observable for the given user.
   *
   * The observable automatically cleans up the internal Subject when
   * the client disconnects (the HTTP response closes).
   */
  subscribe(userId: string): Observable<SseMessage> {
    let subject = this.streams.get(userId);

    if (!subject) {
      subject = new Subject<RealtimeEvent>();
      this.streams.set(userId, subject);
      this.logger.log(`SSE stream opened for user ${userId}`);
    }

    return subject.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => this.toSseMessage(event)),
      finalize(() => {
        this.removeStream(userId);
      })
    );
  }

  /**
   * Returns the number of users with active SSE connections.
   * Useful for monitoring / health dashboards.
   */
  getActiveConnectionCount(): number {
    return this.streams.size;
  }

  // --------------------------------------------------------------- lifecycle

  onModuleDestroy(): void {
    this.logger.log('Closing all SSE streams');
    for (const [userId, subject] of this.streams.entries()) {
      subject.complete();
      this.streams.delete(userId);
      this.logger.debug(`Closed stream for user ${userId}`);
    }
  }

  // ---------------------------------------------------------------- internal

  private removeStream(userId: string): void {
    const subject = this.streams.get(userId);
    if (subject) {
      subject.complete();
      this.streams.delete(userId);
      this.logger.log(`SSE stream closed for user ${userId}`);
    }
  }

  private toSseMessage(event: RealtimeEvent): SseMessage {
    return {
      data: JSON.stringify({
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      }),
      type: event.type,
      id: `${event.userId}-${Date.now()}`,
      retry: 15_000, // client should retry after 15 s on disconnect
    };
  }
}
