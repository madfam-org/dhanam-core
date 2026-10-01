/**
 * Smoke test for the jest setup of @dhanam-core/simulations.
 *
 * Until this file existed, no workspace in the repository had a single test
 * and every `jest --passWithNoTests` run passed vacuously. This proves the
 * ts-jest toolchain actually compiles and executes a spec, against pure,
 * deterministic helpers with hand-checked expected values. The package's
 * `test` script no longer passes `--passWithNoTests`, so deleting or breaking
 * discovery of this file fails `pnpm test`.
 */
import {
  cagr,
  futureValueOfAnnuity,
  mean,
  median,
  percentile,
  presentValue,
} from '../statistics.util';

describe('statistics.util', () => {
  it('computes the arithmetic mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it('refuses the mean of an empty dataset', () => {
    expect(() => mean([])).toThrow('Cannot calculate mean of empty array');
  });

  it('interpolates percentiles linearly between ranks', () => {
    // index = 0.25 * (4 - 1) = 0.75 → 10 + 0.75 * (20 - 10)
    expect(percentile([40, 10, 30, 20], 25)).toBeCloseTo(17.5, 10);
    expect(percentile([10, 20, 30, 40], 0)).toBe(10);
    expect(percentile([10, 20, 30, 40], 100)).toBe(40);
  });

  it('takes the median of an even-length dataset as the midpoint', () => {
    expect(median([3, 1, 4, 2])).toBe(2.5);
  });

  it('rejects a percentile outside 0–100', () => {
    expect(() => percentile([1, 2], 101)).toThrow('Percentile must be between 0 and 100');
  });

  it('computes CAGR for a value that doubles in one year', () => {
    expect(cagr(100, 200, 1)).toBeCloseTo(1, 10);
  });

  it('sums payments when the annuity rate is zero', () => {
    expect(futureValueOfAnnuity(100, 0, 2)).toBe(2400); // 100 × 12 × 2
  });

  it('discounts a future value with annual compounding', () => {
    expect(presentValue(110, 0.1, 1)).toBeCloseTo(100, 10);
  });
});
