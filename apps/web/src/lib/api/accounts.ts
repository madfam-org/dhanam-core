import { Account, Provider, AccountType, Currency } from '@dhanam-core/shared';

import { apiClient } from './client';

export interface ConnectAccountDto {
  provider: Exclude<Provider, 'manual'>;
  linkToken?: string;
  credentials?: Record<string, unknown>;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  subtype?: string;
  currency: Currency;
  balance: number;
}

export interface UpdateAccountDto {
  name?: string;
  balance?: number;
}

export const accountsApi = {
  getAccounts: async (spaceId: string): Promise<Account[]> => {
    return apiClient.get<Account[]>(`/spaces/${spaceId}/accounts`);
  },

  getAccount: async (spaceId: string, accountId: string): Promise<Account> => {
    return apiClient.get<Account>(`/spaces/${spaceId}/accounts/${accountId}`);
  },

  connectAccount: async (spaceId: string, dto: ConnectAccountDto): Promise<Account[]> => {
    return apiClient.post<Account[]>(`/spaces/${spaceId}/accounts/connect`, dto);
  },

  createAccount: async (spaceId: string, dto: CreateAccountDto): Promise<Account> => {
    return apiClient.post<Account>(`/spaces/${spaceId}/accounts`, dto);
  },

  updateAccount: async (
    spaceId: string,
    accountId: string,
    dto: UpdateAccountDto
  ): Promise<Account> => {
    return apiClient.patch<Account>(`/spaces/${spaceId}/accounts/${accountId}`, dto);
  },

  deleteAccount: async (spaceId: string, accountId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/accounts/${accountId}`);
  },

  refreshAccount: async (spaceId: string, accountId: string): Promise<Account> => {
    return apiClient.post<Account>(`/spaces/${spaceId}/accounts/${accountId}/refresh`);
  },
};
