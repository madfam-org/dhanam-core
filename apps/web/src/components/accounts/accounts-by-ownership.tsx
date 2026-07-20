'use client';

import { Skeleton } from '@dhanam-core/ui';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { OwnershipToggle, type OwnershipFilter } from './ownership-toggle';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  ownership: 'individual' | 'joint' | 'trust';
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

interface NetWorth {
  yours: number;
  mine: number;
  ours: number;
  total: number;
}

interface AccountsByOwnershipProps {
  spaceId: string;
  currency?: string;
  partnerName?: string;
}

export function AccountsByOwnership({
  spaceId,
  currency = 'USD',
  partnerName = 'Partner',
}: AccountsByOwnershipProps) {
  const [filter, setFilter] = useState<OwnershipFilter>('yours');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [netWorth, setNetWorth] = useState<NetWorth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch net worth summary
  useEffect(() => {
    const fetchNetWorth = async () => {
      try {
        const response = await fetch(`/api/spaces/${spaceId}/accounts/net-worth/by-ownership`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch net worth');
        }

        const data = await response.json();
        setNetWorth(data);
      } catch (err) {
        console.error('Error fetching net worth:', err);
        setError('Failed to load net worth');
      }
    };

    fetchNetWorth();
  }, [spaceId]);

  // Fetch accounts by ownership filter
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/accounts/by-ownership/${filter}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }

        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [spaceId, filter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'savings':
        return <Wallet className="h-4 w-4" />;
      case 'investment':
      case 'crypto':
        return <TrendingUp className="h-4 w-4" />;
      case 'credit':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getAccountTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'savings':
        return 'default';
      case 'investment':
      case 'crypto':
        return 'secondary';
      case 'credit':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <OwnershipToggle
        spaceId={spaceId}
        onFilterChange={setFilter}
        netWorth={netWorth || undefined}
        currency={currency}
        partnerName={partnerName}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          {filter === 'yours' && 'Your Accounts'}
          {filter === 'mine' && `${partnerName}'s Accounts`}
          {filter === 'ours' && 'Joint Accounts'}
        </h2>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {filter === 'yours' && 'You have no individual accounts yet.'}
                {filter === 'mine' && `${partnerName} has no individual accounts yet.`}
                {filter === 'ours' && 'No joint accounts yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium line-clamp-1">{account.name}</CardTitle>
                  {getAccountTypeIcon(account.type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getAccountTypeBadgeVariant(account.type)}>{account.type}</Badge>
                    {account.owner && filter === 'mine' && (
                      <span className="text-xs text-muted-foreground">{account.owner.name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
