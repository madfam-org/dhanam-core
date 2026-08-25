'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dhanam-core/ui';
import { Loader2, Plus, RotateCcw, HelpCircle } from 'lucide-react';
import { useState, useCallback } from 'react';

import {
  ReadyToAssignBanner,
  CategoryAllocationList,
  MonthSelector,
  AllocateModal,
  MoveFundsModal,
  AddIncomeModal,
  IncomeEventsList,
  GoalEditor,
  RolloverModal,
} from '@/components/budgets/zero-based';
import {
  useAllocationStatus,
  useCreateIncomeEvent,
  useAllocateFunds,
  useMoveFunds,
  useAutoAllocate,
  useRolloverMonth,
  useSetCategoryGoal,
} from '@/hooks/useZeroBasedQuery';
import {
  CategoryAllocationStatus,
  CreateIncomeEventDto,
  SetCategoryGoalDto,
} from '@/lib/api/zero-based';
import { useSpaceStore } from '@/stores/space';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function ZeroBasedBudgetPage() {
  const { t } = useTranslation('budgets');
  const { currentSpace } = useSpaceStore();
  const currency = currentSpace?.currency ?? Currency.USD;

  // Month state
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  // Modal states
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isMoveFundsOpen, setIsMoveFundsOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false);
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryAllocationStatus | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>();

  // Queries
  const { data: allocationStatus, isLoading, error } = useAllocationStatus(currentMonth);

  // Mutations
  const createIncomeMutation = useCreateIncomeEvent();
  const allocateMutation = useAllocateFunds();
  const moveFundsMutation = useMoveFunds();
  const autoAllocateMutation = useAutoAllocate();
  const rolloverMutation = useRolloverMonth();
  const setGoalMutation = useSetCategoryGoal();

  // Handlers
  const handleAllocateClick = useCallback(() => {
    setPreselectedCategoryId(undefined);
    setIsAllocateOpen(true);
  }, []);

  const handleAllocateCategory = useCallback((categoryId: string) => {
    setPreselectedCategoryId(categoryId);
    setIsAllocateOpen(true);
  }, []);

  const handleMoveFundsCategory = useCallback((categoryId: string) => {
    setPreselectedCategoryId(categoryId);
    setIsMoveFundsOpen(true);
  }, []);

  const handleEditGoal = useCallback(
    (categoryId: string) => {
      const category = allocationStatus?.categories?.find((c) => c.categoryId === categoryId);
      if (category) {
        setSelectedCategory(category);
        setIsGoalEditorOpen(true);
      }
    },
    [allocationStatus?.categories]
  );

  const handleAutoAllocate = useCallback(async () => {
    await autoAllocateMutation.mutateAsync(undefined);
  }, [autoAllocateMutation]);

  const handleAddIncome = useCallback(
    async (dto: CreateIncomeEventDto) => {
      await createIncomeMutation.mutateAsync(dto);
    },
    [createIncomeMutation]
  );

  const handleAllocate = useCallback(
    async (categoryId: string, amount: number, notes?: string) => {
      await allocateMutation.mutateAsync({
        categoryId,
        amount,
        notes,
      });
    },
    [allocateMutation]
  );

  const handleMoveFunds = useCallback(
    async (fromCategoryId: string, toCategoryId: string, amount: number, notes?: string) => {
      await moveFundsMutation.mutateAsync({
        fromCategoryId,
        toCategoryId,
        amount,
        notes,
      });
    },
    [moveFundsMutation]
  );

  const handleSetGoal = useCallback(
    async (categoryId: string, dto: SetCategoryGoalDto) => {
      await setGoalMutation.mutateAsync({ categoryId, dto });
    },
    [setGoalMutation]
  );

  const handleRollover = useCallback(
    async (dto: { fromMonth: string; toMonth: string }) => {
      await rolloverMutation.mutateAsync(dto);
    },
    [rolloverMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">{t('zeroBased.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isDemoMode = false;

    if (isDemoMode) {
      return (
        <div className="container mx-auto space-y-6 py-6">
          <div>
            <h1 className="text-2xl font-bold">{t('zeroBased.title')}</h1>
            <p className="text-muted-foreground">
              {t('zeroBased.description', { name: currentSpace?.name ?? '' })}
            </p>
          </div>
          <div className="flex h-[300px] items-center justify-center rounded-lg border bg-card">
            <div className="flex flex-col items-center gap-4 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">{t('zeroBased.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {t('zeroBased.emptyDescription')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium text-red-600">{t('zeroBased.errorTitle')}</p>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : t('zeroBased.errorFallback')}
          </p>
          <Button onClick={() => window.location.reload()}>{t('zeroBased.retry')}</Button>
        </div>
      </div>
    );
  }

  // No space selected
  if (!currentSpace) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <p className="text-muted-foreground">{t('zeroBased.noSpace')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('zeroBased.title')}</h1>
          <p className="text-muted-foreground">
            {t('zeroBased.description', { name: currentSpace.name })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddIncomeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('zeroBased.addIncome')}
          </Button>
          <Button variant="outline" onClick={() => setIsRolloverOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('zeroBased.rollover')}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setIsHowItWorksOpen(true)}
        >
          <HelpCircle className="h-4 w-4" />
          {t('zeroBased.howItWorks')}
        </Button>
      </div>

      {/* Ready to Assign Banner */}
      {allocationStatus && (
        <ReadyToAssignBanner
          totalIncome={allocationStatus.totalIncome}
          totalAllocated={allocationStatus.totalAllocated}
          unallocated={allocationStatus.unallocated}
          totalSpent={allocationStatus.totalSpent}
          isFullyAllocated={allocationStatus.isFullyAllocated}
          currency={currency}
          onAllocate={handleAllocateClick}
          onAutoAllocate={handleAutoAllocate}
          isAutoAllocating={autoAllocateMutation.isPending}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Allocations - Takes 2 columns */}
        <div className="lg:col-span-2">
          {allocationStatus && (
            <CategoryAllocationList
              categories={allocationStatus.categories}
              currency={currency}
              onAllocate={handleAllocateCategory}
              onMoveFunds={handleMoveFundsCategory}
              onEditGoal={handleEditGoal}
            />
          )}
        </div>

        {/* Income Events Sidebar */}
        <div className="space-y-6">
          {allocationStatus && (
            <IncomeEventsList
              incomeEvents={allocationStatus.incomeEvents}
              currency={currency}
              onAddIncome={() => setIsAddIncomeOpen(true)}
              compact
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <AllocateModal
        open={isAllocateOpen}
        onOpenChange={setIsAllocateOpen}
        categories={allocationStatus?.categories || []}
        unallocated={allocationStatus?.unallocated || 0}
        currency={currency}
        preselectedCategoryId={preselectedCategoryId}
        onAllocate={handleAllocate}
        isLoading={allocateMutation.isPending}
      />

      <MoveFundsModal
        open={isMoveFundsOpen}
        onOpenChange={setIsMoveFundsOpen}
        categories={allocationStatus?.categories || []}
        currency={currency}
        preselectedFromCategoryId={preselectedCategoryId}
        onMoveFunds={handleMoveFunds}
        isLoading={moveFundsMutation.isPending}
      />

      <AddIncomeModal
        open={isAddIncomeOpen}
        onOpenChange={setIsAddIncomeOpen}
        currency={currency}
        onAddIncome={handleAddIncome}
        isLoading={createIncomeMutation.isPending}
      />

      <GoalEditor
        open={isGoalEditorOpen}
        onOpenChange={setIsGoalEditorOpen}
        category={selectedCategory}
        currency={currency}
        onSaveGoal={handleSetGoal}
        isLoading={setGoalMutation.isPending}
      />

      <RolloverModal
        open={isRolloverOpen}
        onOpenChange={setIsRolloverOpen}
        currentMonth={currentMonth}
        categories={allocationStatus?.categories || []}
        currency={currency}
        onRollover={handleRollover}
        isLoading={rolloverMutation.isPending}
      />

      {/* How It Works Dialog */}
      <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('zeroBased.howItWorksDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((step) => (
              <div key={step}>
                <h4 className="font-medium">{t(`zeroBased.howItWorksDialog.${step}Title`)}</h4>
                <p className="text-sm text-muted-foreground">
                  {t(`zeroBased.howItWorksDialog.${step}Desc`)}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHowItWorksOpen(false)}>
              {t('zeroBased.howItWorksDialog.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
