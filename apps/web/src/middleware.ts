import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { buildContentSecurityPolicy } from './lib/routing/csp';
import { getHostnameFromHostHeader } from './lib/routing/hosts';

/**
 * dhanam-core middleware.
 *
 * A minimal auth gate: unauthenticated visits to app routes are redirected to
 * /login, and a Content-Security-Policy header is attached to every response.
 *
 * The full product's middleware also handled marketing/preview/staging surface
 * routing, an admin subdomain and geo overrides — none of which are part of the
 * open core.
 */

// Paths that do not require authentication.
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/verify-email',
  '/privacy',
  '/terms',
  '/cookies',
  '/security',
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader = request.headers.get('host');
  const hostname = getHostnameFromHostHeader(hostHeader);

  const response = isPublicPath(pathname) ? NextResponse.next() : gateAuthenticated(request);

  response.headers.set(
    'Content-Security-Policy',
    buildContentSecurityPolicy(hostname, process.env.NEXT_PUBLIC_API_URL, { path: pathname })
  );

  return response;
}

function gateAuthenticated(request: NextRequest): NextResponse {
  // The client sets an `auth-storage=authenticated` marker cookie on login.
  // This is only a redirect-flash guard — every API request is validated
  // server-side by the API's JWT guard.
  const isAuthenticated = request.cookies.get('auth-storage')?.value === 'authenticated';

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
