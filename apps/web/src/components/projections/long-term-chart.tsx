'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { YearlySnapshot } from '@/lib/api/projections';

interface LongTermChartProps {
  snapshots: YearlySnapshot[];
  retirementYear: number;
  currency?: string;
}

function formatCurrency(value: number, currency = 'USD'): string {
  if (Math.abs(value) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LongTermChart({ snapshots, retirementYear, currency = 'USD' }: LongTermChartProps) {
  const { t } = useTranslation('analytics');
  const data = snapshots.map((s) => ({
    year: s.year,
    age: s.age,
    netWorth: s.netWorth,
    totalAssets: s.totalAssets,
    totalDebt: s.totalDebt,
    grossIncome: s.grossIncome,
    totalExpenses: s.totalExpenses,
    netCashflow: s.netCashflow,
    isRetired: s.year >= retirementYear,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.longTerm.netWorthProjection')}</CardTitle>
        <CardDescription>{t('charts.longTerm.netWorthDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}`} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, currency)}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !payload[0]?.payload) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-semibold">
                        {label} ({t('charts.longTerm.age')} {data.age})
                        {data.isRetired && (
                          <span className="ml-2 text-xs text-orange-500">
                            {t('charts.longTerm.retired')}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-green-600">
                          {t('charts.longTerm.netWorth')}: {formatCurrency(data.netWorth, currency)}
                        </p>
                        <p className="text-blue-600">
                          {t('charts.longTerm.totalAssets')}:{' '}
                          {formatCurrency(data.totalAssets, currency)}
                        </p>
                        <p className="text-red-600">
                          {t('charts.longTerm.totalDebt')}:{' '}
                          {formatCurrency(data.totalDebt, currency)}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalAssets"
                name={t('charts.longTerm.totalAssets')}
                stroke="#3b82f6"
                fill="url(#assetsGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                name={t('charts.longTerm.netWorth')}
                stroke="#22c55e"
                fill="url(#netWorthGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalDebt"
                name={t('charts.longTerm.totalDebt')}
                stroke="#ef4444"
                fill="url(#debtGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function IncomeExpenseChart({
  snapshots,
  retirementYear,
  currency = 'USD',
}: LongTermChartProps) {
  const { t } = useTranslation('analytics');
  const data = snapshots.map((s) => ({
    year: s.year,
    age: s.age,
    income: s.grossIncome,
    expenses: s.totalExpenses,
    netCashflow: s.netCashflow,
    isRetired: s.year >= retirementYear,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.longTerm.incomeVsExpenses')}</CardTitle>
        <CardDescription>{t('charts.longTerm.incomeVsExpensesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, currency)}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !payload[0]?.payload) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="font-semibold">
                        {label} ({t('charts.longTerm.age')} {data.age})
                      </p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-green-600">
                          {t('charts.longTerm.income')}: {formatCurrency(data.income, currency)}
                        </p>
                        <p className="text-orange-600">
                          {t('charts.longTerm.expenses')}: {formatCurrency(data.expenses, currency)}
                        </p>
                        <p className={data.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {t('charts.longTerm.net')}: {formatCurrency(data.netCashflow, currency)}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                name={t('charts.longTerm.income')}
                stroke="#22c55e"
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name={t('charts.longTerm.expenses')}
                stroke="#f97316"
                fill="url(#expensesGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
