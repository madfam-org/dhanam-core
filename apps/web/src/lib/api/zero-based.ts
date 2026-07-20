import { Currency } from '@dhanam-core/shared';

import { apiClient } from './client';

// ============================================
// Request DTOs
// ============================================

export interface CreateIncomeEventDto {
  amount: number;
  currency: Currency;
  source: string;
  description?: string;
  receivedAt: string; // ISO date string
}

export interface AllocateFundsDto {
  incomeEventId?: string;
  categoryId: string;
  amount: number;
  notes?: string;
}

export interface MoveFundsDto {
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  notes?: string;
}

export interface SetCategoryGoalDto {
  goalType: 'monthly_spending' | 'target_balance' | 'weekly_spending' | 'percentage_income';
  targetAmount?: number;
  targetDate?: string; // ISO date string
  monthlyFunding?: number;
  percentageTarget?: number;
  notes?: string;
}

export interface RolloverMonthDto {
  fromMonth: string; // YYYY-MM format
  toMonth: string; // YYYY-MM format
}

// ============================================
// Response DTOs
// ============================================

export interface CategoryAllocationStatus {
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  carryoverAmount: number;
  allocated: number;
  spent: number;
  available: number; // allocated + carryover - spent
  goalProgress?: number; // percentage toward goal (0-100)
  isOverspent: boolean;
  goalType?: string;
  goalTarget?: number;
}

export interface IncomeEventSummary {
  id: string;
  amount: number;
  source: string;
  receivedAt: string;
  isAllocated: boolean;
}

export interface AllocationStatus {
  month: string; // YYYY-MM format
  totalIncome: number;
  totalAllocated: number;
  unallocated: number; // "Ready to Assign" amount
  totalSpent: number;
  isFullyAllocated: boolean;
  categories: CategoryAllocationStatus[];
  incomeEvents: IncomeEventSummary[];
}

export interface IncomeEvent {
  id: string;
  amount: number;
  currency: Currency;
  source: string;
  description: string | null;
  receivedAt: string;
  isAllocated: boolean;
}

export interface CategoryGoal {
  categoryId: string;
  categoryName: string;
  goalType: 'monthly_spending' | 'target_balance' | 'weekly_spending' | 'percentage_income';
  targetAmount: number | null;
  targetDate: string | null;
  monthlyFunding: number | null;
  percentageTarget: number | null;
  progress: number; // 0-100
}

export interface AllocateFundsResponse {
  success: boolean;
  remainingUnallocated: number;
}

export interface MoveFundsResponse {
  success: boolean;
}

export interface AutoAllocateResponse {
  allocations: Array<{
    categoryId: string;
    amount: number;
  }>;
  remainingUnallocated: number;
}

export interface RolloverResponse {
  categoriesRolledOver: number;
  totalCarryover: number;
}

export interface CreateIncomeEventResponse {
  id: string;
  amount: number;
}

export interface SetGoalResponse {
  success: boolean;
}

// ============================================
// API Client
// ============================================

export const zeroBasedApi = {
  /**
   * Get allocation status for a month (envelope budgeting view)
   * Returns "Ready to Assign" amount, category allocations, and spending
   */
  getAllocationStatus: async (spaceId: string, month?: string): Promise<AllocationStatus> => {
    const params: Record<string, string> = {};
    if (month) {
      params.month = month;
    }
    return apiClient.get<AllocationStatus>(
      `/budgets/zero-based/spaces/${spaceId}/allocation-status`,
      params
    );
  },

  /**
   * Get income events for a space
   */
  getIncomeEvents: async (
    spaceId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<IncomeEvent[]> => {
    const params: Record<string, string> = {};
    if (options?.startDate) params.startDate = options.startDate;
    if (options?.endDate) params.endDate = options.endDate;
    if (options?.limit) params.limit = options.limit.toString();
    return apiClient.get<IncomeEvent[]>(
      `/budgets/zero-based/spaces/${spaceId}/income-events`,
      params
    );
  },

  /**
   * Create a new income event (when money comes in)
   */
  createIncomeEvent: async (
    spaceId: string,
    dto: CreateIncomeEventDto
  ): Promise<CreateIncomeEventResponse> => {
    return apiClient.post<CreateIncomeEventResponse>(
      `/budgets/zero-based/spaces/${spaceId}/income-events`,
      dto
    );
  },

  /**
   * Allocate funds to a category
   * Assigns money from "Ready to Assign" to a specific budget category
   */
  allocateFunds: async (spaceId: string, dto: AllocateFundsDto): Promise<AllocateFundsResponse> => {
    return apiClient.post<AllocateFundsResponse>(
      `/budgets/zero-based/spaces/${spaceId}/allocate`,
      dto
    );
  },

  /**
   * Move funds between categories
   * Transfers allocated money from one category to another
   */
  moveFunds: async (spaceId: string, dto: MoveFundsDto): Promise<MoveFundsResponse> => {
    return apiClient.post<MoveFundsResponse>(
      `/budgets/zero-based/spaces/${spaceId}/move-funds`,
      dto
    );
  },

  /**
   * Auto-allocate based on category goals
   * Automatically distributes unallocated funds based on configured category goals
   */
  autoAllocate: async (spaceId: string, incomeEventId?: string): Promise<AutoAllocateResponse> => {
    const params: Record<string, string> = {};
    if (incomeEventId) params.incomeEventId = incomeEventId;
    return apiClient.post<AutoAllocateResponse>(
      `/budgets/zero-based/spaces/${spaceId}/auto-allocate`,
      params
    );
  },

  /**
   * Rollover unspent funds to next month
   * Carries over positive category balances to the next budget period
   */
  rolloverMonth: async (spaceId: string, dto: RolloverMonthDto): Promise<RolloverResponse> => {
    return apiClient.post<RolloverResponse>(`/budgets/zero-based/spaces/${spaceId}/rollover`, dto);
  },

  /**
   * Get category funding goals
   */
  getCategoryGoals: async (spaceId: string): Promise<CategoryGoal[]> => {
    return apiClient.get<CategoryGoal[]>(`/budgets/zero-based/spaces/${spaceId}/category-goals`);
  },

  /**
   * Set a funding goal for a category
   * Configures how much should be allocated to a category each month
   */
  setCategoryGoal: async (
    spaceId: string,
    categoryId: string,
    dto: SetCategoryGoalDto
  ): Promise<SetGoalResponse> => {
    return apiClient.put<SetGoalResponse>(
      `/budgets/zero-based/spaces/${spaceId}/categories/${categoryId}/goal`,
      dto
    );
  },
};

// ============================================
// React Query Keys
// ============================================

export const zeroBasedKeys = {
  all: ['zero-based'] as const,
  allocationStatus: (spaceId: string, month?: string) =>
    [...zeroBasedKeys.all, 'allocation-status', spaceId, month] as const,
  incomeEvents: (spaceId: string) => [...zeroBasedKeys.all, 'income-events', spaceId] as const,
  categoryGoals: (spaceId: string) => [...zeroBasedKeys.all, 'category-goals', spaceId] as const,
};
