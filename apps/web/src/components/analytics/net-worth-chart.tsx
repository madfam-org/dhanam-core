'use client';

import type { Currency } from '@dhanam-core/shared';
import { useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam-core/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { formatCurrency } from '@/lib/utils';

interface NetWorthDataPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

interface NetWorthChartProps {
  data: NetWorthDataPoint[];
  currency: string;
  isLoading?: boolean;
}

export function NetWorthChart({ data, currency, isLoading }: NetWorthChartProps) {
  const { t } = useTranslation('analytics');
  const { trend, changePercent, formattedData } = useMemo(() => {
    if (!data || data.length < 2) {
      return { trend: 'neutral', changePercent: 0, formattedData: data || [] };
    }

    // Format dates for display
    const formattedData = data.map((point) => ({
      ...point,
      displayDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));

    const first = data[0]?.netWorth ?? 0;
    const last = data[data.length - 1]?.netWorth ?? 0;
    const changePercent = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
    const trend = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral';

    return { trend, changePercent, formattedData };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">{t('charts.netWorth.netWorth')}: </span>
              <span className="font-semibold">
                {formatCurrency(payload[0]?.value || 0, currency as Currency)}
              </span>
            </p>
            {payload[1] && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('charts.netWorth.assets')}: </span>
                <span className="text-green-600">
                  {formatCurrency(payload[1]?.value || 0, currency as Currency)}
                </span>
              </p>
            )}
            {payload[2] && (
              <p className="text-sm">
                <span className="text-muted-foreground">{t('charts.netWorth.liabilities')}: </span>
                <span className="text-red-600">
                  {formatCurrency(payload[2]?.value || 0, currency as Currency)}
                </span>
              </p>
            )}
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
          <CardTitle>{t('charts.netWorth.title')}</CardTitle>
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
          <CardTitle>{t('charts.netWorth.title')}</CardTitle>
          <CardDescription>{t('charts.netWorth.noData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t('charts.netWorth.noDataHint')}
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
            <CardTitle>{t('charts.netWorth.title')}</CardTitle>
            <CardDescription>{t('charts.netWorth.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : null}
            <span
              className={`text-sm font-medium ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-muted-foreground'
              }`}
            >
              {changePercent > 0 ? '+' : ''}
              {changePercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
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
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNetWorth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
