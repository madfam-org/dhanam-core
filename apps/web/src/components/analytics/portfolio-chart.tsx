'use client';

import type { Currency } from '@dhanam-core/shared';
import { useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@dhanam-core/ui';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';

import { formatCurrency } from '@/lib/utils';

interface PortfolioAllocation {
  assetType: string;
  value: number;
  percentage: number;
}

interface PortfolioChartProps {
  data: PortfolioAllocation[];
  currency: string;
  isLoading?: boolean;
}

// Color palette for asset types
const ASSET_COLORS: Record<string, string> = {
  checking: 'hsl(221 83% 53%)',
  savings: 'hsl(142 76% 36%)',
  investment: 'hsl(262 83% 58%)',
  crypto: 'hsl(38 92% 50%)',
  credit: 'hsl(0 84% 60%)',
  real_estate: 'hsl(173 80% 40%)',
  vehicle: 'hsl(330 81% 60%)',
  other: 'hsl(var(--muted-foreground))',
};

const ASSET_LABEL_KEYS: Record<string, string> = {
  checking: 'charts.portfolio.checking',
  savings: 'charts.portfolio.savings',
  investment: 'charts.portfolio.investment',
  crypto: 'charts.portfolio.crypto',
  credit: 'charts.portfolio.credit',
  real_estate: 'charts.portfolio.realEstate',
  vehicle: 'charts.portfolio.vehicle',
  other: 'charts.portfolio.other',
};

export function PortfolioChart({ data, currency, isLoading }: PortfolioChartProps) {
  const { t } = useTranslation('analytics');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const { chartData, totalValue, liabilityBreakdown } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: [],
        totalValue: 0,
        assetBreakdown: [],
        liabilityBreakdown: [],
      };
    }

    // Separate assets (positive) and liabilities (negative/credit)
    const assets = data.filter((item) => item.value > 0 && item.assetType !== 'credit');
    const liabilities = data.filter((item) => item.value < 0 || item.assetType === 'credit');

    const chartData = assets.map((item) => ({
      name: t(ASSET_LABEL_KEYS[item.assetType] || 'charts.portfolio.other'),
      value: Math.abs(item.value),
      percentage: item.percentage,
      color: ASSET_COLORS[item.assetType] || ASSET_COLORS.other,
    }));

    const totalValue = assets.reduce((sum, item) => sum + item.value, 0);

    return {
      chartData,
      totalValue,
      liabilityBreakdown: liabilities,
    };
  }, [data, t]);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
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
            {t('charts.portfolio.ofPortfolio', { percent: data.percentage.toFixed(1) })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.portfolio.title')}</CardTitle>
          <CardDescription>{t('charts.loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
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
          <CardTitle>{t('charts.portfolio.title')}</CardTitle>
          <CardDescription>{t('charts.portfolio.noData')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            {t('charts.portfolio.noDataHint')}
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
            <CardTitle>{t('charts.portfolio.title')}</CardTitle>
            <CardDescription>{t('charts.portfolio.description')}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('charts.portfolio.totalAssets')}</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalValue, currency as Currency)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Asset Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('charts.portfolio.assetBreakdown')}</h4>
            <div className="space-y-2">
              {chartData.map((asset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: asset.color }} />
                    <span className="text-sm">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(asset.value, currency as Currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{asset.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Liabilities if present */}
            {liabilityBreakdown.length > 0 && (
              <>
                <h4 className="text-sm font-medium mt-4 flex items-center gap-2">
                  {t('charts.portfolio.liabilities')}
                  <Badge variant="destructive" className="text-xs">
                    {formatCurrency(
                      liabilityBreakdown.reduce((sum, l) => sum + Math.abs(l.value), 0),
                      currency as Currency
                    )}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {liabilityBreakdown.map((liability, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-sm">
                          {t(ASSET_LABEL_KEYS[liability.assetType] || 'charts.portfolio.other')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-red-600">
                        {formatCurrency(Math.abs(liability.value), currency as Currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
