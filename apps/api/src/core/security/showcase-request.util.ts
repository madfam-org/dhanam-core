// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * In the full product, requests originating from the embedded landing-page demo
 * carried a header that let them bypass IP throttling. dhanam-core has no demo
 * surface, so there is nothing to bypass — this always returns false and every
 * request is subject to the normal rate limits.
 */
export function isShowcaseRateLimitBypass(_req: { headers?: Record<string, unknown> }): boolean {
  return false;
}
