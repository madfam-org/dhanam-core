// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { Currency, RecurrenceFrequency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';

interface TransactionForDetection {
  id: string;
  date: Date;
  amount: number;
  merchant: string | null;
  description: string;
}

interface DetectedPattern {
  merchantName: string;
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
  }>;
  suggestedFrequency: RecurrenceFrequency;
  averageAmount: number;
  amountVariance: number;
  confidence: number;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrenceCount: number;
  currency: Currency;
}

interface FrequencyResult {
  frequency: RecurrenceFrequency;
  score: number;
  avgDaysBetween: number;
}

@Injectable()
export class RecurringDetectorService {
  private readonly logger = new Logger(RecurringDetectorService.name);

  // Expected days between transactions for each frequency
  private readonly frequencyDays: Record<RecurrenceFrequency, number> = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };

  // Tolerance for frequency detection (as percentage)
  private readonly frequencyTolerance = 0.25;

  // Minimum occurrences to detect a pattern
  private readonly minOccurrences = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Detect recurring transaction patterns for a space
   */
  async detectPatterns(spaceId: string): Promise<DetectedPattern[]> {
    this.logger.log(`Detecting recurring patterns for space: ${spaceId}`);

    // Get all transactions for the space from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        date: { gte: oneYearAgo },
        pending: false,
      },
      select: {
        id: true,
        date: true,
        amount: true,
        merchant: true,
        description: true,
        currency: true,
        recurringId: true,
      },
      orderBy: { date: 'asc' },
    });

    // Filter out transactions already linked to recurring patterns and transform Decimal to number
    const unlinkedTransactions = transactions
      .filter((t) => !t.recurringId)
      .map((t) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        merchant: t.merchant,
        description: t.description,
        currency: t.currency,
      }));

    // Group by normalized merchant name
    const merchantGroups = this.groupByMerchant(unlinkedTransactions);

    // Get existing recurring patterns to exclude
    const existingPatterns = await this.prisma.recurringTransaction.findMany({
      where: { spaceId, status: { in: ['confirmed', 'detected'] } },
      select: { merchantName: true },
    });
    const existingMerchants = new Set(
      existingPatterns.map((p) => this.normalizeMerchant(p.merchantName))
    );

    // Analyze each group for recurring patterns
    const patterns: DetectedPattern[] = [];

    for (const [normalizedMerchant, group] of Object.entries(merchantGroups)) {
      // Skip if already tracked
      if (existingMerchants.has(normalizedMerchant)) {
        continue;
      }

      // Need at least minOccurrences transactions
      if (group.transactions.length < this.minOccurrences) {
        continue;
      }

      const pattern = this.analyzePatternForGroup(
        group.merchantName,
        group.transactions,
        group.currency
      );

      if (pattern && pattern.confidence >= 0.6) {
        patterns.push(pattern);
      }
    }

    // Sort by confidence (highest first)
    patterns.sort((a, b) => b.confidence - a.confidence);

    this.logger.log(`Detected ${patterns.length} recurring patterns for space: ${spaceId}`);
    return patterns;
  }

  /**
   * Group transactions by normalized merchant name
   */
  private groupByMerchant(
    transactions: Array<TransactionForDetection & { currency: Currency }>
  ): Record<
    string,
    { merchantName: string; transactions: TransactionForDetection[]; currency: Currency }
  > {
    const groups: Record<
      string,
      { merchantName: string; transactions: TransactionForDetection[]; currency: Currency }
    > = {};

    for (const txn of transactions) {
      const merchant = txn.merchant || this.extractMerchantFromDescription(txn.description);
      if (!merchant) continue;

      const normalized = this.normalizeMerchant(merchant);
      if (!groups[normalized]) {
        groups[normalized] = {
          merchantName: merchant,
          transactions: [],
          currency: txn.currency,
        };
      }
      groups[normalized].transactions.push({
        id: txn.id,
        date: txn.date,
        amount: Math.abs(Number(txn.amount)),
        merchant: txn.merchant,
        description: txn.description,
      });
    }

    return groups;
  }

  /**
   * Extract merchant name from transaction description
   */
  private extractMerchantFromDescription(description: string): string | null {
    // Common patterns to strip
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

  /**
   * Normalize merchant name for grouping
   */
  private normalizeMerchant(merchant: string): string {
    return merchant
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  /**
   * Analyze a group of transactions for recurring patterns
   */
  private analyzePatternForGroup(
    merchantName: string,
    transactions: TransactionForDetection[],
    currency: Currency
  ): DetectedPattern | null {
    if (transactions.length < this.minOccurrences) {
      return null;
    }

    // Sort by date
    const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate intervals between consecutive transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days =
        (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    // Detect frequency
    const frequencyResult = this.detectFrequency(intervals);
    if (!frequencyResult || frequencyResult.score < 0.5) {
      return null;
    }

    // Calculate amount statistics
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance = this.calculateVariance(amounts, avgAmount);

    // Skip if amount variance is too high (> 50%)
    if (amountVariance > 0.5) {
      return null;
    }

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      frequencyResult.score,
      amountVariance,
      sorted.length
    );

    return {
      merchantName,
      transactions: sorted.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        amount: t.amount,
        description: t.description,
      })),
      suggestedFrequency: frequencyResult.frequency,
      averageAmount: Math.round(avgAmount * 100) / 100,
      amountVariance: Math.round(amountVariance * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      firstOccurrence: sorted[0].date.toISOString(),
      lastOccurrence: sorted[sorted.length - 1].date.toISOString(),
      occurrenceCount: sorted.length,
      currency,
    };
  }

  /**
   * Detect the most likely frequency from intervals
   */
  private detectFrequency(intervals: number[]): FrequencyResult | null {
    if (intervals.length === 0) return null;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let bestMatch: FrequencyResult | null = null;
    let bestScore = 0;

    for (const [frequency, expectedDays] of Object.entries(this.frequencyDays) as [
      RecurrenceFrequency,
      number,
    ][]) {
      const tolerance = expectedDays * this.frequencyTolerance;
      const minDays = expectedDays - tolerance;
      const maxDays = expectedDays + tolerance;

      // Count how many intervals fall within expected range
      const matchingIntervals = intervals.filter((i) => i >= minDays && i <= maxDays);
      const score = matchingIntervals.length / intervals.length;

      // Also consider how close the average is to expected
      const avgDeviation = Math.abs(avgInterval - expectedDays) / expectedDays;
      const avgScore = Math.max(0, 1 - avgDeviation);

      // Combined score
      const combinedScore = score * 0.7 + avgScore * 0.3;

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestMatch = {
          frequency,
          score: combinedScore,
          avgDaysBetween: avgInterval,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate variance as a ratio of mean
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0 || mean === 0) return 1;

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return stdDev / mean;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    frequencyScore: number,
    amountVariance: number,
    occurrenceCount: number
  ): number {
    // Base confidence from frequency detection
    let confidence = frequencyScore * 0.5;

    // Adjust for amount consistency (lower variance = higher confidence)
    confidence += (1 - Math.min(amountVariance, 1)) * 0.3;

    // Adjust for number of occurrences (more = higher confidence)
    const occurrenceBonus = Math.min(occurrenceCount / 12, 1) * 0.2;
    confidence += occurrenceBonus;

    return Math.min(confidence, 1);
  }

  /**
   * Calculate the next expected date for a recurring transaction
   */
  calculateNextExpected(lastOccurrence: Date, frequency: RecurrenceFrequency): Date {
    const next = new Date(lastOccurrence);
    const days = this.frequencyDays[frequency];

    next.setDate(next.getDate() + days);
    return next;
  }

  /**
   * Link a transaction to a recurring pattern if it matches
   */
  async matchTransactionToRecurring(
    transaction: {
      id: string;
      merchant: string | null;
      description: string;
      amount: number;
      date: Date;
    },
    spaceId: string
  ): Promise<string | null> {
    const merchant =
      transaction.merchant || this.extractMerchantFromDescription(transaction.description);
    if (!merchant) return null;

    const normalizedMerchant = this.normalizeMerchant(merchant);

    // Find matching recurring pattern
    const patterns = await this.prisma.recurringTransaction.findMany({
      where: {
        spaceId,
        status: 'confirmed',
      },
    });

    for (const pattern of patterns) {
      const patternNormalized = this.normalizeMerchant(pattern.merchantName);

      // Check merchant match
      if (
        !patternNormalized.includes(normalizedMerchant) &&
        !normalizedMerchant.includes(patternNormalized)
      ) {
        continue;
      }

      // Check amount match (within variance)
      const expectedAmount = Number(pattern.expectedAmount);
      const variance = Number(pattern.amountVariance);
      const minAmount = expectedAmount * (1 - variance);
      const maxAmount = expectedAmount * (1 + variance);

      if (transaction.amount < minAmount || transaction.amount > maxAmount) {
        continue;
      }

      // Match found - link the transaction
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { recurringId: pattern.id },
      });

      // Update the recurring pattern
      await this.prisma.recurringTransaction.update({
        where: { id: pattern.id },
        data: {
          lastOccurrence: transaction.date,
          nextExpected: this.calculateNextExpected(transaction.date, pattern.frequency),
          occurrenceCount: { increment: 1 },
        },
      });

      return pattern.id;
    }

    return null;
  }
}