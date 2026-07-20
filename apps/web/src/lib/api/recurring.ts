import {
  RecurringTransaction,
  RecurringSummary,
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  ConfirmRecurringDto,
  RecurringStatus,
} from '@dhanam-core/shared';

import { apiClient } from './client';

export interface RecurringTransactionResponse extends Omit<
  RecurringTransaction,
  'recentTransactions'
> {
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    merchant?: string;
  }>;
}

export interface DetectionResult {
  detected: RecurringTransactionResponse[];
  total: number;
}

export interface RecurringFilterOptions {
  status?: RecurringStatus;
  includeDetected?: boolean;
}

export const recurringApi = {
  /**
   * Get all recurring transactions for a space
   */
  getRecurring: async (
    spaceId: string,
    options?: RecurringFilterOptions
  ): Promise<RecurringTransactionResponse[]> => {
    const params: Record<string, unknown> = {};
    if (options?.status) params.status = options.status;
    if (options?.includeDetected) params.includeDetected = 'true';
    return apiClient.get<RecurringTransactionResponse[]>(`/spaces/${spaceId}/recurring`, params);
  },

  /**
   * Get summary of recurring transactions
   */
  getSummary: async (spaceId: string): Promise<RecurringSummary> => {
    return apiClient.get<RecurringSummary>(`/spaces/${spaceId}/recurring/summary`);
  },

  /**
   * Get a single recurring transaction
   */
  getOne: async (spaceId: string, id: string): Promise<RecurringTransactionResponse> => {
    return apiClient.get<RecurringTransactionResponse>(`/spaces/${spaceId}/recurring/${id}`);
  },

  /**
   * Create a new recurring transaction manually
   */
  create: async (
    spaceId: string,
    dto: CreateRecurringTransactionDto
  ): Promise<RecurringTransactionResponse> => {
    return apiClient.post<RecurringTransactionResponse>(`/spaces/${spaceId}/recurring`, dto);
  },

  /**
   * Detect recurring patterns from transaction history
   */
  detect: async (spaceId: string): Promise<DetectionResult> => {
    return apiClient.post<DetectionResult>(`/spaces/${spaceId}/recurring/detect`, {});
  },

  /**
   * Update a recurring transaction
   */
  update: async (
    spaceId: string,
    id: string,
    dto: UpdateRecurringTransactionDto
  ): Promise<RecurringTransactionResponse> => {
    return apiClient.patch<RecurringTransactionResponse>(`/spaces/${spaceId}/recurring/${id}`, dto);
  },

  /**
   * Confirm a detected recurring pattern
   */
  confirm: async (
    spaceId: string,
    id: string,
    dto?: ConfirmRecurringDto
  ): Promise<RecurringTransactionResponse> => {
    return apiClient.post<RecurringTransactionResponse>(
      `/spaces/${spaceId}/recurring/${id}/confirm`,
      dto || {}
    );
  },

  /**
   * Dismiss a detected recurring pattern
   */
  dismiss: async (spaceId: string, id: string): Promise<RecurringTransactionResponse> => {
    return apiClient.post<RecurringTransactionResponse>(
      `/spaces/${spaceId}/recurring/${id}/dismiss`,
      {}
    );
  },

  /**
   * Toggle pause status for a recurring pattern
   */
  togglePause: async (spaceId: string, id: string): Promise<RecurringTransactionResponse> => {
    return apiClient.post<RecurringTransactionResponse>(
      `/spaces/${spaceId}/recurring/${id}/toggle-pause`,
      {}
    );
  },

  /**
   * Delete a recurring pattern
   */
  delete: async (spaceId: string, id: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/recurring/${id}`);
  },
};
