'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Users,
  Plus,
  Home,
  Building2,
  Briefcase,
  Target,
  Loader2,
  DollarSign,
  Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { OwnershipToggle } from '@/components/accounts/ownership-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useHouseholds,
  type Household,
  type HouseholdNetWorth,
  type HouseholdGoalSummary,
  type CreateHouseholdInput,
} from '@/hooks/useHouseholds';
import { useOwnershipNetWorth, type OwnershipFilter } from '@/hooks/useOwnershipNetWorth';

export default function HouseholdsPage() {
  const { t } = useTranslation('households');
  const {
    getHouseholds,
    getHousehold,
    createHousehold,
    getHouseholdNetWorth,
    getHouseholdGoalSummary,
    loading,
    error,
  } = useHouseholds();

  const {
    netWorth: ownershipNetWorth,
    accounts: ownershipAccounts,
    loading: ownershipLoading,
    fetchNetWorthByOwnership,
    fetchAccountsByOwnership,
  } = useOwnershipNetWorth();

  const { t: tCommon } = useTranslation('common');
  const [loadError, setLoadError] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [netWorth, setNetWorth] = useState<HouseholdNetWorth | null>(null);
  const [goalSummary, setGoalSummary] = useState<HouseholdGoalSummary | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOwnershipFilter, setSelectedOwnershipFilter] = useState<OwnershipFilter>('yours');
  const [newHousehold, setNewHousehold] = useState<CreateHouseholdInput>({
    name: '',
    type: 'family',
    baseCurrency: 'USD',
    description: '',
  });

  useEffect(() => {
    loadHouseholds();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reason: Only load on mount; getHouseholds is stable from useHouseholds hook
  }, []);

  const loadHouseholds = async () => {
    setLoadError(false);
    try {
      const data = await getHouseholds();
      setHouseholds(data);
    } catch (err) {
      console.error('Failed to load households:', err);
      setLoadError(true);
    }
  };

  const handleHouseholdClick = async (household: Household) => {
    try {
      const [fullHousehold, netWorthData, goalsData] = await Promise.all([
        getHousehold(household.id),
        getHouseholdNetWorth(household.id),
        getHouseholdGoalSummary(household.id),
      ]);

      setSelectedHousehold(fullHousehold);
      setNetWorth(netWorthData);
      setGoalSummary(goalsData);

      // Fetch ownership breakdown for the first space if available
      const firstSpace = fullHousehold.spaces?.[0];
      if (firstSpace) {
        await Promise.all([
          fetchNetWorthByOwnership(firstSpace.id),
          fetchAccountsByOwnership(firstSpace.id, 'all'),
        ]);
      }
    } catch (err) {
      console.error('Failed to load household details:', err);
    }
  };

  const handleOwnershipFilterChange = async (filter: OwnershipFilter) => {
    setSelectedOwnershipFilter(filter);
    const firstSpace = selectedHousehold?.spaces?.[0];
    if (firstSpace) {
      await fetchAccountsByOwnership(firstSpace.id, filter === 'yours' ? undefined : filter);
    }
  };

  const handleCreateHousehold = async () => {
    try {
      await createHousehold(newHousehold);
      setIsCreateDialogOpen(false);
      setNewHousehold({
        name: '',
        type: 'family',
        baseCurrency: 'USD',
        description: '',
      });
      loadHouseholds();
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  };

  const getHouseholdIcon = (type: string) => {
    switch (type) {
      case 'family':
        return <Home className="h-5 w-5" />;
      case 'trust':
        return <Building2 className="h-5 w-5" />;
      case 'estate':
        return <Building2 className="h-5 w-5" />;
      case 'partnership':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('page.createHousehold')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.createTitle')}</DialogTitle>
              <DialogDescription>{t('dialog.createDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('fields.name')}</Label>
                <Input
                  id="name"
                  value={newHousehold.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewHousehold({ ...newHousehold, name: e.target.value })
                  }
                  placeholder={t('fields.namePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="type">{t('fields.type')}</Label>
                <Select
                  value={newHousehold.type}
                  onValueChange={(value: string) =>
                    setNewHousehold({
                      ...newHousehold,
                      type: value as 'family' | 'trust' | 'estate' | 'partnership',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">{t('types.family')}</SelectItem>
                    <SelectItem value="trust">{t('types.trust')}</SelectItem>
                    <SelectItem value="estate">{t('types.estate')}</SelectItem>
                    <SelectItem value="partnership">{t('types.partnership')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">{t('fields.baseCurrency')}</Label>
                <Select
                  value={newHousehold.baseCurrency}
                  onValueChange={(value: string) =>
                    setNewHousehold({ ...newHousehold, baseCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">{t('fields.descriptionOptional')}</Label>
                <Input
                  id="description"
                  value={newHousehold.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewHousehold({ ...newHousehold, description: e.target.value })
                  }
                  placeholder={t('fields.descriptionPlaceholder')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={handleCreateHousehold} disabled={!newHousehold.name}>
                {t('actions.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && households.length === 0 && !loadError && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {loadError && households.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button onClick={() => loadHouseholds()}>{tCommon('tryAgain')}</Button>
          </CardContent>
        </Card>
      )}

      {/* Households List */}
      {!loading && !loadError && households.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('page.createHousehold')}
            </Button>
          </CardContent>
        </Card>
      )}

      {households.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household) => (
            <Card
              key={household.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleHouseholdClick(household)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getHouseholdIcon(household.type)}
                    <CardTitle className="text-xl">{household.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {household.type}
                  </Badge>
                </div>
                {household.description && (
                  <CardDescription>{household.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('labels.members')}</span>
                    <span className="font-medium">
                      {household.members?.length || household._count?.spaces || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('labels.spaces')}</span>
                    <span className="font-medium">{household._count?.spaces || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('labels.goals')}</span>
                    <span className="font-medium">{household._count?.goals || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Household Details */}
      {selectedHousehold && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{selectedHousehold.name} Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Net Worth Card */}
            {netWorth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('detail.totalNetWorth')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(netWorth.totalNetWorth, selectedHousehold.baseCurrency)}
                  </div>
                  {(netWorth?.bySpace ?? []).length > 0 && (
                    <div className="mt-4 space-y-2">
                      {(netWorth?.bySpace ?? []).map((space) => (
                        <div key={space.spaceId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{space.spaceName}:</span>
                          <span className="font-medium">
                            {formatCurrency(space.netWorth, selectedHousehold.baseCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Goals Summary Card */}
            {goalSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t('detail.goalsSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('detail.totalGoals')}</span>
                      <span className="font-medium">{goalSummary.totalGoals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('detail.active')}</span>
                      <span className="font-medium">{goalSummary.activeGoals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('detail.achieved')}</span>
                      <span className="font-medium">{goalSummary.achievedGoals}</span>
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t">
                      <span className="text-muted-foreground">{t('detail.targetAmount')}</span>
                      <span className="font-medium">
                        {formatCurrency(
                          goalSummary.totalTargetAmount,
                          selectedHousehold.baseCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('detail.members')} ({selectedHousehold.members?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedHousehold.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{member.user?.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {member.relationship}
                        </div>
                      </div>
                      {member.isMinor && (
                        <Badge variant="secondary" className="text-xs">
                          {t('detail.minor')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yours, Mine, Ours Section */}
          {selectedHousehold.spaces && selectedHousehold.spaces.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">{t('detail.yoursMineOurs')}</h3>
              </div>
              <p className="text-muted-foreground">{t('detail.ownershipDescription')}</p>

              {ownershipLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {ownershipNetWorth && selectedHousehold.spaces?.[0] && (
                    <OwnershipToggle
                      spaceId={selectedHousehold.spaces[0].id}
                      netWorth={{
                        yours: ownershipNetWorth.yours,
                        mine: ownershipNetWorth.mine,
                        ours: ownershipNetWorth.ours,
                        total: ownershipNetWorth.total,
                      }}
                      currency={ownershipNetWorth.currency || selectedHousehold.baseCurrency}
                      onFilterChange={(filter) =>
                        handleOwnershipFilterChange(filter as OwnershipFilter)
                      }
                      partnerName={
                        selectedHousehold.members?.find((m) => m.relationship === 'spouse')?.user
                          ?.name || 'Partner'
                      }
                    />
                  )}

                  {/* Filtered Accounts List */}
                  {ownershipAccounts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium mb-4">
                        {selectedOwnershipFilter === 'yours'
                          ? t('detail.yourAccounts')
                          : selectedOwnershipFilter === 'mine'
                            ? t('detail.partnerAccounts')
                            : selectedOwnershipFilter === 'ours'
                              ? t('detail.jointAccounts')
                              : t('detail.allAccounts')}
                        <Badge variant="secondary" className="ml-2">
                          {ownershipAccounts.length}
                        </Badge>
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ownershipAccounts.map((account) => (
                          <Card key={account.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">
                                  {account.name}
                                </CardTitle>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {account.ownershipCategory}
                                </Badge>
                              </div>
                              <CardDescription className="capitalize">
                                {account.type}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatCurrency(account.balance, account.currency)}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
