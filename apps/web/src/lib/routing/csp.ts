import {
  getPublicApiOrigin,
  isMarketingHostname,
  resolvePublicApiUrl,
  resolvePublicAppUrl,
} from './public-surface';

const STATIC_CONNECT_SRC = [
  'https://us.i.posthog.com',
  'https://challenges.cloudflare.com',
  'https://cloudflareinsights.com',
  'https://*.ingest.sentry.io',
];

const EMBED_FRAME_ANCESTORS = [
  'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3040',
  'http://localhost:3000',
];

export interface ContentSecurityPolicyOptions {
  /** Request path — used to detect embed routes on the app host. */
  path?: string;
}

function buildFrameSrc(hostname: string, bakedAppUrl?: string): string | null {
  const isLandingHost =
    isMarketingHostname(hostname) || hostname === 'localhost' || hostname.endsWith('.localhost');

  if (!isLandingHost) {
    return null;
  }

  const appUrl = resolvePublicAppUrl(hostname, bakedAppUrl);
  try {
    const appOrigin = new URL(appUrl).origin;
    return `frame-src 'self' ${appOrigin}`;
  } catch {
    return "frame-src 'self' http://localhost:3000 http://localhost:3040";
  }
}

function buildFrameAncestors(path: string): string {
  const isEmbedRoute = path.startsWith('/embed/');
  if (isEmbedRoute) {
    return `frame-ancestors ${EMBED_FRAME_ANCESTORS.join(' ')}`;
  }
  return "frame-ancestors 'none'";
}

export function buildContentSecurityPolicy(
  hostname: string,
  bakedApiUrl?: string,
  options: ContentSecurityPolicyOptions = {}
): string {
  const path = options.path ?? '/';
  const apiUrl = resolvePublicApiUrl(hostname, bakedApiUrl);
  const apiOrigin = getPublicApiOrigin(apiUrl);
  const oidcIssuer = process.env.NEXT_PUBLIC_OIDC_ISSUER || '';

  const connectSrc = ["'self'", 'blob:', apiOrigin, oidcIssuer, ...STATIC_CONNECT_SRC].join(' ');
  const frameSrc = buildFrameSrc(hostname, process.env.NEXT_PUBLIC_BASE_URL);

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us.i.posthog.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    buildFrameAncestors(path),
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (frameSrc) {
    directives.splice(directives.length - 2, 0, frameSrc);
  }

  return directives.join('; ');
}
