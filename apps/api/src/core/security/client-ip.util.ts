// SPDX-License-Identifier: AGPL-3.0-or-later
type HeaderBag = Record<string, unknown> | undefined;

function headerValue(headers: HeaderBag, name: string): string {
  const raw = headers?.[name];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) {
    return raw[0].trim();
  }
  return '';
}

/**
 * Resolve the client IP behind Cloudflare / ingress proxies.
 * Without this, Fastify sees the hop IP and all visitors share one rate-limit bucket.
 */
export function resolveClientIp(req: { ip?: string; headers?: HeaderBag }): string {
  const cfIp = headerValue(req.headers, 'cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  const forwarded = headerValue(req.headers, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headerValue(req.headers, 'x-real-ip');
  if (realIp) {
    return realIp;
  }

  return req.ip || 'unknown';
}
