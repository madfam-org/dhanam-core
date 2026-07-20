'use client';

import { useState, useCallback } from 'react';

import {
  analyticsApi,
  type NetWorthByOwnership,
  type AccountWithOwnership,
  type OwnershipFilter,
} from '@/lib/api/analytics';

export interface UseOwnershipNetWorthResult {
  netWorth: NetWorthByOwnership | null;
  accounts: AccountWithOwnership[];
  loading: boolean;
  error: string | null;
  fetchNetWorthByOwnership: (spaceId: string) => Promise<void>;
  fetchAccountsByOwnership: (spaceId: string, filter?: OwnershipFilter) => Promise<void>;
}

export function useOwnershipNetWorth(): UseOwnershipNetWorthResult {
  const [netWorth, setNetWorth] = useState<NetWorthByOwnership | null>(null);
  const [accounts, setAccounts] = useState<AccountWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNetWorthByOwnership = useCallback(async (spaceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getNetWorthByOwnership(spaceId);
      setNetWorth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch net worth by ownership');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccountsByOwnership = useCallback(
    async (spaceId: string, filter?: OwnershipFilter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyticsApi.getAccountsByOwnership(spaceId, filter);
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts by ownership');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    netWorth,
    accounts,
    loading,
    error,
    fetchNetWorthByOwnership,
    fetchAccountsByOwnership,
  };
}

export type { NetWorthByOwnership, AccountWithOwnership, OwnershipFilter };
