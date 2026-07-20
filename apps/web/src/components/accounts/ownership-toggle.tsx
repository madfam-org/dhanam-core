'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@dhanam-core/ui';
import { Users, User, Heart } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export type OwnershipFilter = 'yours' | 'mine' | 'ours';

interface OwnershipToggleProps {
  spaceId: string;
  onFilterChange?: (filter: OwnershipFilter) => void;
  netWorth?: {
    yours: number;
    mine: number;
    ours: number;
    total: number;
  };
  currency?: string;
  partnerName?: string; // Name of the other household member
}

export function OwnershipToggle({
  spaceId: _spaceId,
  onFilterChange,
  netWorth,
  currency = 'USD',
  partnerName = 'Partner',
}: OwnershipToggleProps) {
  const [activeFilter, setActiveFilter] = useState<OwnershipFilter>('yours');

  const handleFilterChange = (value: string) => {
    const filter = value as OwnershipFilter;
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Net Worth Summary */}
      {netWorth && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              activeFilter === 'yours' && 'ring-2 ring-primary'
            )}
            onClick={() => handleFilterChange('yours')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yours</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth.yours)}</div>
              <p className="text-xs text-muted-foreground">Your individual accounts</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              activeFilter === 'mine' && 'ring-2 ring-primary'
            )}
            onClick={() => handleFilterChange('mine')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mine</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth.mine)}</div>
              <p className="text-xs text-muted-foreground">{partnerName}'s accounts</p>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              activeFilter === 'ours' && 'ring-2 ring-primary'
            )}
            onClick={() => handleFilterChange('ours')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ours</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth.ours)}</div>
              <p className="text-xs text-muted-foreground">Joint accounts</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netWorth.total)}</div>
              <p className="text-xs text-muted-foreground">Combined net worth</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab-based Filter */}
      <Tabs value={activeFilter} onValueChange={handleFilterChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="yours" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Yours
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mine
          </TabsTrigger>
          <TabsTrigger value="ours" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Ours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>
                Individual accounts owned by you. These are visible only to you unless shared.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{partnerName}'s Accounts</CardTitle>
              <CardDescription>
                Individual accounts owned by {partnerName}. Visibility depends on sharing settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="ours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Joint Accounts</CardTitle>
              <CardDescription>
                Shared accounts accessible to all household members. Perfect for joint expenses and
                savings.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
