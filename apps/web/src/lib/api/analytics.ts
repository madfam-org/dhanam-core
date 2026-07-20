import {
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
  Account,
  Transaction,
  Budget,
} from '@dhanam-core/shared';

import type { Goal } from '@/hooks/useGoals';

import type { BudgetSummary } from './budgets';
import { apiClient } from './client';

export interface NetWorthHistoryPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export type OwnershipFilter = 'yours' | 'mine' | 'ours' | 'all';

export interface NetWorthByOwnership {
  yours: number;
  mine: number;
  ours: number;
  total: number;
  currency: string;
  breakdown: {
    category: OwnershipFilter;
    assets: number;
    liabilities: number;
    netWorth: number;
    accountCount: number;
  }[];
}

export interface AccountWithOwnership extends Account {
  ownershipCategory: 'yours' | 'mine' | 'ours';
}

// Statistics types
export interface StatisticsData {
  totalTransactions: number;
  totalAmount: number;
  topPurchases: {
    id: string;
    description: string;
    amount: number;
    date: string;
    merchant: string | null;
  }[];
  topMerchants: {
    merchant: string;
    totalSpent: number;
    transactionCount: number;
  }[];
  topCategories: {
    categoryId: string;
    categoryName: string;
    totalSpent: number;
    transactionCount: number;
  }[];
}

// Trend types
export interface TrendMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

// Calendar types
export interface CalendarDay {
  date: string;
  transactionCount: number;
  income: number;
  expenses: number;
  net: number;
  transactions?: {
    id: string;
    description: string;
    amount: number;
    merchant: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    accountName: string;
  }[];
}

export interface CalendarResponse {
  year: number;
  month: number;
  days: CalendarDay[];
}

// Query types
export interface AnalyticsQueryParams {
  startDate: string;
  endDate: string;
  groupBy: 'month' | 'category' | 'merchant' | 'account' | 'tag';
  categoryId?: string;
  merchant?: string;
  accountId?: string;
  tagId?: string;
}

export interface AnalyticsQueryResult {
  groupKey: string;
  groupLabel: string;
  totalAmount: number;
  transactionCount: number;
  income: number;
  expenses: number;
}

export const analyticsApi = {
  /**
   * Get net worth analysis for a space
   */
  getNetWorth: async (spaceId: string): Promise<NetWorthResponse> => {
    return apiClient.get<NetWorthResponse>(`/analytics/${spaceId}/net-worth`);
  },

  /**
   * Get net worth history for charting
   */
  getNetWorthHistory: async (spaceId: string, days?: number): Promise<NetWorthHistoryPoint[]> => {
    const params = days ? { days: days.toString() } : {};
    return apiClient.get<NetWorthHistoryPoint[]>(`/analytics/${spaceId}/net-worth-history`, params);
  },

  /**
   * Get cashflow forecast for the next 60 days
   */
  getCashflowForecast: async (spaceId: string, days?: number): Promise<CashflowForecast> => {
    const params = days ? { days: days.toString() } : {};
    return apiClient.get<CashflowForecast>(`/analytics/${spaceId}/cashflow-forecast`, params);
  },

  /**
   * Get spending breakdown by category
   */
  getSpendingByCategory: async (
    spaceId: string,
    startDate?: string,
    endDate?: string,
    budgetId?: string
  ): Promise<SpendingByCategory[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (budgetId) params.budgetId = budgetId;

    return apiClient.get<SpendingByCategory[]>(
      `/analytics/${spaceId}/spending-by-category`,
      params
    );
  },

  /**
   * Get income vs expenses trend
   */
  getIncomeVsExpenses: async (
    spaceId: string,
    months?: number,
    budgetId?: string
  ): Promise<IncomeVsExpenses[]> => {
    const params: Record<string, string> = {};
    if (months) params.months = months.toString();
    if (budgetId) params.budgetId = budgetId;
    return apiClient.get<IncomeVsExpenses[]>(`/analytics/${spaceId}/income-vs-expenses`, params);
  },

  /**
   * Get account balances with analytics
   */
  getAccountBalances: async (spaceId: string): Promise<AccountBalanceAnalytics[]> => {
    return apiClient.get<AccountBalanceAnalytics[]>(`/analytics/${spaceId}/account-balances`);
  },

  /**
   * Get portfolio allocation breakdown
   */
  getPortfolioAllocation: async (spaceId: string): Promise<PortfolioAllocation[]> => {
    return apiClient.get<PortfolioAllocation[]>(`/analytics/${spaceId}/portfolio-allocation`);
  },

  /**
   * Get combined dashboard data in a single request
   * Reduces waterfall by returning all dashboard data at once
   */
  getDashboardData: async (spaceId: string): Promise<DashboardData> => {
    return apiClient.get<DashboardData>(`/analytics/${spaceId}/dashboard-data`);
  },

  /**
   * Get net worth breakdown by ownership (yours, mine, ours)
   * Used for household views where couples want to see individual vs joint assets
   */
  getNetWorthByOwnership: async (
    spaceId: string,
    currency?: string
  ): Promise<NetWorthByOwnership> => {
    const params = currency ? { currency } : {};
    return apiClient.get<NetWorthByOwnership>(
      `/analytics/${spaceId}/net-worth-by-ownership`,
      params
    );
  },

  /**
   * Get accounts filtered by ownership type
   */
  getAccountsByOwnership: async (
    spaceId: string,
    ownership?: OwnershipFilter
  ): Promise<AccountWithOwnership[]> => {
    const params = ownership ? { ownership } : {};
    return apiClient.get<AccountWithOwnership[]>(
      `/analytics/${spaceId}/accounts-by-ownership`,
      params
    );
  },

  /**
   * Get statistics for a date range (top purchases, merchants, categories)
   */
  getStatistics: async (
    spaceId: string,
    startDate: string,
    endDate: string,
    budgetId?: string
  ): Promise<StatisticsData> => {
    const params: Record<string, string> = { startDate, endDate };
    if (budgetId) params.budgetId = budgetId;
    return apiClient.get<StatisticsData>(`/analytics/${spaceId}/statistics`, params);
  },

  /**
   * Get annual/multi-month trend data (income, expenses, net, savings rate per month)
   */
  getAnnualTrends: async (
    spaceId: string,
    months?: number,
    budgetId?: string
  ): Promise<TrendMonth[]> => {
    const params: Record<string, string> = {};
    if (months) params.months = months.toString();
    if (budgetId) params.budgetId = budgetId;
    return apiClient.get<TrendMonth[]>(`/analytics/${spaceId}/trends`, params);
  },

  /**
   * Get calendar data for a given month (transaction count and net per day)
   */
  getCalendarData: async (
    spaceId: string,
    year: number,
    month: number,
    budgetId?: string
  ): Promise<CalendarResponse> => {
    const params: Record<string, string> = {
      year: year.toString(),
      month: month.toString(),
    };
    if (budgetId) params.budgetId = budgetId;
    return apiClient.get<CalendarResponse>(`/analytics/${spaceId}/calendar`, params);
  },

  /**
   * Execute an ad-hoc analytics query with grouping and filters
   */
  executeQuery: async (
    spaceId: string,
    params: AnalyticsQueryParams
  ): Promise<AnalyticsQueryResult[]> => {
    return apiClient.post<AnalyticsQueryResult[]>(`/analytics/${spaceId}/query`, params);
  },
};

// Dashboard data type for combined endpoint
export interface DashboardData {
  accounts: Account[];
  recentTransactions: {
    data: Transaction[];
    total: number;
  };
  budgets: Budget[];
  currentBudgetSummary: BudgetSummary | null;
  netWorth: NetWorthResponse | null;
  cashflowForecast: CashflowForecast | null;
  portfolioAllocation: PortfolioAllocation[];
  goals: Goal[];
  _errors?: string[];
}
