import { UUID, Currency, DateRange } from './common.types';

export interface Transaction {
  id: UUID;
  accountId: UUID;
  providerTransactionId?: string;
  amount: number;
  currency: Currency;
  description: string;
  category?: Category;
  categoryId?: UUID;
  date: string;
  pending: boolean;
  excludeFromTotals?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: UUID;
  spaceId: UUID;
  name: string;
  icon?: string;
  color?: string;
  parentId?: UUID;
  parent?: Category;
  isIncome?: boolean;
  excludeFromBudget?: boolean;
  excludeFromTotals?: boolean;
  groupName?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  accountId: UUID;
  amount: number;
  currency?: Currency;
  description: string;
  categoryId?: UUID;
  date: string;
  pending?: boolean;
}

export interface UpdateTransactionDto {
  description?: string;
  categoryId?: UUID;
  pending?: boolean;
}

export interface BulkTransactionOperationDto {
  operation: 'categorize' | 'delete';
  transactionIds: UUID[];
  categoryId?: UUID;
}

export interface TransactionFilters extends DateRange {
  accountId?: UUID;
  categoryId?: UUID;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  pending?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  color?: string;
  parentId?: UUID;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: UUID;
}

export interface TransactionRule {
  id: UUID;
  spaceId: UUID;
  name: string;
  conditions: RuleConditions;
  categoryId: UUID;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConditions {
  description?: {
    contains?: string;
    regex?: string;
  };
  amount?: {
    min?: number;
    max?: number;
  };
  merchant?: string;
}

export interface CreateTransactionRuleDto {
  name: string;
  conditions: RuleConditions;
  categoryId: UUID;
  priority?: number;
  enabled?: boolean;
}

export interface UpdateTransactionRuleDto {
  name?: string;
  conditions?: RuleConditions;
  categoryId?: UUID;
  priority?: number;
  enabled?: boolean;
}
