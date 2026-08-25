// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Types and interfaces for Monte Carlo simulations
 */

export interface MonteCarloConfig {
  // Initial portfolio value
  initialBalance: number;

  // Monthly contribution (can be 0)
  monthlyContribution: number;

  // Number of months to simulate
  months: number;

  // Number of simulation iterations
  iterations: number;

  // Expected annual return (e.g., 0.07 for 7%)
  expectedReturn: number;

  // Annual volatility/standard deviation (e.g., 0.15 for 15%)
  volatility: number;

  // Annual inflation rate (default: 0.03 for 3%)
  inflationRate?: number;

  // Risk-free rate for Sharpe ratio (default: 0.02 for 2%)
  riskFreeRate?: number;
}

export interface SimulationResult {
  // Final values from all iterations
  finalValues: number[];

  // Statistical summary
  median: number;
  mean: number;
  stdDev: number;

  // Percentiles (confidence intervals)
  p10: number; // 10th percentile (worst 10%)
  p25: number; // 25th percentile
  p75: number; // 75th percentile
  p90: number; // 90th percentile

  // Min and max outcomes
  min: number;
  max: number;

  // Probability of success (if targetAmount provided)
  successRate?: number;
  targetAmount?: number;

  // Time series data for visualization (monthly snapshots)
  timeSeries: MonthlySnapshot[];

  // Metadata
  config: MonteCarloConfig;
  computedAt: Date;
}

export interface MonthlySnapshot {
  month: number;
  median: number;
  p10: number;
  p90: number;
  mean: number;
}

export interface RetirementSimulationConfig extends MonteCarloConfig {
  // Age-based parameters
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;

  // Retirement phase parameters
  monthlyExpenses?: number; // Expected monthly expenses in retirement
  socialSecurityIncome?: number; // Monthly social security/pension income
  inflationAdjusted?: boolean; // Adjust expenses for inflation
}

export interface RetirementSimulationResult extends SimulationResult {
  // Retirement-specific metrics
  probabilityOfNotRunningOut: number; // Probability of money lasting until life expectancy
  medianRetirementBalance: number; // Median balance at retirement age
  medianFinalBalance: number; // Median balance at life expectancy
  yearsOfSustainability: number; // Median years money will last
  safeWithdrawalRate: number; // Safe withdrawal rate (4% rule adjusted)
}

export interface ScenarioConfig {
  name: string;
  description: string;

  // Market shock events
  shocks?: MarketShock[];

  // Modified return/volatility
  returnAdjustment?: number; // e.g., -0.02 for 2% lower returns
  volatilityMultiplier?: number; // e.g., 1.5 for 50% higher volatility
}

export interface MarketShock {
  type: 'crash' | 'recession' | 'boom' | 'correction';
  magnitude: number; // e.g., -0.30 for 30% decline
  startMonth: number; // Month when shock occurs
  durationMonths: number; // How long the shock lasts
  recoveryMonths: number; // Months to recover to normal
}

export interface ScenarioComparisonResult {
  baseline: SimulationResult;
  scenario: SimulationResult;
  comparison: {
    medianDifference: number;
    medianDifferencePercent: number;
    successRateDifference: number;
    worstCaseDifference: number;
  };
}

export interface GoalProbabilityConfig {
  goalId: string;
  currentValue: number;
  targetAmount: number;
  monthsRemaining: number;
  monthlyContribution: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
}

export interface GoalProbabilityResult {
  goalId: string;
  targetAmount: number;
  probabilityOfSuccess: number;
  medianOutcome: number;
  expectedShortfall: number; // Expected amount short of goal
  confidence90Range: {
    low: number;
    high: number;
  };
  recommendedMonthlyContribution: number; // To achieve 90% success rate
}
