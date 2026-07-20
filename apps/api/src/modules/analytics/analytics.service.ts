// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  ANALYTICS,
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
} from '@dhanam-core/shared';
import { Injectable, Logger } from '@nestjs/common';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';

import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { FxRatesService } from '../fx-rates/fx-rates.service';
import { SpacesService } from '../spaces/spaces.service';

import { AnalyticsQueryService } from './analytics-query.service';

export interface NetWorthHistoryPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export type OwnershipFilter = 'yours' | 'mine' | 'ours' | 'all';

export interface NetWorthByOwnership {
  yours: number; // Accounts owned by the current user (individual)
  mine: number; // Accounts owned by partner (individual, ownerId !== userId)
  ours: number; // Joint accounts
  total: number;
  currency: Currency;
  breakdown: {
    category: OwnershipFilter;
    assets: number;
    liabilities: number;
    netWorth: number;
    accountCount: number;
  }[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private fxRatesService: FxRatesService,
    private analyticsQueryService: AnalyticsQueryService
  ) {}

  /**
   * Calculate net worth with multi-currency support.
   * Converts all account balances to the target currency (defaults to space's base currency).
   * @param userId - The user ID
   * @param spaceId - The space ID
   * @param targetCurrency - Optional target currency for conversion (defaults to space currency)
   */
  async getNetWorth(
    userId: string,
    spaceId: string,
    targetCurrency?: Currency
  ): Promise<NetWorthResponse> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');
    return this._getNetWorthUnchecked(spaceId, targetCurrency);
  }

  /**
   * Internal net worth calculation that skips access verification.
   * Used by getDashboardData which already verified access once.
   */
  private async _getNetWorthUnchecked(
    spaceId: string,
    targetCurrency?: Currency
  ): Promise<NetWorthResponse> {
    // Get space to determine default currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const displayCurrency = targetCurrency || (space?.currency as Currency) || Currency.MXN;

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      include: {
        assetValuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    // Also fetch manual assets for comprehensive net worth
    const manualAssets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
    });

    // Pre-fetch all needed FX rates in parallel.
    const neededPairs = new Set<string>();
    for (const account of accounts) {
      const cur = account.currency as Currency;
      if (cur !== displayCurrency) neededPairs.add(`${cur}:${displayCurrency}`);
    }
    for (const asset of manualAssets) {
      const cur = asset.currency as Currency;
      if (cur !== displayCurrency) neededPairs.add(`${cur}:${displayCurrency}`);
    }

    const rateMap = new Map<string, number>();
    await Promise.all(
      Array.from(neededPairs).map(async (pair) => {
        const [from, to] = pair.split(':') as [Currency, Currency];
        rateMap.set(pair, await this.fxRatesService.getExchangeRate(from, to));
      })
    );

    const getRate = (from: Currency, to: Currency): number => {
      if (from === to) return 1;
      return rateMap.get(`${from}:${to}`) ?? 1;
    };

    // Convert all account balances to target currency
    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const account of accounts) {
      const balance = account.balance.toNumber();
      const accountCurrency = account.currency as Currency;

      // Convert to target currency if different
      let convertedBalance = balance;
      if (accountCurrency !== displayCurrency) {
        convertedBalance = Math.abs(balance) * getRate(accountCurrency, displayCurrency);
        // Preserve sign after conversion
        if (balance < 0) convertedBalance = -convertedBalance;
      }

      if (convertedBalance > 0) {
        totalAssets += convertedBalance;
      } else {
        totalLiabilities += Math.abs(convertedBalance);
      }
    }

    // Add manual assets (converted to target currency)
    for (const asset of manualAssets) {
      const value = asset.currentValue.toNumber();
      const assetCurrency = asset.currency as Currency;

      let convertedValue = value;
      if (assetCurrency !== displayCurrency) {
        convertedValue = value * getRate(assetCurrency, displayCurrency);
      }

      totalAssets += convertedValue;
    }

    const netWorth = totalAssets - totalLiabilities;

    // Get historical data for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalValuations = await this.prisma.assetValuation.findMany({
      where: {
        accountId: { in: accounts.map((a) => a.id) },
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Pre-fetch FX rates for historical valuations
    for (const v of historicalValuations) {
      const account = accounts.find((a) => a.id === v.accountId);
      const valuationCurrency = (v.currency || account?.currency || Currency.MXN) as Currency;
      if (valuationCurrency !== displayCurrency) {
        const pairKey = `${valuationCurrency}:${displayCurrency}`;
        if (!rateMap.has(pairKey)) {
          neededPairs.add(pairKey);
        }
      }
    }

    // Fetch any additional rates needed for historical valuations
    const additionalPairs = Array.from(neededPairs).filter((p) => !rateMap.has(p));
    if (additionalPairs.length > 0) {
      await Promise.all(
        additionalPairs.map(async (pair) => {
          const [from, to] = pair.split(':') as [Currency, Currency];
          rateMap.set(pair, await this.fxRatesService.getExchangeRate(from, to));
        })
      );
    }

    // Convert historical valuations to target currency for consistent trend
    const trend = historicalValuations.map((v) => {
      const account = accounts.find((a) => a.id === v.accountId);
      const valuationCurrency = (v.currency || account?.currency || Currency.MXN) as Currency;
      let value = v.value.toNumber();

      if (valuationCurrency !== displayCurrency) {
        value = value * getRate(valuationCurrency, displayCurrency);
      }

      return {
        date: v.date.toISOString(),
        value,
      };
    });

    // Calculate change from earliest to latest
    let changeAmount = 0;
    let changePercent = 0;
    if (trend.length >= 2) {
      const earliest = trend[0]?.value || 0;
      const latest = trend[trend.length - 1]?.value || 0;
      changeAmount = latest - earliest;
      changePercent = earliest > 0 ? ((latest - earliest) / earliest) * 100 : 0;
    }

    return {
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      currency: displayCurrency as unknown as import('@dhanam-core/shared').Currency,
      lastUpdated: new Date().toISOString(),
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      changeAmount: Math.round(changeAmount * 100) / 100,
    };
  }

  /**
   * Get net worth breakdown by ownership (yours, mine, ours).
   * Used for household views where couples want to see individual vs joint assets.
   * @param userId - The current user ID
   * @param spaceId - The space ID
   * @param targetCurrency - Optional target currency for conversion
   */
  async getNetWorthByOwnership(
    userId: string,
    spaceId: string,
    targetCurrency?: Currency
  ): Promise<NetWorthByOwnership> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Get space to determine default currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const displayCurrency = targetCurrency || (space?.currency as Currency) || Currency.MXN;

    // Fetch all accounts with owner information
    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
    });

    // Pre-fetch all needed FX rates in parallel.
    const neededPairs = new Set<string>();
    for (const account of accounts) {
      const cur = account.currency as Currency;
      if (cur !== displayCurrency) neededPairs.add(`${cur}:${displayCurrency}`);
    }

    const rateMap = new Map<string, number>();
    await Promise.all(
      Array.from(neededPairs).map(async (pair) => {
        const [from, to] = pair.split(':') as [Currency, Currency];
        rateMap.set(pair, await this.fxRatesService.getExchangeRate(from, to));
      })
    );

    const getRate = (from: Currency, to: Currency): number => {
      if (from === to) return 1;
      return rateMap.get(`${from}:${to}`) ?? 1;
    };

    // Initialize totals for each category
    const categories = {
      yours: { assets: 0, liabilities: 0, count: 0 },
      mine: { assets: 0, liabilities: 0, count: 0 },
      ours: { assets: 0, liabilities: 0, count: 0 },
    };

    for (const account of accounts) {
      const balance = account.balance.toNumber();
      const accountCurrency = account.currency as Currency;

      // Convert to target currency if different
      let convertedBalance = balance;
      if (accountCurrency !== displayCurrency) {
        convertedBalance = Math.abs(balance) * getRate(accountCurrency, displayCurrency);
        if (balance < 0) convertedBalance = -convertedBalance;
      }

      // Determine ownership category
      let category: 'yours' | 'mine' | 'ours';
      if (account.ownership === 'joint' || account.ownership === 'trust') {
        category = 'ours';
      } else if (account.ownerId === userId || !account.ownerId) {
        // Individual account owned by current user (or unassigned - default to yours)
        category = 'yours';
      } else {
        // Individual account owned by partner
        category = 'mine';
      }

      // Add to appropriate category
      categories[category].count++;
      if (convertedBalance > 0) {
        categories[category].assets += convertedBalance;
      } else {
        categories[category].liabilities += Math.abs(convertedBalance);
      }
    }

    // Calculate net worth for each category
    const yoursNetWorth = categories.yours.assets - categories.yours.liabilities;
    const mineNetWorth = categories.mine.assets - categories.mine.liabilities;
    const oursNetWorth = categories.ours.assets - categories.ours.liabilities;
    const totalNetWorth = yoursNetWorth + mineNetWorth + oursNetWorth;

    return {
      yours: Math.round(yoursNetWorth * 100) / 100,
      mine: Math.round(mineNetWorth * 100) / 100,
      ours: Math.round(oursNetWorth * 100) / 100,
      total: Math.round(totalNetWorth * 100) / 100,
      currency: displayCurrency,
      breakdown: [
        {
          category: 'yours',
          assets: Math.round(categories.yours.assets * 100) / 100,
          liabilities: Math.round(categories.yours.liabilities * 100) / 100,
          netWorth: Math.round(yoursNetWorth * 100) / 100,
          accountCount: categories.yours.count,
        },
        {
          category: 'mine',
          assets: Math.round(categories.mine.assets * 100) / 100,
          liabilities: Math.round(categories.mine.liabilities * 100) / 100,
          netWorth: Math.round(mineNetWorth * 100) / 100,
          accountCount: categories.mine.count,
        },
        {
          category: 'ours',
          assets: Math.round(categories.ours.assets * 100) / 100,
          liabilities: Math.round(categories.ours.liabilities * 100) / 100,
          netWorth: Math.round(oursNetWorth * 100) / 100,
          accountCount: categories.ours.count,
        },
      ],
    };
  }

  /**
   * Get accounts filtered by ownership type.
   * @param userId - The current user ID
   * @param spaceId - The space ID
   * @param ownership - Filter: 'yours', 'mine', 'ours', or 'all'
   */
  async getAccountsByOwnership(
    userId: string,
    spaceId: string,
    ownership: OwnershipFilter = 'all'
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      orderBy: { balance: 'desc' },
    });

    if (ownership === 'all') {
      return accounts.map((a) => ({
        ...a,
        balance: a.balance.toNumber(),
        ownershipCategory: this.determineOwnershipCategory(a, userId),
      }));
    }

    return accounts
      .filter((account) => {
        const category = this.determineOwnershipCategory(account, userId);
        return category === ownership;
      })
      .map((a) => ({
        ...a,
        balance: a.balance.toNumber(),
        ownershipCategory: ownership,
      }));
  }

  private determineOwnershipCategory(
    account: { ownership: string; ownerId: string | null },
    userId: string
  ): 'yours' | 'mine' | 'ours' {
    if (account.ownership === 'joint' || account.ownership === 'trust') {
      return 'ours';
    }
    if (account.ownerId === userId || !account.ownerId) {
      return 'yours';
    }
    return 'mine';
  }

  /**
   * Get net worth history for charting
   * Returns daily snapshots of net worth, assets, and liabilities
   */
  async getNetWorthHistory(
    userId: string,
    spaceId: string,
    days = 30
  ): Promise<NetWorthHistoryPoint[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // Get all accounts in the space
    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
    });

    // Get manual assets
    const manualAssets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
    });

    // Get all valuations in the date range
    const valuations = await this.prisma.assetValuation.findMany({
      where: {
        accountId: { in: accounts.map((a) => a.id) },
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // Group valuations by date
    const valuationsByDate = new Map<string, Map<string, number>>();
    for (const v of valuations) {
      const dateKey = format(v.date, 'yyyy-MM-dd');
      if (!valuationsByDate.has(dateKey)) {
        valuationsByDate.set(dateKey, new Map());
      }
      valuationsByDate.get(dateKey)!.set(v.accountId, v.value.toNumber());
    }

    // Build daily history using last known values
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    const history: NetWorthHistoryPoint[] = [];
    const lastKnownValues = new Map<string, number>();

    // Initialize with current balances as fallback
    for (const account of accounts) {
      lastKnownValues.set(account.id, account.balance.toNumber());
    }

    for (const date of allDates) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayValuations = valuationsByDate.get(dateKey);

      // Update last known values with any valuations for this day
      if (dayValuations) {
        for (const [accountId, value] of dayValuations) {
          lastKnownValues.set(accountId, value);
        }
      }

      // Calculate totals using last known values
      let assets = 0;
      let liabilities = 0;

      for (const account of accounts) {
        const value = lastKnownValues.get(account.id) || 0;
        if (value > 0 && account.type !== 'credit') {
          assets += value;
        } else if (value < 0 || account.type === 'credit') {
          liabilities += Math.abs(value);
        }
      }

      // Add manual assets (use current value as they don't have daily history)
      for (const asset of manualAssets) {
        assets += asset.currentValue.toNumber();
      }

      history.push({
        date: dateKey,
        netWorth: Math.round((assets - liabilities) * 100) / 100,
        assets: Math.round(assets * 100) / 100,
        liabilities: Math.round(liabilities * 100) / 100,
      });
    }

    return history;
  }

  async getCashflowForecast(userId: string, spaceId: string, days = 60): Promise<CashflowForecast> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');
    return this._getCashflowForecastUnchecked(spaceId, days);
  }

  /**
   * Internal cashflow forecast that skips access verification.
   * Used by getDashboardData which already verified access once.
   */
  private async _getCashflowForecastUnchecked(
    spaceId: string,
    days = 60
  ): Promise<CashflowForecast> {
    // Get current liquid account balances
    const liquidAccounts = await this.prisma.account.findMany({
      where: {
        spaceId,
        type: { in: ['checking', 'savings'] },
      },
    });

    const currentBalance = liquidAccounts.reduce(
      (sum, account) => sum + account.balance.toNumber(),
      0
    );

    // Analyze historical patterns for forecasting
    const historicalData = await this.getHistoricalCashflowPatterns(
      spaceId,
      ANALYTICS.HISTORY_DAYS
    );

    const forecast: Array<{ date: string; income: number; expenses: number; balance: number }> = [];
    let runningBalance = currentBalance;
    const today = new Date();

    for (let i = 0; i < days; i += 7) {
      // Weekly granularity
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Predict weekly income/expenses based on historical averages
      const weeklyIncome = historicalData.avgWeeklyIncome || 0;
      const weeklyExpenses = historicalData.avgWeeklyExpenses || 0;
      const weeklyNet = weeklyIncome - weeklyExpenses;

      runningBalance += weeklyNet;

      forecast.push({
        date: forecastDate.toISOString(),
        income: weeklyIncome,
        expenses: weeklyExpenses,
        balance: runningBalance,
      });
    }

    const totalProjectedIncome = forecast.reduce((sum, week) => sum + week.income, 0);
    const totalProjectedExpenses = forecast.reduce((sum, week) => sum + week.expenses, 0);

    return {
      forecast,
      summary: {
        currentBalance,
        projectedBalance: runningBalance,
        totalIncome: totalProjectedIncome,
        totalExpenses: totalProjectedExpenses,
        currency: Currency.MXN as unknown as import('@dhanam-core/shared').Currency,
      },
    };
  }

  private async getHistoricalCashflowPatterns(
    spaceId: string,
    days: number
  ): Promise<{
    avgWeeklyIncome: number;
    avgWeeklyExpenses: number;
    incomeVariability: number;
    expenseVariability: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get income transactions (positive amounts), excluding transfers/excluded categories
    const incomeData = await this.prisma.transaction.aggregate({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { gt: 0 },
        excludeFromTotals: false,
        OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }],
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get expense transactions (negative amounts), excluding transfers/excluded categories
    const expenseData = await this.prisma.transaction.aggregate({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { lt: 0 },
        excludeFromTotals: false,
        OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }],
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalIncome = incomeData._sum.amount?.toNumber() || 0;
    const totalExpenses = Math.abs(expenseData._sum.amount?.toNumber() || 0);

    const weeksInPeriod = days / 7;

    return {
      avgWeeklyIncome: totalIncome / weeksInPeriod,
      avgWeeklyExpenses: totalExpenses / weeksInPeriod,
      incomeVariability: 0.1, // 10% variance
      expenseVariability: 0.15, // 15% variance
    };
  }

  async getSpendingByCategory(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    budgetId?: string
  ): Promise<SpendingByCategory[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const transactions = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
        excludeFromTotals: false,
        ...(budgetId
          ? { category: { budgetId, excludeFromTotals: false } }
          : { OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }] }),
      },
      _sum: { amount: true },
      _count: true,
    });

    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: transactions.map((t) => t.categoryId).filter(Boolean) as string[] },
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Calculate total spending for percentage calculation
    const totalSpending = transactions.reduce(
      (sum, t) => sum + Math.abs(t._sum.amount?.toNumber() || 0),
      0
    );

    return transactions
      .filter((t) => t.categoryId)
      .map((t) => {
        const category = categoryMap.get(t.categoryId!) as (typeof categories)[0] | undefined;
        const amount = Math.abs(t._sum.amount?.toNumber() || 0);
        return {
          categoryId: t.categoryId!,
          categoryName: category?.name || 'Unknown',
          amount,
          percentage: totalSpending > 0 ? Math.round((amount / totalSpending) * 10000) / 100 : 0,
          transactionCount: t._count,
          icon: category?.icon || undefined,
          color: category?.color || undefined,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Get income vs expenses for the last N months.
   * Uses a single GROUP BY query instead of 2*N individual queries.
   */
  async getIncomeVsExpenses(
    userId: string,
    spaceId: string,
    months = 6,
    budgetId?: string
  ): Promise<IncomeVsExpenses[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const rawData = budgetId
      ? await this.prisma.$queryRaw<
          Array<{ month: string; income: string | null; expenses: string | null }>
        >`
          SELECT
            TO_CHAR(t.date, 'YYYY-MM') as month,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE a.space_id = ${spaceId}
            AND t.date >= ${sixMonthsAgo}
            AND t.deleted_at IS NULL
            AND t.exclude_from_totals = false
            AND (c.exclude_from_totals IS NULL OR c.exclude_from_totals = false)
            AND c.budget_id = ${budgetId}
          GROUP BY TO_CHAR(t.date, 'YYYY-MM')
          ORDER BY month ASC
        `
      : await this.prisma.$queryRaw<
          Array<{ month: string; income: string | null; expenses: string | null }>
        >`
          SELECT
            TO_CHAR(t.date, 'YYYY-MM') as month,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE a.space_id = ${spaceId}
            AND t.date >= ${sixMonthsAgo}
            AND t.deleted_at IS NULL
            AND t.exclude_from_totals = false
            AND (c.exclude_from_totals IS NULL OR c.exclude_from_totals = false)
          GROUP BY TO_CHAR(t.date, 'YYYY-MM')
          ORDER BY month ASC
        `;

    // Build a map from raw results
    const dataMap = new Map<string, { income: number; expenses: number }>();
    for (const row of rawData) {
      dataMap.set(row.month, {
        income: parseFloat(row.income ?? '0'),
        expenses: parseFloat(row.expenses ?? '0'),
      });
    }

    // Fill all months (including those with no transactions)
    const result: IncomeVsExpenses[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7);
      const data = dataMap.get(monthKey) || { income: 0, expenses: 0 };
      result.push({
        month: monthKey,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      });
    }

    return result;
  }

  async getAccountBalances(userId: string, spaceId: string): Promise<AccountBalanceAnalytics[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      orderBy: { balance: 'desc' },
    });

    return accounts.map((account) => ({
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance: account.balance.toNumber(),
      currency: account.currency as unknown as import('@dhanam-core/shared').Currency,
      lastSynced: account.lastSyncedAt?.toISOString(),
    }));
  }

  async getPortfolioAllocation(userId: string, spaceId: string): Promise<PortfolioAllocation[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');
    return this._getPortfolioAllocationUnchecked(spaceId);
  }

  /**
   * Internal portfolio allocation that skips access verification.
   * Used by getDashboardData which already verified access once.
   */
  private async _getPortfolioAllocationUnchecked(spaceId: string): Promise<PortfolioAllocation[]> {
    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
    });

    const totalValue = accounts.reduce(
      (sum, account) => sum + Math.abs(account.balance.toNumber()),
      0
    );

    const typeGroups = accounts.reduce(
      (groups, account) => {
        const type = account.type;
        if (!groups[type]) {
          groups[type] = { value: 0, count: 0 };
        }
        groups[type]!.value += Math.abs(account.balance.toNumber());
        groups[type]!.count += 1;
        return groups;
      },
      {} as Record<string, { value: number; count: number }>
    );

    return Object.entries(typeGroups).map(([type, data]) => {
      const typedData = data as { value: number; count: number };
      return {
        assetType: type,
        value: typedData.value,
        percentage: totalValue > 0 ? (typedData.value / totalValue) * 100 : 0,
        accountCount: typedData.count,
      };
    });
  }

  /**
   * Get consolidated net worth across all of a user's spaces.
   * Converts each space's net worth to the specified base currency.
   * @param userId - The user ID
   * @param baseCurrency - Target currency for consolidation (defaults to MXN)
   */
  async getConsolidatedNetWorth(
    userId: string,
    baseCurrency: Currency = Currency.MXN
  ): Promise<{
    totalNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    currency: Currency;
    spaces: Array<{
      spaceId: string;
      spaceName: string;
      netWorth: number;
      assets: number;
      liabilities: number;
      originalCurrency: Currency;
    }>;
  }> {
    // Find all spaces the user belongs to
    const userSpaces = await this.prisma.userSpace.findMany({
      where: { userId },
      include: { space: true },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    const spaces: Array<{
      spaceId: string;
      spaceName: string;
      netWorth: number;
      assets: number;
      liabilities: number;
      originalCurrency: Currency;
    }> = [];

    // Calculate net worth for each space
    for (const us of userSpaces) {
      try {
        const nw = await this._getNetWorthUnchecked(us.spaceId, baseCurrency);
        totalAssets += nw.totalAssets;
        totalLiabilities += nw.totalLiabilities;
        spaces.push({
          spaceId: us.spaceId,
          spaceName: us.space.name,
          netWorth: nw.netWorth,
          assets: nw.totalAssets,
          liabilities: nw.totalLiabilities,
          originalCurrency: (us.space.currency as Currency) || Currency.MXN,
        });
      } catch (err) {
        this.logger.warn(`Failed to calculate net worth for space ${us.spaceId}: ${err}`);
      }
    }

    return {
      totalNetWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      currency: baseCurrency,
      spaces,
    };
  }

  /**
   * Combined dashboard data endpoint to reduce waterfall requests
   * Returns all data needed for dashboard in a single API call
   */
  async getDashboardData(userId: string, spaceId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const startTime = performance.now();
    const timings: Record<string, number> = {};

    // Wrap each sub-query to track timing
    const timed = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      const t0 = performance.now();
      try {
        const result = await fn();
        timings[name] = Math.round(performance.now() - t0);
        return result;
      } catch (e) {
        timings[name] = Math.round(performance.now() - t0);
        throw e;
      }
    };

    // Fetch all data in parallel with fault tolerance — one sub-query failure
    // should not crash the entire dashboard endpoint.
    // Uses _unchecked variants to skip redundant verifyUserAccess calls.
    const results = await Promise.allSettled([
      // 0: Accounts
      timed('accounts', () =>
        this.prisma.account.findMany({
          where: { spaceId },
          orderBy: { balance: 'desc' },
        })
      ),
      // 1: Recent transactions (limit 5)
      timed('transactions', () =>
        this.prisma.transaction.findMany({
          where: { account: { spaceId } },
          orderBy: { date: 'desc' },
          take: 5,
          include: { account: true },
        })
      ),
      // 2: Budgets with first budget summary
      timed('budgets', () => this.getBudgetsWithSummary(spaceId)),
      // 3: Net worth (unchecked — access already verified above)
      timed('netWorth', () => this._getNetWorthUnchecked(spaceId)),
      // 4: Cashflow forecast (unchecked — access already verified above)
      timed('cashflowForecast', () => this._getCashflowForecastUnchecked(spaceId, 60)),
      // 5: Portfolio allocation (unchecked — access already verified above)
      timed('portfolioAllocation', () => this._getPortfolioAllocationUnchecked(spaceId)),
      // 6: Goals
      timed('goals', () =>
        this.prisma.goal.findMany({
          where: { spaceId },
          include: {
            allocations: {
              include: {
                account: {
                  select: {
                    id: true,
                    name: true,
                    balance: true,
                    currency: true,
                  },
                },
              },
            },
          },
          orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
          take: 10,
        })
      ),
    ]);

    timings['total'] = Math.round(performance.now() - startTime);
    this.logger.log(`Dashboard timings: ${JSON.stringify(timings)}`);

    const sectionNames = [
      'accounts',
      'recentTransactions',
      'budgets',
      'netWorth',
      'cashflowForecast',
      'portfolioAllocation',
      'goals',
    ];

    const _errors: string[] = [];

    // Extract results with safe fallbacks
    const extract = <T>(index: number, fallback: T): T => {
      const result = results[index];
      if (result.status === 'fulfilled') return result.value as T;
      this.logger.error(
        `getDashboardData: ${sectionNames[index]} failed for space ${spaceId}`,
        result.reason?.stack || result.reason
      );
      _errors.push(sectionNames[index]);
      return fallback;
    };

    const accounts = extract<any[]>(0, []);
    const recentTransactions = extract<any[]>(1, []);
    const budgetsWithSummary = extract<{ budgets: any[]; summary: any }>(2, {
      budgets: [],
      summary: null,
    });
    const netWorth = extract<any>(3, null);
    const cashflowForecast = extract<any>(4, null);
    const portfolioAllocation = extract<any[]>(5, []);
    const goals = extract<any[]>(6, []);

    return {
      accounts: accounts.map((a: any) => ({
        ...a,
        balance: a.balance.toNumber(),
      })),
      recentTransactions: {
        data: recentTransactions.map((t: any) => ({
          ...t,
          amount: t.amount.toNumber(),
          date: t.date.toISOString(),
        })),
        total: recentTransactions.length,
      },
      budgets: budgetsWithSummary.budgets,
      currentBudgetSummary: budgetsWithSummary.summary,
      netWorth,
      cashflowForecast,
      portfolioAllocation,
      goals: goals.map((g: any) => ({
        ...g,
        targetAmount: g.targetAmount.toNumber(),
        currentProbability: g.currentProbability?.toNumber() ?? null,
        confidenceLow: g.confidenceLow?.toNumber() ?? null,
        confidenceHigh: g.confidenceHigh?.toNumber() ?? null,
        currentProgress: g.currentProgress?.toNumber() ?? null,
        expectedReturn: g.expectedReturn?.toNumber() ?? null,
        volatility: g.volatility?.toNumber() ?? null,
        monthlyContribution: g.monthlyContribution?.toNumber() ?? null,
        allocations: g.allocations.map((a: any) => ({
          ...a,
          percentage: a.percentage.toNumber(),
          account: {
            ...a.account,
            balance: a.account.balance.toNumber(),
          },
        })),
      })),
      ...(_errors.length > 0 ? { _errors } : {}),
    };
  }

  // ── Delegated query methods (implemented in AnalyticsQueryService) ──

  async getStatistics(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    budgetId?: string
  ) {
    return this.analyticsQueryService.getStatistics(userId, spaceId, startDate, endDate, budgetId);
  }

  async getAnnualTrends(userId: string, spaceId: string, months = 12, budgetId?: string) {
    return this.analyticsQueryService.getAnnualTrends(userId, spaceId, months, budgetId);
  }

  async executeQuery(
    userId: string,
    spaceId: string,
    params: {
      startDate: Date;
      endDate: Date;
      groupBy: 'month' | 'category' | 'merchant' | 'account' | 'tag';
      categoryIds?: string[];
      tagIds?: string[];
      merchantNames?: string[];
      accountIds?: string[];
      amountMin?: number;
      amountMax?: number;
      aggregation?: 'sum' | 'count' | 'average';
      budgetId?: string;
    }
  ) {
    return this.analyticsQueryService.executeQuery(userId, spaceId, params);
  }

  async getCalendarData(
    userId: string,
    spaceId: string,
    year: number,
    month: number,
    budgetId?: string
  ) {
    return this.analyticsQueryService.getCalendarData(userId, spaceId, year, month, budgetId);
  }

  private async getBudgetsWithSummary(spaceId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { spaceId },
      include: {
        categories: {
          include: {
            _count: {
              select: { transactions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (budgets.length === 0) {
      return { budgets: [], summary: null };
    }

    const currentBudget = budgets[0];
    if (!currentBudget) {
      return { budgets: [], summary: null };
    }

    // Get transactions for current budget
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: {
          gte: currentBudget.startDate,
          lte: currentBudget.endDate || undefined,
        },
        categoryId: {
          in: currentBudget.categories.map((c) => c.id),
        },
      },
    });

    // Calculate category summaries (exclude categories marked as excludeFromBudget)
    const budgetCategories = currentBudget.categories.filter((c) => !c.excludeFromBudget);
    const categories = budgetCategories.map((category) => {
      const categoryTransactions = transactions.filter((t) => t.categoryId === category.id);
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount.toNumber()), 0);
      const budgetedAmount = category.budgetedAmount.toNumber();
      const carryoverAmount = category.carryoverAmount.toNumber();
      const remaining = budgetedAmount + carryoverAmount - spent;
      const percentUsed =
        budgetedAmount + carryoverAmount > 0
          ? (spent / (budgetedAmount + carryoverAmount)) * 100
          : 0;

      return {
        id: category.id,
        budgetId: category.budgetId,
        name: category.name,
        budgetedAmount,
        carryoverAmount,
        icon: category.icon,
        color: category.color,
        description: category.description,
        spent,
        remaining,
        percentUsed,
        transactionCount: categoryTransactions.length,
      };
    });

    const totalIncome = currentBudget.income.toNumber();
    const totalBudgeted = budgetCategories.reduce((sum, c) => sum + c.budgetedAmount.toNumber(), 0);
    const totalCarryover = budgetCategories.reduce(
      (sum, c) => sum + c.carryoverAmount.toNumber(),
      0
    );
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudgeted + totalCarryover - totalSpent;
    const totalPercentUsed =
      totalBudgeted + totalCarryover > 0
        ? (totalSpent / (totalBudgeted + totalCarryover)) * 100
        : 0;

    return {
      budgets: budgets.map((b) => ({
        id: b.id,
        name: b.name,
        period: b.period,
        startDate: b.startDate.toISOString(),
        endDate: b.endDate?.toISOString() || null,
        income: b.income.toNumber(),
      })),
      summary: {
        id: currentBudget.id,
        name: currentBudget.name,
        categories,
        summary: {
          totalBudgeted,
          totalSpent,
          totalRemaining,
          totalPercentUsed,
          totalIncome,
          readyToAssign: totalIncome + totalCarryover - totalBudgeted,
          totalCarryover,
        },
      },
    };
  }
}