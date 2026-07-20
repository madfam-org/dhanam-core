'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Loader2,
  Plus,
  Download,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  NetWorthChart,
  IncomeExpenseChart,
  SpendingCategoryChart,
  PortfolioChart,
} from '@/components/analytics';
import { ScheduleReportModal } from '@/components/reports/schedule-report-modal';
import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

export default function AnalyticsPage() {
  const { currentSpace } = useSpaceStore();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { t } = useTranslation('analytics');

  const {
    data: netWorthData,
    isLoading: isLoadingNetWorth,
    isError: isErrorNetWorth,
    refetch: refetchNetWorth,
  } = useQuery({
    queryKey: ['net-worth', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getNetWorth(currentSpace.id);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  const {
    data: netWorthHistory,
    isLoading: isLoadingNetWorthHistory,
    isError: isErrorHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['net-worth-history', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getNetWorthHistory(currentSpace.id, 30);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  const {
    data: spendingData,
    isLoading: isLoadingSpending,
    isError: isErrorSpending,
    refetch: refetchSpending,
  } = useQuery({
    queryKey: ['spending-by-category', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return analyticsApi.getSpendingByCategory(currentSpace.id, startDate, endDate);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  const {
    data: incomeVsExpenses,
    isLoading: isLoadingIncomeExpenses,
    isError: isErrorIncome,
    refetch: refetchIncome,
  } = useQuery({
    queryKey: ['income-vs-expenses', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getIncomeVsExpenses(currentSpace.id, 6);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  const {
    data: cashflowForecast,
    isLoading: isLoadingCashflow,
    isError: isErrorCashflow,
    refetch: refetchCashflow,
  } = useQuery({
    queryKey: ['cashflow-forecast', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getCashflowForecast(currentSpace.id, 60);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  const {
    data: portfolioAllocation,
    isLoading: isLoadingPortfolio,
    isError: isErrorPortfolio,
    refetch: refetchPortfolio,
  } = useQuery({
    queryKey: ['portfolio-allocation', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return analyticsApi.getPortfolioAllocation(currentSpace.id);
    },
    enabled: !!currentSpace,
    staleTime: 120_000,
    retry: 1,
  });

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t('emptyState.noSpaceSelected')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {t('emptyState.selectSpacePrompt')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <Clock className="mr-2 h-4 w-4" />
            {t('scheduleReports')}
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/analytics/${currentSpace.id}/export?format=excel`} download>
              <Download className="mr-2 h-4 w-4" />
              {t('exportExcel')}
            </a>
          </Button>
        </div>
      </div>

      {/* Net Worth Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.netWorth')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isErrorNetWorth ? (
              <div className="text-sm text-muted-foreground">
                Failed to load.{' '}
                <button onClick={() => refetchNetWorth()} className="underline">
                  Retry
                </button>
              </div>
            ) : isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(netWorthData?.netWorth || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {netWorthData?.changePercent !== undefined &&
                    netWorthData.changePercent !== 0 && (
                      <>
                        {netWorthData.changePercent > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={
                            netWorthData.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {Math.abs(netWorthData.changePercent).toFixed(1)}%
                        </span>
                      </>
                    )}
                  {t('descriptions.vsLastMonth')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.totalAssets')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isErrorNetWorth ? (
              <div className="text-sm text-muted-foreground">
                Failed to load.{' '}
                <button onClick={() => refetchNetWorth()} className="underline">
                  Retry
                </button>
              </div>
            ) : isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(netWorthData?.totalAssets || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('descriptions.savingsInvestmentsCrypto')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.totalLiabilities')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isErrorNetWorth ? (
              <div className="text-sm text-muted-foreground">
                Failed to load.{' '}
                <button onClick={() => refetchNetWorth()} className="underline">
                  Retry
                </button>
              </div>
            ) : isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(netWorthData?.totalLiabilities || 0, currentSpace.currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('descriptions.creditCardsLoans')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cards.debtRatio')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isErrorNetWorth ? (
              <div className="text-sm text-muted-foreground">
                Failed to load.{' '}
                <button onClick={() => refetchNetWorth()} className="underline">
                  Retry
                </button>
              </div>
            ) : isLoadingNetWorth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {netWorthData?.totalAssets
                    ? ((netWorthData.totalLiabilities / netWorthData.totalAssets) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('descriptions.liabilitiesToAssets')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Chart */}
      {isErrorHistory ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-sm text-muted-foreground text-center">
              Failed to load net worth history.{' '}
              <button onClick={() => refetchHistory()} className="underline">
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <NetWorthChart
          data={netWorthHistory || []}
          currency={currentSpace.currency}
          isLoading={isLoadingNetWorthHistory}
        />
      )}

      {/* Income vs Expenses and Spending by Category */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isErrorIncome ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-sm text-muted-foreground text-center">
                Failed to load income vs expenses.{' '}
                <button onClick={() => refetchIncome()} className="underline">
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <IncomeExpenseChart
            data={incomeVsExpenses || []}
            currency={currentSpace.currency}
            isLoading={isLoadingIncomeExpenses}
          />
        )}

        {isErrorSpending ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-sm text-muted-foreground text-center">
                Failed to load spending data.{' '}
                <button onClick={() => refetchSpending()} className="underline">
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <SpendingCategoryChart
            data={spendingData || []}
            currency={currentSpace.currency}
            isLoading={isLoadingSpending}
          />
        )}
      </div>

      {/* Portfolio Allocation */}
      {isErrorPortfolio ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-sm text-muted-foreground text-center">
              Failed to load portfolio allocation.{' '}
              <button onClick={() => refetchPortfolio()} className="underline">
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PortfolioChart
          data={portfolioAllocation || []}
          currency={currentSpace.currency}
          isLoading={isLoadingPortfolio}
        />
      )}

      {/* Cashflow Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('cashflow.title')}
          </CardTitle>
          <CardDescription>{t('cashflow.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isErrorCashflow ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Failed to load cashflow forecast.{' '}
              <button onClick={() => refetchCashflow()} className="underline">
                Retry
              </button>
            </div>
          ) : isLoadingCashflow ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cashflowForecast ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('cashflow.currentBalance')}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(cashflowForecast.summary.currentBalance, currentSpace.currency)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('cashflow.projectedIncome')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(cashflowForecast.summary.totalIncome, currentSpace.currency)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('cashflow.projectedExpenses')}</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(cashflowForecast.summary.totalExpenses, currentSpace.currency)}
                  </p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    cashflowForecast.summary.projectedBalance >= 0
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                >
                  <p className="text-sm text-muted-foreground">{t('cashflow.projectedBalance')}</p>
                  <p
                    className={`text-lg font-semibold ${
                      cashflowForecast.summary.projectedBalance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(
                      cashflowForecast.summary.projectedBalance,
                      currentSpace.currency
                    )}
                  </p>
                </div>
              </div>

              {cashflowForecast.forecast && cashflowForecast.forecast.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">{t('cashflow.weeklyForecast')}</h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {cashflowForecast.forecast.slice(0, 8).map((point, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium">
                            {t('cashflow.week', { number: index + 1 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(point.date)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('cashflow.income')}</span>
                            <span className="text-green-600">
                              +{formatCurrency(point.income, currentSpace.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('cashflow.expenses')}</span>
                            <span className="text-red-600">
                              -{formatCurrency(point.expenses, currentSpace.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span className="font-medium">{t('cashflow.balance')}</span>
                            <span
                              className={`font-medium ${
                                point.balance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(point.balance, currentSpace.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t('cashflow.noForecast')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/accounts">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('cashflow.connectAccount')}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Insights */}

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        spaceId={currentSpace.id}
      />
    </div>
  );
}
