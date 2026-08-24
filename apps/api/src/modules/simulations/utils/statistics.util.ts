// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Statistical utility functions for financial simulations
 * Uses jStat library for core statistical operations
 */
import * as jStat from 'jstat';

export class StatisticsUtil {
  /**
   * Calculate minimum value in an array
   */
  static min(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  /**
   * Calculate maximum value in an array
   */
  static max(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  /**
   * Calculate sum of all values in an array
   */
  static sum(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((acc, val) => acc + val, 0);
  }

  /**
   * Calculate mean (average) of an array of numbers
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return jStat.mean(values);
  }

  /**
   * Calculate standard deviation (sample)
   */
  static stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    return jStat.stdev(values, true); // true = sample std dev
  }

  /**
   * Calculate variance (sample)
   */
  static variance(values: number[]): number {
    if (values.length < 2) return 0;
    return jStat.variance(values, true);
  }

  /**
   * Calculate percentile of a dataset
   * @param values Array of numbers
   * @param p Percentile (0-1, e.g., 0.5 for median)
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    if (p < 0 || p > 1) {
      throw new Error('Percentile must be between 0 and 1');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate median (50th percentile)
   */
  static median(values: number[]): number {
    return this.percentile(values, 0.5);
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) {
      throw new Error('Arrays must have the same length and at least 2 elements');
    }
    // Handle constant arrays (std dev = 0) which would return NaN
    const stdX = this.stdDev(x);
    const stdY = this.stdDev(y);
    if (stdX === 0 || stdY === 0) {
      return 0; // Correlation undefined for constant arrays, return 0
    }
    return jStat.corrcoeff(x, y);
  }

  /**
   * Generate random number from normal distribution
   * @param mean Mean of the distribution
   * @param stdDev Standard deviation
   */
  static randomNormal(mean: number, stdDev: number): number {
    return jStat.normal.sample(mean, stdDev);
  }

  /**
   * Generate random number from log-normal distribution
   * @param mean Mean of the underlying normal distribution
   * @param stdDev Standard deviation of the underlying normal distribution
   */
  static randomLogNormal(mean: number, stdDev: number): number {
    return jStat.lognormal.sample(mean, stdDev);
  }

  /**
   * Calculate cumulative distribution function for normal distribution
   * @param x Value to evaluate
   * @param mean Mean of the distribution
   * @param stdDev Standard deviation
   */
  static normalCDF(x: number, mean: number, stdDev: number): number {
    return jStat.normal.cdf(x, mean, stdDev);
  }

  /**
   * Calculate probability density function for normal distribution
   * @param x Value to evaluate
   * @param mean Mean of the distribution
   * @param stdDev Standard deviation
   */
  static normalPDF(x: number, mean: number, stdDev: number): number {
    return jStat.normal.pdf(x, mean, stdDev);
  }

  /**
   * Calculate annualized return from monthly returns
   */
  static annualizeReturn(monthlyReturn: number): number {
    return Math.pow(1 + monthlyReturn, 12) - 1;
  }

  /**
   * Calculate monthly return from annualized return
   */
  static monthlyReturn(annualReturn: number): number {
    return Math.pow(1 + annualReturn, 1 / 12) - 1;
  }

  /**
   * Calculate annualized volatility from monthly volatility
   */
  static annualizeVolatility(monthlyVolatility: number): number {
    return monthlyVolatility * Math.sqrt(12);
  }

  /**
   * Calculate monthly volatility from annualized volatility
   */
  static monthlyVolatility(annualVolatility: number): number {
    return annualVolatility / Math.sqrt(12);
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   * @param beginningValue Starting value
   * @param endingValue Ending value
   * @param years Number of years
   */
  static cagr(beginningValue: number, endingValue: number, years: number): number {
    if (beginningValue <= 0 || years <= 0) return 0;
    return Math.pow(endingValue / beginningValue, 1 / years) - 1;
  }

  /**
   * Calculate future value with compound interest
   * @param presentValue Current value
   * @param rate Interest rate per period
   * @param periods Number of periods
   */
  static futureValue(presentValue: number, rate: number, periods: number): number {
    return presentValue * Math.pow(1 + rate, periods);
  }

  /**
   * Calculate present value of future amount
   * @param futureValue Future value
   * @param rate Discount rate per period
   * @param periods Number of periods
   */
  static presentValue(futureValue: number, rate: number, periods: number): number {
    return futureValue / Math.pow(1 + rate, periods);
  }

  /**
   * Calculate Sharpe Ratio
   * @param returns Array of returns
   * @param riskFreeRate Risk-free rate (same period as returns)
   */
  static sharpeRatio(returns: number[], riskFreeRate: number): number {
    const excessReturns = returns.map((r) => r - riskFreeRate);
    const meanExcess = this.mean(excessReturns);
    const stdDevExcess = this.stdDev(excessReturns);

    if (stdDevExcess === 0) return 0;
    return meanExcess / stdDevExcess;
  }

  /**
   * Calculate Value at Risk (VaR) - parametric method
   * @param mean Expected return
   * @param stdDev Standard deviation of returns
   * @param confidenceLevel Confidence level (e.g., 0.95 for 95%)
   * @param initialValue Initial portfolio value
   */
  static valueAtRisk(
    mean: number,
    stdDev: number,
    confidenceLevel: number,
    initialValue: number
  ): number {
    // Z-score for confidence level (e.g., 1.645 for 95%)
    const zScore = jStat.normal.inv(1 - confidenceLevel, 0, 1);
    const worstReturn = mean + zScore * stdDev;
    return -worstReturn * initialValue; // Negative because it's a loss
  }

  /**
   * Calculate summary statistics for an array of values
   */
  static summary(values: number[]): {
    count: number;
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  } {
    if (values.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        variance: 0,
        min: 0,
        max: 0,
        p10: 0,
        p25: 0,
        p75: 0,
        p90: 0,
      };
    }

    return {
      count: values.length,
      mean: this.mean(values),
      median: this.median(values),
      stdDev: this.stdDev(values),
      variance: this.variance(values),
      min: Math.min(...values),
      max: Math.max(...values),
      p10: this.percentile(values, 0.1),
      p25: this.percentile(values, 0.25),
      p75: this.percentile(values, 0.75),
      p90: this.percentile(values, 0.9),
    };
  }

  /**
   * Generate array of random numbers from normal distribution
   * @param count Number of random numbers to generate
   * @param mean Mean of the distribution
   * @param stdDev Standard deviation
   */
  static randomNormalArray(count: number, mean: number, stdDev: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.randomNormal(mean, stdDev));
    }
    return result;
  }

  /**
   * Calculate geometric mean (useful for investment returns)
   */
  static geometricMean(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.some((v) => v <= 0)) {
      throw new Error('All values must be positive for geometric mean');
    }

    const product = values.reduce((acc, val) => acc * val, 1);
    return Math.pow(product, 1 / values.length);
  }

  /**
   * Calculate maximum drawdown from a series of values
   * @param values Array of portfolio values over time
   * @returns Maximum drawdown as a negative decimal (e.g., -0.25 for 25% drawdown)
   */
  static maxDrawdown(values: number[]): number {
    if (values.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = values[0];

    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i];
      }
      const drawdown = (values[i] - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate skewness of a dataset
   * @param values Array of numbers
   * @returns Skewness value (0 = symmetric, >0 = right skewed, <0 = left skewed)
   */
  static skewness(values: number[]): number {
    if (values.length < 3) return 0;
    const n = values.length;
    const mean = this.mean(values);
    const stdDev = this.stdDev(values);
    if (stdDev === 0) return 0;

    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Calculate kurtosis of a dataset
   * @param values Array of numbers
   * @returns Excess kurtosis (0 = normal, >0 = heavy tails, <0 = light tails)
   */
  static kurtosis(values: number[]): number {
    if (values.length < 4) return 0;
    const n = values.length;
    const mean = this.mean(values);
    const stdDev = this.stdDev(values);
    if (stdDev === 0) return 0;

    const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
    const rawKurtosis = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
    const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    return rawKurtosis - correction;
  }

  /**
   * Generate random number from uniform distribution [0, 1)
   */
  static randomUniform(): number {
    return Math.random();
  }

  /**
   * Calculate annuity payment (PMT)
   * @param presentValue Loan amount
   * @param rate Interest rate per period
   * @param periods Number of periods
   * @returns Payment amount per period
   */
  static annuityPayment(presentValue: number, rate: number, periods: number): number {
    if (rate === 0) return presentValue / periods;
    return (
      (presentValue * (rate * Math.pow(1 + rate, periods))) / (Math.pow(1 + rate, periods) - 1)
    );
  }
}
