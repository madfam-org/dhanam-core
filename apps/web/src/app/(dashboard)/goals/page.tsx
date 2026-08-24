'use client';

import { useTranslation, FINANCIAL_DEFAULTS } from '@dhanam-core/shared';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calculator,
  Loader2,
  Users,
  Pencil,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { GoalActivityFeed } from '@/components/goals/goal-activity-feed';
import { GoalEditDialog } from '@/components/goals/goal-edit-dialog';
import { ShareGoalDialog } from '@/components/goals/share-goal-dialog';
import { ShareManagementPanel } from '@/components/goals/share-management-panel';
import { SharedGoalsList } from '@/components/goals/shared-goals-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  useGoals,
  type Goal,
  type GoalProgress,
  type GoalSummary,
  UpdateGoalInput,
} from '@/hooks/useGoals';
import { useSimulations, type GoalProbabilityResult } from '@/hooks/useSimulations';
import { useSpaceStore } from '@/stores/space';
import { fireGoalConfetti } from '~/lib/celebrations';
import { formatDate } from '~/lib/utils';

export default function GoalsPage() {
  const { t } = useTranslation('goals');
  const { t: tCommon } = useTranslation('common');
  const {
    getGoalsBySpace,
    getGoalSummary,
    getGoalProgress,
    updateGoal,
    deleteGoal,
    loading: _loading,
    error,
  } = useGoals();
  const { calculateGoalProbability } = useSimulations();
  const analytics = useAnalytics();
  const { currentSpace } = useSpaceStore();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [probability, setProbability] = useState<GoalProbabilityResult | null>(null);
  const [loadingProbability, setLoadingProbability] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);

  // Get spaceId from current space context
  const spaceId = currentSpace?.id;

  useEffect(() => {
    if (spaceId) {
      loadGoals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reason: loadGoals depends on hook functions that are stable; only re-run when spaceId changes
  }, [spaceId]);

  const loadGoals = async () => {
    if (!spaceId) return;

    const [goalsData, summaryData] = await Promise.all([
      getGoalsBySpace(spaceId),
      getGoalSummary(spaceId),
    ]);

    if (goalsData) {
      setGoals(goalsData);
      // Check for newly achieved goals and celebrate
      for (const goal of goalsData) {
        if (goal.status === 'achieved') {
          const celebratedKey = `dhanam_celebrated_goal_${goal.id}`;
          try {
            if (!localStorage.getItem(celebratedKey)) {
              localStorage.setItem(celebratedKey, 'true');
              fireGoalConfetti();
              break; // One celebration at a time
            }
          } catch {
            // localStorage unavailable
          }
        }
      }
    }
    if (summaryData) setSummary(summaryData);
  };

  const handleGoalClick = async (goal: Goal) => {
    setSelectedGoal(goal);
    setProbability(null);

    const progress = await getGoalProgress(goal.id);
    setGoalProgress(progress);

    // Celebrate if goal is achieved
    if (progress && progress.currentValue >= parseFloat(goal.targetAmount.toString())) {
      const celebratedKey = `dhanam_celebrated_goal_${goal.id}`;
      try {
        if (!localStorage.getItem(celebratedKey)) {
          localStorage.setItem(celebratedKey, 'true');
          fireGoalConfetti();
        }
      } catch {
        // localStorage unavailable
      }
    }

    // Track goal progress view
    if (progress) {
      analytics.trackGoalProgressViewed(goal.id, progress.percentComplete, progress.onTrack);
    }
  };

  const calculateProbability = async () => {
    if (!selectedGoal || !goalProgress) return;

    setLoadingProbability(true);
    const targetDate = new Date(selectedGoal.targetDate);
    const now = new Date();
    const monthsRemaining = Math.max(
      1,
      (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth())
    );

    const result = await calculateGoalProbability({
      goalId: selectedGoal.id,
      currentValue: goalProgress.currentValue,
      targetAmount: parseFloat(selectedGoal.targetAmount.toString()),
      monthsRemaining,
      monthlyContribution: goalProgress.monthlyContributionNeeded || 0,
      expectedReturn: FINANCIAL_DEFAULTS.EXPECTED_RETURN,
      volatility: FINANCIAL_DEFAULTS.VOLATILITY,
    });

    if (result) {
      setProbability(result);

      // Track goal probability calculation
      analytics.trackGoalProbabilityCalculated(
        selectedGoal.id,
        result.probabilityOfSuccess,
        result.medianOutcome,
        parseFloat(selectedGoal.targetAmount.toString())
      );
    }

    setLoadingProbability(false);
  };

  const handleSaveGoal = async (updates: UpdateGoalInput) => {
    if (!selectedGoal) return;
    setIsSavingGoal(true);
    try {
      const result = await updateGoal(selectedGoal.id, updates);
      if (result) {
        setSelectedGoal(result);
        setIsEditDialogOpen(false);
        toast.success(t('toast.goalUpdated'));
        await loadGoals();
        // Refresh progress for updated goal
        const progress = await getGoalProgress(result.id);
        setGoalProgress(progress);
      } else {
        toast.error(t('toast.goalUpdateFailed'));
      }
    } catch {
      toast.error(t('toast.goalUpdateFailed'));
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setIsDeletingGoal(true);
    try {
      await deleteGoal(goalId);
      setSelectedGoal(null);
      setGoalProgress(null);
      setProbability(null);
      setIsEditDialogOpen(false);
      toast.success(t('toast.goalDeleted'));
      await loadGoals();
    } catch {
      toast.error(t('toast.goalDeleteFailed'));
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const getGoalTypeLabel = (type: Goal['type']): string => {
    const keys: Record<Goal['type'], string> = {
      retirement: 'types.retirement',
      education: 'types.education',
      house_purchase: 'types.home',
      emergency_fund: 'types.emergency',
      legacy: 'types.legacy',
      travel: 'types.travel',
      business: 'types.business',
      debt_payoff: 'types.debtPayoff',
      other: 'types.custom',
    };
    return t(keys[type]);
  };

  const getStatusColor = (status: Goal['status']) => {
    const colors = {
      active: 'bg-blue-600',
      paused: 'bg-yellow-600',
      achieved: 'bg-green-600',
      abandoned: 'bg-gray-600',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Goal['status']): string => {
    const keys: Record<Goal['status'], string> = {
      active: 'status.active',
      paused: 'status.paused',
      achieved: 'status.achieved',
      abandoned: 'status.abandoned',
    };
    return t(keys[status]);
  };

  // Show loading state while waiting for space context
  if (!currentSpace) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('main.financialGoals')}</h1>
          <p className="text-muted-foreground mt-2">{t('page.loadingSpace')}</p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('main.financialGoals')}</h1>
          <p className="text-muted-foreground mt-2">{t('page.description')}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button onClick={() => loadGoals()}>{tCommon('tryAgain')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{t('main.financialGoals')}</h1>
        <p className="text-muted-foreground mt-2">{t('page.description')}</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('page.totalGoals')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalGoals}</div>
              <p className="text-xs text-muted-foreground">
                {summary.activeGoals} {t('status.active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('page.targetAmount')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalTargetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">{t('page.acrossAllGoals')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('page.currentValue')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground">{t('page.totalSaved')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('page.overallProgress')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overallProgress.toFixed(1)}%</div>
              <Progress value={summary.overallProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shared Goals Section */}
      <SharedGoalsList
        onGoalClick={(goal) => {
          setSelectedGoal(goal);
          handleGoalClick(goal);
        }}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goals List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('page.yourGoals')}</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('page.addGoal')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('messages.noGoals')}</p>
                  <p className="text-sm">{t('messages.createFirstGoal')}</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => handleGoalClick(goal)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleGoalClick(goal);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                      selectedGoal?.id === goal.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getGoalTypeLabel(goal.type)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(goal.status)}>
                        {getStatusLabel(goal.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{t('page.targetLabel')}</span>
                        <span className="font-semibold">
                          $
                          {parseFloat(goal.targetAmount.toString()).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t('page.dueLabel')}</span>
                        <span>{formatDate(goal.targetDate)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Goal Details & Probability */}
        <div className="lg:col-span-2">
          {selectedGoal && goalProgress ? (
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="progress">{t('tabs.progress')}</TabsTrigger>
                <TabsTrigger value="probability">{t('tabs.probability')}</TabsTrigger>
                <TabsTrigger value="collaboration">
                  <Users className="h-4 w-4 mr-2" />
                  {t('tabs.collaboration')}
                </TabsTrigger>
                <TabsTrigger value="activity">{t('tabs.activity')}</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedGoal.name}</CardTitle>
                        <CardDescription>{selectedGoal.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                          aria-label={t('page.editGoal')}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t('page.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShareDialogOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {t('page.share')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{t('page.goalProgress')}</span>
                        <span className="text-sm font-bold">
                          {goalProgress.percentComplete.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={goalProgress.percentComplete} className="h-3" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>${goalProgress.currentValue.toLocaleString()}</span>
                        <span>
                          ${parseFloat(selectedGoal.targetAmount.toString()).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* On Track Status */}
                    <Alert variant={goalProgress.onTrack ? 'default' : 'destructive'}>
                      {goalProgress.onTrack ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {goalProgress.onTrack ? (
                          <p>{t('page.onTrackMessage')}</p>
                        ) : (
                          <div>
                            <p className="font-semibold mb-1">{t('page.behindSchedule')}</p>
                            <p className="text-sm">
                              {t('page.increaseContribution', {
                                amount: goalProgress.monthlyContributionNeeded.toLocaleString(),
                              })}
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>

                    {/* Time Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{t('page.timeProgress')}</span>
                        <span className="text-sm font-bold">
                          {goalProgress.timeProgress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={goalProgress.timeProgress} className="h-2" />
                    </div>

                    {/* Allocations */}
                    {goalProgress.allocations && goalProgress.allocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3">
                          {t('page.accountAllocations')}
                        </h4>
                        <div className="space-y-2">
                          {goalProgress.allocations.map((alloc) => (
                            <div
                              key={alloc.accountId}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div>
                                <p className="font-medium">{alloc.accountName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {alloc.percentage}% {t('page.allocated')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  $
                                  {alloc.contributedValue.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="probability" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      {t('probability.title')}
                    </CardTitle>
                    <CardDescription>{t('probability.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!probability ? (
                      <div className="text-center py-8">
                        <Button
                          onClick={calculateProbability}
                          disabled={loadingProbability}
                          size="lg"
                        >
                          {loadingProbability ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('probability.runningSimulation')}
                            </>
                          ) : (
                            <>
                              <Calculator className="mr-2 h-4 w-4" />
                              {t('probability.calculateButton')}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Success Rate */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t('probability.probabilityOfSuccess')}
                          </p>
                          <p className="text-4xl font-bold">
                            {(probability.probabilityOfSuccess * 100).toFixed(1)}%
                          </p>
                          <Progress
                            value={probability.probabilityOfSuccess * 100}
                            className="mt-2 h-3"
                          />
                        </div>

                        {/* Median Outcome */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {t('probability.expectedOutcome')}
                            </p>
                            <p className="text-2xl font-semibold">
                              $
                              {probability.medianOutcome.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {t('probability.expectedShortfall')}
                            </p>
                            <p className="text-2xl font-semibold">
                              $
                              {probability.expectedShortfall.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* 90% Confidence Range */}
                        <div>
                          <p className="text-sm font-semibold mb-2">
                            {t('probability.confidenceRange')}
                          </p>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {t('probability.worst10')}
                              </p>
                              <p className="text-lg font-semibold">
                                $
                                {probability.confidence90Range.low.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {t('probability.best10')}
                              </p>
                              <p className="text-lg font-semibold">
                                $
                                {probability.confidence90Range.high.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation */}
                        {probability.recommendedMonthlyContribution >
                          probability.currentMonthlyContribution && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-semibold mb-1">
                                {t('probability.increaseSavings')}
                              </p>
                              <p className="text-sm">
                                {t('probability.recommendedContribution', {
                                  recommended:
                                    probability.recommendedMonthlyContribution.toLocaleString(),
                                  current: probability.currentMonthlyContribution.toLocaleString(),
                                })}
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="collaboration" className="space-y-6">
                <ShareManagementPanel
                  goalId={selectedGoal.id}
                  onUpdate={() => {
                    // Reload goal data to reflect changes
                    handleGoalClick(selectedGoal);
                  }}
                />
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <GoalActivityFeed goalId={selectedGoal.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-[600px] border border-dashed rounded-lg">
              <div className="text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">{t('page.noGoalSelected')}</p>
                <p className="text-sm text-muted-foreground">{t('page.selectGoalPrompt')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Goal Dialog */}
      {selectedGoal && (
        <ShareGoalDialog
          goal={selectedGoal}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onShared={() => {
            // Reload goals to reflect sharing status
            loadGoals();
          }}
        />
      )}

      {/* Goal Edit Dialog */}
      <GoalEditDialog
        goal={selectedGoal}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
        isSaving={isSavingGoal}
        isDeleting={isDeletingGoal}
      />
    </div>
  );
}
