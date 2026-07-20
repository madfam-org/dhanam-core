// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import {
  MonteCarloConfig,
  SimulationResult,
  MonthlySnapshot,
  MarketShock,
  ScenarioConfig,
} from '../types/simulation.types';
import { StatisticsUtil } from '../utils/statistics.util';

/**
 * Monte Carlo Simulation Engine
 *
 * Performs stochastic simulations of portfolio growth using Monte Carlo methods.
 * Uses geometric Brownian motion (GBM) for modeling asset returns.
 *
 * ## Mathematical Model
 * Portfolio value follows: `dS = μSdt + σSdW`
 * Where:
 * - `μ` = expected annual return (drift)
 * - `σ` = annual volatility (standard deviation)
 * - `dW` = Wiener process (random walk)
 *
 * Monthly discretization: `S(t+1) = S(t) * (1 + r) + C`
 * Where: `r = μ_monthly + σ_monthly * Z`, `Z ~ N(0,1)`
 *
 * ## Features
 * - Configurable iterations (default: 10,000)
 * - Monthly contribution modeling
 * - Market shock scenarios (bear markets, recessions, crashes)
 * - Success probability calculations
 * - Required contribution finder via binary search
 *
 * ## Predefined Scenarios
 * - BEAR_MARKET: 30% decline over 6 months
 * - GREAT_RECESSION: 50% decline (2008-style)
 * - DOT_COM_BUST: 45% decline (2000-style)
 * - COVID_SHOCK: 35% crash with V-shaped recovery
 * - And more...
 *
 * @example
 * ```typescript
 * // Run basic simulation
 * const result = await engine.simulate({
 *   initialBalance: 100000,
 *   monthlyContribution: 1000,
 *   expectedReturn: 0.07,  // 7% annual
 *   volatility: 0.15,       // 15% annual
 *   months: 240,            // 20 years
 *   iterations: 10000
 * });
 *
 * console.log(`Median: $${result.median.toLocaleString()}`);
 * console.log(`P10-P90: $${result.p10.toLocaleString()} - $${result.p90.toLocaleString()}`);
 *
 * // Calculate probability of reaching $1M
 * const successRate = engine.calculateSuccessRate(result.finalValues, 1000000);
 * console.log(`${(successRate * 100).toFixed(1)}% chance of reaching $1M`);
 * ```
 *
 * @see SimulationsService - High-level simulation orchestration
 * @see StatisticsUtil - Statistical helper functions
 */
@Injectable()
export class MonteCarloEngine {
  private readonly logger = new Logger(MonteCarloEngine.name);

  /**
   * Run Monte Carlo simulation
   *
   * Executes multiple iterations of portfolio growth using geometric Brownian motion.
   * Returns comprehensive statistics including percentiles and time series.
   *
   * @param config - Simulation configuration
   * @param config.initialBalance - Starting portfolio value
   * @param config.monthlyContribution - Monthly contribution amount
   * @param config.expectedReturn - Expected annual return (e.g., 0.07 for 7%)
   * @param config.volatility - Annual volatility (e.g., 0.15 for 15%)
   * @param config.months - Simulation duration in months
   * @param config.iterations - Number of Monte Carlo iterations
   * @returns Simulation results with statistics and time series
   *
   * @throws Error if configuration is invalid (negative balance, non-positive months, etc.)
   */
  simulate(config: MonteCarloConfig): SimulationResult {
    this.logger.log(
      `Starting Monte Carlo simulation: ${config.iterations} iterations, ${config.months} months`
    );

    const startTime = Date.now();

    // Validate configuration
    this.validateConfig(config);

    // Convert annual parameters to monthly
    const monthlyReturn = StatisticsUtil.monthlyReturn(config.expectedReturn);
    const monthlyVolatility = StatisticsUtil.monthlyVolatility(config.volatility);

    // Run all iterations
    const finalValues: number[] = [];
    const allTimeSeries: number[][] = Array(config.months + 1)
      .fill(null)
      .map(() => []);

    for (let iteration = 0; iteration < config.iterations; iteration++) {
      const result = this.runSingleIteration(config, monthlyReturn, monthlyVolatility);

      finalValues.push(result.finalValue);

      // Store time series data
      result.monthlyValues.forEach((value, monthIndex) => {
        allTimeSeries[monthIndex].push(value);
      });
    }

    // Calculate time series statistics
    const timeSeries: MonthlySnapshot[] = allTimeSeries.map((values, month) => ({
      month,
      median: StatisticsUtil.median(values),
      mean: StatisticsUtil.mean(values),
      p10: StatisticsUtil.percentile(values, 0.1),
      p90: StatisticsUtil.percentile(values, 0.9),
    }));

    // Calculate summary statistics
    const summary = StatisticsUtil.summary(finalValues);

    const result: SimulationResult = {
      finalValues,
      median: summary.median,
      mean: summary.mean,
      stdDev: summary.stdDev,
      p10: summary.p10,
      p25: summary.p25,
      p75: summary.p75,
      p90: summary.p90,
      min: summary.min,
      max: summary.max,
      timeSeries,
      config,
      computedAt: new Date(),
    };

    const duration = Date.now() - startTime;
    this.logger.log(`Simulation completed in ${duration}ms`);

    return result;
  }

  /**
   * Run single iteration of the simulation
   */
  private runSingleIteration(
    config: MonteCarloConfig,
    monthlyReturn: number,
    monthlyVolatility: number,
    shocks?: MarketShock[]
  ): { finalValue: number; monthlyValues: number[] } {
    let balance = config.initialBalance;
    const monthlyValues: number[] = [balance];

    for (let month = 1; month <= config.months; month++) {
      // Apply market shock if applicable
      const shockReturn = this.getShockReturn(month, shocks);

      // Generate random return using geometric Brownian motion
      // r = μ + σ * Z, where Z ~ N(0,1)
      const randomReturn = monthlyReturn + monthlyVolatility * StatisticsUtil.randomNormal(0, 1);

      // Apply shock if present
      const totalReturn = shockReturn !== null ? shockReturn : randomReturn;

      // Update balance: balance = balance * (1 + return) + contribution
      balance = balance * (1 + totalReturn) + config.monthlyContribution;

      // Ensure balance doesn't go negative
      balance = Math.max(0, balance);

      monthlyValues.push(balance);
    }

    return {
      finalValue: balance,
      monthlyValues,
    };
  }

  /**
   * Run simulation with market shocks (scenario analysis)
   *
   * Simulates portfolio growth with predefined market events (crashes, recessions, booms).
   * Shocks override the random return for affected months.
   *
   * @param config - Base simulation configuration
   * @param shocks - Array of market shock events to apply
   * @returns Simulation results incorporating shock events
   *
   * @example
   * ```typescript
   * // Simulate with 2008-style recession
   * const result = engine.simulateWithShocks(config, MonteCarloEngine.SCENARIOS.GREAT_RECESSION.shocks);
   * ```
   */
  simulateWithShocks(config: MonteCarloConfig, shocks: MarketShock[]): SimulationResult {
    this.logger.log(`Running scenario simulation with ${shocks.length} market shocks`);

    const monthlyReturn = StatisticsUtil.monthlyReturn(config.expectedReturn);
    const monthlyVolatility = StatisticsUtil.monthlyVolatility(config.volatility);

    const finalValues: number[] = [];
    const allTimeSeries: number[][] = Array(config.months + 1)
      .fill(null)
      .map(() => []);

    for (let iteration = 0; iteration < config.iterations; iteration++) {
      const result = this.runSingleIteration(config, monthlyReturn, monthlyVolatility, shocks);

      finalValues.push(result.finalValue);

      result.monthlyValues.forEach((value, monthIndex) => {
        allTimeSeries[monthIndex].push(value);
      });
    }

    const timeSeries: MonthlySnapshot[] = allTimeSeries.map((values, month) => ({
      month,
      median: StatisticsUtil.median(values),
      mean: StatisticsUtil.mean(values),
      p10: StatisticsUtil.percentile(values, 0.1),
      p90: StatisticsUtil.percentile(values, 0.9),
    }));

    const summary = StatisticsUtil.summary(finalValues);

    return {
      finalValues,
      median: summary.median,
      mean: summary.mean,
      stdDev: summary.stdDev,
      p10: summary.p10,
      p25: summary.p25,
      p75: summary.p75,
      p90: summary.p90,
      min: summary.min,
      max: summary.max,
      timeSeries,
      config,
      computedAt: new Date(),
    };
  }

  /**
   * Calculate probability of reaching a target amount
   *
   * @param finalValues - Array of final portfolio values from simulation
   * @param targetAmount - Target amount to reach
   * @returns Probability (0-1) of reaching target amount
   *
   * @example
   * ```typescript
   * const successRate = engine.calculateSuccessRate(result.finalValues, 1000000);
   * console.log(`${(successRate * 100).toFixed(1)}% chance of reaching $1M`);
   * ```
   */
  calculateSuccessRate(finalValues: number[], targetAmount: number): number {
    const successfulIterations = finalValues.filter((value) => value >= targetAmount).length;
    return successfulIterations / finalValues.length;
  }

  /**
   * Calculate expected shortfall (Conditional Value at Risk)
   *
   * Returns the average amount by which the portfolio falls short of the target
   * in scenarios where the target is not met. Useful for risk assessment.
   *
   * @param finalValues - Array of final portfolio values from simulation
   * @param targetAmount - Target amount
   * @returns Average shortfall amount (0 if target always met)
   *
   * @example
   * ```typescript
   * const shortfall = engine.calculateExpectedShortfall(result.finalValues, 1000000);
   * console.log(`In failure scenarios, average shortfall is $${shortfall.toLocaleString()}`);
   * ```
   */
  calculateExpectedShortfall(finalValues: number[], targetAmount: number): number {
    const shortfalls = finalValues
      .filter((value) => value < targetAmount)
      .map((value) => targetAmount - value);

    if (shortfalls.length === 0) return 0;

    return StatisticsUtil.mean(shortfalls);
  }

  /**
   * Find required monthly contribution for desired success rate
   *
   * Uses binary search to find the minimum monthly contribution needed
   * to achieve a target amount with the specified probability.
   *
   * @param config - Simulation config (without monthlyContribution)
   * @param targetAmount - Target portfolio value to reach
   * @param desiredSuccessRate - Desired probability (e.g., 0.90 for 90%)
   * @param tolerance - Acceptable deviation from desired success rate (default: 0.01)
   * @returns Required monthly contribution amount
   *
   * @example
   * ```typescript
   * // Find contribution needed for 90% chance of reaching $1M
   * const contribution = engine.findRequiredContribution(
   *   { initialBalance: 50000, expectedReturn: 0.07, volatility: 0.15, months: 240, iterations: 5000 },
   *   1000000,
   *   0.90
   * );
   * console.log(`Need $${contribution.toFixed(0)}/month for 90% success rate`);
   * ```
   */
  findRequiredContribution(
    config: Omit<MonteCarloConfig, 'monthlyContribution'>,
    targetAmount: number,
    desiredSuccessRate: number,
    tolerance: number = 0.01
  ): number {
    this.logger.log(`Finding required contribution for ${desiredSuccessRate * 100}% success rate`);

    let low = 0;
    let high = targetAmount / config.months; // Upper bound estimate
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations && high - low > 10) {
      const mid = (low + high) / 2;

      const result = this.simulate({
        ...config,
        monthlyContribution: mid,
        iterations: 1000, // Use fewer iterations for speed
      });

      const successRate = this.calculateSuccessRate(result.finalValues, targetAmount);

      if (Math.abs(successRate - desiredSuccessRate) < tolerance) {
        return mid;
      }

      if (successRate < desiredSuccessRate) {
        low = mid;
      } else {
        high = mid;
      }

      iterations++;
    }

    return (low + high) / 2;
  }

  /**
   * Get market shock return for a given month
   */
  private getShockReturn(month: number, shocks?: MarketShock[]): number | null {
    if (!shocks || shocks.length === 0) return null;

    for (const shock of shocks) {
      const shockEnd = shock.startMonth + shock.durationMonths;
      const recoveryEnd = shockEnd + shock.recoveryMonths;

      // During shock period
      if (month >= shock.startMonth && month < shockEnd) {
        // Distribute shock evenly over duration
        return shock.magnitude / shock.durationMonths;
      }

      // During recovery period
      if (month >= shockEnd && month < recoveryEnd) {
        // Gradual recovery (linear interpolation back to 0)
        const recoveryProgress = (month - shockEnd) / shock.recoveryMonths;
        const recoveryReturn = -shock.magnitude / shock.recoveryMonths;
        return recoveryReturn * (1 - recoveryProgress);
      }
    }

    return null;
  }

  /**
   * Validate simulation configuration
   */
  private validateConfig(config: MonteCarloConfig): void {
    if (config.initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }

    if (config.months <= 0) {
      throw new Error('Months must be positive');
    }

    if (config.iterations <= 0) {
      throw new Error('Iterations must be positive');
    }

    if (config.volatility < 0) {
      throw new Error('Volatility cannot be negative');
    }

    if (config.iterations > 50000) {
      this.logger.warn(
        `High iteration count (${config.iterations}). Consider reducing for performance.`
      );
    }
  }

  /**
   * Apply scenario modifications to base config
   */
  applyScenario(baseConfig: MonteCarloConfig, scenario: ScenarioConfig): MonteCarloConfig {
    const modifiedConfig = { ...baseConfig };

    if (scenario.returnAdjustment) {
      modifiedConfig.expectedReturn += scenario.returnAdjustment;
    }

    if (scenario.volatilityMultiplier) {
      modifiedConfig.volatility *= scenario.volatilityMultiplier;
    }

    return modifiedConfig;
  }

  /**
   * Predefined market scenarios
   */
  static readonly SCENARIOS = {
    BEAR_MARKET: {
      name: 'Bear Market',
      description: '30% decline over 6 months with 12 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.3,
          startMonth: 12,
          durationMonths: 6,
          recoveryMonths: 12,
        },
      ],
    },
    GREAT_RECESSION: {
      name: 'Great Recession (2008-style)',
      description: '50% decline over 12 months with 24 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.5,
          startMonth: 24,
          durationMonths: 12,
          recoveryMonths: 24,
        },
      ],
    },
    DOT_COM_BUST: {
      name: 'Dot-com Bust (2000-style)',
      description: '45% decline over 18 months with 36 month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.45,
          startMonth: 6,
          durationMonths: 18,
          recoveryMonths: 36,
        },
      ],
    },
    MILD_RECESSION: {
      name: 'Mild Recession',
      description: '15% decline over 3 months with 6 month recovery',
      shocks: [
        {
          type: 'recession' as const,
          magnitude: -0.15,
          startMonth: 18,
          durationMonths: 3,
          recoveryMonths: 6,
        },
      ],
    },
    MARKET_CORRECTION: {
      name: 'Market Correction',
      description: '10% decline over 1 month with 3 month recovery',
      shocks: [
        {
          type: 'correction' as const,
          magnitude: -0.1,
          startMonth: 36,
          durationMonths: 1,
          recoveryMonths: 3,
        },
      ],
    },
    STAGFLATION: {
      name: 'Stagflation (1970s-style)',
      description: 'Persistent 20% decline over 24 months with slow 36 month recovery',
      shocks: [
        {
          type: 'recession' as const,
          magnitude: -0.2,
          startMonth: 12,
          durationMonths: 24,
          recoveryMonths: 36,
        },
      ],
    },
    DOUBLE_DIP_RECESSION: {
      name: 'Double-Dip Recession',
      description: 'Two consecutive recessions with brief recovery in between',
      shocks: [
        {
          type: 'recession' as const,
          magnitude: -0.25,
          startMonth: 12,
          durationMonths: 8,
          recoveryMonths: 12,
        },
        {
          type: 'recession' as const,
          magnitude: -0.2,
          startMonth: 36,
          durationMonths: 6,
          recoveryMonths: 12,
        },
      ],
    },
    LOST_DECADE: {
      name: 'Lost Decade (Japan 1990s-style)',
      description: 'Prolonged stagnation with 30% decline and minimal recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.3,
          startMonth: 6,
          durationMonths: 18,
          recoveryMonths: 60,
        },
      ],
    },
    FLASH_CRASH: {
      name: 'Flash Crash',
      description: 'Sudden 25% drop with rapid 2-month recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.25,
          startMonth: 24,
          durationMonths: 1,
          recoveryMonths: 2,
        },
      ],
    },
    BOOM_CYCLE: {
      name: 'Boom Cycle',
      description: '40% gain over 24 months (bull market)',
      shocks: [
        {
          type: 'boom' as const,
          magnitude: 0.4,
          startMonth: 12,
          durationMonths: 24,
          recoveryMonths: 0,
        },
      ],
    },
    TECH_BUBBLE: {
      name: 'Tech Bubble',
      description: 'Rapid 60% gain followed by 50% crash',
      shocks: [
        {
          type: 'boom' as const,
          magnitude: 0.6,
          startMonth: 6,
          durationMonths: 18,
          recoveryMonths: 0,
        },
        {
          type: 'crash' as const,
          magnitude: -0.5,
          startMonth: 30,
          durationMonths: 12,
          recoveryMonths: 24,
        },
      ],
    },
    COVID_SHOCK: {
      name: 'COVID-19 Style Shock',
      description: '35% crash in 2 months with rapid V-shaped recovery',
      shocks: [
        {
          type: 'crash' as const,
          magnitude: -0.35,
          startMonth: 24,
          durationMonths: 2,
          recoveryMonths: 6,
        },
      ],
    },
  };
}