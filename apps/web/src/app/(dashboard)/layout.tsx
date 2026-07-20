'use client';

import { useTranslation } from '@dhanam-core/shared';
import { useRouter } from 'next/navigation';
import type { ReactNode as React18Node } from 'react';
import { useEffect, useState } from 'react';

import { KeyboardShortcuts } from '~/components/keyboard-shortcuts';
import { DashboardHeader } from '~/components/layout/dashboard-header';
import { DashboardNav } from '~/components/layout/dashboard-nav';
import { MobileNav } from '~/components/layout/mobile-nav';
import { PageTransition } from '~/components/motion/page-transition';
import { useAuth } from '~/lib/hooks/use-auth';
import { useSpaces } from '~/lib/hooks/use-spaces';

/**
 * Loading skeleton shown during SSR and initial client hydration.
 * Must match on both server and client to prevent hydration mismatch.
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="h-16 border-b bg-card animate-pulse" />
      <div className="flex">
        <div className="w-64 border-r bg-card animate-pulse hidden md:block" />
        <main id="main-content" className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </main>
      </div>
    </div>
  );
}

function SkipLink() {
  const { t } = useTranslation('common');
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
    >
      {t('aria.skipToContent')}
    </a>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const content = children as React18Node;
  const { isAuthenticated, _hasHydrated, user, refreshUser } = useAuth();
  const router = useRouter();
  // Trigger spaces fetch early so child pages have data before rendering.
  useSpaces();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch user profile in background if we have tokens but no user data.
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && !user) {
      refreshUser().catch(console.error);
    }
  }, [_hasHydrated, isAuthenticated, user, refreshUser]);

  // Redirect unauthenticated users after hydration is complete.
  useEffect(() => {
    if (hasMounted && _hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hasMounted, _hasHydrated, isAuthenticated, router]);

  if (!hasMounted || !_hasHydrated) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />
      <DashboardHeader />
      <KeyboardShortcuts />
      <div className="flex">
        <div className="hidden md:block">
          <DashboardNav />
        </div>
        <main id="main-content" className="flex-1 p-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            <PageTransition>{content}</PageTransition>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
