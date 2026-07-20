// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Open-core queue stub.
 *
 * The full Dhanam product runs a set of background job queues (provider sync,
 * billing reconciliation, drip campaigns, webhook fan-out, ...). Those
 * processors depend on proprietary/monetization modules and are NOT part of
 * dhanam-core.
 *
 * This stub keeps the small surface consumed by the health/metrics endpoints
 * and the graceful-shutdown path in main.ts, without registering any queues.
 * Self-hosters who want background processing can wire BullMQ (or similar) in
 * place of this class.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  /** Returns per-queue statistics. Empty in the open core (no queues wired). */
  async getAllQueueStats(): Promise<QueueStats[]> {
    return [];
  }

  /** Drains in-flight jobs before shutdown. No-op in the open core. */
  async drainQueues(_timeoutMs?: number): Promise<void> {
    this.logger.debug('[queue stub] drainQueues() — no queues registered');
  }
}
