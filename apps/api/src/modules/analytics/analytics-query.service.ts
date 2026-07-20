// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class AnalyticsQueryService {
  private readonly logger = new Logger(AnalyticsQueryService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  /**
   * Get top purchases (largest individual transactions)
   */
  private async getTopPurchases(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    limit = 10,
    budgetId?: string
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
        deletedAt: null,
        excludeFromTotals: false,
        ...(budgetId
          ? { category: { budgetId, excludeFromTotals: false } }
          : { OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }] }),
      },
      orderBy: { amount: 'asc' }, // Most negative = largest expense
      take: limit,
      include: { account: true, category: true },
    });

    return transactions.map((t) => ({
      id: t.id,
      description: t.description,
      merchant: t.merchant,
      amount: Math.abs(t.amount.toNumber()),
      date: t.date.toISOString(),
      categoryName: t.category?.name || null,
      accountName: t.account.name,
    }));
  }

  /**
   * Get top merchants by total spending
   */
  private async getTopMerchants(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    limit = 10,
    budgetId?: string
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const results = await this.prisma.transaction.groupBy({
      by: ['merchant'],
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
        merchant: { not: null },
        deletedAt: null,
        excludeFromTotals: false,
        ...(budgetId
          ? { category: { budgetId, excludeFromTotals: false } }
          : { OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }] }),
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'asc' } },
      take: limit,
    });

    return results
      .filter((r) => r.merchant !== null)
      .map((r) => ({
        merchant: r.merchant!,
        totalSpent: Math.abs(r._sum.amount?.toNumber() || 0),
        transactionCount: r._count.id,
      }));
  }

  /**
   * Get top categories by total spending
   */
  private async getTopCategories(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    limit = 10,
    budgetId?: string
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const results = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        amount: { lt: 0 },
        categoryId: { not: null },
        deletedAt: null,
        excludeFromTotals: false,
        category: { excludeFromTotals: false, ...(budgetId && { budgetId }) },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'asc' } },
      take: limit,
    });

    const categoryIds = results.map((r) => r.categoryId).filter(Boolean) as string[];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return results
      .filter((r) => r.categoryId)
      .map((r) => {
        const cat = categoryMap.get(r.categoryId!);
        return {
          categoryId: r.categoryId!,
          categoryName: cat?.name || 'Unknown',
          color: cat?.color || null,
          icon: cat?.icon || null,
          totalSpent: Math.abs(r._sum.amount?.toNumber() || 0),
          transactionCount: r._count.id,
        };
      });
  }

  /**
   * Get statistics summary (combined view)
   */
  async getStatistics(
    userId: string,
    spaceId: string,
    startDate: Date,
    endDate: Date,
    budgetId?: string
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const [topPurchases, topMerchants, topCategories, totals] = await Promise.all([
      this.getTopPurchases(userId, spaceId, startDate, endDate, 10, budgetId),
      this.getTopMerchants(userId, spaceId, startDate, endDate, 10, budgetId),
      this.getTopCategories(userId, spaceId, startDate, endDate, 10, budgetId),
      this.prisma.transaction.aggregate({
        where: {
          account: { spaceId },
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      topPurchases,
      topMerchants,
      topCategories,
      totalTransactions: totals._count.id,
      totalAmount: totals._sum.amount?.toNumber() || 0,
    };
  }

  /**
   * Get annual trends with savings rate
   */
  async getAnnualTrends(userId: string, spaceId: string, months = 12, budgetId?: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

    const rawData = budgetId
      ? await this.prisma.$queryRaw<
          Array<{ month: string; income: string | null; expenses: string | null; count: string }>
        >`
          SELECT
            TO_CHAR(t.date, 'YYYY-MM') as month,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses,
            COUNT(*)::text as count
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE a.space_id = ${spaceId}
            AND t.date >= ${startDate}
            AND t.deleted_at IS NULL
            AND t.exclude_from_totals = false
            AND (c.exclude_from_totals IS NULL OR c.exclude_from_totals = false)
            AND c.budget_id = ${budgetId}
          GROUP BY TO_CHAR(t.date, 'YYYY-MM')
          ORDER BY month ASC
        `
      : await this.prisma.$queryRaw<
          Array<{ month: string; income: string | null; expenses: string | null; count: string }>
        >`
          SELECT
            TO_CHAR(t.date, 'YYYY-MM') as month,
            SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as expenses,
            COUNT(*)::text as count
          FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE a.space_id = ${spaceId}
            AND t.date >= ${startDate}
            AND t.deleted_at IS NULL
            AND t.exclude_from_totals = false
            AND (c.exclude_from_totals IS NULL OR c.exclude_from_totals = false)
          GROUP BY TO_CHAR(t.date, 'YYYY-MM')
          ORDER BY month ASC
        `;

    const dataMap = new Map<string, { income: number; expenses: number; count: number }>();
    for (const row of rawData) {
      dataMap.set(row.month, {
        income: parseFloat(row.income ?? '0'),
        expenses: parseFloat(row.expenses ?? '0'),
        count: parseInt(row.count, 10),
      });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransactions = 0;

    const monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
      savingsRate: number;
      transactionCount: number;
    }> = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().slice(0, 7);
      const data = dataMap.get(monthKey) || { income: 0, expenses: 0, count: 0 };
      const net = data.income - data.expenses;
      const savingsRate = data.income > 0 ? (net / data.income) * 100 : 0;

      totalIncome += data.income;
      totalExpenses += data.expenses;
      totalTransactions += data.count;

      monthlyData.push({
        month: monthKey,
        income: data.income,
        expenses: data.expenses,
        net,
        savingsRate: Math.round(savingsRate * 100) / 100,
        transactionCount: data.count,
      });
    }

    const overallSavingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 100 : 0;

    return {
      months: monthlyData,
      summary: {
        totalIncome,
        totalExpenses,
        totalNet: totalIncome - totalExpenses,
        totalTransactions,
        overallSavingsRate,
      },
    };
  }

  /**
   * Flexible query tool for ad-hoc analysis
   */
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
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const where: Record<string, unknown> = {
      account: { spaceId },
      date: { gte: params.startDate, lte: params.endDate },
      deletedAt: null,
      excludeFromTotals: false,
      ...(params.budgetId
        ? { category: { budgetId: params.budgetId, excludeFromTotals: false } }
        : { OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }] }),
    };

    if (params.categoryIds?.length) {
      where.categoryId = { in: params.categoryIds };
    }
    if (params.tagIds?.length) {
      where.tags = { some: { tagId: { in: params.tagIds } } };
    }
    if (params.merchantNames?.length) {
      where.merchant = { in: params.merchantNames };
    }
    if (params.accountIds?.length) {
      where.accountId = { in: params.accountIds };
    }
    if (params.amountMin !== undefined) {
      where.amount = {
        ...((where.amount as Record<string, unknown>) || {}),
        gte: params.amountMin,
      };
    }
    if (params.amountMax !== undefined) {
      where.amount = {
        ...((where.amount as Record<string, unknown>) || {}),
        lte: params.amountMax,
      };
    }

    if (params.groupBy === 'month') {
      return this._queryGroupByMonth(where, params.startDate, params.endDate);
    }

    const groupByField =
      params.groupBy === 'category'
        ? 'categoryId'
        : params.groupBy === 'account'
          ? 'accountId'
          : 'merchant';

    const results = await this.prisma.transaction.groupBy({
      by: [groupByField as any],
      where,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
      orderBy: { _sum: { amount: 'asc' } },
    });

    // Enrich with names
    if (params.groupBy === 'category') {
      const ids = results
        .map(
          (
            r: Record<string, unknown> & {
              _sum: { amount: { toNumber: () => number } | null };
              _count: { id: number };
              _avg: { amount: { toNumber: () => number } | null };
            }
          ) => r.categoryId
        )
        .filter(Boolean) as string[];
      const cats = await this.prisma.category.findMany({ where: { id: { in: ids } } });
      const catMap = new Map(cats.map((c) => [c.id, c.name]));

      return results.map(
        (
          r: Record<string, unknown> & {
            _sum: { amount: { toNumber: () => number } | null };
            _count: { id: number };
            _avg: { amount: { toNumber: () => number } | null };
          }
        ) => ({
          group: catMap.get(r.categoryId as string) || 'Uncategorized',
          groupId: r.categoryId as string | null,
          sum: Math.abs(r._sum.amount?.toNumber() || 0),
          count: r._count.id,
          average: Math.abs(r._avg.amount?.toNumber() || 0),
        })
      );
    }

    if (params.groupBy === 'account') {
      const ids = results
        .map(
          (
            r: Record<string, unknown> & {
              _sum: { amount: { toNumber: () => number } | null };
              _count: { id: number };
              _avg: { amount: { toNumber: () => number } | null };
            }
          ) => r.accountId
        )
        .filter(Boolean) as string[];
      const accts = await this.prisma.account.findMany({ where: { id: { in: ids } } });
      const acctMap = new Map(accts.map((a) => [a.id, a.name]));

      return results.map(
        (
          r: Record<string, unknown> & {
            _sum: { amount: { toNumber: () => number } | null };
            _count: { id: number };
            _avg: { amount: { toNumber: () => number } | null };
          }
        ) => ({
          group: acctMap.get(r.accountId as string) || 'Unknown',
          groupId: r.accountId as string | null,
          sum: Math.abs(r._sum.amount?.toNumber() || 0),
          count: r._count.id,
          average: Math.abs(r._avg.amount?.toNumber() || 0),
        })
      );
    }

    // merchant grouping
    return results.map(
      (
        r: Record<string, unknown> & {
          _sum: { amount: { toNumber: () => number } | null };
          _count: { id: number };
          _avg: { amount: { toNumber: () => number } | null };
        }
      ) => ({
        group: r.merchant || 'Unknown',
        groupId: r.merchant,
        sum: Math.abs(r._sum.amount?.toNumber() || 0),
        count: r._count.id,
        average: Math.abs(r._avg.amount?.toNumber() || 0),
      })
    );
  }

  private async _queryGroupByMonth(where: Record<string, unknown>, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: { date: true, amount: true },
    });

    const monthMap = new Map<string, { sum: number; count: number }>();
    for (const t of transactions) {
      const monthKey = t.date.toISOString().slice(0, 7);
      const existing = monthMap.get(monthKey) || { sum: 0, count: 0 };
      existing.sum += t.amount.toNumber();
      existing.count += 1;
      monthMap.set(monthKey, existing);
    }

    const result: Array<{
      group: string;
      groupId: string;
      sum: number;
      count: number;
      average: number;
    }> = [];
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const current = new Date(start);

    while (current <= end) {
      const key = current.toISOString().slice(0, 7);
      const data = monthMap.get(key) || { sum: 0, count: 0 };
      result.push({
        group: key,
        groupId: key,
        sum: data.sum,
        count: data.count,
        average: data.count > 0 ? data.sum / data.count : 0,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }

  /**
   * Get transactions grouped by day for calendar view
   */
  async getCalendarData(
    userId: string,
    spaceId: string,
    year: number,
    month: number,
    budgetId?: string
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate, lte: endDate },
        deletedAt: null,
        excludeFromTotals: false,
        ...(budgetId
          ? { category: { budgetId, excludeFromTotals: false } }
          : { OR: [{ category: { is: null } }, { category: { excludeFromTotals: false } }] }),
      },
      include: { account: true, category: true },
      orderBy: { date: 'asc' },
    });

    // Group by day
    const dayMap = new Map<string, any[]>();
    for (const t of transactions) {
      const dayKey = t.date.toISOString().slice(0, 10);
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
      dayMap.get(dayKey)!.push({
        id: t.id,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount.toNumber(),
        categoryName: t.category?.name || null,
        categoryColor: t.category?.color || null,
        accountName: t.account.name,
      });
    }

    // Build daily summary
    const days: Array<{
      date: string;
      transactions: unknown[];
      transactionCount: number;
      income: number;
      expenses: number;
      net: number;
    }> = [];
    const daysInMonth = endDate.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTransactions = dayMap.get(dateStr) || [];
      const income = dayTransactions
        .filter((t: { amount: number }) => t.amount > 0)
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
      const expenses = dayTransactions
        .filter((t: { amount: number }) => t.amount < 0)
        .reduce((sum: number, t: { amount: number }) => sum + Math.abs(t.amount), 0);

      days.push({
        date: dateStr,
        transactions: dayTransactions,
        transactionCount: dayTransactions.length,
        income,
        expenses,
        net: income - expenses,
      });
    }

    return { year, month, days };
  }
}