import { UUID, DateRange } from './common.types';
import { Category } from './transaction.types';

export interface Budget {
  id: UUID;
  spaceId: UUID;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  categories: BudgetCategory[];
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface BudgetCategory {
  category: Category;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  alertThreshold: number;
}

export interface CreateBudgetDto {
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  categories: Array<{
    categoryId: UUID;
    amount: number;
    alertThreshold?: number;
  }>;
}

export interface UpdateBudgetDto {
  name?: string;
  endDate?: string;
  categories?: Array<{
    categoryId: UUID;
    amount: number;
    alertThreshold?: number;
  }>;
}

export interface BudgetProgress {
  budgetId: UUID;
  period: DateRange;
  categories: Array<{
    categoryId: UUID;
    categoryName: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    transactions: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  daysRemaining: number;
  projectedSpend: number;
}

export interface BudgetAlert {
  id: UUID;
  budgetId: UUID;
  categoryId: UUID;
  type: 'threshold_reached' | 'exceeded' | 'projection_warning';
  message: string;
  percentUsed: number;
  createdAt: string;
}
