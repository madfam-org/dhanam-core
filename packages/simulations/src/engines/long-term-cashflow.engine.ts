/**
 * Long-Term Cashflow Projection Engine
 *
 * Provides 10-30 year financial projections including:
 * - Income growth with inflation and raises
 * - Loan amortization schedules
 * - Social Security estimation (US/MX)
 * - Tax bracket projections
 * - Life events (retirement, college, major purchases)
 */

import { mean, percentile } from '../utils/statistics.util';

/**
 * Life event types that can affect cashflow
 */
export type LifeEventType =
  | 'retirement'
  | 'college'
  | 'home_purchase'
  | 'car_purchase'
  | 'wedding'
  | 'child_birth'
  | 'inheritance'
  | 'business_sale'
  | 'custom';

/**
 * Country for Social Security and tax calculations
 */
export type Country = 'US' | 'MX';

/**
 * Life event configuration
 */
export interface LifeEvent {
  /** Type of life event */
  type: LifeEventType;

  /** Custom name for the event */
  name: string;

  /** Year when event occurs (e.g., 2030) */
  year: number;

  /** One-time cost/income (negative for expense, positive for income) */
  amount: number;

  /** Recurring annual impact after event (e.g., increased expenses after child birth) */
  annualImpact?: number;

  /** Duration of annual impact in years (0 = permanent until end of projection) */
  impactDuration?: number;

  /** Whether to adjust amounts for inflation */
  inflationAdjusted?: boolean;
}

/**
 * Income stream configuration
 */
export interface IncomeStream {
  /** Name of the income source */
  name: string;

  /** Current annual gross income */
  annualAmount: number;

  /** Expected annual growth rate (e.g., 0.03 for 3%) */
  growthRate: number;

  /** Year this income starts (if not already active) */
  startYear?: number;

  /** Year this income ends (e.g., retirement year) */
  endYear?: number;

  /** Whether this is pre-tax income */
  isTaxable: boolean;
}

/**
 * Expense category configuration
 */
export interface ExpenseCategory {
  /** Name of the expense category */
  name: string;

  /** Current annual expense amount */
  annualAmount: number;

  /** Expected annual growth rate (usually matches or exceeds inflation) */
  growthRate: number;

  /** Whether this expense is essential (for risk analysis) */
  isEssential: boolean;

  /** Year this expense starts */
  startYear?: number;

  /** Year this expense ends */
  endYear?: number;
}

/**
 * Loan/debt configuration
 */
export interface LoanConfig {
  /** Name of the loan */
  name: string;

  /** Current outstanding balance */
  balance: number;

  /** Annual interest rate (e.g., 0.045 for 4.5%) */
  interestRate: number;

  /** Monthly payment amount */
  monthlyPayment: number;

  /** Remaining term in months */
  remainingTermMonths: number;

  /** Type of loan for categorization */
  type: 'mortgage' | 'auto' | 'student' | 'personal' | 'credit_card' | 'other';
}

/**
 * Asset growth configuration
 */
export interface AssetConfig {
  /** Name of the asset/account */
  name: string;

  /** Current value */
  currentValue: number;

  /** Expected annual return rate */
  expectedReturn: number;

  /** Monthly contribution (if any) */
  monthlyContribution?: number;

  /** Type of asset for tax treatment */
  type: 'taxable' | 'tax_deferred' | 'tax_free' | 'real_estate' | 'other';

  /** Year contributions end (e.g., retirement) */
  contributionEndYear?: number;

  /** Year withdrawals begin */
  withdrawalStartYear?: number;

  /** Annual withdrawal amount (or percentage with negative value like -0.04 for 4%) */
  annualWithdrawal?: number;
}

/**
 * Social Security configuration
 */
export interface SocialSecurityConfig {
  /** Country for calculation rules */
  country: Country;

  /** Expected monthly benefit at full retirement age (in local currency) */
  monthlyBenefit: number;

  /** Year to start claiming benefits */
  claimYear: number;

  /** For US: whether claiming early, at FRA, or delayed */
  claimAge?: 62 | 65 | 67 | 70;

  /** For spouse benefits */
  spouseMonthlyBenefit?: number;

  /** Spouse claim year */
  spouseClaimYear?: number;
}

/**
 * Tax configuration
 */
export interface TaxConfig {
  /** Country for tax rules */
  country: Country;

  /** Filing status */
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

  /** State/region for state taxes (US) or state for ISR (MX) */
  state?: string;

  /** Effective state tax rate (simplified) */
  stateTaxRate?: number;

  /** Additional deductions or credits to apply annually */
  annualDeductions?: number;
}

/**
 * Complete long-term projection configuration
 */
export interface LongTermProjectionConfig {
  /** Start year for projection (defaults to current year) */
  startYear?: number;

  /** Number of years to project (10-30) */
  projectionYears: number;

  /** Base inflation rate assumption */
  inflationRate: number;

  /** Current age of primary user */
  currentAge: number;

  /** Target retirement age */
  retirementAge: number;

  /** Life expectancy for planning */
  lifeExpectancy: number;

  /** Income streams */
  incomeStreams: IncomeStream[];

  /** Expense categories */
  expenses: ExpenseCategory[];

  /** Active loans/debts */
  loans: LoanConfig[];

  /** Investment assets */
  assets: AssetConfig[];

  /** Life events */
  lifeEvents: LifeEvent[];

  /** Social Security configuration */
  socialSecurity?: SocialSecurityConfig;

  /** Tax configuration */
  taxes?: TaxConfig;

  /** Target emergency fund months of expenses */
  emergencyFundMonths?: number;

  /** Current liquid savings (for emergency fund calculation) */
  currentLiquidSavings?: number;
}

/**
 * Yearly projection snapshot
 */
export interface YearlySnapshot {
  /** Calendar year */
  year: number;

  /** Age of primary user */
  age: number;

  /** Total gross income for the year */
  grossIncome: number;

  /** Total taxes paid */
  taxesPaid: number;

  /** Net income after taxes */
  netIncome: number;

  /** Total expenses */
  totalExpenses: number;

  /** Net cashflow (income - expenses) */
  netCashflow: number;

  /** Total debt remaining */
  totalDebt: number;

  /** Total asset value */
  totalAssets: number;

  /** Net worth (assets - debt) */
  netWorth: number;

  /** Social Security income (if applicable) */
  socialSecurityIncome: number;

  /** Life events that occurred this year */
  lifeEventsThisYear: LifeEvent[];

  /** Breakdown by income source */
  incomeBreakdown: { name: string; amount: number }[];

  /** Breakdown by expense category */
  expenseBreakdown: { name: string; amount: number }[];

  /** Asset breakdown */
  assetBreakdown: { name: string; value: number; type: string }[];

  /** Loan breakdown */
  loanBreakdown: { name: string; balance: number; paymentThisYear: number }[];

  /** Cumulative savings rate */
  savingsRate: number;

  /** Financial independence ratio (passive income / expenses) */
  fiRatio: number;
}

/**
 * What-if scenario definition
 */
export interface WhatIfScenario {
  /** Scenario name */
  name: string;

  /** Description of the scenario */
  description: string;

  /** Modified configuration values */
  modifications: Partial<LongTermProjectionConfig>;
}

/**
 * Complete projection result
 */
export interface LongTermProjectionResult {
  /** Configuration used */
  config: LongTermProjectionConfig;

  /** Year-by-year projections */
  yearlySnapshots: YearlySnapshot[];

  /** Summary statistics */
  summary: {
    /** Year when debt-free (if applicable) */
    debtFreeYear: number | null;

    /** Year when financially independent (passive income >= expenses) */
    financialIndependenceYear: number | null;

    /** Peak net worth and year */
    peakNetWorth: { year: number; amount: number };

    /** Minimum net worth and year */
    minNetWorth: { year: number; amount: number };

    /** Total lifetime earnings */
    totalLifetimeEarnings: number;

    /** Total lifetime taxes */
    totalLifetimeTaxes: number;

    /** Total lifetime Social Security received */
    totalSocialSecurity: number;

    /** Average savings rate */
    averageSavingsRate: number;

    /** Years until retirement */
    yearsUntilRetirement: number;

    /** Projected retirement income (annual) */
    projectedRetirementIncome: number;

    /** Retirement income replacement ratio */
    incomeReplacementRatio: number;

    /** Risk score (0-100, higher = more risk) */
    riskScore: number;
  };

  /** Warnings and recommendations */
  warnings: string[];

  /** Execution time */
  executionTimeMs: number;
}

/**
 * US Federal Tax Brackets 2024 (simplified, would need updates for future years)
 */
const US_TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.1 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const US_TAX_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 0.1 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

/**
 * Mexico ISR Brackets 2024 (simplified)
 */
const MX_ISR_BRACKETS = [
  { min: 0, max: 8952.49, rate: 0.0192 },
  { min: 8952.49, max: 75984.55, rate: 0.064 },
  { min: 75984.55, max: 133536.07, rate: 0.1088 },
  { min: 133536.07, max: 155229.8, rate: 0.16 },
  { min: 155229.8, max: 185852.57, rate: 0.1792 },
  { min: 185852.57, max: 374837.88, rate: 0.2136 },
  { min: 374837.88, max: 590795.99, rate: 0.2352 },
  { min: 590795.99, max: 1127926.84, rate: 0.3 },
  { min: 1127926.84, max: 1503902.46, rate: 0.32 },
  { min: 1503902.46, max: 4511707.37, rate: 0.34 },
  { min: 4511707.37, max: Infinity, rate: 0.35 },
];

/**
 * Calculate progressive tax using brackets
 */
function calculateProgressiveTax(
  income: number,
  brackets: { min: number; max: number; rate: number }[]
): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
  }

  return tax;
}

/**
 * Calculate Social Security benefit adjustment for early/late claiming (US)
 */
function calculateSSAdjustment(claimAge: number, fullRetirementAge: number = 67): number {
  if (claimAge < 62) return 0; // Can't claim before 62
  if (claimAge >= 70) return 1.24; // Maximum delayed credits

  if (claimAge < fullRetirementAge) {
    // Reduction for early claiming
    const monthsEarly = (fullRetirementAge - claimAge) * 12;
    const first36Months = Math.min(monthsEarly, 36);
    const additionalMonths = Math.max(0, monthsEarly - 36);
    const reduction = first36Months * (5 / 900) + additionalMonths * (5 / 1200);
    return 1 - reduction;
  } else {
    // Delayed retirement credits
    const monthsDelayed = (claimAge - fullRetirementAge) * 12;
    const increase = monthsDelayed * (8 / 1200);
    return 1 + increase;
  }
}

/**
 * Calculate loan amortization for a given year
 */
function calculateLoanPayment(
  loan: LoanConfig,
  yearIndex: number
): { balance: number; principalPaid: number; interestPaid: number } {
  const monthlyRate = loan.interestRate / 12;
  let balance = loan.balance;
  let totalPrincipal = 0;
  let totalInterest = 0;

  // Calculate payments for months already passed (yearIndex * 12 to (yearIndex + 1) * 12)
  const startMonth = yearIndex * 12;
  const endMonth = Math.min(startMonth + 12, loan.remainingTermMonths);

  for (let month = startMonth; month < endMonth && balance > 0; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(loan.monthlyPayment - interestPayment, balance);
    balance -= principalPayment;
    totalPrincipal += principalPayment;
    totalInterest += interestPayment;
  }

  return {
    balance: Math.max(0, balance),
    principalPaid: totalPrincipal,
    interestPaid: totalInterest,
  };
}

/**
 * Long-Term Cashflow Projection Engine
 */
export const longTermCashflowEngine = {
  /**
   * Generate a long-term financial projection
   */
  project(config: LongTermProjectionConfig): LongTermProjectionResult {
    const startTime = Date.now();
    const currentYear = config.startYear || new Date().getFullYear();
    const endYear = currentYear + config.projectionYears;
    const retirementYear = currentYear + (config.retirementAge - config.currentAge);

    const yearlySnapshots: YearlySnapshot[] = [];
    const warnings: string[] = [];

    // Initialize tracking variables
    let cumulativeEarnings = 0;
    let cumulativeTaxes = 0;
    let cumulativeSocialSecurity = 0;
    let totalSavings = 0;
    let totalIncome = 0;

    // Initialize assets and loans for tracking
    const assetValues: Map<string, number> = new Map();
    config.assets.forEach((a) => assetValues.set(a.name, a.currentValue));

    const loanBalances: Map<string, number> = new Map();
    config.loans.forEach((l) => loanBalances.set(l.name, l.balance));

    // Track active life event impacts
    const activeImpacts: Map<string, { amount: number; endYear: number | null }>[] = [];

    for (let year = currentYear; year <= endYear; year++) {
      const yearIndex = year - currentYear;
      const age = config.currentAge + yearIndex;
      const isRetired = year >= retirementYear;
      const inflationMultiplier = Math.pow(1 + config.inflationRate, yearIndex);

      // Calculate income
      let grossIncome = 0;
      const incomeBreakdown: { name: string; amount: number }[] = [];

      for (const stream of config.incomeStreams) {
        const streamStart = stream.startYear || currentYear;
        const streamEnd = stream.endYear || (isRetired ? retirementYear : Infinity);

        if (year >= streamStart && year < streamEnd) {
          const yearsGrowth = year - streamStart;
          const amount = stream.annualAmount * Math.pow(1 + stream.growthRate, yearsGrowth);
          grossIncome += amount;
          incomeBreakdown.push({ name: stream.name, amount });
        }
      }

      // Social Security income
      let socialSecurityIncome = 0;
      if (config.socialSecurity && year >= config.socialSecurity.claimYear) {
        const baseMonthly = config.socialSecurity.monthlyBenefit;
        const adjustment =
          config.socialSecurity.country === 'US'
            ? calculateSSAdjustment(config.socialSecurity.claimAge || 67)
            : 1;

        socialSecurityIncome = baseMonthly * 12 * adjustment;

        // Apply COLA (Cost of Living Adjustment) - simplified at inflation rate
        const yearsReceiving = year - config.socialSecurity.claimYear;
        socialSecurityIncome *= Math.pow(1 + config.inflationRate * 0.8, yearsReceiving);

        if (config.socialSecurity.spouseMonthlyBenefit && config.socialSecurity.spouseClaimYear) {
          if (year >= config.socialSecurity.spouseClaimYear) {
            socialSecurityIncome +=
              config.socialSecurity.spouseMonthlyBenefit *
              12 *
              Math.pow(
                1 + config.inflationRate * 0.8,
                year - config.socialSecurity.spouseClaimYear
              );
          }
        }

        grossIncome += socialSecurityIncome;
        incomeBreakdown.push({ name: 'Social Security', amount: socialSecurityIncome });
      }

      cumulativeSocialSecurity += socialSecurityIncome;

      // Calculate taxes
      let taxesPaid = 0;
      if (config.taxes) {
        const taxableIncome = config.incomeStreams
          .filter((s) => s.isTaxable)
          .reduce((sum, s) => {
            const streamStart = s.startYear || currentYear;
            const streamEnd = s.endYear || Infinity;
            if (year >= streamStart && year < streamEnd) {
              const yearsGrowth = year - streamStart;
              return sum + s.annualAmount * Math.pow(1 + s.growthRate, yearsGrowth);
            }
            return sum;
          }, 0);

        // Social Security taxation (simplified - US: up to 85% taxable, MX: exempt)
        const taxableSS = config.taxes.country === 'US' ? socialSecurityIncome * 0.85 : 0;
        const totalTaxableIncome = taxableIncome + taxableSS - (config.taxes.annualDeductions || 0);

        if (config.taxes.country === 'US') {
          const brackets =
            config.taxes.filingStatus === 'married_joint'
              ? US_TAX_BRACKETS_MARRIED
              : US_TAX_BRACKETS_SINGLE;
          taxesPaid = calculateProgressiveTax(Math.max(0, totalTaxableIncome), brackets);

          // State taxes
          if (config.taxes.stateTaxRate) {
            taxesPaid += totalTaxableIncome * config.taxes.stateTaxRate;
          }
        } else {
          // Mexico ISR
          taxesPaid = calculateProgressiveTax(Math.max(0, totalTaxableIncome), MX_ISR_BRACKETS);
        }
      }

      cumulativeTaxes += taxesPaid;
      cumulativeEarnings += grossIncome;
      const netIncome = grossIncome - taxesPaid;

      // Calculate expenses
      let totalExpenses = 0;
      const expenseBreakdown: { name: string; amount: number }[] = [];

      for (const expense of config.expenses) {
        const expStart = expense.startYear || currentYear;
        const expEnd = expense.endYear || Infinity;

        if (year >= expStart && year < expEnd) {
          const yearsGrowth = year - currentYear;
          const amount = expense.annualAmount * Math.pow(1 + expense.growthRate, yearsGrowth);
          totalExpenses += amount;
          expenseBreakdown.push({ name: expense.name, amount });
        }
      }

      // Life events this year
      const lifeEventsThisYear = config.lifeEvents.filter((e) => e.year === year);
      for (const event of lifeEventsThisYear) {
        const eventAmount = event.inflationAdjusted
          ? event.amount * inflationMultiplier
          : event.amount;

        if (eventAmount < 0) {
          totalExpenses += Math.abs(eventAmount);
          expenseBreakdown.push({ name: event.name, amount: Math.abs(eventAmount) });
        } else {
          grossIncome += eventAmount;
          incomeBreakdown.push({ name: event.name, amount: eventAmount });
        }
      }

      // Loan payments
      let totalDebt = 0;
      const loanBreakdown: { name: string; balance: number; paymentThisYear: number }[] = [];

      for (const loan of config.loans) {
        const currentBalance = loanBalances.get(loan.name) || 0;
        if (currentBalance > 0) {
          const payment = calculateLoanPayment({ ...loan, balance: currentBalance }, 0);
          loanBalances.set(loan.name, payment.balance);
          totalDebt += payment.balance;
          totalExpenses += payment.principalPaid + payment.interestPaid;
          loanBreakdown.push({
            name: loan.name,
            balance: payment.balance,
            paymentThisYear: payment.principalPaid + payment.interestPaid,
          });
          expenseBreakdown.push({
            name: `${loan.name} Payment`,
            amount: payment.principalPaid + payment.interestPaid,
          });
        }
      }

      // Calculate assets
      let totalAssets = 0;
      const assetBreakdown: { name: string; value: number; type: string }[] = [];

      for (const asset of config.assets) {
        let currentValue = assetValues.get(asset.name) || asset.currentValue;

        // Apply growth
        currentValue *= 1 + asset.expectedReturn;

        // Add contributions
        if (
          asset.monthlyContribution &&
          (!asset.contributionEndYear || year < asset.contributionEndYear)
        ) {
          currentValue += asset.monthlyContribution * 12;
        }

        // Handle withdrawals
        if (
          asset.withdrawalStartYear &&
          year >= asset.withdrawalStartYear &&
          asset.annualWithdrawal
        ) {
          let withdrawal = asset.annualWithdrawal;
          if (withdrawal < 0) {
            // Percentage-based withdrawal (e.g., -0.04 = 4%)
            withdrawal = currentValue * Math.abs(withdrawal);
          }
          currentValue -= withdrawal;
          grossIncome += withdrawal;
          incomeBreakdown.push({ name: `${asset.name} Withdrawal`, amount: withdrawal });
        }

        assetValues.set(asset.name, Math.max(0, currentValue));
        totalAssets += currentValue;
        assetBreakdown.push({ name: asset.name, value: currentValue, type: asset.type });
      }

      const netCashflow = netIncome - totalExpenses;
      const netWorth = totalAssets - totalDebt;
      const savingsRate = grossIncome > 0 ? netCashflow / grossIncome : 0;

      // Calculate FI ratio (passive income / essential expenses)
      const passiveIncome = assetBreakdown
        .filter((a) => a.type === 'taxable' || a.type === 'tax_deferred')
        .reduce((sum, a) => sum + a.value * 0.04, 0); // Assume 4% withdrawal rate
      const essentialExpenses = config.expenses
        .filter((e) => e.isEssential)
        .reduce((sum, e) => sum + e.annualAmount * Math.pow(1 + e.growthRate, yearIndex), 0);
      const fiRatio =
        essentialExpenses > 0 ? (passiveIncome + socialSecurityIncome) / essentialExpenses : 0;

      totalSavings += Math.max(0, netCashflow);
      totalIncome += grossIncome;

      yearlySnapshots.push({
        year,
        age,
        grossIncome,
        taxesPaid,
        netIncome,
        totalExpenses,
        netCashflow,
        totalDebt,
        totalAssets,
        netWorth,
        socialSecurityIncome,
        lifeEventsThisYear,
        incomeBreakdown,
        expenseBreakdown,
        assetBreakdown,
        loanBreakdown,
        savingsRate,
        fiRatio,
      });
    }

    // Calculate summary statistics
    const netWorths = yearlySnapshots.map((s) => s.netWorth);
    const peakNetWorthIndex = netWorths.indexOf(Math.max(...netWorths));
    const minNetWorthIndex = netWorths.indexOf(Math.min(...netWorths));

    const debtFreeSnapshot = yearlySnapshots.find((s) => s.totalDebt === 0);
    const fiSnapshot = yearlySnapshots.find((s) => s.fiRatio >= 1);

    const retirementSnapshot = yearlySnapshots.find((s) => s.year === retirementYear);
    const preRetirementIncome =
      yearlySnapshots.find((s) => s.year === retirementYear - 1)?.grossIncome || 0;
    const retirementIncome = retirementSnapshot?.grossIncome || 0;

    // Risk score calculation
    let riskScore = 0;
    const lastSnapshot = yearlySnapshots[yearlySnapshots.length - 1];

    // Debt-to-asset ratio
    if (lastSnapshot.totalDebt > 0) {
      const debtRatio = lastSnapshot.totalDebt / (lastSnapshot.totalAssets || 1);
      riskScore += Math.min(30, debtRatio * 50);
    }

    // Low savings rate
    const avgSavingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;
    if (avgSavingsRate < 0.1) riskScore += 20;
    else if (avgSavingsRate < 0.2) riskScore += 10;

    // Low income replacement in retirement
    const incomeReplacement = preRetirementIncome > 0 ? retirementIncome / preRetirementIncome : 0;
    if (incomeReplacement < 0.5) riskScore += 25;
    else if (incomeReplacement < 0.7) riskScore += 15;
    else if (incomeReplacement < 0.8) riskScore += 5;

    // No Social Security
    if (!config.socialSecurity) riskScore += 10;

    // Negative cashflow in retirement
    const retirementSnapshots = yearlySnapshots.filter((s) => s.year >= retirementYear);
    const negativeRetirementYears = retirementSnapshots.filter((s) => s.netCashflow < 0).length;
    riskScore += Math.min(15, negativeRetirementYears * 3);

    // Generate warnings
    if (avgSavingsRate < 0.1) {
      warnings.push(
        'Low savings rate detected. Consider reducing discretionary expenses or increasing income.'
      );
    }

    if (incomeReplacement < 0.7) {
      warnings.push(
        'Retirement income may be insufficient to maintain current lifestyle. Consider increasing retirement contributions.'
      );
    }

    if (negativeRetirementYears > 3) {
      warnings.push(
        `${negativeRetirementYears} years of negative cashflow projected in retirement. Review spending assumptions.`
      );
    }

    if (!config.socialSecurity) {
      warnings.push(
        'No Social Security configured. Add expected benefits for more accurate projections.'
      );
    }

    const minNetWorthSnapshot = yearlySnapshots[minNetWorthIndex];
    if (minNetWorthSnapshot.netWorth < 0) {
      warnings.push(
        `Negative net worth projected in ${minNetWorthSnapshot.year}. Consider debt reduction strategies.`
      );
    }

    return {
      config,
      yearlySnapshots,
      summary: {
        debtFreeYear: debtFreeSnapshot?.year || null,
        financialIndependenceYear: fiSnapshot?.year || null,
        peakNetWorth: {
          year: yearlySnapshots[peakNetWorthIndex].year,
          amount: netWorths[peakNetWorthIndex],
        },
        minNetWorth: {
          year: minNetWorthSnapshot.year,
          amount: netWorths[minNetWorthIndex],
        },
        totalLifetimeEarnings: cumulativeEarnings,
        totalLifetimeTaxes: cumulativeTaxes,
        totalSocialSecurity: cumulativeSocialSecurity,
        averageSavingsRate: avgSavingsRate,
        yearsUntilRetirement: config.retirementAge - config.currentAge,
        projectedRetirementIncome: retirementIncome,
        incomeReplacementRatio: incomeReplacement,
        riskScore: Math.min(100, Math.round(riskScore)),
      },
      warnings,
      executionTimeMs: Date.now() - startTime,
    };
  },

  /**
   * Run a what-if scenario comparison
   */
  compareScenarios(
    baseConfig: LongTermProjectionConfig,
    scenarios: WhatIfScenario[]
  ): {
    baseline: LongTermProjectionResult;
    scenarios: { scenario: WhatIfScenario; result: LongTermProjectionResult }[];
  } {
    const baseline = this.project(baseConfig);

    const scenarioResults = scenarios.map((scenario) => {
      const modifiedConfig = {
        ...baseConfig,
        ...scenario.modifications,
        incomeStreams: scenario.modifications.incomeStreams || baseConfig.incomeStreams,
        expenses: scenario.modifications.expenses || baseConfig.expenses,
        loans: scenario.modifications.loans || baseConfig.loans,
        assets: scenario.modifications.assets || baseConfig.assets,
        lifeEvents: scenario.modifications.lifeEvents || baseConfig.lifeEvents,
      };

      return {
        scenario,
        result: this.project(modifiedConfig),
      };
    });

    return {
      baseline,
      scenarios: scenarioResults,
    };
  },
};

export default longTermCashflowEngine;
