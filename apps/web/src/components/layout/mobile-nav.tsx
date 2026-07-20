'use client';

import { Sheet, SheetContent, SheetTitle, cn } from '@dhanam-core/ui';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  MoreHorizontal,
  PiggyBank,
  Target,
  Settings,
  FileText,
  Users,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useDemoNavigation } from '~/lib/contexts/demo-navigation-context';

const primaryNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: Wallet },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
] as const;

const moreNav = [
  { label: 'Budgets', href: '/budgets', icon: PiggyBank },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Households', href: '/households', icon: Users },
  { label: 'Estate Planning', href: '/estate-planning', icon: ScrollText },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { demoHref, stripDemoPrefix } = useDemoNavigation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-close the "More" sheet on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Active-state matches on the un-prefixed path so /demo/* highlights correctly.
  const normalizedPath = stripDemoPrefix(pathname);
  const isActive = (href: string) =>
    normalizedPath === href || normalizedPath.startsWith(href + '/');

  // Check if any "More" item is active (to highlight the More button)
  const moreIsActive = moreNav.some((item) => isActive(item.href));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16 items-center justify-around">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={demoHref(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors',
              moreIsActive ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="More navigation options"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-xl px-4 pb-8">
          <SheetTitle className="sr-only">More navigation</SheetTitle>
          <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-muted" />
          <ul className="grid grid-cols-3 gap-3">
            {moreNav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={demoHref(item.href)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg p-3 text-xs font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-center leading-tight">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
