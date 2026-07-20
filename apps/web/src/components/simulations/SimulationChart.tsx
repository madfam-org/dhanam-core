'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlySnapshot } from '@/hooks/useSimulations';

interface SimulationChartProps {
  timeSeries: MonthlySnapshot[];
  title?: string;
  description?: string;
}

export function SimulationChart({ timeSeries, title, description }: SimulationChartProps) {
  const { t } = useTranslation('analytics');
  const chartData = timeSeries.map((point) => ({
    month: point.month,
    year: (point.month / 12).toFixed(1),
    median: Math.round(point.median),
    p10: Math.round(point.p10),
    p90: Math.round(point.p90),
    mean: Math.round(point.mean),
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  interface ChartDataPoint {
    month: number;
    year: string;
    median: number;
    p10: number;
    p90: number;
    mean: number;
  }
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataPoint }>;
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">
            {t('charts.simulation.year')} {data.year}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              {t('charts.simulation.best10')}: {formatCurrency(data.p90)}
            </p>
            <p className="text-blue-600 font-semibold">
              {t('charts.simulation.median')}: {formatCurrency(data.median)}
            </p>
            <p className="text-red-600">
              {t('charts.simulation.worst10')}: {formatCurrency(data.p10)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || t('charts.simulation.defaultTitle')}</CardTitle>
        <CardDescription>
          {description || t('charts.simulation.defaultDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              label={{ value: t('charts.simulation.years'), position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              label={{
                value: t('charts.simulation.portfolioValue'),
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Shaded area between p10 and p90 */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill="url(#colorRange)"
              fillOpacity={1}
            />
            <Area type="monotone" dataKey="p10" stroke="none" fill="#ffffff" fillOpacity={1} />

            {/* Percentile lines */}
            <Line
              type="monotone"
              dataKey="p10"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name={t('charts.simulation.p10')}
            />
            <Line
              type="monotone"
              dataKey="median"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              name={t('charts.simulation.median')}
            />
            <Line
              type="monotone"
              dataKey="p90"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name={t('charts.simulation.p90')}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>{t('charts.simulation.confidenceNote')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
