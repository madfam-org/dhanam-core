// SPDX-License-Identifier: AGPL-3.0-or-later
import { ANOMALY_DETECTION } from '@dhanam-core/shared';
import { Injectable, Logger } from '@nestjs/common';

import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

export interface SpendingAnomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  transactionId?: string;
  description: string;
  amount?: number;
  currency?: Currency;
  expectedRange?: { min: number; max: number };
  deviation?: number; // How many standard deviations from mean
  category?: string;
  merchant?: string;
  date: string;
  confidence: number;
}

export type AnomalyType =
  | 'unusual_amount' // Transaction significantly higher than normal
  | 'spending_spike' // Sudden increase in spending
  | 'new_merchant_large' // Large transaction at new merchant
  | 'category_surge' // Unusual spending in a category
  | 'frequency_change' // Unusual transaction frequency
  | 'duplicate_charge'; // Potential duplicate charge

interface TransactionStats {
  mean: number;
  stdDev: number;
  count: number;
  min: number;
  max: number;
}

@Injectable()
export class AnomalyService {
  private readonly logger = new Logger(AnomalyService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  /**
   * Detect all anomalies for a space
   */
  async detectAnomalies(
    spaceId: string,
    userId: string,
    options?: { days?: number; limit?: number }
  ): Promise<SpendingAnomaly[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const days = options?.days ?? 30;
    const limit = options?.limit ?? 50;

    this.logger.log(`Detecting anomalies for space: ${spaceId}, last ${days} days`);

    const anomalies: SpendingAnomaly[] = [];

    // Run all detection methods in parallel
    const [unusualAmounts, spendingSpikes, newMerchantLarge, categorySurges, duplicates] =
      await Promise.all([
        this.detectUnusualAmounts(spaceId, days),
        this.detectSpendingSpikes(spaceId, days),
        this.detectNewMerchantLargeTransactions(spaceId, days),
        this.detectCategorySurges(spaceId, days),
        this.detectDuplicateCharges(spaceId, days),
      ]);

    anomalies.push(
      ...unusualAmounts,
      ...spendingSpikes,
      ...newMerchantLarge,
      ...categorySurges,
      ...duplicates
    );

    // Sort by severity and date
    anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    this.logger.log(`Found ${anomalies.length} anomalies for space: ${spaceId}`);
    return anomalies.slice(0, limit);
  }

  /**
   * Detect transactions with unusually high amounts
   */
  private async detectUnusualAmounts(spaceId: string, days: number): Promise<SpendingAnomaly[]> {
    const startDate = this.getStartDate(days);
    const historyStartDate = this.getStartDate(days + ANOMALY_DETECTION.MIN_HISTORY_DAYS);

    // Get recent transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { lt: 0 }, // Only expenses
        pending: false,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        merchant: true,
        description: true,
        date: true,
        categoryId: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get historical stats by merchant
    const merchantStats = await this.getMerchantStats(spaceId, historyStartDate, startDate);
    const anomalies: SpendingAnomaly[] = [];

    for (const txn of recentTransactions) {
      const merchant = txn.merchant || this.extractMerchantFromDescription(txn.description);
      if (!merchant) continue;

      const normalizedMerchant = this.normalizeMerchant(merchant);
      const stats = merchantStats.get(normalizedMerchant);

      if (!stats || stats.count < 3) continue; // Not enough history

      const amount = Math.abs(Number(txn.amount));
      const zScore = (amount - stats.mean) / stats.stdDev;

      if (zScore > ANOMALY_DETECTION.ZSCORE_THRESHOLD && stats.stdDev > 0) {
        const severity = this.getSeverityFromZScore(zScore);
        anomalies.push({
          id: `unusual-${txn.id}`,
          type: 'unusual_amount',
          severity,
          transactionId: txn.id,
          description: `Transaction of ${this.formatCurrency(amount, txn.currency)} at ${merchant} is ${zScore.toFixed(1)}x higher than your average of ${this.formatCurrency(stats.mean, txn.currency)}`,
          amount,
          currency: txn.currency,
          expectedRange: { min: stats.min, max: stats.max },
          deviation: zScore,
          merchant,
          date: txn.date.toISOString(),
          confidence: Math.min(0.95, 0.7 + (stats.count / 20) * 0.25),
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect spending spikes (sudden increase in total spending)
   */
  private async detectSpendingSpikes(spaceId: string, days: number): Promise<SpendingAnomaly[]> {
    const anomalies: SpendingAnomaly[] = [];
    const now = new Date();

    // Compare weekly spending
    const weeks = Math.min(4, Math.floor(days / 7));
    const weeklySpending: number[] = [];

    for (let i = 0; i < weeks + 2; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const spending = await this.prisma.transaction.aggregate({
        where: {
          account: { spaceId },
          date: { gte: weekStart, lt: weekEnd },
          amount: { lt: 0 },
          pending: false,
        },
        _sum: { amount: true },
      });

      weeklySpending.push(Math.abs(Number(spending._sum.amount) || 0));
    }

    // Check for spikes in recent weeks compared to historical average
    if (weeklySpending.length >= 3) {
      const historicalAvg =
        weeklySpending.slice(2).reduce((a, b) => a + b, 0) / weeklySpending.slice(2).length || 1;

      for (let i = 0; i < Math.min(2, weeklySpending.length); i++) {
        const currentSpending = weeklySpending[i];
        const ratio = currentSpending / historicalAvg;

        if (ratio > ANOMALY_DETECTION.SPENDING_SPIKE_MULTIPLIER) {
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() - i * 7);

          anomalies.push({
            id: `spike-week-${i}`,
            type: 'spending_spike',
            severity: ratio > 2 ? 'high' : 'medium',
            description: `Weekly spending of ${this.formatCurrency(currentSpending, 'MXN')} is ${((ratio - 1) * 100).toFixed(0)}% higher than your average of ${this.formatCurrency(historicalAvg, 'MXN')}`,
            amount: currentSpending,
            deviation: ratio,
            date: weekEnd.toISOString(),
            confidence: 0.8,
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect large transactions at merchants with no history
   */
  private async detectNewMerchantLargeTransactions(
    spaceId: string,
    days: number
  ): Promise<SpendingAnomaly[]> {
    const startDate = this.getStartDate(days);
    const historyStartDate = this.getStartDate(365); // Look back a year for merchant history

    // Get all merchants the user has used before
    const historicalMerchants = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { lt: startDate, gte: historyStartDate },
        merchant: { not: null },
        pending: false,
      },
      select: { merchant: true },
      distinct: ['merchant'],
    });

    const knownMerchants = new Set(
      historicalMerchants.map((t) => this.normalizeMerchant(t.merchant!))
    );

    // Get recent large transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { lt: -ANOMALY_DETECTION.LARGE_TRANSACTION_USD },
        pending: false,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        merchant: true,
        description: true,
        date: true,
      },
    });

    const anomalies: SpendingAnomaly[] = [];

    for (const txn of recentTransactions) {
      const merchant = txn.merchant || this.extractMerchantFromDescription(txn.description);
      if (!merchant) continue;

      const normalizedMerchant = this.normalizeMerchant(merchant);
      if (!knownMerchants.has(normalizedMerchant)) {
        const amount = Math.abs(Number(txn.amount));
        anomalies.push({
          id: `new-merchant-${txn.id}`,
          type: 'new_merchant_large',
          severity: amount > 1000 ? 'high' : 'medium',
          transactionId: txn.id,
          description: `Large transaction of ${this.formatCurrency(amount, txn.currency)} at new merchant: ${merchant}`,
          amount,
          currency: txn.currency,
          merchant,
          date: txn.date.toISOString(),
          confidence: 0.75,
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect unusual spending surges in specific categories
   */
  private async detectCategorySurges(spaceId: string, days: number): Promise<SpendingAnomaly[]> {
    const startDate = this.getStartDate(days);
    const historyStartDate = this.getStartDate(days + 90);

    // Get historical category spending
    const historicalSpending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        account: { spaceId },
        date: { gte: historyStartDate, lt: startDate },
        categoryId: { not: null },
        amount: { lt: 0 },
        pending: false,
      },
      _sum: { amount: true },
      _count: true,
    });

    const historicalByCategory = new Map(
      historicalSpending.map((h) => [
        h.categoryId,
        { total: Math.abs(Number(h._sum.amount) || 0), count: h._count },
      ])
    );

    // Get recent category spending
    const recentSpending = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        account: { spaceId },
        date: { gte: startDate },
        categoryId: { not: null },
        amount: { lt: 0 },
        pending: false,
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get category names
    const categoryIds = recentSpending.map((r) => r.categoryId).filter(Boolean) as string[];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    const anomalies: SpendingAnomaly[] = [];
    const daysRatio = days / 90; // Normalize for comparison

    for (const recent of recentSpending) {
      if (!recent.categoryId) continue;

      const historical = historicalByCategory.get(recent.categoryId);
      if (!historical || historical.count < 3) continue;

      const recentAmount = Math.abs(Number(recent._sum.amount) || 0);
      const normalizedHistorical = historical.total * daysRatio;
      const ratio = recentAmount / normalizedHistorical;

      if (ratio > ANOMALY_DETECTION.SPENDING_SPIKE_MULTIPLIER && recentAmount > 100) {
        const categoryName = categoryNames.get(recent.categoryId) || 'Unknown';
        anomalies.push({
          id: `category-surge-${recent.categoryId}`,
          type: 'category_surge',
          severity: ratio > 2.5 ? 'high' : ratio > 1.75 ? 'medium' : 'low',
          description: `Spending on ${categoryName} is ${((ratio - 1) * 100).toFixed(0)}% higher than usual`,
          amount: recentAmount,
          category: categoryName,
          deviation: ratio,
          date: new Date().toISOString(),
          confidence: 0.7 + Math.min(0.2, historical.count / 50),
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect potential duplicate charges
   */
  private async detectDuplicateCharges(spaceId: string, days: number): Promise<SpendingAnomaly[]> {
    const startDate = this.getStartDate(days);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate },
        amount: { lt: 0 },
        pending: false,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        merchant: true,
        description: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const anomalies: SpendingAnomaly[] = [];
    const seen = new Map<string, (typeof transactions)[0]>();

    for (const txn of transactions) {
      const merchant = txn.merchant || this.extractMerchantFromDescription(txn.description);
      if (!merchant) continue;

      const key = `${this.normalizeMerchant(merchant)}-${Number(txn.amount).toFixed(2)}`;
      const previous = seen.get(key);

      if (previous) {
        const hoursDiff = (txn.date.getTime() - previous.date.getTime()) / (1000 * 60 * 60);

        if (hoursDiff <= ANOMALY_DETECTION.DUPLICATE_WINDOW_HOURS && hoursDiff > 0) {
          const amount = Math.abs(Number(txn.amount));
          anomalies.push({
            id: `duplicate-${txn.id}`,
            type: 'duplicate_charge',
            severity: amount > 100 ? 'high' : 'medium',
            transactionId: txn.id,
            description: `Possible duplicate charge of ${this.formatCurrency(amount, txn.currency)} at ${merchant} (${hoursDiff.toFixed(1)} hours apart)`,
            amount,
            currency: txn.currency,
            merchant,
            date: txn.date.toISOString(),
            confidence: hoursDiff < 24 ? 0.85 : 0.65,
          });
        }
      }

      seen.set(key, txn);
    }

    return anomalies;
  }

  /**
   * Get merchant spending statistics
   */
  private async getMerchantStats(
    spaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, TransactionStats>> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: startDate, lt: endDate },
        amount: { lt: 0 },
        pending: false,
      },
      select: {
        amount: true,
        merchant: true,
        description: true,
      },
    });

    const merchantAmounts = new Map<string, number[]>();

    for (const txn of transactions) {
      const merchant = txn.merchant || this.extractMerchantFromDescription(txn.description);
      if (!merchant) continue;

      const normalized = this.normalizeMerchant(merchant);
      const amount = Math.abs(Number(txn.amount));

      if (!merchantAmounts.has(normalized)) {
        merchantAmounts.set(normalized, []);
      }
      merchantAmounts.get(normalized)!.push(amount);
    }

    const stats = new Map<string, TransactionStats>();

    for (const [merchant, amounts] of merchantAmounts) {
      if (amounts.length < 2) continue;

      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const squaredDiffs = amounts.map((a) => Math.pow(a - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      stats.set(merchant, {
        mean,
        stdDev,
        count: amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
      });
    }

    return stats;
  }

  /**
   * Get anomaly summary for dashboard
   */
  async getAnomalySummary(spaceId: string, userId: string) {
    const anomalies = await this.detectAnomalies(spaceId, userId, { days: 30, limit: 100 });

    const bySeverity = { high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};
    let totalImpact = 0;

    for (const anomaly of anomalies) {
      bySeverity[anomaly.severity]++;
      byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
      if (anomaly.amount) {
        totalImpact += anomaly.amount;
      }
    }

    return {
      totalCount: anomalies.length,
      bySeverity,
      byType,
      totalImpact: Math.round(totalImpact * 100) / 100,
      recentAnomalies: anomalies.slice(0, 5),
    };
  }

  // Helper methods
  private getStartDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private getSeverityFromZScore(zScore: number): 'low' | 'medium' | 'high' {
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  private formatCurrency(amount: number, currency: Currency | string): string {
    const currencySymbols: Record<string, string> = {
      MXN: '$',
      USD: '$',
      EUR: '€',
    };
    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }

  private normalizeMerchant(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  private extractMerchantFromDescription(description: string): string | null {
    const patterns = [
      /^(pos|debit|credit|ach|wire|transfer|payment|purchase)\s+/i,
      /\s+(pos|debit|credit)$/i,
      /\s+\d{4,}$/,
      /\s+[A-Z]{2}\s*$/,
    ];

    let cleaned = description;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    cleaned = cleaned.trim();
    return cleaned.length > 2 ? cleaned : null;
  }
}
