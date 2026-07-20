import { UUID, Currency, Provider, Money } from './common.types';

export interface Account {
  id: UUID;
  spaceId: UUID;
  provider: Provider;
  providerAccountId?: string;
  name: string;
  type: AccountType;
  subtype?: string;
  currency: Currency;
  balance: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'crypto' | 'other';

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

export interface ConnectAccountDto {
  provider: Provider;
  linkToken?: string;
  credentials?: Record<string, unknown>;
}

export interface AccountConnection {
  id: UUID;
  provider: Provider;
  status: ConnectionStatus;
  lastSyncedAt?: string;
  error?: string;
}

export type ConnectionStatus = 'active' | 'error' | 'syncing' | 'disconnected';

export interface SyncAccountResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AccountBalance {
  accountId: UUID;
  balance: Money;
  available?: Money;
  pending?: Money;
  lastUpdated: string;
}
