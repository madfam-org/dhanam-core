import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { useDemoNavigation } from '~/lib/contexts/demo-navigation-context';

/**
 * Demo-aware wrapper around Next.js useRouter().
 * Automatically prefixes paths with /demo when in demo mode.
 */
export function useDemoRouter() {
  const router = useRouter();
  const { demoHref } = useDemoNavigation();

  return useMemo(
    () => ({
      ...router,
      push: (path: string) => router.push(demoHref(path)),
      replace: (path: string) => router.replace(demoHref(path)),
    }),
    [router, demoHref]
  );
}
