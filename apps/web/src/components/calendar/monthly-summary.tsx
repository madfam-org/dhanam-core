'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Currency } from '@dhanam-core/shared';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMemo } from 'react';

import type { CalendarDay } from '@/lib/api/analytics';
import { formatCurrency, cn } from '@/lib/utils';

interface MonthlySummaryProps {
  days: CalendarDay[];
  currency: Currency;
}

export function MonthlySummary({ days, currency }: MonthlySummaryProps) {
  const { t } = useTranslation('transactions');

  const totals = useMemo(() => {
    const income = days.reduce((s, d) => s + d.income, 0);
    const expenses = days.reduce((s, d) => s + d.expenses, 0);
    const net = income - expenses;
    return { income, expenses, net };
  }, [days]);

  const stats = [
    {
      label: t('calendar.income'),
      value: totals.income,
      icon: TrendingUp,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('calendar.expenses'),
      value: totals.expenses,
      icon: TrendingDown,
      colorClass: 'text-red-600 dark:text-red-400',
    },
    {
      label: t('calendar.net'),
      value: totals.net,
      icon: Minus,
      colorClass:
        totals.net >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <Icon className={cn('h-5 w-5 shrink-0', stat.colorClass)} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn('text-sm font-semibold truncate', stat.colorClass)}>
                {formatCurrency(stat.value, currency)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
