// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomUUID } from 'crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Correlation ID Middleware
 * Generates or propagates X-Request-ID for request tracing.
 * SOC 2 Control: Request correlation for audit trails.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Generate unique request ID if not provided
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Add to request headers for downstream use
    req.headers['x-request-id'] = requestId;

    // Attach to request object for easy access in handlers
    (req as any).requestId = requestId;

    // Add to response headers
    const rawRes = res.raw || (res as any);
    if (rawRes.setHeader) {
      rawRes.setHeader('x-request-id', requestId);
    } else if ((res as any).header) {
      (res as any).header('x-request-id', requestId);
    }

    next();
  }
}