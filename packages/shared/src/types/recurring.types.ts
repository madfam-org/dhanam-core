import { UUID, Currency } from './common.types';

/**
 * Recurring Transaction Detection & Management Types
 *
 * These types support automatic detection of recurring transactions
 * (subscriptions, bills, regular payments) and their management.
 */

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type RecurringStatus =
  | 'detected' // Auto-detected, awaiting user confirmation
  | 'confirmed' // User confirmed as recurring
  | 'dismissed' // User dismissed detection
  | 'paused'; // User paused tracking

export interface RecurringTransaction {
  id: UUID;
  spaceId: UUID;
  merchantName: string;
  merchantPattern?: string;
  expectedAmount: number;
  amountVariance: number;
  currency: Currency;
  frequency: RecurrenceFrequency;
  status: RecurringStatus;
  categoryId?: UUID;

  // Tracking
  lastOccurrence?: string;
  nextExpected?: string;
  occurrenceCount: number;
  confidence: number;

  // Detection metadata
  firstDetectedAt: string;
  confirmedAt?: string;
  dismissedAt?: string;

  // Notification preferences
  alertBeforeDays: number;
  alertEnabled: boolean;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransactionSummary {
  id: UUID;
  merchantName: string;
  expectedAmount: number;
  currency: Currency;
  frequency: RecurrenceFrequency;
  status: RecurringStatus;
  nextExpected?: string;
  confidence: number;
  occurrenceCount: number;
  categoryName?: string;
}

export interface CreateRecurringTransactionDto {
  merchantName: string;
  merchantPattern?: string;
  expectedAmount: number;
  amountVariance?: number;
  currency: Currency;
  frequency: RecurrenceFrequency;
  categoryId?: UUID;
  alertBeforeDays?: number;
  alertEnabled?: boolean;
  notes?: string;
}

export interface UpdateRecurringTransactionDto {
  merchantName?: string;
  merchantPattern?: string;
  expectedAmount?: number;
  amountVariance?: number;
  frequency?: RecurrenceFrequency;
  categoryId?: UUID | null;
  alertBeforeDays?: number;
  alertEnabled?: boolean;
  notes?: string;
}

export interface ConfirmRecurringDto {
  frequency?: RecurrenceFrequency;
  categoryId?: UUID;
  alertEnabled?: boolean;
}

export interface DetectedPattern {
  merchantName: string;
  transactions: Array<{
    id: UUID;
    date: string;
    amount: number;
    description: string;
  }>;
  suggestedFrequency: RecurrenceFrequency;
  averageAmount: number;
  amountVariance: number;
  confidence: number;
  firstOccurrence: string;
  lastOccurrence: string;
  occurrenceCount: number;
}

export interface RecurringDetectionResult {
  detected: DetectedPattern[];
  existing: RecurringTransactionSummary[];
}

export interface RecurringCalendarEntry {
  id: UUID;
  merchantName: string;
  expectedAmount: number;
  currency: Currency;
  expectedDate: string;
  status: RecurringStatus;
  isUpcoming: boolean;
  daysUntil: number;
}

export interface RecurringSummary {
  totalMonthly: number;
  totalAnnual: number;
  currency: Currency;
  activeCount: number;
  detectedCount: number;
  upcomingThisMonth: RecurringCalendarEntry[];
}

export interface RecurringAlert {
  id: UUID;
  recurringId: UUID;
  type: 'upcoming' | 'missed' | 'amount_changed' | 'new_detection';
  message: string;
  merchantName: string;
  expectedAmount?: number;
  actualAmount?: number;
  expectedDate?: string;
  createdAt: string;
  read: boolean;
}
