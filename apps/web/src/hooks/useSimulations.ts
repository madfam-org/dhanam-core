import { FINANCIAL_DEFAULTS } from '@dhanam-core/shared';
import { useState, useRef, useEffect } from 'react';

import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { useAuth } from '@/lib/hooks/use-auth';

export interface MonteCarloConfig {
  initialBalance: number;
  monthlyContribution: number;
  months: number;
  iterations?: number;
  expectedReturn: number;
  volatility: number;
}

export interface RetirementConfig {
  initialBalance: number;
  monthlyContribution: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyExpenses?: number;
  socialSecurityIncome?: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
  inflationAdjusted?: boolean;
}

export interface GoalProbabilityConfig {
  goalId?: string;
  currentValue: number;
  targetAmount: number;
  monthsRemaining: number;
  monthlyContribution?: number;
  expectedReturn: number;
  volatility: number;
  iterations?: number;
}

export interface MonthlySnapshot {
  month: number;
  median: number;
  mean: number;
  p10: number;
  p90: number;
}

export interface SimulationResult {
  finalValues: number[];
  median: number;
  mean: number;
  stdDev: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  timeSeries: MonthlySnapshot[];
  computedAt: Date;
  metadata?: {
    iterations: number;
    monteCarloPaths?: number;
    [key: string]: unknown;
  };
  config?: {
    [key: string]: unknown;
  };
}

export interface GoalProbabilityResult {
  probabilityOfSuccess: number;
  medianOutcome: number;
  expectedShortfall: number;
  confidence90Range: {
    low: number;
    high: number;
  };
  recommendedMonthlyContribution: number;
  currentMonthlyContribution: number;
  targetAmount: number;
  monthsRemaining: number;
  simulation: SimulationResult;
  timeSeries?: Array<{ month: number; probability: number }>;
}

export interface RetirementSimulationResult {
  accumulationPhase: {
    yearsToRetirement: number;
    finalBalanceMedian: number;
    finalBalanceP10: number;
    finalBalanceP90: number;
    totalContributions: number;
  };
  withdrawalPhase: {
    yearsInRetirement: number;
    probabilityOfNotRunningOut: number;
    medianYearsOfSustainability: number;
    safeWithdrawalRate: number;
    netMonthlyNeed: number;
  };
  recommendations: {
    increaseContributionBy?: number;
    canRetireEarlierBy?: number;
    targetNestEgg: number;
  };
  simulation: SimulationResult;
}

export interface ScenarioComparisonResult {
  scenario: {
    type: string;
    name: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
    median?: number;
    p10?: number;
    p90?: number;
    timeSeries?: MonthlySnapshot[];
  };
  scenarioName?: string;
  scenarioDescription?: string;
  baseline: SimulationResult;
  stressed: SimulationResult;
  comparison: {
    medianDifference: number;
    medianDifferencePercent: number;
    p10Difference: number;
    p10DifferencePercent: number;
    recoveryYears: number | null;
    recoveryMonths?: number;
    impactSeverity: 'minimal' | 'moderate' | 'significant' | 'critical';
    worthStressTesting: boolean;
  };
}

export interface RecommendedAllocation {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  yearsToRetirement: number;
  expectedReturn: number;
  volatility: number;
  allocation: {
    stocks: number;
    bonds: number;
  };
  description: string;
}

interface SimulationsError {
  statusCode: number;
  message: string;
  error: string;
}

export function useSimulations() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SimulationsError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010';

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRequest = async <T>(
    endpoint: string,
    config: MonteCarloConfig | RetirementConfig | GoalProbabilityConfig
  ): Promise<T | null> => {
    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetchWithTimeout(`${apiBaseUrl}/simulations/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const data = await response.json();
      return data as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null; // Request was superseded or component unmounted
      }
      setError({
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        error: 'Internal Server Error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (config: MonteCarloConfig): Promise<SimulationResult | null> => {
    return handleRequest<SimulationResult>('monte-carlo', config);
  };

  const calculateGoalProbability = async (
    config: GoalProbabilityConfig
  ): Promise<GoalProbabilityResult | null> => {
    return handleRequest<GoalProbabilityResult>('goal-probability', config);
  };

  const simulateRetirement = async (
    config: RetirementConfig
  ): Promise<RetirementSimulationResult | null> => {
    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      // Transform frontend config to backend API format
      const apiConfig = {
        currentAge: config.currentAge,
        retirementAge: config.retirementAge,
        lifeExpectancy: config.lifeExpectancy,
        currentSavings: config.initialBalance,
        monthlyContribution: config.monthlyContribution,
        monthlyWithdrawal: (config.monthlyExpenses || 0) - (config.socialSecurityIncome || 0),
        preRetirementReturn: config.expectedReturn,
        postRetirementReturn: config.expectedReturn * FINANCIAL_DEFAULTS.RETIREMENT_RETURN_FACTOR,
        returnVolatility: config.volatility,
        iterations: config.iterations || FINANCIAL_DEFAULTS.MONTE_CARLO_ITERATIONS,
        inflationRate: config.inflationAdjusted ? FINANCIAL_DEFAULTS.INFLATION_RATE : undefined,
      };

      const response = await fetchWithTimeout(`${apiBaseUrl}/simulations/retirement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiConfig),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const backendResult = await response.json();

      // Transform backend response to frontend format
      const yearsToRetirement = config.retirementAge - config.currentAge;
      const yearsInRetirement = config.lifeExpectancy - config.retirementAge;
      const monthsToRetirement = yearsToRetirement * 12;
      const totalMonths = (yearsToRetirement + yearsInRetirement) * 12;

      // Transform yearlyProjections to monthlySnapshots
      const timeSeries: MonthlySnapshot[] = [];
      for (let month = 0; month <= totalMonths; month++) {
        const yearIndex = Math.floor(month / 12);
        if (backendResult.yearlyProjections && backendResult.yearlyProjections[yearIndex]) {
          const yearly = backendResult.yearlyProjections[yearIndex];
          timeSeries.push({
            month,
            median: yearly.median,
            mean: yearly.mean,
            p10: yearly.p10,
            p90: yearly.p90,
          });
        }
      }

      // Calculate safe withdrawal rate
      const balanceAtRetirement =
        backendResult.balanceAtRetirement?.median ||
        backendResult.yearlyProjections[yearsToRetirement]?.median ||
        0;
      const safeWithdrawalRate = (balanceAtRetirement * 0.04) / 12; // 4% rule monthly

      // Calculate total contributions
      const totalContributions = config.monthlyContribution * monthsToRetirement;

      // Calculate median years of sustainability
      const finalBalance = backendResult.balanceAtLifeExpectancy?.median || 0;
      const medianYearsOfSustainability =
        finalBalance > 0
          ? yearsInRetirement
          : yearsInRetirement * (backendResult.successProbability || 0.5);

      const result: RetirementSimulationResult = {
        accumulationPhase: {
          yearsToRetirement,
          finalBalanceMedian: balanceAtRetirement,
          finalBalanceP10: backendResult.balanceAtRetirement?.p10 || balanceAtRetirement * 0.6,
          finalBalanceP90: backendResult.balanceAtRetirement?.p90 || balanceAtRetirement * 1.4,
          totalContributions,
        },
        withdrawalPhase: {
          yearsInRetirement,
          probabilityOfNotRunningOut: backendResult.successProbability || 0,
          medianYearsOfSustainability,
          safeWithdrawalRate,
          netMonthlyNeed: (config.monthlyExpenses || 0) - (config.socialSecurityIncome || 0),
        },
        recommendations: {
          increaseContributionBy:
            backendResult.successProbability < 0.75
              ? Math.ceil((balanceAtRetirement * 0.25) / monthsToRetirement / 100) * 100
              : undefined,
          canRetireEarlierBy:
            backendResult.successProbability > 0.95
              ? Math.floor(yearsToRetirement * 0.1)
              : undefined,
          targetNestEgg: balanceAtRetirement,
        },
        simulation: {
          finalValues: new Array(config.iterations || 10000).fill(finalBalance),
          median: finalBalance,
          mean: finalBalance,
          stdDev: finalBalance * 0.3,
          p10: backendResult.balanceAtLifeExpectancy?.p10 || finalBalance * 0.5,
          p25: backendResult.balanceAtLifeExpectancy?.p25 || finalBalance * 0.7,
          p75: backendResult.balanceAtLifeExpectancy?.p75 || finalBalance * 1.3,
          p90: backendResult.balanceAtLifeExpectancy?.p90 || finalBalance * 1.6,
          min: 0,
          max: finalBalance * 2,
          timeSeries,
          computedAt: new Date(),
        },
      };

      return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      setError({
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        error: 'Internal Server Error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeScenario = async (
    scenarioType: string,
    config: {
      initialBalance: number;
      monthlyContribution: number;
      years: number;
      expectedReturn: number;
      returnVolatility: number;
      iterations?: number;
      inflationRate?: number;
    }
  ): Promise<ScenarioComparisonResult | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetchWithTimeout(`${apiBaseUrl}/simulations/scenario-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scenarioType,
          ...config,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const data = await response.json();
      return data as ScenarioComparisonResult;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      setError({
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        error: 'Internal Server Error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedAllocation = async (
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    yearsToRetirement: number
  ): Promise<RecommendedAllocation | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetchWithTimeout(`${apiBaseUrl}/simulations/recommended-allocation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ riskTolerance, yearsToRetirement }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      const data = await response.json();
      return data as RecommendedAllocation;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      setError({
        statusCode: 500,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        error: 'Internal Server Error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    runSimulation,
    calculateGoalProbability,
    simulateRetirement,
    analyzeScenario,
    compareScenarios: analyzeScenario, // Alias for backwards compatibility
    getRecommendedAllocation,
    loading,
    error,
  };
}
