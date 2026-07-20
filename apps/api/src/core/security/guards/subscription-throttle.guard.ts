// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

/**
 * Per-user rate-limiting guard.
 *
 * Tracks requests by authenticated userId (falls back to IP for
 * unauthenticated requests) and enforces a single flat limit over a
 * 15-minute sliding window. Prevents abuse from any single user.
 */
@Injectable()
export class SubscriptionThrottleGuard extends ThrottlerGuard {
  private readonly logger = new Logger(SubscriptionThrottleGuard.name);

  /** 15 minutes in milliseconds */
  static readonly WINDOW_MS = 15 * 60 * 1000;

  /** Requests allowed per 15-minute window, per user. */
  static readonly REQUEST_LIMIT = 1_000;

  /**
   * Track by authenticated userId when available, otherwise by IP.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }
    return req.ip || 'unknown';
  }

  /**
   * Override handleRequest to apply the flat per-user limit and a fixed 15-min TTL.
   */
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();

    this.logger.debug(
      `Rate limit check: limit=${SubscriptionThrottleGuard.REQUEST_LIMIT}, user=${req.user?.id ?? 'anonymous'}`
    );

    return super.handleRequest({
      ...requestProps,
      limit: SubscriptionThrottleGuard.REQUEST_LIMIT,
      ttl: SubscriptionThrottleGuard.WINDOW_MS,
    });
  }
}