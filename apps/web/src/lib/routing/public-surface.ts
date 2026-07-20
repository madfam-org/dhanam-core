// Minimal public-surface resolver for dhanam-core.
//
// The full product served several public surfaces (marketing site, app,
// per-PR preview environments, staging) behind one hostname scheme. The open
// core ships a single app surface, so these resolvers simply return the
// configured/baked URLs (defaulting to localhost).

export type PublicSurfaceTier = 'local' | 'production';

export function getPublicSurfaceTier(_hostname: string): PublicSurfaceTier {
  return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

export function isMarketingHostname(_hostname: string): boolean {
  return false;
}

export function resolvePublicAppUrl(_hostname: string, bakedUrl?: string): string {
  return bakedUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export function resolvePublicApiUrl(_hostname: string, bakedUrl?: string): string {
  return bakedUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
}

export function resolvePublicAdminUrl(_hostname: string, bakedUrl?: string): string {
  return bakedUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getPublicApiOrigin(apiUrl: string): string {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl;
  }
}
