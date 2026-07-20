import { useState } from 'react';

import { useAuth } from '@/lib/hooks/use-auth';

export interface Will {
  id: string;
  householdId: string;
  name: string;
  status: 'draft' | 'active' | 'revoked' | 'executed';
  lastReviewedAt?: string;
  activatedAt?: string;
  revokedAt?: string;
  executedAt?: string;
  notes?: string;
  legalDisclaimer: boolean;
  createdAt: string;
  updatedAt: string;
  beneficiaries?: Beneficiary[];
  executors?: Executor[];
  household?: {
    id: string;
    name: string;
    type: string;
  };
  _count?: {
    beneficiaries: number;
    executors: number;
  };
}

export interface Beneficiary {
  id: string;
  willId: string;
  beneficiaryId: string;
  assetType:
    | 'bank_account'
    | 'investment_account'
    | 'crypto_account'
    | 'real_estate'
    | 'business_interest'
    | 'personal_property'
    | 'other';
  assetId?: string;
  percentage: number;
  // Freeform JSON legal clauses with no fixed schema
  conditions?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  beneficiary?: {
    id: string;
    relationship: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface Executor {
  id: string;
  willId: string;
  executorId: string;
  isPrimary: boolean;
  order: number;
  acceptedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  executor?: {
    id: string;
    relationship: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateWillInput {
  householdId: string;
  name: string;
  notes?: string;
  legalDisclaimer?: boolean;
}

export interface UpdateWillInput {
  name?: string;
  notes?: string;
  legalDisclaimer?: boolean;
}

export interface AddBeneficiaryInput {
  beneficiaryId: string;
  assetType: Beneficiary['assetType'];
  assetId?: string;
  percentage: number;
  // Freeform JSON legal clauses with no fixed schema
  conditions?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateBeneficiaryInput {
  assetType?: Beneficiary['assetType'];
  assetId?: string;
  percentage?: number;
  // Freeform JSON legal clauses with no fixed schema
  conditions?: Record<string, unknown>;
  notes?: string;
}

export interface AddExecutorInput {
  executorId: string;
  isPrimary?: boolean;
  order?: number;
  notes?: string;
}

export interface UpdateExecutorInput {
  isPrimary?: boolean;
  order?: number;
  notes?: string;
}

export function useWills() {
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

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  const createWill = async (input: CreateWillInput): Promise<Will> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/wills', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWillsByHousehold = async (householdId: string): Promise<Will[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/household/${householdId}`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wills';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWill = async (id: string): Promise<Will> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${id}`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWill = async (id: string, input: UpdateWillInput): Promise<Will> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWill = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`/wills/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activateWill = async (id: string): Promise<Will> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${id}/activate`, {
        method: 'POST',
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const revokeWill = async (id: string): Promise<Will> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${id}/revoke`, {
        method: 'POST',
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateWill = async (id: string): Promise<ValidationResult> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${id}/validate`);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate will';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addBeneficiary = async (
    willId: string,
    input: AddBeneficiaryInput
  ): Promise<Beneficiary> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${willId}/beneficiaries`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add beneficiary';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBeneficiary = async (
    willId: string,
    beneficiaryId: string,
    input: UpdateBeneficiaryInput
  ): Promise<Beneficiary> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${willId}/beneficiaries/${beneficiaryId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update beneficiary';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeBeneficiary = async (willId: string, beneficiaryId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`/wills/${willId}/beneficiaries/${beneficiaryId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove beneficiary';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addExecutor = async (willId: string, input: AddExecutorInput): Promise<Executor> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${willId}/executors`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add executor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExecutor = async (
    willId: string,
    executorId: string,
    input: UpdateExecutorInput
  ): Promise<Executor> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/wills/${willId}/executors/${executorId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update executor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeExecutor = async (willId: string, executorId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fetchWithAuth(`/wills/${willId}/executors/${executorId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove executor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createWill,
    getWillsByHousehold,
    getWill,
    updateWill,
    deleteWill,
    activateWill,
    revokeWill,
    validateWill,
    addBeneficiary,
    updateBeneficiary,
    removeBeneficiary,
    addExecutor,
    updateExecutor,
    removeExecutor,
  };
}
