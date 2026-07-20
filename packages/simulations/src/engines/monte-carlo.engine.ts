/**
 * Monte Carlo Simulation Engine
 *
 * Provides stochastic modeling for retirement planning, goal probability,
 * and wealth projection scenarios using Monte Carlo methods.
 */

import {
  mean,
  percentile,
  normalRandom,
  futureValue,
  futureValueOfAnnuity,
  confidenceInterval,
  summarize,
  type SummaryStatistics,
} from '../utils/statistics.util';

/**
 * Configuration for a Monte Carlo simulation
 */
export interface SimulationConfig {
  /** Initial portfolio balance */
  initialBalance: number;

  /** Monthly contribution amount (can be negative for withdrawals) */
  monthlyContribution: number;

  /** Number of years to simulate */
  years: number;

  /** Number of simulation iterations (e.g., 10,000) */
  iterations: number;

  /** Expected annual return (e.g., 0.07 for 7%) */
  expectedReturn: number;

  /** Annual return volatility/standard deviation (e.g., 0.15 for 15%) */
  returnVolatility: number;

  /** Annual inflation rate (e.g., 0.03 for 3%) */
  inflationRate?: number;

  /** Whether to adjust contributions for inflation */
  inflationAdjustedContributions?: boolean;
}

/**
 * Result of a Monte Carlo simulation
 */
export interface SimulationResult {
  /** Configuration used for the simulation */
  config: SimulationConfig;

  /** Final balance statistics across all iterations */
  finalBalance: {
    median: number;
    mean: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
    min: number;
    max: number;
  };

  /** Year-by-year projection with confidence bands */
  yearlyProjections: YearlyProjection[];

  /** Probability of reaching specific milestones */
  probabilities: {
    /** Probability of not running out of money */
    successRate: number;

    /** Probability of doubling initial balance */
    doublingProbability: number;

    /** Probability of maintaining purchasing power (inflation-adjusted) */
    maintainingPurchasingPower: number;
  };

  /** Raw outcomes from all iterations (for advanced analysis) */
  allOutcomes: number[];

  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Yearly projection with confidence intervals
 */
export interface YearlyProjection {
  year: number;
  median: number;
  mean: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  confidenceInterval95: [number, number];
}

/**
 * Configuration for retirement-specific simulations
 */
export interface RetirementSimulationConfig {
  /** Current age */
  currentAge: number;

  /** Age at retirement */
  retirementAge: number;

  /** Age of life expectancy */
  lifeExpectancy: number;

  /** Current savings */
  currentSavings: number;

  /** Monthly contribution until retirement */
  monthlyContribution: number;

  /** Monthly withdrawal after retirement */
  monthlyWithdrawal: number;

  /** Expected annual return before retirement */
  preRetirementReturn: number;

  /** Expected annual return after retirement (typically more conservative) */
  postRetirementReturn: number;

  /** Return volatility */
  returnVolatility: number;

  /** Number of simulation iterations */
  iterations?: number;

  /** Inflation rate */
  inflationRate?: number;
}

/**
 * Result of retirement simulation
 */
export interface RetirementSimulationResult {
  /** Probability of not running out of money before life expectancy */
  successProbability: number;

  /** Balance at retirement (statistics) */
  balanceAtRetirement: SummaryStatistics;

  /** Balance at life expectancy (statistics) */
  balanceAtLifeExpectancy: SummaryStatistics;

  /** Year-by-year projections */
  yearlyProjections: YearlyProjection[];

  /** Years until money runs out (for failed scenarios) */
  medianYearsUntilDepletion: number | null;

  /** Probability of success by age */
  successByAge: Array<{ age: number; successRate: number }>;
}

/**
 * Monte Carlo Simulation Engine
 */
export class MonteCarloEngine {
  /**
   * Run a Monte Carlo simulation with the given configuration
   */
  simulate(config: SimulationConfig): SimulationResult {
    const startTime = Date.now();

    // Validate configuration
    this.validateConfig(config);

    // Run all iterations
    const allOutcomes: number[] = [];
    const yearlyBalances: number[][] = Array.from({ length: config.years + 1 }, () => []);

    for (let i = 0; i < config.iterations; i++) {
      const { finalBalance, yearlyBalance } = this.runSingleIteration(config);
      allOutcomes.push(finalBalance);

      // Store yearly balances for projection analysis
      yearlyBalance.forEach((balance, year) => {
        yearlyBalances[year].push(balance);
      });
    }

    // Calculate statistics
    const finalStats = summarize(allOutcomes);

    // Calculate yearly projections
    const yearlyProjections: YearlyProjection[] = yearlyBalances.map((balances, year) => {
      const stats = summarize(balances);
      const ci = confidenceInterval(balances, 0.95);

      return {
        year,
        median: stats.median,
        mean: stats.mean,
        p10: stats.p10,
        p25: stats.p25,
        p75: stats.p75,
        p90: stats.p90,
        confidenceInterval95: ci,
      };
    });

    // Calculate probabilities
    const successRate = allOutcomes.filter((balance) => balance > 0).length / config.iterations;

    const doublingProbability =
      allOutcomes.filter((balance) => balance >= config.initialBalance * 2).length /
      config.iterations;

    const inflationRate = config.inflationRate || 0;
    const inflationAdjustedInitial =
      config.initialBalance * Math.pow(1 + inflationRate, config.years);
    const maintainingPurchasingPower =
      allOutcomes.filter((balance) => balance >= inflationAdjustedInitial).length /
      config.iterations;

    const executionTimeMs = Date.now() - startTime;

    return {
      config,
      finalBalance: {
        median: finalStats.median,
        mean: finalStats.mean,
        p10: finalStats.p10,
        p25: finalStats.p25,
        p75: finalStats.p75,
        p90: finalStats.p90,
        min: finalStats.min,
        max: finalStats.max,
      },
      yearlyProjections,
      probabilities: {
        successRate,
        doublingProbability,
        maintainingPurchasingPower,
      },
      allOutcomes,
      executionTimeMs,
    };
  }

  /**
   * Run a single Monte Carlo iteration
   */
  private runSingleIteration(config: SimulationConfig): {
    finalBalance: number;
    yearlyBalance: number[];
  } {
    let balance = config.initialBalance;
    const yearlyBalance: number[] = [balance];

    const monthlyReturn = config.expectedReturn / 12;
    const monthlyVolatility = config.returnVolatility / Math.sqrt(12);

    let monthlyContribution = config.monthlyContribution;

    for (let year = 1; year <= config.years; year++) {
      // Adjust contribution for inflation if enabled
      if (config.inflationAdjustedContributions && config.inflationRate) {
        monthlyContribution = config.monthlyContribution * Math.pow(1 + config.inflationRate, year);
      }

      for (let month = 1; month <= 12; month++) {
        // Add contribution
        balance += monthlyContribution;

        // Apply stochastic return
        const monthlyReturnSample = normalRandom(monthlyReturn, monthlyVolatility);
        balance *= 1 + monthlyReturnSample;

        // Ensure balance doesn't go negative (in real scenarios, you can't have negative portfolio)
        if (balance < 0) {
          balance = 0;
        }
      }

      yearlyBalance.push(balance);
    }

    return {
      finalBalance: balance,
      yearlyBalance,
    };
  }

  /**
   * Simulate retirement scenario with pre and post-retirement phases
   */
  simulateRetirement(config: RetirementSimulationConfig): RetirementSimulationResult {
    const iterations = config.iterations || 10000;
    const yearsUntilRetirement = config.retirementAge - config.currentAge;
    const yearsInRetirement = config.lifeExpectancy - config.retirementAge;

    // Phase 1: Accumulation (until retirement)
    const accumulationConfig: SimulationConfig = {
      initialBalance: config.currentSavings,
      monthlyContribution: config.monthlyContribution,
      years: yearsUntilRetirement,
      iterations,
      expectedReturn: config.preRetirementReturn,
      returnVolatility: config.returnVolatility,
      inflationRate: config.inflationRate,
      inflationAdjustedContributions: true,
    };

    const accumulationResult = this.simulate(accumulationConfig);
    const balanceAtRetirementOutcomes = accumulationResult.allOutcomes;

    // Phase 2: Distribution (retirement)
    const distributionOutcomes: number[] = [];
    const yearlyBalances: number[][] = Array.from(
      { length: yearsUntilRetirement + yearsInRetirement + 1 },
      () => []
    );
    const successByAge: Array<{ age: number; successRate: number }> = [];
    let yearsUntilDepletionSum = 0;
    let depletionCount = 0;

    // Run distribution phase for each accumulation outcome
    for (let i = 0; i < iterations; i++) {
      const startingBalance = balanceAtRetirementOutcomes[i];

      const distributionConfig: SimulationConfig = {
        initialBalance: startingBalance,
        monthlyContribution: -config.monthlyWithdrawal, // Negative for withdrawals
        years: yearsInRetirement,
        iterations: 1, // Just one path per accumulation outcome
        expectedReturn: config.postRetirementReturn,
        returnVolatility: config.returnVolatility,
        inflationRate: config.inflationRate,
        inflationAdjustedContributions: true, // Adjust withdrawals for inflation
      };

      const { finalBalance, yearlyBalance } = this.runSingleIteration(distributionConfig);
      distributionOutcomes.push(finalBalance);

      // Track when money runs out
      const depletionYear = yearlyBalance.findIndex((balance) => balance <= 0);
      if (depletionYear !== -1) {
        yearsUntilDepletionSum += depletionYear;
        depletionCount++;
      }

      // Combine accumulation and distribution yearly balances
      const combinedYearly = [
        ...accumulationResult.yearlyProjections
          .slice(0, yearsUntilRetirement + 1)
          .map((_, idx) => accumulationResult.allOutcomes[i] * (idx / yearsUntilRetirement)),
        ...yearlyBalance.slice(1), // Skip first year (duplicate of retirement year)
      ];

      combinedYearly.forEach((balance, yearIdx) => {
        if (yearlyBalances[yearIdx]) {
          yearlyBalances[yearIdx].push(balance);
        }
      });
    }

    // Calculate success probability (not running out of money)
    const successProbability =
      distributionOutcomes.filter((balance) => balance > 0).length / iterations;

    // Calculate yearly projections
    const yearlyProjections: YearlyProjection[] = yearlyBalances.map((balances, year) => {
      if (balances.length === 0) {
        return {
          year,
          median: 0,
          mean: 0,
          p10: 0,
          p25: 0,
          p75: 0,
          p90: 0,
          confidenceInterval95: [0, 0] as [number, number],
        };
      }

      const stats = summarize(balances);
      const ci = confidenceInterval(balances, 0.95);

      return {
        year,
        median: stats.median,
        mean: stats.mean,
        p10: stats.p10,
        p25: stats.p25,
        p75: stats.p75,
        p90: stats.p90,
        confidenceInterval95: ci,
      };
    });

    // Calculate success rate by age
    for (let age = config.currentAge; age <= config.lifeExpectancy; age++) {
      const yearIndex = age - config.currentAge;
      if (yearlyBalances[yearIndex] && yearlyBalances[yearIndex].length > 0) {
        const successAtAge =
          yearlyBalances[yearIndex].filter((balance) => balance > 0).length / iterations;
        successByAge.push({ age, successRate: successAtAge });
      }
    }

    return {
      successProbability,
      balanceAtRetirement: summarize(balanceAtRetirementOutcomes),
      balanceAtLifeExpectancy: summarize(distributionOutcomes),
      yearlyProjections,
      medianYearsUntilDepletion:
        depletionCount > 0 ? yearsUntilDepletionSum / depletionCount : null,
      successByAge,
    };
  }

  /**
   * Calculate safe withdrawal rate using the 4% rule simulation
   */
  calculateSafeWithdrawalRate(params: {
    portfolioValue: number;
    yearsInRetirement: number;
    successProbability: number;
    expectedReturn: number;
    returnVolatility: number;
    inflationRate?: number;
    iterations?: number;
    maxAttempts?: number;
  }): number {
    const targetSuccess = params.successProbability;

    // Binary search for the withdrawal rate
    let low = 0.01; // 1%
    let high = 0.1; // 10%
    let bestRate = 0.04; // Default to 4% rule

    const iterations = params.iterations ?? 10000;
    const maxAttempts = params.maxAttempts ?? 20;
    const tolerance = 0.001; // 0.1% tolerance

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const testRate = (low + high) / 2;
      const monthlyWithdrawal = (params.portfolioValue * testRate) / 12;

      const config: SimulationConfig = {
        initialBalance: params.portfolioValue,
        monthlyContribution: -monthlyWithdrawal,
        years: params.yearsInRetirement,
        iterations,
        expectedReturn: params.expectedReturn,
        returnVolatility: params.returnVolatility,
        inflationRate: params.inflationRate,
        inflationAdjustedContributions: true,
      };

      const result = this.simulate(config);
      const successRate = result.probabilities.successRate;

      if (Math.abs(successRate - targetSuccess) < tolerance) {
        bestRate = testRate;
        break;
      }

      if (successRate < targetSuccess) {
        // Withdrawal rate too high, decrease
        high = testRate;
      } else {
        // Withdrawal rate too low, increase
        low = testRate;
        bestRate = testRate; // Keep track of safe rate
      }
    }

    return bestRate;
  }

  /**
   * Validate simulation configuration
   */
  private validateConfig(config: SimulationConfig): void {
    if (config.iterations < 100) {
      throw new Error('Iterations must be at least 100 for meaningful results');
    }

    if (config.iterations > 100000) {
      throw new Error('Iterations cannot exceed 100,000 (performance limit)');
    }

    if (config.years < 1) {
      throw new Error('Years must be at least 1');
    }

    if (config.years > 100) {
      throw new Error('Years cannot exceed 100');
    }

    if (config.returnVolatility < 0) {
      throw new Error('Return volatility cannot be negative');
    }

    if (config.returnVolatility > 1) {
      throw new Error('Return volatility cannot exceed 100%');
    }
  }
}

/**
 * Default instance for convenience
 */
export const monteCarloEngine = new MonteCarloEngine();
