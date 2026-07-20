'use client';

import type { Currency } from '@dhanam-core/shared';
import { useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam-core/ui';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';

interface IncomeExpenseDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseDataPoint[];
  currency: string;
  isLoading?: boolean;
}

export function IncomeExpenseChart({ data, currency, isLoading }: IncomeExpenseChartProps) {
  const { t } = useTranslation('analytics');
  const { formattedData, avgSavings } = useMemo(() => {
    if (!data || data.length === 0) {
      return { formattedData: [], avgSavings: 0 };
    }

    const formattedData = data.map((point) => ({
      ...point,
      savings: point.income - point.expenses,
    }));

    const totalSavings = formattedData.reduce((sum, point) => sum + point.savings, 0);
    const avgSavings = totalSavings / formattedData.length;

    return { formattedData, avgSavings };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
      const savings = income - expenses;

      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-muted-foreground">{t('charts.incomeExpense.income')}:</span>
              <span className="font-semibold">{formatCurrency(income, currency as Currency)}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-muted-foreground">{t('charts.incomeExpense.expenses')}:</span>
              <span className="font-semibold">
                {formatCurrency(expenses, currency as Currency)}
              </span>
            </p>
            <hr className="my-1" />
            <p className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">{t('charts.incomeExpense.net')}:</span>
              <span className={`font-semibold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {savings >= 0 ? '+' : ''}
                {formatCurrency(savings, currency as Currency)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.incomeExpense.title')}</CardTitle>
          <CardDescription>{t('charts.loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.incomeExpense.title')}</CardTitle>
          <CardDescription>{t('charts.incomeExpense.noData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('charts.incomeExpense.noDataHint')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('charts.incomeExpense.title')}</CardTitle>
            <CardDescription>{t('charts.incomeExpense.description')}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {t('charts.incomeExpense.avgMonthlySavings')}
            </p>
            <p
              className={`text-lg font-semibold ${avgSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {avgSavings >= 0 ? '+' : ''}
              {formatCurrency(avgSavings, currency as Currency)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span className="text-sm capitalize">{value}</span>}
              />
              <Bar
                dataKey="income"
                name={t('charts.incomeExpense.income')}
                fill="hsl(142 76% 36%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name={t('charts.incomeExpense.expenses')}
                fill="hsl(0 84% 60%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
