'use client';

import { Currency } from '@dhanam-core/shared';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';

import { analyticsApi } from '~/lib/api/analytics';
import { analyticsKeys } from '~/lib/query-keys';
import { formatCurrency } from '~/lib/utils';
import { useSpaceStore } from '~/stores/space';

export interface WeeklySummaryProps {
  spaceId: string;
}

export function WeeklySummary({ spaceId }: WeeklySummaryProps) {
  const { currentSpace } = useSpaceStore();
  const currency = currentSpace?.currency ?? Currency.USD;

  const { data, isLoading } = useQuery({
    queryKey: [...analyticsKeys.incomeVsExpenses(spaceId), 'weekly-summary'],
    queryFn: () => analyticsApi.getIncomeVsExpenses(spaceId, 2),
    enabled: !!spaceId,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-medium">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Approximate weekly from monthly: current month and previous month divided by 4
  const currentMonth = data[data.length - 1];
  const previousMonth = data.length > 1 ? data[data.length - 2] : null;

  const thisWeekIncome = (currentMonth?.income ?? 0) / 4;
  const thisWeekExpenses = Math.abs(currentMonth?.expenses ?? 0) / 4;
  const thisWeekNet = thisWeekIncome - thisWeekExpenses;

  const lastWeekIncome = previousMonth ? (previousMonth.income ?? 0) / 4 : 0;
  const lastWeekExpenses = previousMonth ? Math.abs(previousMonth.expenses ?? 0) / 4 : 0;

  const incomeChange =
    lastWeekIncome > 0 ? ((thisWeekIncome - lastWeekIncome) / lastWeekIncome) * 100 : 0;
  const expenseChange =
    lastWeekExpenses > 0 ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-sm font-medium">Weekly Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* This Week */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This Week
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(thisWeekIncome, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(thisWeekExpenses, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-1.5">
                <span className="text-sm font-medium">Net</span>
                <span
                  className={`text-sm font-bold ${thisWeekNet >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(thisWeekNet, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* vs Last Week */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              vs Last Week
            </p>
            <div className="space-y-1.5">
              <ChangeRow label="Income" change={incomeChange} positive={incomeChange >= 0} />
              <ChangeRow label="Expenses" change={expenseChange} positive={expenseChange <= 0} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeRow({
  label,
  change,
  positive,
}: {
  label: string;
  change: number;
  positive: boolean;
}) {
  const abs = Math.abs(change);
  if (abs < 0.1) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">No change</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`flex items-center gap-1 text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}
      >
        {change > 0 ? (
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
        )}
        {abs.toFixed(1)}%
      </span>
    </div>
  );
}
