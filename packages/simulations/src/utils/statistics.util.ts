/**
 * Statistical Utility Functions
 *
 * Provides core statistical calculations for Monte Carlo simulations
 * and financial planning analysis.
 */

/**
 * Calculate the arithmetic mean (average) of a dataset
 */
export function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate mean of empty array');
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the sample standard deviation
 */
export function stdDev(values: number[]): number {
  if (values.length < 2) {
    throw new Error('Standard deviation requires at least 2 values');
  }

  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate the variance of a dataset
 */
export function variance(values: number[]): number {
  if (values.length < 2) {
    throw new Error('Variance requires at least 2 values');
  }

  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));

  return squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);
}

/**
 * Calculate a specific percentile from a dataset
 * @param values - Array of numbers
 * @param p - Percentile (0-100)
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate percentile of empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  return percentileFromSorted(sorted, p);
}

function percentileFromSorted(sorted: number[], p: number): number {
  if (p < 0 || p > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }

  const index = (p / 100) * (sorted.length - 1);

  if (Number.isInteger(index)) {
    return sorted[index];
  }

  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate the median (50th percentile)
 */
export function median(values: number[]): number {
  return percentile(values, 50);
}

/**
 * Calculate the Pearson correlation coefficient between two datasets
 * Returns a value between -1 and 1
 */
export function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have equal length for correlation');
  }

  if (x.length < 2) {
    throw new Error('Correlation requires at least 2 data points');
  }

  const xMean = mean(x);
  const yMean = mean(y);

  let numerator = 0;
  let xSquaredSum = 0;
  let ySquaredSum = 0;

  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;

    numerator += xDiff * yDiff;
    xSquaredSum += xDiff * xDiff;
    ySquaredSum += yDiff * yDiff;
  }

  const denominator = Math.sqrt(xSquaredSum * ySquaredSum);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Calculate covariance between two datasets
 */
export function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have equal length for covariance');
  }

  if (x.length < 2) {
    throw new Error('Covariance requires at least 2 data points');
  }

  const xMean = mean(x);
  const yMean = mean(y);

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - xMean) * (y[i] - yMean);
  }

  return sum / (x.length - 1);
}

/**
 * Generate a random number from a normal distribution
 * Uses Box-Muller transform
 *
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation of the distribution
 */
export function normalRandom(mean: number = 0, stdDev: number = 1): number {
  let u1 = 0;
  let u2 = 0;

  // Ensure we don't get 0 which would cause issues with log
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  // Box-Muller transform
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  return z0 * stdDev + mean;
}

/**
 * Generate an array of random numbers from a normal distribution
 */
export function normalRandomArray(count: number, mean: number = 0, stdDev: number = 1): number[] {
  const result: number[] = [];

  for (let i = 0; i < count; i++) {
    result.push(normalRandom(mean, stdDev));
  }

  return result;
}

/**
 * Calculate the compound annual growth rate (CAGR)
 *
 * @param beginningValue - Initial value
 * @param endingValue - Final value
 * @param years - Number of years
 */
export function cagr(beginningValue: number, endingValue: number, years: number): number {
  if (beginningValue <= 0) {
    throw new Error('Beginning value must be positive');
  }

  if (years <= 0) {
    throw new Error('Years must be positive');
  }

  return Math.pow(endingValue / beginningValue, 1 / years) - 1;
}

/**
 * Calculate future value with compound interest
 *
 * @param presentValue - Current value
 * @param rate - Annual interest rate (e.g., 0.07 for 7%)
 * @param years - Number of years
 * @param periodsPerYear - Compounding periods per year (default: 12 for monthly)
 */
export function futureValue(
  presentValue: number,
  rate: number,
  years: number,
  periodsPerYear: number = 12
): number {
  const periodicRate = rate / periodsPerYear;
  const totalPeriods = years * periodsPerYear;

  return presentValue * Math.pow(1 + periodicRate, totalPeriods);
}

/**
 * Calculate future value of a series of payments (annuity)
 *
 * @param payment - Payment amount per period
 * @param rate - Annual interest rate
 * @param years - Number of years
 * @param periodsPerYear - Periods per year (default: 12 for monthly)
 */
export function futureValueOfAnnuity(
  payment: number,
  rate: number,
  years: number,
  periodsPerYear: number = 12
): number {
  const periodicRate = rate / periodsPerYear;
  const totalPeriods = years * periodsPerYear;

  if (periodicRate === 0) {
    return payment * totalPeriods;
  }

  return payment * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
}

/**
 * Calculate present value of future amount
 *
 * @param futureValue - Future value
 * @param rate - Annual discount rate
 * @param years - Number of years
 */
export function presentValue(futureValue: number, rate: number, years: number): number {
  return futureValue / Math.pow(1 + rate, years);
}

/**
 * Calculate confidence interval for a dataset
 *
 * @param values - Array of values
 * @param confidence - Confidence level (e.g., 0.95 for 95%)
 * @returns [lowerBound, upperBound]
 */
export function confidenceInterval(values: number[], confidence: number = 0.95): [number, number] {
  if (confidence <= 0 || confidence >= 1) {
    throw new Error('Confidence must be between 0 and 1');
  }

  if (values.length === 0) {
    throw new Error('Cannot calculate percentile of empty array');
  }

  const alpha = 1 - confidence;
  const lowerPercentile = (alpha / 2) * 100;
  const upperPercentile = (1 - alpha / 2) * 100;
  const sorted = [...values].sort((a, b) => a - b);

  return [
    percentileFromSorted(sorted, lowerPercentile),
    percentileFromSorted(sorted, upperPercentile),
  ];
}

/**
 * Calculate summary statistics for a dataset
 */
export interface SummaryStatistics {
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
}

export function summarize(values: number[]): SummaryStatistics {
  if (values.length === 0) {
    throw new Error('Cannot summarize empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const avg = values.reduce((acc, val) => acc + val, 0) / count;
  const varianceValue =
    count >= 2 ? values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / (count - 1) : 0;

  return {
    count,
    mean: avg,
    median: percentileFromSorted(sorted, 50),
    stdDev: Math.sqrt(varianceValue),
    variance: varianceValue,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p10: percentileFromSorted(sorted, 10),
    p25: percentileFromSorted(sorted, 25),
    p75: percentileFromSorted(sorted, 75),
    p90: percentileFromSorted(sorted, 90),
  };
}
