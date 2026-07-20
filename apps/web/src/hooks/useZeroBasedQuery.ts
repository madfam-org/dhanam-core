'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  zeroBasedApi,
  zeroBasedKeys,
  AllocationStatus,
  IncomeEvent,
  CategoryGoal,
  CreateIncomeEventDto,
  AllocateFundsDto,
  MoveFundsDto,
  SetCategoryGoalDto,
  RolloverMonthDto,
  AllocateFundsResponse,
  MoveFundsResponse,
  AutoAllocateResponse,
  RolloverResponse,
  CreateIncomeEventResponse,
  SetGoalResponse,
} from '@/lib/api/zero-based';
import { useSpaceStore } from '@/stores/space';

// Default stale time: 30 seconds for budget data
const DEFAULT_STALE_TIME = 30 * 1000;

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to get allocation status (envelope budgeting view)
 * Returns "Ready to Assign" amount, category allocations, and spending
 */
export function useAllocationStatus(month?: string) {
  const { currentSpace } = useSpaceStore();

  return useQuery({
    queryKey: zeroBasedKeys.allocationStatus(currentSpace?.id || '', month),
    queryFn: async (): Promise<AllocationStatus> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.getAllocationStatus(currentSpace.id, month);
    },
    enabled: !!currentSpace?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook to get income events for the current space
 */
export function useIncomeEvents(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const { currentSpace } = useSpaceStore();

  return useQuery({
    queryKey: zeroBasedKeys.incomeEvents(currentSpace?.id || ''),
    queryFn: async (): Promise<IncomeEvent[]> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.getIncomeEvents(currentSpace.id, options);
    },
    enabled: !!currentSpace?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
}

/**
 * Hook to get category goals for the current space
 */
export function useCategoryGoals() {
  const { currentSpace } = useSpaceStore();

  return useQuery({
    queryKey: zeroBasedKeys.categoryGoals(currentSpace?.id || ''),
    queryFn: async (): Promise<CategoryGoal[]> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.getCategoryGoals(currentSpace.id);
    },
    enabled: !!currentSpace?.id,
    staleTime: DEFAULT_STALE_TIME,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a new income event
 */
export function useCreateIncomeEvent() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (dto: CreateIncomeEventDto): Promise<CreateIncomeEventResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.createIncomeEvent(currentSpace.id, dto);
    },
    onSuccess: () => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.incomeEvents(currentSpace.id),
        });
      }
      toast.success('Income recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record income');
    },
  });
}

/**
 * Hook to allocate funds to a category
 */
export function useAllocateFunds() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (dto: AllocateFundsDto): Promise<AllocateFundsResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.allocateFunds(currentSpace.id, dto);
    },
    onSuccess: () => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
      }
      toast.success('Funds allocated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to allocate funds');
    },
  });
}

/**
 * Hook to move funds between categories
 */
export function useMoveFunds() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (dto: MoveFundsDto): Promise<MoveFundsResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.moveFunds(currentSpace.id, dto);
    },
    onSuccess: () => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
      }
      toast.success('Funds moved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move funds');
    },
  });
}

/**
 * Hook to auto-allocate based on category goals
 */
export function useAutoAllocate() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (incomeEventId?: string): Promise<AutoAllocateResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.autoAllocate(currentSpace.id, incomeEventId);
    },
    onSuccess: (data) => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
      }
      const allocatedCount = data.allocations.length;
      if (allocatedCount > 0) {
        toast.success(`Auto-allocated to ${allocatedCount} categories`);
      } else {
        toast.info('No categories with goals to allocate to');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to auto-allocate');
    },
  });
}

/**
 * Hook to rollover unspent funds to next month
 */
export function useRolloverMonth() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (dto: RolloverMonthDto): Promise<RolloverResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.rolloverMonth(currentSpace.id, dto);
    },
    onSuccess: (data) => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
      }
      if (data.categoriesRolledOver > 0) {
        toast.success(
          `Rolled over ${data.categoriesRolledOver} categories (${formatCurrency(data.totalCarryover)})`
        );
      } else {
        toast.info('No funds to rollover');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to rollover funds');
    },
  });
}

/**
 * Hook to set a funding goal for a category
 */
export function useSetCategoryGoal() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async ({
      categoryId,
      dto,
    }: {
      categoryId: string;
      dto: SetCategoryGoalDto;
    }): Promise<SetGoalResponse> => {
      if (!currentSpace?.id) throw new Error('No space selected');
      return zeroBasedApi.setCategoryGoal(currentSpace.id, categoryId, dto);
    },
    onSuccess: () => {
      if (currentSpace?.id) {
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.allocationStatus(currentSpace.id),
        });
        queryClient.invalidateQueries({
          queryKey: zeroBasedKeys.categoryGoals(currentSpace.id),
        });
      }
      toast.success('Goal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set goal');
    },
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Simple currency formatter for toast messages
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
