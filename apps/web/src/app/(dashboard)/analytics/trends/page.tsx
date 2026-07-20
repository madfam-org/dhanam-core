'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { useState } from 'react';

import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

const PERIOD_OPTIONS = [
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
  { label: '24 Months', value: 24 },
] as const;

export default function TrendsPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;
  const [months, setMonths] = useState(12);

  const { data: trendsResponse, isLoading } = useQuery({
    queryKey: ['trends', spaceId, months],
    queryFn: () => analyticsApi.getAnnualTrends(spaceId!, months),
    enabled: !!spaceId,
    staleTime: 120_000,
    retry: 1,
  });

  // API returns {months: [...], summary: {...}} — extract the months array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = trendsResponse as any;
  const monthsArr = raw?.months ?? raw;
  const trends: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  }> = Array.isArray(monthsArr) ? monthsArr : [];

  // Use API-provided summary or compute from trends
  const apiSummary = raw?.summary ?? null;
  const summary =
    trends.length > 0
      ? {
          totalIncome: apiSummary?.totalIncome ?? trends.reduce((s, m) => s + m.income, 0),
          totalExpenses: apiSummary?.totalExpenses ?? trends.reduce((s, m) => s + m.expenses, 0),
          totalNet: apiSummary?.totalNet ?? trends.reduce((s, m) => s + m.net, 0),
          avgSavingsRate:
            apiSummary?.overallSavingsRate ??
            trends.reduce((s, m) => s + m.savingsRate, 0) / trends.length,
        }
      : null;

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">Select a space to view trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
          <p className="text-muted-foreground">Income, expenses, and savings over time.</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={months === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonths(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !trends || trends.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No trend data yet</h3>
            <p className="text-muted-foreground text-center">
              Start adding transactions to see your spending trends.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.totalIncome, currentSpace.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Over {months} months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(Math.abs(summary.totalExpenses), currentSpace.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Over {months} months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summary.totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(summary.totalNet, currentSpace.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Income minus expenses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Savings Rate</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${summary.avgSavingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {summary.avgSavingsRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Average over {months} months</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
              <CardDescription>Income, expenses, net, and savings rate by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Month</th>
                      <th className="text-right py-3 px-4 font-medium">Income</th>
                      <th className="text-right py-3 px-4 font-medium">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium">Net</th>
                      <th className="text-right py-3 px-4 font-medium">Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map(
                      (month: {
                        month: string;
                        income: number;
                        expenses: number;
                        net: number;
                        savingsRate: number;
                      }) => (
                        <tr
                          key={month.month}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">{month.month}</td>
                          <td className="py-3 px-4 text-right text-green-600">
                            {formatCurrency(month.income, currentSpace.currency)}
                          </td>
                          <td className="py-3 px-4 text-right text-red-600">
                            {formatCurrency(Math.abs(month.expenses), currentSpace.currency)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {formatCurrency(month.net, currentSpace.currency)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right ${month.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {month.savingsRate.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
