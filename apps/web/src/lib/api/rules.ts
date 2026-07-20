import { apiClient } from './client';

export interface Rule {
  id: string;
  name: string;
  pattern: string;
  field: 'description' | 'merchant' | 'amount';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'gte' | 'lte';
  value: string;
  priority: number;
  isActive: boolean;
  categoryId: string;
  category?: { name: string; color: string };
}

export interface CreateRuleDto {
  name: string;
  pattern: string;
  field: 'description' | 'merchant' | 'amount';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'gte' | 'lte';
  value: string;
  priority: number;
  categoryId: string;
}

export interface TestRuleDto {
  pattern: string;
  field: 'description' | 'merchant' | 'amount';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'gte' | 'lte';
  value: string;
}

export interface TestRuleResult {
  matchCount: number;
  sampleMatches: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
}

export const rulesApi = {
  getRules: async (spaceId: string): Promise<Rule[]> => {
    return apiClient.get<Rule[]>(`/spaces/${spaceId}/transaction-rules`);
  },

  createRule: async (spaceId: string, dto: CreateRuleDto): Promise<Rule> => {
    return apiClient.post<Rule>(`/spaces/${spaceId}/transaction-rules`, dto);
  },

  updateRule: async (
    spaceId: string,
    ruleId: string,
    dto: Partial<CreateRuleDto>
  ): Promise<Rule> => {
    return apiClient.patch<Rule>(`/spaces/${spaceId}/transaction-rules/${ruleId}`, dto);
  },

  toggleRule: async (spaceId: string, ruleId: string, isActive: boolean): Promise<Rule> => {
    return apiClient.patch<Rule>(`/spaces/${spaceId}/transaction-rules/${ruleId}`, {
      isActive,
    });
  },

  deleteRule: async (spaceId: string, ruleId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/transaction-rules/${ruleId}`);
  },

  testRule: async (spaceId: string, dto: TestRuleDto): Promise<TestRuleResult> => {
    return apiClient.post<TestRuleResult>(`/spaces/${spaceId}/transaction-rules/test`, dto);
  },
};
