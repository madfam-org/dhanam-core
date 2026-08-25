// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';
import { Transaction } from '@db';

export interface RuleAction {
  type: 'set_category' | 'set_tag' | 'set_merchant' | 'link_recurring';
  categoryId?: string;
  tagId?: string;
  value?: string;
}

export interface CategoryRule {
  id: string;
  categoryId: string | null;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export interface RuleCondition {
  field: 'description' | 'merchant' | 'amount' | 'account';
  operator:
    | 'contains'
    | 'equals'
    | 'startsWith'
    | 'endsWith'
    | 'regex'
    | 'greaterThan'
    | 'lessThan'
    | 'between';
  value: string | number;
  valueEnd?: number; // For 'between' operator
  caseInsensitive?: boolean;
}

interface LegacyRuleCondition {
  field?: RuleCondition['field'];
  operator?: RuleCondition['operator'];
  value?: string | number;
  valueEnd?: number;
  caseInsensitive?: boolean;
  type?: string;
  descriptionPattern?: string;
  merchantPattern?: string;
  accountPattern?: string;
}

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private prisma: PrismaService) {}

  async createRule(
    spaceId: string,
    categoryId: string,
    name: string,
    conditions: RuleCondition[],
    priority: number = 0
  ): Promise<CategoryRule> {
    const rule = await this.prisma.transactionRule.create({
      data: {
        spaceId,
        categoryId,
        name,
        priority,
        conditions: conditions as any,
        enabled: true,
      },
    });

    return this.transformRule(rule);
  }

  async updateRule(
    ruleId: string,
    updates: Partial<{
      name: string;
      conditions: RuleCondition[];
      priority: number;
      enabled: boolean;
    }>
  ): Promise<CategoryRule> {
    const rule = await this.prisma.transactionRule.update({
      where: { id: ruleId },
      data: {
        ...updates,
        ...(updates.conditions && { conditions: updates.conditions as any }),
      },
    });

    return this.transformRule(rule);
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.prisma.transactionRule.delete({
      where: { id: ruleId },
    });
  }

  async getRulesForCategory(categoryId: string): Promise<CategoryRule[]> {
    const rules = await this.prisma.transactionRule.findMany({
      where: { categoryId },
      orderBy: { priority: 'desc' },
    });

    return rules.map((rule: any) => this.transformRule(rule));
  }

  async getRulesForSpace(spaceId: string): Promise<CategoryRule[]> {
    const rules = await this.prisma.transactionRule.findMany({
      where: { spaceId },
      orderBy: { priority: 'desc' },
    });

    return rules.map((rule: any) => this.transformRule(rule));
  }

  async categorizeTransaction(transaction: Transaction): Promise<string | null> {
    // Get all rules for the space that the transaction's account belongs to
    const account = await this.prisma.account.findUnique({
      where: { id: transaction.accountId },
      include: {
        space: true,
      },
    });

    if (!account) {
      this.logger.warn(`Account not found for transaction ${transaction.id}`);
      return null;
    }

    const rules = await this.getRulesForSpace(account.spaceId);

    // Apply rules in priority order
    for (const rule of rules) {
      if (!rule.enabled) continue;

      if (this.evaluateRule(rule, transaction)) {
        this.logger.log(
          `Transaction ${transaction.id} matched rule "${rule.name}" for category ${rule.categoryId}`
        );
        return rule.categoryId;
      }
    }

    return null;
  }

  async batchCategorizeTransactions(spaceId: string): Promise<{
    categorized: number;
    total: number;
  }> {
    // Get uncategorized transactions for the space
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { spaceId },
        categoryId: null,
      },
      include: {
        account: true,
      },
    });

    // PERFORMANCE FIX: Get rules once for the space instead of per-transaction
    // This eliminates N+1 query pattern (was 1 + N queries, now 2 queries total)
    const rules = await this.getRulesForSpace(spaceId);

    let categorizedCount = 0;

    for (const transaction of transactions) {
      // Evaluate rules in-memory without additional database queries
      const categoryId = this.categorizeTransactionWithRules(transaction, rules);

      if (categoryId) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { categoryId },
        });
        categorizedCount++;
      }
    }

    this.logger.log(
      `Batch categorization complete: ${categorizedCount}/${transactions.length} transactions categorized`
    );

    return {
      categorized: categorizedCount,
      total: transactions.length,
    };
  }

  /**
   * Categorize transaction using pre-loaded rules (no database queries)
   * Used by batch operations to avoid N+1 query pattern
   */
  private categorizeTransactionWithRules(
    transaction: Transaction,
    rules: CategoryRule[]
  ): string | null {
    // Apply rules in priority order (already sorted by getRulesForSpace)
    for (const rule of rules) {
      if (!rule.enabled) continue;

      if (this.evaluateRule(rule, transaction)) {
        this.logger.log(
          `Transaction ${transaction.id} matched rule "${rule.name}" for category ${rule.categoryId}`
        );
        return rule.categoryId;
      }
    }

    return null;
  }

  private evaluateRule(rule: CategoryRule, transaction: Transaction): boolean {
    const conditions = this.normalizeRuleConditions(rule.conditions);

    return (
      conditions.length > 0 &&
      conditions.every((condition) => this.evaluateCondition(condition, transaction))
    );
  }

  private evaluateCondition(condition: RuleCondition, transaction: Transaction): boolean {
    let fieldValue: string | number;

    switch (condition.field) {
      case 'description':
        fieldValue = transaction.description || '';
        break;
      case 'merchant':
        fieldValue = transaction.merchant || '';
        break;
      case 'amount':
        fieldValue = Math.abs(transaction.amount.toNumber());
        break;
      case 'account':
        fieldValue = transaction.accountId;
        break;
      default:
        return false;
    }

    return this.applyOperator(
      condition.operator,
      fieldValue,
      condition.value,
      condition.valueEnd,
      condition.caseInsensitive
    );
  }

  private applyOperator(
    operator: string,
    fieldValue: string | number,
    conditionValue: string | number,
    conditionValueEnd?: number,
    caseInsensitive = true
  ): boolean {
    if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
      const field = caseInsensitive ? fieldValue.toLowerCase() : fieldValue;
      const value = caseInsensitive ? conditionValue.toLowerCase() : conditionValue;

      switch (operator) {
        case 'contains':
          return field.includes(value);
        case 'equals':
          return field === value;
        case 'startsWith':
          return field.startsWith(value);
        case 'endsWith':
          return field.endsWith(value);
        case 'regex':
          try {
            return new RegExp(conditionValue, caseInsensitive ? 'i' : undefined).test(fieldValue);
          } catch {
            return false;
          }
        default:
          return false;
      }
    }

    if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
      switch (operator) {
        case 'equals':
          return fieldValue === conditionValue;
        case 'greaterThan':
          return fieldValue > conditionValue;
        case 'lessThan':
          return fieldValue < conditionValue;
        case 'between':
          return conditionValueEnd !== undefined
            ? fieldValue >= conditionValue && fieldValue <= conditionValueEnd
            : false;
        default:
          return false;
      }
    }

    return false;
  }

  private transformRule(rule: any): CategoryRule {
    // Build actions from legacy categoryId and new actions field
    let actions: RuleAction[] = [];
    if (rule.actions) {
      actions = rule.actions as RuleAction[];
    } else if (rule.categoryId) {
      actions = [{ type: 'set_category', categoryId: rule.categoryId }];
    }

    return {
      id: rule.id,
      categoryId: rule.categoryId,
      name: rule.name,
      priority: rule.priority,
      conditions: this.normalizeRuleConditions(rule.conditions),
      actions,
      enabled: rule.enabled,
    };
  }

  private normalizeRuleConditions(rawConditions: unknown): RuleCondition[] {
    if (Array.isArray(rawConditions)) {
      return rawConditions
        .map((condition) => this.normalizeRuleCondition(condition))
        .filter((condition): condition is RuleCondition => condition !== null);
    }

    const condition = this.normalizeRuleCondition(rawConditions);
    return condition ? [condition] : [];
  }

  private normalizeRuleCondition(rawCondition: unknown): RuleCondition | null {
    if (!rawCondition || typeof rawCondition !== 'object') {
      return null;
    }

    const condition = rawCondition as LegacyRuleCondition;
    if (condition.field && condition.operator && condition.value !== undefined) {
      return {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        ...(condition.valueEnd !== undefined && { valueEnd: condition.valueEnd }),
        ...(condition.caseInsensitive !== undefined && {
          caseInsensitive: condition.caseInsensitive,
        }),
      };
    }

    if (condition.type === 'regex') {
      const pattern =
        condition.descriptionPattern || condition.merchantPattern || condition.accountPattern;
      if (!pattern) {
        return null;
      }

      return {
        field: condition.descriptionPattern
          ? 'description'
          : condition.merchantPattern
            ? 'merchant'
            : 'account',
        operator: 'regex',
        value: pattern,
        caseInsensitive: true,
      };
    }

    return null;
  }

  // Predefined common rules for quick setup
  async createCommonRules(spaceId: string): Promise<CategoryRule[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        budget: { spaceId },
      },
    });

    const rules: CategoryRule[] = [];
    const commonPatterns = [
      {
        name: 'Grocery Stores',
        pattern: 'grocery',
        categoryNames: ['groceries', 'food', 'supermarket'],
      },
      {
        name: 'Gas Stations',
        pattern: 'gas|fuel|petrol|gasolina',
        categoryNames: ['transportation', 'fuel', 'gas'],
      },
      {
        name: 'Restaurants',
        pattern: 'restaurant|cafe|coffee|starbucks|mcdonald',
        categoryNames: ['dining', 'restaurants', 'food'],
      },
      {
        name: 'ATM Withdrawals',
        pattern: 'atm|cajero',
        categoryNames: ['cash', 'withdrawal', 'efectivo'],
      },
      {
        name: 'Transfers',
        pattern: 'transfer|transferencia',
        categoryNames: ['transfer', 'transferencia'],
      },
    ];

    for (const pattern of commonPatterns) {
      const matchingCategory = categories.find((cat) =>
        pattern.categoryNames.some((name) => cat.name.toLowerCase().includes(name.toLowerCase()))
      );

      if (matchingCategory) {
        try {
          const rule = await this.createRule(
            spaceId,
            matchingCategory.id,
            pattern.name,
            [
              {
                field: 'description',
                operator: 'contains',
                value: pattern.pattern,
                caseInsensitive: true,
              },
            ],
            100
          );
          rules.push(rule);
        } catch (error) {
          this.logger.error(`Failed to create rule ${pattern.name}:`, error);
        }
      }
    }

    return rules;
  }

  async categorizeSpecificTransactions(
    spaceId: string,
    transactionIds: string[]
  ): Promise<{ categorized: number; total: number }> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        account: { spaceId },
      },
    });

    let categorizedCount = 0;

    for (const transaction of transactions) {
      const categoryId = await this.categorizeTransaction(transaction);
      if (categoryId) {
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { categoryId },
        });
        categorizedCount++;
      }
    }

    this.logger.log(
      `Specific categorization complete: ${categorizedCount}/${transactions.length} transactions categorized`
    );

    return {
      categorized: categorizedCount,
      total: transactions.length,
    };
  }
}
