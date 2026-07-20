/**
 * Scenario Analysis Engine
 *
 * Provides stress testing for financial plans using predefined adverse scenarios.
 * Allows comparison of baseline projections vs. scenario-stressed outcomes.
 */

import {
  MonteCarloEngine,
  type SimulationConfig,
  type SimulationResult,
} from './monte-carlo.engine';

/**
 * Predefined stress scenarios
 */
export enum ScenarioType {
  JOB_LOSS = 'job_loss',
  MARKET_CRASH = 'market_crash',
  RECESSION = 'recession',
  MEDICAL_EMERGENCY = 'medical_emergency',
  INFLATION_SPIKE = 'inflation_spike',
  DISABILITY = 'disability',
  MARKET_CORRECTION = 'market_correction',
}

/**
 * Scenario shock configuration
 */
export interface ScenarioShock {
  type:
    | 'income_reduction'
    | 'expense_increase'
    | 'return_reduction'
    | 'volatility_increase'
    | 'one_time_expense';
  magnitude: number; // Percentage or absolute amount
  startYear: number;
  durationYears: number;
}

/**
 * Scenario definition
 */
export interface Scenario {
  type: ScenarioType;
  name: string;
  description: string;
  shocks: ScenarioShock[];
  severity: 'mild' | 'moderate' | 'severe';
}

/**
 * Scenario comparison result
 */
export interface ScenarioComparisonResult {
  scenario: Scenario;
  baseline: SimulationResult;
  stressed: SimulationResult;
  comparison: {
    medianDifference: number;
    medianDifferencePercent: number;
    p10Difference: number;
    p10DifferencePercent: number;
    recoveryYears: number | null;
    impactSeverity: 'minimal' | 'moderate' | 'significant' | 'critical';
    worthStressTesting: boolean;
  };
}

/**
 * Predefined scenarios based on historical events and common life events
 */
export const PREDEFINED_SCENARIOS: Record<ScenarioType, Scenario> = {
  [ScenarioType.JOB_LOSS]: {
    type: ScenarioType.JOB_LOSS,
    name: 'Job Loss (6 months)',
    description: 'Complete loss of income for 6 months, simulating unemployment',
    severity: 'severe',
    shocks: [
      {
        type: 'income_reduction',
        magnitude: 100, // 100% loss
        startYear: 1,
        durationYears: 0.5,
      },
    ],
  },
  [ScenarioType.MARKET_CRASH]: {
    type: ScenarioType.MARKET_CRASH,
    name: 'Market Crash (-30%)',
    description: 'Severe market downturn similar to 2008 financial crisis',
    severity: 'severe',
    shocks: [
      {
        type: 'return_reduction',
        magnitude: 30, // -30% return in year 1
        startYear: 1,
        durationYears: 1,
      },
      {
        type: 'volatility_increase',
        magnitude: 25, // +25% volatility
        startYear: 1,
        durationYears: 2,
      },
      {
        type: 'return_reduction',
        magnitude: 10, // Slower recovery
        startYear: 2,
        durationYears: 2,
      },
    ],
  },
  [ScenarioType.RECESSION]: {
    type: ScenarioType.RECESSION,
    name: 'Economic Recession',
    description: 'Economic downturn with income reduction and lower returns',
    severity: 'moderate',
    shocks: [
      {
        type: 'income_reduction',
        magnitude: 20, // 20% income loss
        startYear: 1,
        durationYears: 1.5,
      },
      {
        type: 'return_reduction',
        magnitude: 8, // -8% returns
        startYear: 1,
        durationYears: 2,
      },
      {
        type: 'volatility_increase',
        magnitude: 15,
        startYear: 1,
        durationYears: 2,
      },
    ],
  },
  [ScenarioType.MEDICAL_EMERGENCY]: {
    type: ScenarioType.MEDICAL_EMERGENCY,
    name: 'Medical Emergency ($50k)',
    description: 'Unexpected major medical expense not covered by insurance',
    severity: 'moderate',
    shocks: [
      {
        type: 'one_time_expense',
        magnitude: 50000, // $50k expense
        startYear: 1,
        durationYears: 0,
      },
    ],
  },
  [ScenarioType.INFLATION_SPIKE]: {
    type: ScenarioType.INFLATION_SPIKE,
    name: 'High Inflation (5 years)',
    description: 'Sustained period of high inflation reducing real returns',
    severity: 'moderate',
    shocks: [
      {
        type: 'return_reduction',
        magnitude: 4, // -4% real returns
        startYear: 1,
        durationYears: 5,
      },
      {
        type: 'volatility_increase',
        magnitude: 8,
        startYear: 1,
        durationYears: 5,
      },
    ],
  },
  [ScenarioType.DISABILITY]: {
    type: ScenarioType.DISABILITY,
    name: 'Long-term Disability',
    description: 'Extended inability to work with 40% income replacement',
    severity: 'severe',
    shocks: [
      {
        type: 'income_reduction',
        magnitude: 60, // 60% income loss (40% replacement)
        startYear: 1,
        durationYears: 3,
      },
      {
        type: 'expense_increase',
        magnitude: 20, // +20% medical expenses
        startYear: 1,
        durationYears: 3,
      },
    ],
  },
  [ScenarioType.MARKET_CORRECTION]: {
    type: ScenarioType.MARKET_CORRECTION,
    name: 'Market Correction (-10%)',
    description: 'Mild market downturn with quick recovery',
    severity: 'mild',
    shocks: [
      {
        type: 'return_reduction',
        magnitude: 15, // -15% returns for 1 year
        startYear: 1,
        durationYears: 1,
      },
      {
        type: 'volatility_increase',
        magnitude: 10,
        startYear: 1,
        durationYears: 1,
      },
    ],
  },
};

/**
 * Scenario Analysis Engine
 */
export class ScenarioAnalysisEngine {
  private monteCarloEngine: MonteCarloEngine;

  constructor() {
    this.monteCarloEngine = new MonteCarloEngine();
  }

  /**
   * Run scenario analysis comparing baseline to stressed scenario
   */
  analyzeScenario(
    baselineConfig: SimulationConfig,
    scenario: Scenario | ScenarioType
  ): ScenarioComparisonResult {
    // Resolve scenario if type was provided
    const resolvedScenario =
      typeof scenario === 'string' ? PREDEFINED_SCENARIOS[scenario] : scenario;

    // Run baseline simulation
    const baseline = this.monteCarloEngine.simulate(baselineConfig);

    // Apply shocks and run stressed simulation
    const stressedConfig = this.applyShocks(baselineConfig, resolvedScenario.shocks);
    const stressed = this.monteCarloEngine.simulate(stressedConfig);

    // Calculate comparison metrics
    const comparison = this.compareResults(baseline, stressed, baselineConfig.years);

    return {
      scenario: resolvedScenario,
      baseline,
      stressed,
      comparison,
    };
  }

  /**
   * Apply scenario shocks to baseline configuration
   */
  private applyShocks(baselineConfig: SimulationConfig, shocks: ScenarioShock[]): SimulationConfig {
    const stressedConfig = { ...baselineConfig };

    // For simplicity, we'll apply average impact across the simulation period
    // In a real implementation, this would vary by year
    let totalIncomeReduction = 0;
    let totalExpenseIncrease = 0;
    let totalReturnReduction = 0;
    let totalVolatilityIncrease = 0;
    let oneTimeExpense = 0;

    for (const shock of shocks) {
      const impactWeight = shock.durationYears / baselineConfig.years;

      switch (shock.type) {
        case 'income_reduction':
          totalIncomeReduction += (shock.magnitude / 100) * impactWeight;
          break;
        case 'expense_increase':
          totalExpenseIncrease += (shock.magnitude / 100) * impactWeight;
          break;
        case 'return_reduction':
          totalReturnReduction += (shock.magnitude / 100) * impactWeight;
          break;
        case 'volatility_increase':
          totalVolatilityIncrease += (shock.magnitude / 100) * impactWeight;
          break;
        case 'one_time_expense':
          oneTimeExpense += shock.magnitude;
          break;
      }
    }

    // Apply aggregated shocks
    stressedConfig.monthlyContribution *= 1 - totalIncomeReduction + totalExpenseIncrease;
    stressedConfig.expectedReturn -= totalReturnReduction;
    stressedConfig.returnVolatility += totalVolatilityIncrease;
    stressedConfig.initialBalance -= oneTimeExpense;

    return stressedConfig;
  }

  /**
   * Compare baseline and stressed simulation results
   */
  private compareResults(
    baseline: SimulationResult,
    stressed: SimulationResult,
    years: number
  ): ScenarioComparisonResult['comparison'] {
    const medianDifference = baseline.finalBalance.median - stressed.finalBalance.median;
    const medianDifferencePercent = (medianDifference / baseline.finalBalance.median) * 100;

    const p10Difference = baseline.finalBalance.p10 - stressed.finalBalance.p10;
    const p10DifferencePercent = (p10Difference / baseline.finalBalance.p10) * 100;

    // Calculate recovery time (years to reach 90% of baseline)
    const recoveryYears = this.calculateRecoveryTime(baseline, stressed);

    // Determine impact severity
    let impactSeverity: 'minimal' | 'moderate' | 'significant' | 'critical';
    if (medianDifferencePercent < 10) {
      impactSeverity = 'minimal';
    } else if (medianDifferencePercent < 25) {
      impactSeverity = 'moderate';
    } else if (medianDifferencePercent < 50) {
      impactSeverity = 'significant';
    } else {
      impactSeverity = 'critical';
    }

    const worthStressTesting = medianDifferencePercent > 5;

    return {
      medianDifference,
      medianDifferencePercent,
      p10Difference,
      p10DifferencePercent,
      recoveryYears,
      impactSeverity,
      worthStressTesting,
    };
  }

  /**
   * Calculate how many years it takes to recover to 90% of baseline
   */
  private calculateRecoveryTime(
    baseline: SimulationResult,
    stressed: SimulationResult
  ): number | null {
    const targetValue = baseline.finalBalance.median * 0.9;

    // If stressed outcome already exceeds target, recovery is immediate
    if (stressed.finalBalance.median >= targetValue) {
      return 0;
    }

    // If stressed outcome never reaches target, return null
    if (stressed.finalBalance.max < targetValue) {
      return null;
    }

    // Estimate recovery based on growth trajectories
    // This is simplified - a more accurate version would track year-by-year
    const baselineGrowthRate =
      Math.pow(
        baseline.finalBalance.median / baseline.yearlyProjections[0].median,
        1 / (baseline.yearlyProjections.length - 1)
      ) - 1;

    const stressedGrowthRate =
      Math.pow(
        stressed.finalBalance.median / stressed.yearlyProjections[0].median,
        1 / (stressed.yearlyProjections.length - 1)
      ) - 1;

    // Estimate years needed for stressed to reach target
    if (stressedGrowthRate <= 0) {
      return null;
    }

    const yearsToRecover =
      Math.log(targetValue / stressed.finalBalance.median) / Math.log(1 + stressedGrowthRate);

    return Math.round(yearsToRecover * 10) / 10; // Round to 1 decimal
  }

  /**
   * Run multiple scenario analyses
   */
  analyzeMultipleScenarios(
    baselineConfig: SimulationConfig,
    scenarios: (Scenario | ScenarioType)[]
  ): ScenarioComparisonResult[] {
    return scenarios.map((scenario) => this.analyzeScenario(baselineConfig, scenario));
  }

  /**
   * Get all predefined scenarios
   */
  static getPredefinedScenarios(): Scenario[] {
    return Object.values(PREDEFINED_SCENARIOS);
  }

  /**
   * Get scenario by type
   */
  static getScenario(type: ScenarioType): Scenario {
    return PREDEFINED_SCENARIOS[type];
  }
}

/**
 * Default instance for convenience
 */
export const scenarioAnalysisEngine = new ScenarioAnalysisEngine();
