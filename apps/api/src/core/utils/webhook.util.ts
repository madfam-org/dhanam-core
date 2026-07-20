// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Redis } from 'ioredis';

/**
 * Webhook Handler Utility
 *
 * Provides standardized webhook handling with:
 * - Signature verification (HMAC-SHA256)
 * - Idempotency checks (Redis-based)
 * - Safe error handling (always return 200 after signature verified)
 * - Comprehensive Sentry error reporting
 */

export interface WebhookResult {
  success: boolean;
  processed: boolean;
  idempotent: boolean;
  error?: string;
}

export interface WebhookOptions {
  /** Provider name for logging/Sentry */
  provider: string;
  /** Secret key for HMAC signature verification */
  secret: string;
  /** Redis client for idempotency checks */
  redis?: Redis;
  /** TTL for idempotency keys in seconds (default: 24 hours) */
  idempotencyTtlSeconds?: number;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Create a unique idempotency key for a webhook
 */
export function createWebhookIdempotencyKey(provider: string, payload: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex').substring(0, 16);
  return `webhook:idempotency:${provider}:${hash}`;
}

/**
 * Verify HMAC-SHA256 webhook signature
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  encoding: 'hex' | 'base64' = 'hex'
): boolean {
  if (!secret || !signature) {
    return false;
  }

  try {
    const expectedSignature = createHmac('sha256', secret).update(payload, 'utf8').digest(encoding);

    // Handle both raw signature and prefixed signatures (e.g., "sha256=...")
    const cleanSignature = signature.replace(/^sha256=/, '').replace(/^v0=/, '');

    return timingSafeEqual(
      Buffer.from(cleanSignature, encoding),
      Buffer.from(expectedSignature, encoding)
    );
  } catch {
    return false;
  }
}

/**
 * Process a webhook with full error handling and idempotency
 *
 * Always returns 200 OK after signature verification to prevent
 * webhook providers from retrying (which causes duplicate processing).
 *
 * @example
 * ```typescript
 * const result = await processWebhook(
 *   payload,
 *   signature,
 *   { provider: 'plaid', secret: webhookSecret, redis: this.redis },
 *   async () => {
 *     await this.handlePlaidWebhook(payload);
 *   }
 * );
 * // result.success = true even if processing failed
 * // result.processed = false if processing failed
 * // result.error = error message if processing failed
 * ```
 */
export async function processWebhook<T>(
  payload: T,
  signature: string,
  options: WebhookOptions,
  processor: () => Promise<void>
): Promise<WebhookResult> {
  const {
    provider,
    secret,
    redis,
    idempotencyTtlSeconds = 86400, // 24 hours
    logger,
  } = options;

  const log = logger || new Logger(`${provider}WebhookHandler`);
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Step 1: Verify signature
  if (!verifyHmacSignature(payloadStr, signature, secret)) {
    log.warn(`Invalid webhook signature for ${provider}`);

    Sentry.withScope((scope) => {
      scope.setTag('provider', provider);
      scope.setTag('webhook', 'signature_invalid');
      scope.setLevel('warning');
      Sentry.captureMessage(`Invalid webhook signature: ${provider}`);
    });

    // Return failure for invalid signature - provider should NOT retry
    return {
      success: false,
      processed: false,
      idempotent: false,
      error: 'Invalid signature',
    };
  }

  // Step 2: Check idempotency (if Redis available)
  const idempotencyKey = createWebhookIdempotencyKey(provider, payload);

  if (redis) {
    try {
      const existing = await redis.get(idempotencyKey);
      if (existing) {
        log.log(`Duplicate webhook detected for ${provider}, skipping`);
        return {
          success: true,
          processed: false,
          idempotent: true,
        };
      }
    } catch (redisError) {
      // Log but continue - idempotency is a nice-to-have
      log.warn(`Redis idempotency check failed: ${(redisError as Error).message}`);
    }
  }

  // Step 3: Process the webhook
  try {
    await processor();

    // Mark as processed in Redis
    if (redis) {
      try {
        await redis.setex(idempotencyKey, idempotencyTtlSeconds, 'processed');
      } catch {
        // Ignore Redis errors for marking
      }
    }

    log.log(`Webhook processed successfully for ${provider}`);

    return {
      success: true,
      processed: true,
      idempotent: false,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    log.error(`Webhook processing failed for ${provider}: ${err.message}`);

    // Capture to Sentry with full context
    Sentry.withScope((scope) => {
      scope.setTag('provider', provider);
      scope.setTag('webhook', 'processing_failed');
      scope.setLevel('error');
      scope.setContext('webhook', {
        provider,
        payloadSample: payloadStr.substring(0, 500),
      });
      Sentry.captureException(err);
    });

    // Mark as attempted in Redis (shorter TTL to allow retry)
    if (redis) {
      try {
        await redis.setex(idempotencyKey, 3600, 'failed'); // 1 hour for failed attempts
      } catch {
        // Ignore
      }
    }

    // IMPORTANT: Return success=true to prevent provider from retrying
    // The error is logged and captured in Sentry for manual investigation
    return {
      success: true, // Always 200 OK after signature verified
      processed: false,
      idempotent: false,
      error: err.message,
    };
  }
}

/**
 * Create a standardized webhook response
 */
export function createWebhookResponse(result: WebhookResult): {
  message: string;
  received: boolean;
} {
  if (result.idempotent) {
    return {
      message: 'Webhook already processed',
      received: true,
    };
  }

  if (result.processed) {
    return {
      message: 'Webhook processed successfully',
      received: true,
    };
  }

  if (!result.success) {
    return {
      message: 'Webhook verification failed',
      received: false,
    };
  }

  // Processing failed but we still acknowledge receipt
  return {
    message: 'Webhook received',
    received: true,
  };
}

/**
 * Provider-specific signature verification helpers
 */
export const WebhookSignatureVerifiers = {
  /**
   * Plaid uses HMAC-SHA256 with hex encoding
   */
  plaid: (payload: string, signature: string, secret: string): boolean => {
    return verifyHmacSignature(payload, signature, secret, 'hex');
  },

  /**
   * Bitso uses HMAC-SHA256 with hex encoding
   */
  bitso: (payload: string, signature: string, secret: string): boolean => {
    return verifyHmacSignature(payload, signature, secret, 'hex');
  },
};