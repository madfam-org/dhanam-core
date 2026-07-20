import { apiClient } from './client';

export interface IncomeStream {
  name: string;
  annualAmount: number;
  growthRate: number;
  startYear?: number;
  endYear?: number;
  isTaxable: boolean;
}

export interface ExpenseCategory {
  name: string;
  annualAmount: number;
  growthRate: number;
  isEssential: boolean;
  startYear?: number;
  endYear?: number;
}

export interface LifeEvent {
  type: string;
  name: string;
  year: number;
  amount: number;
  annualImpact?: number;
  impactDuration?: number;
  inflationAdjusted?: boolean;
}

export interface SocialSecurityConfig {
  country: 'US' | 'MX';
  monthlyBenefit: number;
  claimYear: number;
  claimAge?: 62 | 65 | 67 | 70;
  spouseMonthlyBenefit?: number;
  spouseClaimYear?: number;
}

export interface TaxConfig {
  country: 'US' | 'MX';
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  state?: string;
  stateTaxRate?: number;
  annualDeductions?: number;
}

export interface CreateProjectionDto {
  projectionYears: number;
  inflationRate?: number;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy?: number;
  incomeStreams?: IncomeStream[];
  expenses?: ExpenseCategory[];
  socialSecurity?: SocialSecurityConfig;
  taxes?: TaxConfig;
  lifeEvents?: LifeEvent[];
  includeAccounts?: boolean;
  includeRecurring?: boolean;
}

export interface YearlySnapshot {
  year: number;
  age: number;
  grossIncome: number;
  taxesPaid: number;
  netIncome: number;
  totalExpenses: number;
  netCashflow: number;
  totalDebt: number;
  totalAssets: number;
  netWorth: number;
  socialSecurityIncome: number;
  lifeEventsThisYear: LifeEvent[];
  incomeBreakdown: { name: string; amount: number }[];
  expenseBreakdown: { name: string; amount: number }[];
  assetBreakdown: { name: string; value: number; type: string }[];
  loanBreakdown: { name: string; balance: number; paymentThisYear: number }[];
  savingsRate: number;
  fiRatio: number;
}

export interface ProjectionResult {
  config: CreateProjectionDto;
  yearlySnapshots: YearlySnapshot[];
  summary: {
    debtFreeYear: number | null;
    financialIndependenceYear: number | null;
    peakNetWorth: { year: number; amount: number };
    minNetWorth: { year: number; amount: number };
    totalLifetimeEarnings: number;
    totalLifetimeTaxes: number;
    totalSocialSecurity: number;
    averageSavingsRate: number;
    yearsUntilRetirement: number;
    projectedRetirementIncome: number;
    incomeReplacementRatio: number;
    riskScore: number;
  };
  warnings: string[];
  executionTimeMs: number;
}

export interface WhatIfScenario {
  name: string;
  description: string;
  modifications: Partial<CreateProjectionDto>;
}

export interface QuickProjectionResult {
  netWorthAtRetirement: number;
  monthlyRetirementIncome: number;
  yearsUntilRetirement: number;
  riskScore: number;
  incomeReplacementRatio: number;
}

export const projectionsApi = {
  /**
   * Generate a long-term financial projection
   */
  generateProjection: async (
    spaceId: string,
    dto: CreateProjectionDto
  ): Promise<ProjectionResult> => {
    return apiClient.post<ProjectionResult>(`/analytics/${spaceId}/projections`, dto);
  },

  /**
   * Compare what-if scenarios
   */
  compareScenarios: async (
    spaceId: string,
    baseConfig: CreateProjectionDto,
    scenarios: WhatIfScenario[]
  ): Promise<{
    baseline: ProjectionResult;
    scenarios: { scenario: WhatIfScenario; result: ProjectionResult }[];
  }> => {
    return apiClient.post(`/analytics/${spaceId}/projections/compare`, {
      baseConfig,
      scenarios,
    });
  },

  /**
   * Get quick projection summary for dashboard
   */
  getQuickProjection: async (
    spaceId: string,
    currentAge: number,
    retirementAge: number
  ): Promise<QuickProjectionResult> => {
    return apiClient.get<QuickProjectionResult>(
      `/analytics/${spaceId}/projections/quick?currentAge=${currentAge}&retirementAge=${retirementAge}`
    );
  },

  /**
   * Get predefined scenario templates
   */
  getScenarioTemplates: async (spaceId: string): Promise<WhatIfScenario[]> => {
    return apiClient.get<WhatIfScenario[]>(`/analytics/${spaceId}/projections/scenario-templates`);
  },
};
