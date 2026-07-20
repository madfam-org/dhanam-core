// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  longTermCashflowEngine,
  type LongTermProjectionConfig,
  type LongTermProjectionResult,
  type IncomeStream,
  type ExpenseCategory,
  type LoanConfig,
  type AssetConfig,
  type LifeEvent,
  type SocialSecurityConfig,
  type TaxConfig,
  type WhatIfScenario,
} from '@dhanam-core/simulations';
import { Injectable, BadRequestException } from '@nestjs/common';

import { Currency } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { FxRatesService } from '../fx-rates/fx-rates.service';
import { SpacesService } from '../spaces/spaces.service';

export interface CreateProjectionDto {
  /** Number of years to project (10-30) */
  projectionYears: number;

  /** Inflation rate assumption (e.g., 0.03 for 3%) */
  inflationRate?: number;

  /** Current age */
  currentAge: number;

  /** Target retirement age */
  retirementAge: number;

  /** Life expectancy for planning */
  lifeExpectancy?: number;

  /** Custom income streams (overrides auto-detected) */
  incomeStreams?: IncomeStream[];

  /** Custom expenses (overrides auto-detected) */
  expenses?: ExpenseCategory[];

  /** Social Security configuration */
  socialSecurity?: SocialSecurityConfig;

  /** Tax configuration */
  taxes?: TaxConfig;

  /** Life events to include */
  lifeEvents?: LifeEvent[];

  /** Whether to include existing accounts as assets */
  includeAccounts?: boolean;

  /** Whether to include recurring transactions as expenses */
  includeRecurring?: boolean;
}

export interface WhatIfComparisonDto {
  baseConfig: CreateProjectionDto;
  scenarios: WhatIfScenario[];
}

export interface ProjectionSummary {
  id: string;
  spaceId: string;
  name: string;
  projectionYears: number;
  currentAge: number;
  retirementAge: number;
  debtFreeYear: number | null;
  financialIndependenceYear: number | null;
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LongTermForecastService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private fxRatesService: FxRatesService
  ) {}

  /**
   * Generate a long-term financial projection
   */
  async generateProjection(
    userId: string,
    spaceId: string,
    dto: CreateProjectionDto
  ): Promise<LongTermProjectionResult> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Validate inputs
    if (dto.projectionYears < 5 || dto.projectionYears > 50) {
      throw new BadRequestException('Projection years must be between 5 and 50');
    }

    if (dto.currentAge < 18 || dto.currentAge > 100) {
      throw new BadRequestException('Current age must be between 18 and 100');
    }

    if (dto.retirementAge <= dto.currentAge) {
      throw new BadRequestException('Retirement age must be greater than current age');
    }

    // Get space for currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const currency = (space?.currency as Currency) || Currency.USD;

    // Build configuration
    const config: LongTermProjectionConfig = {
      projectionYears: dto.projectionYears,
      inflationRate: dto.inflationRate || 0.03,
      currentAge: dto.currentAge,
      retirementAge: dto.retirementAge,
      lifeExpectancy: dto.lifeExpectancy || 90,
      incomeStreams: dto.incomeStreams || [],
      expenses: dto.expenses || [],
      loans: [],
      assets: [],
      lifeEvents: dto.lifeEvents || [],
      socialSecurity: dto.socialSecurity,
      taxes: dto.taxes,
    };

    // Auto-populate from accounts if requested
    if (dto.includeAccounts !== false) {
      const accountsData = await this.getAccountsAsAssets(spaceId, currency);
      config.assets = [...config.assets, ...accountsData.assets];
      config.loans = [...config.loans, ...accountsData.loans];
    }

    // Auto-populate from recurring transactions if requested
    if (dto.includeRecurring !== false) {
      const recurringData = await this.getRecurringAsExpenses(spaceId, currency);
      config.incomeStreams = [...config.incomeStreams, ...recurringData.income];
      config.expenses = [...config.expenses, ...recurringData.expenses];
    }

    // Run projection
    return longTermCashflowEngine.project(config);
  }

  /**
   * Compare what-if scenarios
   */
  async compareScenarios(
    userId: string,
    spaceId: string,
    dto: WhatIfComparisonDto
  ): Promise<{
    baseline: LongTermProjectionResult;
    scenarios: { scenario: WhatIfScenario; result: LongTermProjectionResult }[];
  }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Get space for currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const currency = (space?.currency as Currency) || Currency.USD;

    // Build base configuration
    const baseConfig: LongTermProjectionConfig = {
      projectionYears: dto.baseConfig.projectionYears,
      inflationRate: dto.baseConfig.inflationRate || 0.03,
      currentAge: dto.baseConfig.currentAge,
      retirementAge: dto.baseConfig.retirementAge,
      lifeExpectancy: dto.baseConfig.lifeExpectancy || 90,
      incomeStreams: dto.baseConfig.incomeStreams || [],
      expenses: dto.baseConfig.expenses || [],
      loans: [],
      assets: [],
      lifeEvents: dto.baseConfig.lifeEvents || [],
      socialSecurity: dto.baseConfig.socialSecurity,
      taxes: dto.baseConfig.taxes,
    };

    // Auto-populate from accounts if requested
    if (dto.baseConfig.includeAccounts !== false) {
      const accountsData = await this.getAccountsAsAssets(spaceId, currency);
      baseConfig.assets = [...baseConfig.assets, ...accountsData.assets];
      baseConfig.loans = [...baseConfig.loans, ...accountsData.loans];
    }

    // Auto-populate from recurring transactions if requested
    if (dto.baseConfig.includeRecurring !== false) {
      const recurringData = await this.getRecurringAsExpenses(spaceId, currency);
      baseConfig.incomeStreams = [...baseConfig.incomeStreams, ...recurringData.income];
      baseConfig.expenses = [...baseConfig.expenses, ...recurringData.expenses];
    }

    return longTermCashflowEngine.compareScenarios(baseConfig, dto.scenarios);
  }

  /**
   * Get predefined what-if scenario templates
   */
  getScenarioTemplates(): WhatIfScenario[] {
    return [
      {
        name: 'Early Retirement (5 years earlier)',
        description: 'What if you retire 5 years earlier?',
        modifications: {
          retirementAge: -5 as unknown as number, // Will be applied as offset
        },
      },
      {
        name: 'Delayed Retirement (5 years later)',
        description: 'What if you work 5 more years?',
        modifications: {
          retirementAge: 5 as unknown as number,
        },
      },
      {
        name: 'Higher Inflation (4%)',
        description: 'What if inflation averages 4% instead of 3%?',
        modifications: {
          inflationRate: 0.04,
        },
      },
      {
        name: 'Lower Inflation (2%)',
        description: 'What if inflation averages only 2%?',
        modifications: {
          inflationRate: 0.02,
        },
      },
      {
        name: 'Aggressive Savings (+20%)',
        description: 'What if you increase savings by 20%?',
        modifications: {
          // This would need to be applied to asset contributions
        },
      },
    ];
  }

  /**
   * Get quick projection summary for dashboard
   */
  async getQuickProjection(
    userId: string,
    spaceId: string,
    currentAge: number,
    retirementAge: number
  ): Promise<{
    netWorthAtRetirement: number;
    monthlyRetirementIncome: number;
    yearsUntilRetirement: number;
    riskScore: number;
    incomeReplacementRatio: number;
  }> {
    const result = await this.generateProjection(userId, spaceId, {
      projectionYears: Math.max(30, retirementAge - currentAge + 25),
      currentAge,
      retirementAge,
      includeAccounts: true,
      includeRecurring: true,
    });

    const retirementYear = new Date().getFullYear() + (retirementAge - currentAge);
    const retirementSnapshot = result.yearlySnapshots.find((s) => s.year === retirementYear);

    return {
      netWorthAtRetirement: retirementSnapshot?.netWorth || 0,
      monthlyRetirementIncome: (retirementSnapshot?.grossIncome || 0) / 12,
      yearsUntilRetirement: result.summary.yearsUntilRetirement,
      riskScore: result.summary.riskScore,
      incomeReplacementRatio: result.summary.incomeReplacementRatio,
    };
  }

  /**
   * Convert accounts to asset/loan configurations
   */
  private async getAccountsAsAssets(
    spaceId: string,
    targetCurrency: Currency
  ): Promise<{ assets: AssetConfig[]; loans: LoanConfig[] }> {
    const accounts = await this.prisma.account.findMany({
      where: { spaceId },
      include: {
        assetValuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const assets: AssetConfig[] = [];
    const loans: LoanConfig[] = [];

    for (const account of accounts) {
      const balance = account.balance?.toNumber() || 0;
      const accountCurrency = account.currency as Currency;

      // Convert to target currency
      let convertedBalance = balance;
      if (accountCurrency !== targetCurrency) {
        try {
          convertedBalance = await this.fxRatesService.convertAmount(
            balance,
            accountCurrency,
            targetCurrency
          );
        } catch {
          // Use balance as-is if conversion fails
        }
      }

      // Categorize by account type
      const type = account.type.toLowerCase();

      if (type.includes('loan') || type.includes('credit') || type.includes('mortgage')) {
        // Treat as debt
        if (convertedBalance < 0) {
          loans.push({
            name: account.name,
            balance: Math.abs(convertedBalance),
            interestRate: 0.05, // Default rate, would need actual rate from account
            monthlyPayment: Math.abs(convertedBalance) / 60, // Estimate 5-year payoff
            remainingTermMonths: 60,
            type: type.includes('mortgage')
              ? 'mortgage'
              : type.includes('auto')
                ? 'auto'
                : type.includes('student')
                  ? 'student'
                  : type.includes('credit')
                    ? 'credit_card'
                    : 'personal',
          });
        }
      } else {
        // Treat as asset
        let assetType: 'taxable' | 'tax_deferred' | 'tax_free' | 'real_estate' | 'other' =
          'taxable';
        let expectedReturn = 0.06; // Default conservative return

        if (type.includes('401k') || type.includes('ira') || type.includes('retirement')) {
          assetType = 'tax_deferred';
          expectedReturn = 0.07;
        } else if (type.includes('roth')) {
          assetType = 'tax_free';
          expectedReturn = 0.07;
        } else if (type.includes('checking') || type.includes('savings')) {
          expectedReturn = 0.02;
        } else if (type.includes('brokerage') || type.includes('investment')) {
          expectedReturn = 0.07;
        }

        if (convertedBalance > 0) {
          assets.push({
            name: account.name,
            currentValue: convertedBalance,
            expectedReturn,
            type: assetType,
          });
        }
      }
    }

    // Also include manual assets
    const manualAssets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
    });

    for (const asset of manualAssets) {
      const value = asset.currentValue?.toNumber() || 0;
      const assetCurrency = asset.currency as Currency;

      let convertedValue = value;
      if (assetCurrency !== targetCurrency) {
        try {
          convertedValue = await this.fxRatesService.convertAmount(
            value,
            assetCurrency,
            targetCurrency
          );
        } catch {
          // Use value as-is
        }
      }

      if (convertedValue > 0) {
        assets.push({
          name: asset.name,
          currentValue: convertedValue,
          expectedReturn: asset.type === 'real_estate' ? 0.03 : 0.04,
          type: asset.type === 'real_estate' ? 'real_estate' : 'other',
        });
      }
    }

    return { assets, loans };
  }

  /**
   * Convert recurring transactions to income/expense configurations
   */
  private async getRecurringAsExpenses(
    spaceId: string,
    targetCurrency: Currency
  ): Promise<{ income: IncomeStream[]; expenses: ExpenseCategory[] }> {
    const recurringTransactions = await this.prisma.recurringTransaction.findMany({
      where: {
        spaceId,
        status: { in: ['confirmed', 'detected'] },
      },
    });

    // Get categories through budgets for this space
    const budgets = await this.prisma.budget.findMany({
      where: { spaceId },
      include: { categories: true },
    });
    const categoryMap = new Map(budgets.flatMap((b) => b.categories.map((c) => [c.id, c])));

    const income: IncomeStream[] = [];
    const expenses: ExpenseCategory[] = [];

    for (const recurring of recurringTransactions) {
      const amount = recurring.expectedAmount?.toNumber() || 0;
      const currency = recurring.currency as Currency;

      let convertedAmount = Math.abs(amount);
      if (currency !== targetCurrency) {
        try {
          convertedAmount = await this.fxRatesService.convertAmount(
            Math.abs(amount),
            currency,
            targetCurrency
          );
        } catch {
          // Use amount as-is
        }
      }

      // Annualize based on frequency
      let annualAmount: number;
      switch (recurring.frequency) {
        case 'weekly':
          annualAmount = convertedAmount * 52;
          break;
        case 'biweekly':
          annualAmount = convertedAmount * 26;
          break;
        case 'monthly':
          annualAmount = convertedAmount * 12;
          break;
        case 'quarterly':
          annualAmount = convertedAmount * 4;
          break;
        case 'yearly':
          annualAmount = convertedAmount;
          break;
        default:
          annualAmount = convertedAmount * 12; // Default to monthly
      }

      if (amount > 0) {
        // Income
        income.push({
          name: recurring.merchantName || 'Recurring Income',
          annualAmount,
          growthRate: 0.02, // Assume 2% annual growth
          isTaxable: true,
        });
      } else {
        // Expense
        const category = recurring.categoryId ? categoryMap.get(recurring.categoryId) : null;
        const categoryName = category?.name || 'Uncategorized';
        const isEssential =
          categoryName.toLowerCase().includes('housing') ||
          categoryName.toLowerCase().includes('utilities') ||
          categoryName.toLowerCase().includes('insurance') ||
          categoryName.toLowerCase().includes('healthcare');

        expenses.push({
          name: recurring.merchantName || 'Recurring Expense',
          annualAmount,
          growthRate: 0.03, // Assume expenses grow with inflation
          isEssential,
        });
      }
    }

    return { income, expenses };
  }
}