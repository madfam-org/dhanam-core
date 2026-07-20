'use client';

import type { Currency } from '@dhanam-core/shared';
import { useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam-core/ui';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';

import { formatCurrency } from '@/lib/utils';

interface SpendingCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

interface SpendingCategoryChartProps {
  data: SpendingCategory[];
  currency: string;
  isLoading?: boolean;
}

// Color palette for categories
const COLORS = [
  'hsl(221 83% 53%)', // Blue
  'hsl(142 76% 36%)', // Green
  'hsl(38 92% 50%)', // Orange
  'hsl(0 84% 60%)', // Red
  'hsl(262 83% 58%)', // Purple
  'hsl(173 80% 40%)', // Teal
  'hsl(330 81% 60%)', // Pink
  'hsl(47 96% 53%)', // Yellow
];

export function SpendingCategoryChart({ data, currency, isLoading }: SpendingCategoryChartProps) {
  const { t } = useTranslation('analytics');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const { chartData, totalSpending } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], totalSpending: 0 };
    }

    // Take top 7 categories and group rest as "Other"
    const sorted = [...data].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const top7 = sorted.slice(0, 7);
    const rest = sorted.slice(7);

    const chartData = top7.map((item, index) => ({
      name: item.categoryName,
      value: Math.abs(item.amount),
      percentage: item.percentage,
      color: COLORS[index % COLORS.length],
    }));

    if (rest.length > 0) {
      const otherTotal = rest.reduce((sum, item) => sum + Math.abs(item.amount), 0);
      const otherPercentage = rest.reduce((sum, item) => sum + item.percentage, 0);
      chartData.push({
        name: t('charts.spendingCategory.other'),
        value: otherTotal,
        percentage: otherPercentage,
        color: 'hsl(var(--muted-foreground))',
      });
    }

    const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

    return { chartData, totalSpending };
  }, [data, t]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 12}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(data.value, currency as Currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('charts.spendingCategory.ofTotal', { percent: data.percentage.toFixed(1) })}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.spendingCategory.title')}</CardTitle>
          <CardDescription>{t('charts.loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-full w-48 h-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.spendingCategory.title')}</CardTitle>
          <CardDescription>{t('charts.spendingCategory.noData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('charts.spendingCategory.noDataHint')}
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
            <CardTitle>{t('charts.spendingCategory.title')}</CardTitle>
            <CardDescription>{t('charts.spendingCategory.description')}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {t('charts.spendingCategory.totalSpending')}
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalSpending, currency as Currency)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
                {...({
                  activeIndex,
                  activeShape: renderActiveShape,
                } as any)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
