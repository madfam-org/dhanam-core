import { UUID, Currency, DateRange } from './common.types';

export interface CashflowForecast {
  forecast: CashflowPoint[];
  summary: {
    currentBalance: number;
    projectedBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currency: Currency;
  };
}

export interface CashflowPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface NetWorthHistory {
  history: NetWorthPoint[];
  current: {
    assets: number;
    liabilities: number;
    netWorth: number;
    change: {
      amount: number;
      percentage: number;
    };
    currency: Currency;
  };
}

export interface NetWorthPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface ExpenseAnalytics {
  period: DateRange;
  totalExpenses: number;
  averageDaily: number;
  averageTransaction: number;
  currency: Currency;
  byCategory: Array<{
    categoryId: UUID;
    categoryName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  byAccount: Array<{
    accountId: UUID;
    accountName: string;
    amount: number;
    percentage: number;
  }>;
  trends: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

export interface FinancialInsights {
  period: DateRange;
  insights: Array<{
    type: InsightType;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    impact?: number;
    recommendation?: string;
  }>;
}

export type InsightType =
  | 'spending_spike'
  | 'budget_risk'
  | 'savings_opportunity'
  | 'irregular_income'
  | 'recurring_charge'
  | 'category_anomaly'
  | 'cash_flow_warning';

// Additional types for API compatibility
export interface NetWorthResponse {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: Currency;
  lastUpdated: string;
  trend: Array<{
    date: string;
    value: number;
  }>;
  changePercent: number;
  changeAmount: number;
}

export interface SpendingByCategory {
  categoryId: UUID;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  icon?: string;
  color?: string;
}

export interface IncomeVsExpenses {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface AccountBalanceAnalytics {
  accountId: UUID;
  accountName: string;
  accountType: string;
  balance: number;
  currency: Currency;
  lastSynced?: string;
}

export interface PortfolioAllocation {
  assetType: string;
  value: number;
  percentage: number;
  accountCount: number;
}

export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf';
  type: 'transactions' | 'budget' | 'networth' | 'full';
  dateRange?: DateRange;
  accountIds?: UUID[];
  categoryIds?: UUID[];
}

export interface ExportResponse {
  exportId: UUID;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}
