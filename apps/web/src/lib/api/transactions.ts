import { Transaction } from '@dhanam-core/shared';

import { apiClient } from './client';

export interface CreateTransactionDto {
  accountId: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
  metadata?: Record<string, unknown>;
  excludeFromTotals?: boolean;
}

export interface UpdateTransactionDto {
  amount?: number;
  date?: Date;
  description?: string;
  merchant?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
  metadata?: Record<string, unknown>;
  excludeFromTotals?: boolean;
}

export interface TransactionsFilterDto {
  accountId?: string;
  categoryId?: string;
  tagIds?: string[];
  reviewed?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'amount' | 'date' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MerchantInfo {
  name: string;
  transactionCount: number;
  firstSeen: string;
  lastSeen: string;
  totalAmount: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const transactionsApi = {
  getTransactions: async (
    spaceId: string,
    filter: TransactionsFilterDto
  ): Promise<TransactionsResponse> => {
    return apiClient.get<TransactionsResponse>(
      `/spaces/${spaceId}/transactions`,
      filter as Record<string, unknown>
    );
  },

  getTransaction: async (spaceId: string, transactionId: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/spaces/${spaceId}/transactions/${transactionId}`);
  },

  createTransaction: async (spaceId: string, dto: CreateTransactionDto): Promise<Transaction> => {
    return apiClient.post<Transaction>(`/spaces/${spaceId}/transactions`, dto);
  },

  updateTransaction: async (
    spaceId: string,
    transactionId: string,
    dto: UpdateTransactionDto
  ): Promise<Transaction> => {
    return apiClient.patch<Transaction>(`/spaces/${spaceId}/transactions/${transactionId}`, dto);
  },

  deleteTransaction: async (spaceId: string, transactionId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/transactions/${transactionId}`);
  },

  bulkCategorize: async (
    spaceId: string,
    transactionIds: string[],
    categoryId: string
  ): Promise<Transaction[]> => {
    return apiClient.post<Transaction[]>(`/spaces/${spaceId}/transactions/bulk-categorize`, {
      transactionIds,
      categoryId,
    });
  },

  bulkReview: async (
    spaceId: string,
    transactionIds: string[],
    reviewed: boolean
  ): Promise<{ updated: number }> => {
    return apiClient.post<{ updated: number }>(`/spaces/${spaceId}/transactions/bulk-review`, {
      transactionIds,
      reviewed,
    });
  },

  getUnreviewedCount: async (spaceId: string): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>(`/spaces/${spaceId}/transactions/unreviewed-count`);
  },

  getMerchants: async (spaceId: string): Promise<MerchantInfo[]> => {
    return apiClient.get<MerchantInfo[]>(`/spaces/${spaceId}/transactions/merchants`);
  },

  renameMerchant: async (
    spaceId: string,
    oldName: string,
    newName: string
  ): Promise<{ updated: number }> => {
    return apiClient.post<{ updated: number }>(`/spaces/${spaceId}/transactions/merchants/rename`, {
      oldName,
      newName,
    });
  },

  mergeMerchants: async (
    spaceId: string,
    sourceNames: string[],
    targetName: string
  ): Promise<{ merged: number }> => {
    return apiClient.post<{ merged: number }>(`/spaces/${spaceId}/transactions/merchants/merge`, {
      sourceNames,
      targetName,
    });
  },
};
