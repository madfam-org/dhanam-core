'use client';

import type { ReactNode } from 'react';

/**
 * Navigation helpers that were "demo-mode aware" in the full product (they
 * prefixed routes with `/demo` for the guided demo experience).
 *
 * dhanam-core has no demo mode, so these are identity/no-op helpers. Kept so the
 * shared navigation components compile and behave normally.
 */
export interface DemoNavigation {
  isDemoMode: boolean;
  demoHref: (path: string) => string;
  stripDemoPrefix: (path: string) => string;
}

export function useDemoNavigation(): DemoNavigation {
  return {
    isDemoMode: false,
    demoHref: (path: string) => path,
    stripDemoPrefix: (path: string) => path,
  };
}

export function DemoNavigationProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
