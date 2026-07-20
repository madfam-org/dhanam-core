'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3, ShoppingCart, Store, FolderOpen, Receipt } from 'lucide-react';
import { useState } from 'react';

import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

function getDefaultDateRange() {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export default function StatisticsPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;

  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data: statistics, isLoading } = useQuery({
    queryKey: ['statistics', spaceId, startDate, endDate],
    queryFn: () => analyticsApi.getStatistics(spaceId!, startDate, endDate),
    enabled: !!spaceId && !!startDate && !!endDate,
    staleTime: 120_000,
    retry: 1,
  });

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">Select a space to view statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground">Detailed spending analysis for the selected period.</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stats-start">Start Date</Label>
              <Input
                id="stats-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stats-end">End Date</Label>
              <Input
                id="stats-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setStartDate(
                    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
                  );
                  setEndDate(now.toISOString().slice(0, 10));
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setStartDate(
                    new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
                  );
                  setEndDate(
                    new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
                  );
                }}
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setDate(start.getDate() - 90);
                  setStartDate(start.toISOString().slice(0, 10));
                  setEndDate(now.toISOString().slice(0, 10));
                }}
              >
                Last 90 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate('2000-01-01');
                  setEndDate(new Date().toISOString().slice(0, 10));
                }}
              >
                All Time
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !statistics ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No data available</h3>
            <p className="text-muted-foreground text-center">
              No transactions found for the selected date range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalTransactions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Math.abs(statistics.totalAmount), currentSpace.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Top Purchases
              </CardTitle>
              <CardDescription>Your largest transactions in this period</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No purchases in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {statistics.topPurchases.map((purchase, index) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{purchase.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {purchase.merchant && `${purchase.merchant} · `}
                            {formatDate(purchase.date)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium text-red-600">
                        {formatCurrency(Math.abs(purchase.amount), currentSpace.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Merchants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Top Merchants
              </CardTitle>
              <CardDescription>Merchants where you spend the most</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No merchant data in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {statistics.topMerchants.map((merchant, index) => (
                    <div
                      key={merchant.merchant}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{merchant.merchant}</p>
                          <p className="text-sm text-muted-foreground">
                            {merchant.transactionCount} transaction
                            {merchant.transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(Math.abs(merchant.totalSpent), currentSpace.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Top Categories
              </CardTitle>
              <CardDescription>Categories with the highest spending</CardDescription>
            </CardHeader>
            <CardContent>
              {statistics.topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No categorized transactions in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {statistics.topCategories.map((category, index) => (
                    <div
                      key={category.categoryId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{category.categoryName}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.transactionCount} transaction
                            {category.transactionCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(Math.abs(category.totalSpent), currentSpace.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
