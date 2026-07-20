'use client';

import { useTranslation } from '@dhanam-core/shared';
import { cn } from '@dhanam-core/ui';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  TrendingUp,
  PiggyBank,
  Settings,
  FileText,
  Target,
  AlertTriangle,
  Users,
  ScrollText,
  Landmark,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useDemoNavigation } from '~/lib/contexts/demo-navigation-context';

interface NavChild {
  key: string;
  href: string;
  icon: LucideIcon;
}

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'accounts', href: '/accounts', icon: Wallet },
  {
    key: 'transactions',
    href: '/transactions',
    icon: Receipt,
    children: [{ key: 'calendar', href: '/transactions/calendar', icon: Calendar }],
  },
  {
    key: 'budgets',
    href: '/budgets',
    icon: PiggyBank,
    children: [{ key: 'zeroBased', href: '/budgets/zero-based', icon: Landmark }],
  },
  { key: 'goals', href: '/goals', icon: Target },
  { key: 'households', href: '/households', icon: Users },
  { key: 'estatePlanning', href: '/estate-planning', icon: ScrollText },
  {
    key: 'analytics',
    href: '/analytics',
    icon: TrendingUp,
    children: [
      { key: 'statistics', href: '/analytics/statistics', icon: BarChart3 },
      { key: 'trends', href: '/analytics/trends', icon: TrendingUp },
    ],
  },
  { key: 'retirement', href: '/retirement', icon: Target },
  { key: 'scenarios', href: '/scenarios', icon: AlertTriangle },
  { key: 'reports', href: '/reports', icon: FileText },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const { demoHref, stripDemoPrefix } = useDemoNavigation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['analytics']));

  const normalizedPath = stripDemoPrefix(pathname);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <nav aria-label={tc('aria.mainNavigation')} className="w-64 border-r bg-background">
      <div className="flex h-full flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        <ul className="flex flex-1 flex-col gap-y-7 pt-6">
          <li>
            <ul className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  normalizedPath === item.href || normalizedPath.startsWith(item.href + '/');
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expanded.has(item.key);

                return (
                  <li key={item.key} data-tour={`sidebar-${item.key}`}>
                    <div className="flex items-center">
                      <Link
                        href={demoHref(item.href)}
                        className={cn(
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                          'group flex flex-1 gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {t(`sidebar.${item.key}`)}
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.key)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={
                            isExpanded
                              ? `Collapse ${t(`sidebar.${item.key}`)}`
                              : `Expand ${t(`sidebar.${item.key}`)}`
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {hasChildren && isExpanded && (
                      <ul className="mt-1 space-y-1">
                        {(item.children ?? []).map((child) => {
                          const isChildActive =
                            normalizedPath === child.href ||
                            normalizedPath.startsWith(child.href + '/');
                          return (
                            <li key={child.key}>
                              <Link
                                href={demoHref(child.href)}
                                className={cn(
                                  isChildActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                                  'group flex gap-x-3 rounded-md p-2 pl-8 text-xs font-medium leading-6 transition-colors'
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    isChildActive
                                      ? 'text-primary'
                                      : 'text-muted-foreground group-hover:text-foreground',
                                    'h-4 w-4 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {t(`sidebar.${child.key}`)}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}
