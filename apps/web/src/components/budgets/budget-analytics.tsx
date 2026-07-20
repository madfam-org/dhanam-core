'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { budgetsApi } from '@/lib/api/budgets';
import { formatCurrency } from '@/lib/utils';

interface BudgetAnalyticsProps {
  spaceId: string;
  budgetId: string;
  currency: Currency;
}

interface CategoryData {
  name: string;
  spent: number;
  budgeted: number;
  color: string;
}

export function BudgetAnalytics({ spaceId, budgetId, currency }: BudgetAnalyticsProps) {
  const { t } = useTranslation('analytics');
  const { data: analytics } = useQuery({
    queryKey: ['budget-analytics', spaceId, budgetId],
    queryFn: () => budgetsApi.getBudgetAnalytics(spaceId, budgetId),
    enabled: !!spaceId && !!budgetId,
  });

  if (!analytics) {
    return null;
  }

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const categorySpendingData: CategoryData[] = analytics.categories.map(
    (cat: { name: string; spent: number; budgeted: number; color?: string }, index: number) => ({
      name: cat.name,
      spent: cat.spent,
      budgeted: cat.budgeted,
      color: (cat.color || COLORS[index % COLORS.length]) as string,
    })
  );

  const weeklyTrendData =
    analytics.weeklyTrend?.map(
      (week: { weekStart: string; spent: number; budgetedForWeek: number }) => ({
        week: new Date(week.weekStart).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        spent: week.spent,
        budget: week.budgetedForWeek,
      })
    ) || [];

  const categoryPieData = categorySpendingData.map((cat) => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color,
  }));

  const overBudgetCategories = categorySpendingData.filter((cat) => cat.spent > cat.budgeted);
  const underBudgetCategories = categorySpendingData.filter(
    (cat) => cat.spent < cat.budgeted * 0.5
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('charts.budget.budgetHealth')}</CardTitle>
            {analytics.summary.totalPercentUsed > 90 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : analytics.summary.totalPercentUsed > 75 ? (
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalPercentUsed.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">{t('charts.budget.ofTotalBudgetUsed')}</p>
            <div className="mt-2">
              <Badge
                variant={analytics.summary.totalPercentUsed > 90 ? 'destructive' : 'secondary'}
              >
                {t('charts.budget.remaining', {
                  amount: formatCurrency(analytics.summary.totalRemaining, currency),
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('charts.budget.categoriesAtRisk')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overBudgetCategories.length}</div>
            <p className="text-xs text-muted-foreground">{t('charts.budget.overBudget')}</p>
            {overBudgetCategories.length > 0 && (
              <div className="mt-2 text-xs">
                {overBudgetCategories.slice(0, 2).map((cat) => (
                  <div key={cat.name} className="text-red-600">
                    • {cat.name}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('charts.budget.daysRemaining')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.daysRemaining || 0}</div>
            <p className="text-xs text-muted-foreground">{t('charts.budget.inThisPeriod')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.budget.categorySpending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categorySpendingData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => {
                      const numValue =
                        typeof value === 'number' ? value : parseFloat(String(value));
                      return [formatCurrency(numValue, currency), ''];
                    }}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="budgeted" fill="#e5e7eb" name={t('charts.budget.budgeted')} />
                  <Bar dataKey="spent" fill="#3b82f6" name={t('charts.budget.spent')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.budget.spendingDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryPieData.slice(0, 6).map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      {weeklyTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('charts.budget.weeklySpendingTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), currency), '']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t('charts.budget.spent')}
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="#e5e7eb"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={t('charts.budget.budget')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {underBudgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-green-600">
                {t('charts.budget.opportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {t('charts.budget.categoriesWithRoom')}
              </p>
              <div className="space-y-2">
                {underBudgetCategories.slice(0, 3).map((cat) => (
                  <div key={cat.name} className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-green-600">
                      {t('charts.budget.available', {
                        amount: formatCurrency(cat.budgeted - cat.spent, currency),
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {overBudgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-red-600">
                {t('charts.budget.attentionNeeded')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {t('charts.budget.categoriesOverBudget')}
              </p>
              <div className="space-y-2">
                {overBudgetCategories.slice(0, 3).map((cat) => (
                  <div key={cat.name} className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="text-red-600">
                      {t('charts.budget.over', {
                        amount: formatCurrency(cat.spent - cat.budgeted, currency),
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
