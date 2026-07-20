import { randomUUID } from 'node:crypto';

import type { AccountType, Provider, SpaceType } from './types';
import { Currency } from './types';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  locale: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockSpace {
  id: string;
  name: string;
  type: SpaceType;
  currency: Currency;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAccount {
  id: string;
  spaceId: string;
  provider: Provider;
  providerAccountId: string;
  name: string;
  type: AccountType;
  subtype: string;
  currency: Currency;
  balance: number;
  lastSyncedAt: Date;
  isActive: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTransaction {
  id: string;
  accountId: string;
  providerTransactionId: string | null;
  amount: number;
  currency: Currency;
  description: string;
  merchant: string | null;
  categoryId: string | null;
  date: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockBudget {
  id: string;
  spaceId: string;
  name: string;
  period: 'weekly' | 'monthly' | 'yearly';
  currency: Currency;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCategory {
  id: string;
  budgetId: string;
  name: string;
  type: 'income' | 'expense';
  limit: number;
  spent: number;
  currency: Currency;
  period: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class TestUtils {
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: 'test-user-' + randomUUID().slice(0, 9),
      email: 'test@example.com',
      name: 'Test User',
      locale: 'en',
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockSpace(overrides: Partial<MockSpace> = {}): MockSpace {
    return {
      id: 'test-space-' + randomUUID().slice(0, 9),
      name: 'Test Space',
      type: 'personal',
      currency: Currency.USD,
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockAccount(overrides: Partial<MockAccount> = {}): MockAccount {
    return {
      id: 'test-account-' + randomUUID().slice(0, 9),
      spaceId: 'test-space-id',
      provider: 'manual',
      providerAccountId: 'manual-' + randomUUID().slice(0, 9),
      name: 'Test Account',
      type: 'checking',
      subtype: 'checking',
      currency: Currency.USD,
      balance: 1000,
      lastSyncedAt: new Date(),
      isActive: true,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockTransaction(overrides: Partial<MockTransaction> = {}): MockTransaction {
    return {
      id: 'test-tx-' + randomUUID().slice(0, 9),
      accountId: 'test-account-id',
      providerTransactionId: null,
      amount: -50,
      currency: Currency.USD,
      description: 'Test Transaction',
      merchant: 'Test Merchant',
      categoryId: null,
      date: new Date(),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockBudget(overrides: Partial<MockBudget> = {}): MockBudget {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    return {
      id: 'test-budget-' + randomUUID().slice(0, 9),
      spaceId: 'test-space-id',
      name: 'Test Budget',
      period: 'monthly',
      currency: Currency.USD,
      startDate,
      endDate,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMockCategory(overrides: Partial<MockCategory> = {}): MockCategory {
    return {
      id: 'test-category-' + randomUUID().slice(0, 9),
      budgetId: 'test-budget-id',
      name: 'Test Category',
      type: 'expense',
      limit: 500,
      spent: 250,
      currency: Currency.USD,
      period: 'monthly',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  // ESG test data
  static createMockESGData() {
    return {
      symbol: 'BTC',
      environmentalScore: 15,
      socialScore: 75,
      governanceScore: 85,
      overallScore: 58,
      grade: 'C',
      energyIntensity: 707000,
      carbonFootprint: 357000,
      consensusMechanism: 'Proof of Work',
      description: 'High energy consumption but excellent decentralization',
      lastUpdated: new Date(),
    };
  }

  // Helper for API response mocking
  static createApiResponse<T>(data: T, success = true) {
    return {
      success,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  // Helper for error responses
  static createErrorResponse(message: string, code = 'GENERIC_ERROR') {
    return {
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Date helpers for testing
  static createDateRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    return { start, end };
  }

  static formatCurrency(amount: number, currency: Currency = Currency.USD): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });

    return formatter.format(amount);
  }
}
