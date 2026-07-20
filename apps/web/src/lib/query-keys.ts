/**
 * Centralized query key factories for React Query.
 *
 * Using factories ensures cache keys are consistent across the app and enables
 * fine-grained invalidation (e.g. invalidate all analytics for a space, or just
 * the net-worth entry).
 *
 * Pattern: each factory is a plain object whose leaf values are readonly tuples
 * produced via `as const`, which gives TypeScript exact literal types.
 */

export const analyticsKeys = {
  all: ['analytics'] as const,
  netWorth: (spaceId: string) => [...analyticsKeys.all, 'net-worth', spaceId] as const,
  netWorthHistory: (spaceId: string) =>
    [...analyticsKeys.all, 'net-worth-history', spaceId] as const,
  cashflowForecast: (spaceId: string) =>
    [...analyticsKeys.all, 'cashflow-forecast', spaceId] as const,
  spendingByCategory: (spaceId: string) =>
    [...analyticsKeys.all, 'spending-by-category', spaceId] as const,
  incomeVsExpenses: (spaceId: string) =>
    [...analyticsKeys.all, 'income-vs-expenses', spaceId] as const,
  accountBalances: (spaceId: string) =>
    [...analyticsKeys.all, 'account-balances', spaceId] as const,
  portfolioAllocation: (spaceId: string) =>
    [...analyticsKeys.all, 'portfolio-allocation', spaceId] as const,
  dashboard: (spaceId: string) => [...analyticsKeys.all, 'dashboard', spaceId] as const,
};

export const accountKeys = {
  all: ['accounts'] as const,
  list: (spaceId: string) => [...accountKeys.all, 'list', spaceId] as const,
};

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (spaceId: string, filters?: Record<string, unknown>) =>
    [...transactionKeys.all, 'list', spaceId, filters] as const,
};

export const budgetKeys = {
  all: ['budgets'] as const,
  list: (spaceId: string) => [...budgetKeys.all, 'list', spaceId] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
  list: (spaceId: string) => [...categoryKeys.all, 'list', spaceId] as const,
};
