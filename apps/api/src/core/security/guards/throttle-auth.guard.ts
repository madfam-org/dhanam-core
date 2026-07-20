// SPDX-License-Identifier: AGPL-3.0-or-later
import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { resolveClientIp } from '../client-ip.util';
import { isShowcaseRateLimitBypass } from '../showcase-request.util';

// Strict rate limiting for authentication endpoints
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return resolveClientIp(req);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Record<string, any>>();
    return isShowcaseRateLimitBypass(req);
  }
}

@Injectable()
export class StrictThrottleGuard extends ThrottlerGuard {
  // For sensitive endpoints like password reset, TOTP setup
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = resolveClientIp(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  }
}