// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PostHogService } from '../analytics/posthog.service';

@Injectable()
export class TransactionsAnalytics {
  private readonly logger = new Logger(TransactionsAnalytics.name);

  constructor(private readonly posthogService: PostHogService) {}

  /**
   * Track when a transaction is categorized
   */
  async trackTransactionCategorized(
    userId: string,
    method: 'auto' | 'manual' | 'rule',
    categoryName: string
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'txn_categorized',
        properties: {
          categorization_method: method,
          category_name: categoryName,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction categorized:', error);
    }
  }

  /**
   * Track bulk categorization
   */
  async trackBulkCategorization(
    userId: string,
    count: number,
    method: 'rule' | 'manual',
    ruleId?: string
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'txn_bulk_categorized',
        properties: {
          transaction_count: count,
          categorization_method: method,
          rule_id: ruleId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track bulk categorization:', error);
    }
  }

  /**
   * Track when a transaction is created manually
   */
  async trackTransactionCreated(
    userId: string,
    transaction: {
      amount: number;
      currency: string;
      category?: string;
      type: string;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_created',
        properties: {
          amount: transaction.amount,
          currency: transaction.currency,
          category: transaction.category,
          transaction_type: transaction.type,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction created:', error);
    }
  }

  /**
   * Track when a transaction is updated
   */
  async trackTransactionUpdated(
    userId: string,
    transactionId: string,
    changes: string[]
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_updated',
        properties: {
          transaction_id: transactionId,
          changes,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction updated:', error);
    }
  }

  /**
   * Track when a transaction is deleted
   */
  async trackTransactionDeleted(userId: string, transactionId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_deleted',
        properties: {
          transaction_id: transactionId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction deleted:', error);
    }
  }

  /**
   * Track when transactions are split
   */
  async trackTransactionSplit(
    userId: string,
    originalTransactionId: string,
    splitCount: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_split',
        properties: {
          original_transaction_id: originalTransactionId,
          split_count: splitCount,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction split:', error);
    }
  }

  /**
   * Track when user views transaction details
   */
  async trackTransactionViewed(userId: string, transactionId: string): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_viewed',
        properties: {
          transaction_id: transactionId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction viewed:', error);
    }
  }

  /**
   * Track when user searches transactions
   */
  async trackTransactionSearch(
    userId: string,
    filters: {
      searchTerm?: string;
      category?: string;
      dateRange?: string;
      amountRange?: string;
    }
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_search',
        properties: {
          has_search_term: !!filters.searchTerm,
          has_category_filter: !!filters.category,
          has_date_filter: !!filters.dateRange,
          has_amount_filter: !!filters.amountRange,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction search:', error);
    }
  }

  /**
   * Track when user exports transactions
   */
  async trackTransactionExport(
    userId: string,
    format: 'csv' | 'pdf' | 'json',
    count: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'transaction_export',
        properties: {
          export_format: format,
          transaction_count: count,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track transaction export:', error);
    }
  }

  /**
   * Track recurring transaction detection
   */
  async trackRecurringDetected(
    userId: string,
    merchant: string,
    frequency: string,
    confidence: number
  ): Promise<void> {
    try {
      await this.posthogService.capture({
        distinctId: userId,
        event: 'recurring_detected',
        properties: {
          merchant,
          frequency,
          confidence,
        },
      });
    } catch (error) {
      this.logger.error('Failed to track recurring detection:', error);
    }
  }
}
