// SPDX-License-Identifier: AGPL-3.0-or-later
import { SEARCH_DEFAULTS } from '@dhanam-core/shared';
import { Injectable, Logger } from '@nestjs/common';

import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

export interface ParsedQuery {
  intent: QueryIntent;
  filters: QueryFilters;
  timeRange: TimeRange;
  aggregation?: AggregationType;
  limit?: number;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  originalQuery: string;
  confidence: number;
}

export type QueryIntent =
  | 'search_transactions'
  | 'sum_spending'
  | 'count_transactions'
  | 'find_largest'
  | 'find_merchants'
  | 'category_breakdown'
  | 'compare_periods';

export interface QueryFilters {
  merchant?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  transactionType?: 'expense' | 'income' | 'all';
  keywords?: string[];
}

export interface TimeRange {
  start: Date;
  end: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  periodLabel?: string;
}

export type AggregationType = 'sum' | 'count' | 'average' | 'max' | 'min';

export interface SearchResult {
  query: ParsedQuery;
  answer: string;
  data: {
    transactions?: TransactionResult[];
    total?: number;
    count?: number;
    average?: number;
    breakdown?: CategoryBreakdown[];
    merchants?: MerchantSummary[];
  };
  suggestions?: string[];
}

interface TransactionResult {
  id: string;
  date: string;
  amount: number;
  merchant: string | null;
  description: string;
  category: string | null;
  currency: Currency;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
  lastTransaction: string;
}

@Injectable()
export class NaturalLanguageService {
  private readonly logger = new Logger(NaturalLanguageService.name);

  // Pattern matchers for query parsing
  private readonly patterns = {
    // Time patterns
    today: /\btoday\b/i,
    yesterday: /\byesterday\b/i,
    thisWeek: /\bthis\s+week\b/i,
    lastWeek: /\blast\s+week\b/i,
    thisMonth: /\bthis\s+month\b/i,
    lastMonth: /\blast\s+month\b/i,
    thisYear: /\bthis\s+year\b/i,
    lastYear: /\blast\s+year\b/i,
    lastNDays: /\blast\s+(\d+)\s+days?\b/i,
    lastNMonths: /\blast\s+(\d+)\s+months?\b/i,
    inMonth:
      /\bin\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,

    // Amount patterns
    over: /\bover\s+\$?([\d,]+(?:\.\d{2})?)\b/i,
    under: /\bunder\s+\$?([\d,]+(?:\.\d{2})?)\b/i,
    moreThan: /\bmore\s+than\s+\$?([\d,]+(?:\.\d{2})?)\b/i,
    lessThan: /\bless\s+than\s+\$?([\d,]+(?:\.\d{2})?)\b/i,
    between: /\bbetween\s+\$?([\d,]+(?:\.\d{2})?)\s+and\s+\$?([\d,]+(?:\.\d{2})?)\b/i,
    exactAmount: /\bfor\s+\$?([\d,]+(?:\.\d{2})?)\b/i,

    // Intent patterns
    howMuch: /\bhow\s+much\b/i,
    howMany: /\bhow\s+many\b/i,
    showMe: /\bshow\s+me\b/i,
    findAll: /\bfind\s+(?:all\s+)?/i,
    whatAre: /\bwhat\s+(?:are|were)\b/i,
    biggest: /\bbiggest|largest|highest|most\s+expensive\b/i,
    smallest: /\bsmallest|lowest|cheapest\b/i,
    total: /\btotal\b/i,
    average: /\baverage\b/i,

    // Type patterns
    spent: /\bspent|spending|expenses?\b/i,
    earned: /\bearned|income|received\b/i,
    transactions: /\btransactions?\b/i,

    // Category patterns (common categories)
    food: /\bfood|restaurant|dining|groceries|eating\b/i,
    transport: /\btransport|uber|lyft|taxi|gas|fuel\b/i,
    shopping: /\bshopping|store|amazon|retail\b/i,
    entertainment: /\bentertainment|movies|games|streaming\b/i,
    utilities: /\butilities|electric|water|gas|internet|phone\b/i,
    subscriptions: /\bsubscriptions?\b/i,
  };

  // Category keyword mappings
  private readonly categoryKeywords: Record<string, string[]> = {
    'Food & Dining': [
      'food',
      'restaurant',
      'dining',
      'groceries',
      'eating',
      'lunch',
      'dinner',
      'breakfast',
      'coffee',
    ],
    Transportation: ['transport', 'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus'],
    Shopping: ['shopping', 'store', 'amazon', 'retail', 'clothes', 'electronics'],
    Entertainment: [
      'entertainment',
      'movies',
      'games',
      'streaming',
      'netflix',
      'spotify',
      'concert',
    ],
    Utilities: ['utilities', 'electric', 'water', 'gas', 'internet', 'phone', 'cable'],
    Subscriptions: ['subscriptions', 'membership', 'premium'],
    Health: ['health', 'doctor', 'pharmacy', 'medicine', 'gym', 'fitness'],
    Travel: ['travel', 'hotel', 'flight', 'airbnb', 'vacation'],
  };

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  /**
   * Process a natural language query and return results
   */
  async search(spaceId: string, userId: string, query: string): Promise<SearchResult> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    this.logger.log(`Processing NL query for space ${spaceId}: "${query}"`);

    // Parse the query
    const parsedQuery = this.parseQuery(query);

    // Execute the query
    const result = await this.executeQuery(spaceId, parsedQuery);

    // Generate suggestions for follow-up queries
    const suggestions = this.generateSuggestions(parsedQuery, result);

    return {
      query: parsedQuery,
      ...result,
      suggestions,
    };
  }

  /**
   * Parse natural language query into structured format
   */
  parseQuery(query: string): ParsedQuery {
    const normalizedQuery = query.toLowerCase().trim();

    // Determine intent
    const intent = this.determineIntent(normalizedQuery);

    // Extract time range
    const timeRange = this.extractTimeRange(normalizedQuery);

    // Extract filters
    const filters = this.extractFilters(normalizedQuery);

    // Extract aggregation type
    const aggregation = this.extractAggregation(normalizedQuery);

    // Extract sorting
    const { sortBy, sortOrder, limit } = this.extractSorting(normalizedQuery);

    // Calculate confidence
    const confidence = this.calculateConfidence(normalizedQuery, intent, filters);

    return {
      intent,
      filters,
      timeRange,
      aggregation,
      sortBy,
      sortOrder,
      limit,
      originalQuery: query,
      confidence,
    };
  }

  /**
   * Determine the intent of the query
   */
  private determineIntent(query: string): QueryIntent {
    if (this.patterns.howMuch.test(query) || this.patterns.total.test(query)) {
      return 'sum_spending';
    }

    if (this.patterns.howMany.test(query)) {
      return 'count_transactions';
    }

    if (this.patterns.biggest.test(query)) {
      return 'find_largest';
    }

    if (/\bbreakdown|by\s+category|categories\b/i.test(query)) {
      return 'category_breakdown';
    }

    if (/\bmerchants?|stores?|where\b/i.test(query)) {
      return 'find_merchants';
    }

    if (/\bcompare|vs|versus|compared\s+to\b/i.test(query)) {
      return 'compare_periods';
    }

    return 'search_transactions';
  }

  /**
   * Extract time range from query
   */
  private extractTimeRange(query: string): TimeRange {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);
    let period: TimeRange['period'];
    let periodLabel: string;

    // Today
    if (this.patterns.today.test(query)) {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      period = 'day';
      periodLabel = 'today';
    }
    // Yesterday
    else if (this.patterns.yesterday.test(query)) {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      period = 'day';
      periodLabel = 'yesterday';
    }
    // This week
    else if (this.patterns.thisWeek.test(query)) {
      const dayOfWeek = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      period = 'week';
      periodLabel = 'this week';
    }
    // Last week
    else if (this.patterns.lastWeek.test(query)) {
      const dayOfWeek = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 7);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek - 1, 23, 59, 59);
      period = 'week';
      periodLabel = 'last week';
    }
    // This month
    else if (this.patterns.thisMonth.test(query)) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      period = 'month';
      periodLabel = 'this month';
    }
    // Last month
    else if (this.patterns.lastMonth.test(query)) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      period = 'month';
      periodLabel = 'last month';
    }
    // This year
    else if (this.patterns.thisYear.test(query)) {
      start = new Date(now.getFullYear(), 0, 1);
      period = 'year';
      periodLabel = 'this year';
    }
    // Last year
    else if (this.patterns.lastYear.test(query)) {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      period = 'year';
      periodLabel = 'last year';
    }
    // Last N days
    else if (this.patterns.lastNDays.test(query)) {
      const match = query.match(this.patterns.lastNDays);
      const days = parseInt(match![1], 10);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
      period = 'day';
      periodLabel = `last ${days} days`;
    }
    // Last N months
    else if (this.patterns.lastNMonths.test(query)) {
      const match = query.match(this.patterns.lastNMonths);
      const months = parseInt(match![1], 10);
      start = new Date(now.getFullYear(), now.getMonth() - months, 1);
      period = 'month';
      periodLabel = `last ${months} months`;
    }
    // Specific month
    else if (this.patterns.inMonth.test(query)) {
      const match = query.match(this.patterns.inMonth);
      const monthName = match![1].toLowerCase();
      const monthIndex = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ].indexOf(monthName);
      const year = monthIndex > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
      start = new Date(year, monthIndex, 1);
      end = new Date(year, monthIndex + 1, 0, 23, 59, 59);
      period = 'month';
      periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    }
    // Default to last 30 days
    else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      period = 'month';
      periodLabel = 'last 30 days';
    }

    return { start, end, period, periodLabel };
  }

  /**
   * Extract filters from query
   */
  private extractFilters(query: string): QueryFilters {
    const filters: QueryFilters = {};

    // Transaction type
    if (this.patterns.spent.test(query)) {
      filters.transactionType = 'expense';
    } else if (this.patterns.earned.test(query)) {
      filters.transactionType = 'income';
    } else {
      filters.transactionType = 'all';
    }

    // Amount filters
    const overMatch = query.match(this.patterns.over) || query.match(this.patterns.moreThan);
    if (overMatch) {
      filters.minAmount = parseFloat(overMatch[1].replace(/,/g, ''));
    }

    const underMatch = query.match(this.patterns.under) || query.match(this.patterns.lessThan);
    if (underMatch) {
      filters.maxAmount = parseFloat(underMatch[1].replace(/,/g, ''));
    }

    const betweenMatch = query.match(this.patterns.between);
    if (betweenMatch) {
      filters.minAmount = parseFloat(betweenMatch[1].replace(/,/g, ''));
      filters.maxAmount = parseFloat(betweenMatch[2].replace(/,/g, ''));
    }

    // Category detection
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some((keyword) => query.includes(keyword))) {
        filters.category = category;
        break;
      }
    }

    // Merchant detection (quoted strings or capitalized words)
    const quotedMatch = query.match(/"([^"]+)"|'([^']+)'/);
    if (quotedMatch) {
      filters.merchant = quotedMatch[1] || quotedMatch[2];
    } else {
      // Look for common merchant names
      const merchantPatterns = [
        /\b(netflix|spotify|amazon|uber|lyft|starbucks|walmart|target|costco|apple|google)\b/i,
      ];
      for (const pattern of merchantPatterns) {
        const match = query.match(pattern);
        if (match) {
          filters.merchant = match[1];
          break;
        }
      }
    }

    // Extract keywords (words that might be search terms)
    const stopWords = new Set([
      'how',
      'much',
      'many',
      'did',
      'i',
      'spend',
      'on',
      'in',
      'at',
      'for',
      'the',
      'a',
      'an',
      'show',
      'me',
      'find',
      'all',
      'my',
      'what',
      'are',
      'were',
      'transactions',
      'last',
      'this',
      'month',
      'week',
      'year',
      'day',
      'days',
      'total',
      'spending',
      'expenses',
      'over',
      'under',
    ]);

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    if (words.length > 0 && !filters.category && !filters.merchant) {
      filters.keywords = words;
    }

    return filters;
  }

  /**
   * Extract aggregation type
   */
  private extractAggregation(query: string): AggregationType | undefined {
    if (this.patterns.total.test(query) || this.patterns.howMuch.test(query)) {
      return 'sum';
    }
    if (this.patterns.howMany.test(query)) {
      return 'count';
    }
    if (this.patterns.average.test(query)) {
      return 'average';
    }
    if (this.patterns.biggest.test(query)) {
      return 'max';
    }
    if (this.patterns.smallest.test(query)) {
      return 'min';
    }
    return undefined;
  }

  /**
   * Extract sorting parameters
   */
  private extractSorting(query: string): {
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  } {
    let sortBy: 'date' | 'amount' | undefined;
    let sortOrder: 'asc' | 'desc' | undefined;
    let limit: number | undefined;

    if (this.patterns.biggest.test(query)) {
      sortBy = 'amount';
      sortOrder = 'desc';
      limit = 10;
    } else if (this.patterns.smallest.test(query)) {
      sortBy = 'amount';
      sortOrder = 'asc';
      limit = 10;
    } else if (/\brecent|latest\b/i.test(query)) {
      sortBy = 'date';
      sortOrder = 'desc';
      limit = SEARCH_DEFAULTS.MAX_RESULTS;
    }

    // Extract explicit limit
    const limitMatch = query.match(/\btop\s+(\d+)\b|\b(\d+)\s+(?:transactions?|results?)\b/i);
    if (limitMatch) {
      limit = parseInt(limitMatch[1] || limitMatch[2], 10);
    }

    return { sortBy, sortOrder, limit };
  }

  /**
   * Calculate confidence in the parsed query
   */
  private calculateConfidence(query: string, intent: QueryIntent, filters: QueryFilters): number {
    let confidence = 0.5; // Base confidence

    // Boost for clear intent patterns
    if (intent !== 'search_transactions') {
      confidence += 0.15;
    }

    // Boost for time range detection
    const hasTimeRange = Object.values(this.patterns)
      .slice(0, 12) // Time patterns
      .some((pattern) => pattern.test(query));
    if (hasTimeRange) {
      confidence += 0.1;
    }

    // Boost for amount filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      confidence += 0.1;
    }

    // Boost for category or merchant
    if (filters.category || filters.merchant) {
      confidence += 0.15;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Execute the parsed query
   */
  private async executeQuery(
    spaceId: string,
    query: ParsedQuery
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const {
      intent,
      filters,
      timeRange,
      aggregation: _aggregation,
      sortBy,
      sortOrder,
      limit,
    } = query;

    // Build base where clause
    const where: Record<string, unknown> = {
      account: { spaceId },
      date: { gte: timeRange.start, lte: timeRange.end },
      pending: false,
    };

    // Apply transaction type filter
    if (filters.transactionType === 'expense') {
      where.amount = { lt: 0 };
    } else if (filters.transactionType === 'income') {
      where.amount = { gt: 0 };
    }

    // Apply amount filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (filters.minAmount !== undefined) {
        // For expenses, we look for amounts less than -minAmount
        amountFilter.lte = -filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        amountFilter.gte = -filters.maxAmount;
      }
      where.amount = { ...((where.amount as object) || {}), ...amountFilter };
    }

    // Apply merchant filter
    if (filters.merchant) {
      where.OR = [
        { merchant: { contains: filters.merchant, mode: 'insensitive' } },
        { description: { contains: filters.merchant, mode: 'insensitive' } },
      ];
    }

    // Apply keyword search
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordOr = filters.keywords.flatMap((keyword) => [
        { merchant: { contains: keyword, mode: 'insensitive' as const } },
        { description: { contains: keyword, mode: 'insensitive' as const } },
      ]);
      where.OR = keywordOr;
    }

    // Execute based on intent
    switch (intent) {
      case 'sum_spending':
        return this.executeSumQuery(where, filters, timeRange);

      case 'count_transactions':
        return this.executeCountQuery(where, filters, timeRange);

      case 'find_largest':
        return this.executeFindLargest(where, filters, timeRange, limit || 10);

      case 'category_breakdown':
        return this.executeCategoryBreakdown(spaceId, where, timeRange);

      case 'find_merchants':
        return this.executeFindMerchants(spaceId, where, timeRange);

      default:
        return this.executeTransactionSearch(
          where,
          filters,
          timeRange,
          sortBy,
          sortOrder,
          limit || SEARCH_DEFAULTS.MAX_RESULTS
        );
    }
  }

  private async executeSumQuery(
    where: Record<string, unknown>,
    filters: QueryFilters,
    timeRange: TimeRange
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const total = Math.abs(Number(result._sum.amount) || 0);
    const count = result._count;

    const categoryText = filters.category ? ` on ${filters.category}` : '';
    const merchantText = filters.merchant ? ` at ${filters.merchant}` : '';

    return {
      answer: `You spent $${total.toFixed(2)}${categoryText}${merchantText} ${timeRange.periodLabel} across ${count} transactions.`,
      data: { total, count },
    };
  }

  private async executeCountQuery(
    where: Record<string, unknown>,
    filters: QueryFilters,
    timeRange: TimeRange
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const count = await this.prisma.transaction.count({ where });

    const categoryText = filters.category ? ` in ${filters.category}` : '';
    const merchantText = filters.merchant ? ` at ${filters.merchant}` : '';

    return {
      answer: `You had ${count} transactions${categoryText}${merchantText} ${timeRange.periodLabel}.`,
      data: { count },
    };
  }

  private async executeFindLargest(
    where: Record<string, unknown>,
    filters: QueryFilters,
    timeRange: TimeRange,
    limit: number
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { amount: 'asc' }, // Ascending for expenses (most negative first)
      take: limit,
      select: {
        id: true,
        date: true,
        amount: true,
        merchant: true,
        description: true,
        currency: true,
        category: { select: { name: true } },
      },
    });

    const formatted: TransactionResult[] = transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      amount: Math.abs(Number(t.amount)),
      merchant: t.merchant,
      description: t.description,
      category: t.category?.name || null,
      currency: t.currency,
    }));

    const topAmount = formatted[0]?.amount || 0;
    const topMerchant = formatted[0]?.merchant || 'Unknown';

    return {
      answer: `Your biggest expense ${timeRange.periodLabel} was $${topAmount.toFixed(2)} at ${topMerchant}. Here are your top ${limit} transactions:`,
      data: { transactions: formatted },
    };
  }

  private async executeCategoryBreakdown(
    spaceId: string,
    where: Record<string, unknown>,
    timeRange: TimeRange
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    // Get transactions with categories
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        category: { select: { name: true } },
      },
    });

    // Calculate breakdown
    const byCategory = new Map<string, { total: number; count: number }>();
    let grandTotal = 0;

    for (const t of transactions) {
      const categoryName = t.category?.name || 'Uncategorized';
      const amount = Math.abs(Number(t.amount));
      grandTotal += amount;

      const existing = byCategory.get(categoryName) || { total: 0, count: 0 };
      byCategory.set(categoryName, {
        total: existing.total + amount,
        count: existing.count + 1,
      });
    }

    const breakdown: CategoryBreakdown[] = Array.from(byCategory.entries())
      .map(([category, data]) => ({
        category,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percentage: Math.round((data.total / grandTotal) * 100),
      }))
      .sort((a, b) => b.total - a.total);

    const topCategory = breakdown[0];
    const topText = topCategory
      ? `${topCategory.category} ($${topCategory.total.toFixed(2)}, ${topCategory.percentage}%)`
      : 'None';

    return {
      answer: `Your spending breakdown ${timeRange.periodLabel}: Top category is ${topText}.`,
      data: { breakdown, total: grandTotal },
    };
  }

  private async executeFindMerchants(
    spaceId: string,
    where: Record<string, unknown>,
    timeRange: TimeRange
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        merchant: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate by merchant
    const byMerchant = new Map<string, { total: number; count: number; lastDate: Date }>();

    for (const t of transactions) {
      const merchant = t.merchant || 'Unknown';
      const amount = Math.abs(Number(t.amount));

      const existing = byMerchant.get(merchant);
      if (!existing) {
        byMerchant.set(merchant, { total: amount, count: 1, lastDate: t.date });
      } else {
        byMerchant.set(merchant, {
          total: existing.total + amount,
          count: existing.count + 1,
          lastDate: existing.lastDate > t.date ? existing.lastDate : t.date,
        });
      }
    }

    const merchants: MerchantSummary[] = Array.from(byMerchant.entries())
      .map(([merchant, data]) => ({
        merchant,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        lastTransaction: data.lastDate.toISOString(),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, SEARCH_DEFAULTS.MAX_RESULTS);

    return {
      answer: `You made purchases at ${merchants.length} different merchants ${timeRange.periodLabel}.`,
      data: { merchants },
    };
  }

  private async executeTransactionSearch(
    where: Record<string, unknown>,
    filters: QueryFilters,
    timeRange: TimeRange,
    sortBy?: 'date' | 'amount',
    sortOrder?: 'asc' | 'desc',
    limit?: number
  ): Promise<{ answer: string; data: SearchResult['data'] }> {
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy,
      take: limit || SEARCH_DEFAULTS.MAX_RESULTS,
      select: {
        id: true,
        date: true,
        amount: true,
        merchant: true,
        description: true,
        currency: true,
        category: { select: { name: true } },
      },
    });

    const formatted: TransactionResult[] = transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      amount: Number(t.amount),
      merchant: t.merchant,
      description: t.description,
      category: t.category?.name || null,
      currency: t.currency,
    }));

    const total = await this.prisma.transaction.count({ where });

    return {
      answer: `Found ${total} matching transactions ${timeRange.periodLabel}. Showing ${formatted.length}:`,
      data: { transactions: formatted, count: total },
    };
  }

  /**
   * Generate suggestions for follow-up queries
   */
  private generateSuggestions(
    query: ParsedQuery,
    result: { answer: string; data: SearchResult['data'] }
  ): string[] {
    const suggestions: string[] = [];

    // Suggest category breakdown if not already done
    if (query.intent !== 'category_breakdown') {
      suggestions.push(`Show me spending breakdown by category ${query.timeRange.periodLabel}`);
    }

    // Suggest finding largest transactions
    if (query.intent !== 'find_largest') {
      suggestions.push(`What were my biggest expenses ${query.timeRange.periodLabel}?`);
    }

    // Suggest comparison
    if (query.timeRange.period === 'month') {
      suggestions.push(`Compare this month to last month`);
    }

    // Suggest drilling into top category if available
    if (result.data.breakdown && result.data.breakdown.length > 0) {
      const topCategory = result.data.breakdown[0].category;
      suggestions.push(`Show me all ${topCategory} transactions`);
    }

    return suggestions.slice(0, 3);
  }

  /** Fuzzy search transactions using pg_trgm similarity(). */
  async fuzzySearchTransactions(
    spaceId: string,
    userId: string,
    searchTerm: string,
    limit = 20,
    threshold = 0.3
  ): Promise<TransactionResult[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');
    type FuzzyRow = {
      id: string;
      date: Date;
      amount: string;
      merchant: string | null;
      description: string;
      currency: string;
      category_name: string | null;
      relevance: number;
    };
    const results = await this.prisma.$queryRaw<FuzzyRow[]>`
      SELECT t.id, t.date, t.amount::text, t.merchant, t.description, t.currency,
        c.name as category_name,
        GREATEST(COALESCE(similarity(t.description, ${searchTerm}), 0),
                 COALESCE(similarity(t.merchant, ${searchTerm}), 0)) as relevance
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE a.space_id = ${spaceId} AND t.deleted_at IS NULL
        AND (similarity(t.description, ${searchTerm}) > ${threshold}
          OR similarity(t.merchant, ${searchTerm}) > ${threshold})
      ORDER BY relevance DESC LIMIT ${limit}`;
    return results.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      amount: parseFloat(r.amount),
      merchant: r.merchant,
      description: r.description,
      category: r.category_name,
      currency: r.currency as Currency,
    }));
  }

  /** Get search suggestions based on partial query */
  async getSuggestions(spaceId: string, userId: string, partialQuery: string): Promise<string[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const suggestions = [
      'How much did I spend this month?',
      'Show me my biggest expenses',
      'Transactions over $100',
      'Spending on food last week',
      'What are my subscriptions?',
      'Compare this month to last month',
    ];

    if (!partialQuery || partialQuery.length < SEARCH_DEFAULTS.MIN_QUERY_LENGTH) {
      return suggestions.slice(0, 5);
    }

    const normalizedQuery = partialQuery.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(normalizedQuery)).slice(0, 5);
  }
}
