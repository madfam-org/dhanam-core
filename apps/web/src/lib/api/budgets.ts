import { Budget, BudgetPeriod } from '@dhanam-core/shared';

import { apiClient } from './client';

export interface CreateBudgetDto {
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateBudgetDto {
  name?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
}

export interface CategorySummary {
  id: string;
  budgetId: string;
  name: string;
  budgetedAmount: number;
  icon: string | null;
  color: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
  spent: number;
  remaining: number;
  percentUsed: number;
  transactionCount: number;
}

export interface BudgetSummary extends Omit<Budget, 'categories'> {
  categories: CategorySummary[];
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    totalPercentUsed: number;
  };
}

export interface BudgetAnalytics {
  categories: Array<{
    name: string;
    spent: number;
    budgeted: number;
    color?: string;
  }>;
  weeklyTrend?: Array<{
    weekStart: string;
    spent: number;
    budgetedForWeek: number;
  }>;
  summary: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    totalPercentUsed: number;
    averageSpending: number;
    projectedSpending: number;
    daysRemaining: number;
  };
}

export const budgetsApi = {
  getBudgets: async (spaceId: string): Promise<Budget[]> => {
    return apiClient.get<Budget[]>(`/spaces/${spaceId}/budgets`);
  },

  getBudget: async (spaceId: string, budgetId: string): Promise<Budget> => {
    return apiClient.get<Budget>(`/spaces/${spaceId}/budgets/${budgetId}`);
  },

  getBudgetSummary: async (spaceId: string, budgetId: string): Promise<BudgetSummary> => {
    return apiClient.get<BudgetSummary>(`/spaces/${spaceId}/budgets/${budgetId}/summary`);
  },

  createBudget: async (spaceId: string, dto: CreateBudgetDto): Promise<Budget> => {
    return apiClient.post<Budget>(`/spaces/${spaceId}/budgets`, dto);
  },

  updateBudget: async (
    spaceId: string,
    budgetId: string,
    dto: UpdateBudgetDto
  ): Promise<Budget> => {
    return apiClient.patch<Budget>(`/spaces/${spaceId}/budgets/${budgetId}`, dto);
  },

  deleteBudget: async (spaceId: string, budgetId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/budgets/${budgetId}`);
  },

  getBudgetAnalytics: async (spaceId: string, budgetId: string): Promise<BudgetAnalytics> => {
    return apiClient.get<BudgetAnalytics>(`/spaces/${spaceId}/budgets/${budgetId}/analytics`);
  },
};
