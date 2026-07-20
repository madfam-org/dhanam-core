import { useState } from 'react';

import { useAuth } from '@/lib/hooks/use-auth';

export interface Household {
  id: string;
  name: string;
  type: 'family' | 'trust' | 'estate' | 'partnership';
  baseCurrency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: HouseholdMember[];
  spaces?: HouseholdSpace[];
  goals?: HouseholdGoal[];
  _count?: {
    spaces: number;
    goals: number;
  };
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  relationship:
    | 'spouse'
    | 'partner'
    | 'child'
    | 'parent'
    | 'sibling'
    | 'grandparent'
    | 'grandchild'
    | 'dependent'
    | 'trustee'
    | 'beneficiary'
    | 'other';
  isMinor: boolean;
  accessStartDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    dateOfBirth?: string;
  };
}

export interface HouseholdSpace {
  id: string;
  name: string;
  type: string;
  currency: string;
}

export interface HouseholdGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currency: string;
  targetDate: string;
  status: string;
}

export interface HouseholdNetWorth {
  totalNetWorth: number;
  bySpace: {
    spaceId: string;
    spaceName: string;
    netWorth: number;
    assets: number;
    liabilities: number;
  }[];
  byCurrency: Record<string, number>;
}

export interface HouseholdGoalSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  totalTargetAmount: number;
  byType: Record<string, number>;
}

export interface CreateHouseholdInput {
  name: string;
  type?: Household['type'];
  baseCurrency?: string;
  description?: string;
}

export interface UpdateHouseholdInput {
  name?: string;
  type?: Household['type'];
  baseCurrency?: string;
  description?: string;
}

export interface AddMemberInput {
  userId: string;
  relationship: HouseholdMember['relationship'];
  isMinor?: boolean;
  accessStartDate?: string;
  notes?: string;
}

export interface UpdateMemberInput {
  relationship?: HouseholdMember['relationship'];
  isMinor?: boolean;
  accessStartDate?: string;
  notes?: string;
}

export function useHouseholds() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010';

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  /**
   * Get all households for the current user
   */
  const getHouseholds = async (): Promise<Household[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/households');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch households';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single household by ID
   */
  const getHousehold = async (id: string): Promise<Household> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${id}`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch household';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new household
   */
  const createHousehold = async (input: CreateHouseholdInput): Promise<Household> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/households', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create household';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a household
   */
  const updateHousehold = async (id: string, input: UpdateHouseholdInput): Promise<Household> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update household';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a household
   */
  const deleteHousehold = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`/households/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete household';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get household net worth aggregation
   */
  const getHouseholdNetWorth = async (id: string): Promise<HouseholdNetWorth> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${id}/net-worth`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch net worth';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get household goal summary
   */
  const getHouseholdGoalSummary = async (id: string): Promise<HouseholdGoalSummary> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${id}/goals/summary`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch goal summary';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a member to a household
   */
  const addMember = async (
    householdId: string,
    input: AddMemberInput
  ): Promise<HouseholdMember> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${householdId}/members`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a household member
   */
  const updateMember = async (
    householdId: string,
    memberId: string,
    input: UpdateMemberInput
  ): Promise<HouseholdMember> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/households/${householdId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update member';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a member from a household
   */
  const removeMember = async (householdId: string, memberId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`/households/${householdId}/members/${memberId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getHouseholds,
    getHousehold,
    createHousehold,
    updateHousehold,
    deleteHousehold,
    getHouseholdNetWorth,
    getHouseholdGoalSummary,
    addMember,
    updateMember,
    removeMember,
  };
}
