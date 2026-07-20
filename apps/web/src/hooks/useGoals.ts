import { useState } from 'react';

import { useAuth } from '@/lib/hooks/use-auth';

export interface Goal {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  type:
    | 'retirement'
    | 'education'
    | 'house_purchase'
    | 'emergency_fund'
    | 'legacy'
    | 'travel'
    | 'business'
    | 'debt_payoff'
    | 'other';
  targetAmount: number;
  currency: string;
  targetDate: string;
  priority: number;
  status: 'active' | 'paused' | 'achieved' | 'abandoned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  allocations?: GoalAllocation[];
  currentProbability?: number;
  probabilityHistory?: Array<{ month: number; probability: number }>;
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  accountId: string;
  percentage: number;
  notes?: string;
  account?: {
    id: string;
    name: string;
    balance: number;
  };
}

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  percentComplete: number;
  timeProgress: number;
  onTrack: boolean;
  monthlyContributionNeeded: number;
  projectedCompletion: string | null;
  allocations: {
    accountId: string;
    accountName: string;
    contributedValue: number;
    percentage: number;
  }[];
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  totalTargetAmount: number;
  totalCurrentValue: number;
  overallProgress: number;
}

export interface GoalProbabilityResult {
  goalId: string;
  probability: number; // 0-100
  confidenceLow: number; // P10 value
  confidenceHigh: number; // P90 value
  currentProgress: number; // 0-100
  projectedCompletion: string | null;
  recommendedMonthlyContribution: number;
  timeline: {
    month: number;
    median: number;
    p10: number;
    p90: number;
  }[];
  timeSeries?: Array<{ month: number; median: number; p10: number; p90: number }>;
  simulation?: {
    timeSeries: Array<{ month: number; median: number; p10: number; p90: number }>;
    [key: string]: unknown;
  };
}

export interface WhatIfScenario {
  monthlyContribution?: number;
  targetAmount?: number;
  targetDate?: string;
  expectedReturn?: number;
  volatility?: number;
}

export interface GoalShare {
  id: string;
  goalId: string;
  role: 'viewer' | 'contributor' | 'editor' | 'manager';
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  message?: string;
  acceptedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GoalActivity {
  id: string;
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Activity metadata is freeform JSON varying by action type (contribution, share, edit, etc.); values rendered dynamically
  metadata?: Record<string, any>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ShareGoalInput {
  shareWithEmail: string;
  role: 'viewer' | 'contributor' | 'editor' | 'manager';
  message?: string;
}

export interface CreateGoalInput {
  spaceId: string;
  name: string;
  description?: string;
  type: Goal['type'];
  targetAmount: number;
  currency?: string;
  targetDate: string;
  priority?: number;
  notes?: string;
}

export interface UpdateGoalInput {
  name?: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  priority?: number;
  status?: Goal['status'];
  notes?: string;
}

export interface AddAllocationInput {
  accountId: string;
  percentage: number;
  notes?: string;
}

interface GoalsError {
  statusCode: number;
  message: string;
  error: string;
}

export function useGoals() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GoalsError | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010';

  const handleRequest = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic request handler accepts any JSON-serializable body (goal inputs, share inputs, etc.)
    data?: Record<string, any>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${apiBaseUrl}/goals/${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData);
        return null;
      }

      if (method === 'DELETE' || response.status === 204) {
        return null;
      }

      const result = await response.json();
      return result as T;
    } catch (err) {
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

  const createGoal = async (input: CreateGoalInput): Promise<Goal | null> => {
    return handleRequest<Goal>('POST', '', input);
  };

  const getGoalsBySpace = async (spaceId: string): Promise<Goal[] | null> => {
    return handleRequest<Goal[]>('GET', `space/${spaceId}`);
  };

  const getGoalSummary = async (spaceId: string): Promise<GoalSummary | null> => {
    return handleRequest<GoalSummary>('GET', `space/${spaceId}/summary`);
  };

  const getGoalById = async (goalId: string): Promise<Goal | null> => {
    return handleRequest<Goal>('GET', goalId);
  };

  const updateGoal = async (goalId: string, input: UpdateGoalInput): Promise<Goal | null> => {
    return handleRequest<Goal>('PUT', goalId, input);
  };

  const deleteGoal = async (goalId: string): Promise<void> => {
    await handleRequest('DELETE', goalId);
  };

  const getGoalProgress = async (goalId: string): Promise<GoalProgress | null> => {
    return handleRequest<GoalProgress>('GET', `${goalId}/progress`);
  };

  const addAllocation = async (
    goalId: string,
    input: AddAllocationInput
  ): Promise<GoalAllocation | null> => {
    return handleRequest<GoalAllocation>('POST', `${goalId}/allocations`, input);
  };

  const removeAllocation = async (goalId: string, accountId: string): Promise<void> => {
    await handleRequest('DELETE', `${goalId}/allocations/${accountId}`);
  };

  // Probabilistic Planning Methods (Monte Carlo Integration)
  const getGoalProbability = async (goalId: string): Promise<GoalProbabilityResult | null> => {
    return handleRequest<GoalProbabilityResult>('GET', `${goalId}/probability`);
  };

  const updateGoalProbability = async (goalId: string): Promise<{ message: string } | null> => {
    return handleRequest<{ message: string }>('POST', `${goalId}/probability/update`);
  };

  const runWhatIfScenario = async (
    goalId: string,
    scenario: WhatIfScenario
  ): Promise<GoalProbabilityResult | null> => {
    return handleRequest<GoalProbabilityResult>('POST', `${goalId}/what-if`, scenario);
  };

  const updateAllGoalProbabilities = async (
    spaceId: string
  ): Promise<{ message: string } | null> => {
    return handleRequest<{ message: string }>('POST', `space/${spaceId}/probability/update-all`);
  };

  // Collaboration Methods (Goal Sharing)
  const shareGoal = async (goalId: string, input: ShareGoalInput): Promise<GoalShare | null> => {
    return handleRequest<GoalShare>('POST', `${goalId}/share`, input);
  };

  const getGoalShares = async (goalId: string): Promise<GoalShare[] | null> => {
    return handleRequest<GoalShare[]>('GET', `${goalId}/shares`);
  };

  const getSharedGoals = async (): Promise<Goal[] | null> => {
    return handleRequest<Goal[]>('GET', 'shared/me');
  };

  const acceptShare = async (shareId: string): Promise<GoalShare | null> => {
    return handleRequest<GoalShare>('POST', `shares/${shareId}/accept`);
  };

  const declineShare = async (shareId: string): Promise<void> => {
    await handleRequest('POST', `shares/${shareId}/decline`);
  };

  const revokeShare = async (shareId: string): Promise<void> => {
    await handleRequest('DELETE', `shares/${shareId}`);
  };

  const updateShareRole = async (
    shareId: string,
    newRole: 'viewer' | 'contributor' | 'editor' | 'manager'
  ): Promise<GoalShare | null> => {
    return handleRequest<GoalShare>('PUT', `shares/${shareId}/role`, { newRole });
  };

  const getGoalActivities = async (goalId: string): Promise<GoalActivity[] | null> => {
    return handleRequest<GoalActivity[]>('GET', `${goalId}/activities`);
  };

  return {
    createGoal,
    getGoalsBySpace,
    getGoalSummary,
    getGoalById,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    addAllocation,
    removeAllocation,
    // Probabilistic Planning
    getGoalProbability,
    updateGoalProbability,
    runWhatIfScenario,
    updateAllGoalProbabilities,
    // Collaboration
    shareGoal,
    getGoalShares,
    getSharedGoals,
    acceptShare,
    declineShare,
    revokeShare,
    updateShareRole,
    getGoalActivities,
    loading,
    error,
  };
}
