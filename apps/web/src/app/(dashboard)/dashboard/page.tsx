'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { accountsApi } from '~/lib/api/accounts';
import { useSpaceStore } from '~/stores/space';

/**
 * Dashboard overview (dhanam-core).
 *
 * A concise net-worth summary for the current space. The full product shipped a
 * richer, persona-driven dashboard with guided tours; those demo-only surfaces
 * are not part of the open core.
 */
export default function DashboardPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;

  const { data: accounts } = useQuery({
    queryKey: ['accounts', spaceId],
    queryFn: () => accountsApi.getAccounts(spaceId as string),
    enabled: !!spaceId,
  });

  if (!currentSpace) {
    return <p className="text-muted-foreground">Select a space to see your overview.</p>;
  }

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + Number(a.balance), 0);

  const tiles: Array<{ href: string; title: string; description: string }> = [
    { href: '/dashboard/accounts', title: 'Accounts', description: 'Track balances' },
    { href: '/dashboard/transactions', title: 'Transactions', description: 'Review activity' },
    { href: '/dashboard/budgets', title: 'Budgets', description: 'Plan spending' },
    { href: '/dashboard/goals', title: 'Goals', description: 'Track progress' },
    { href: '/dashboard/assets', title: 'Assets', description: 'Manual assets & valuations' },
    { href: '/dashboard/projections', title: 'Projections', description: 'Simulate the future' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">{currentSpace.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net worth (tracked accounts)</CardTitle>
          <CardDescription>Sum of balances across your accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">
            {totalBalance.toLocaleString(undefined, {
              style: 'currency',
              currency: currentSpace.currency ?? 'USD',
            })}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{tile.title}</CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
