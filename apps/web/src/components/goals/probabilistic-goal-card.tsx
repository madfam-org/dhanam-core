'use client';

import { Target, TrendingUp, TrendingDown, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoals, type Goal, type GoalProbabilityResult } from '@/hooks/useGoals';

import { HelpTooltip } from '../demo/help-tooltip';

interface ProbabilisticGoalCardProps {
  goal: Goal;
  onClick?: () => void;
  showActions?: boolean;
}

export function ProbabilisticGoalCard({
  goal,
  onClick,
  showActions = true,
}: ProbabilisticGoalCardProps) {
  const { getGoalProbability, updateGoalProbability } = useGoals();
  const [probability, setProbability] = useState<GoalProbabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadProbability = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getGoalProbability(goal.id);
      if (result) {
        setProbability(result);
      }
    } catch (error) {
      console.error('Failed to load goal probability:', error);
    } finally {
      setLoading(false);
    }
  }, [goal.id, getGoalProbability]);

  useEffect(() => {
    loadProbability();
  }, [loadProbability]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(true);
    try {
      await updateGoalProbability(goal.id);
      await loadProbability();
    } catch (error) {
      console.error('Failed to update goal probability:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 90) return 'bg-goal-excellent';
    if (prob >= 75) return 'bg-goal-on-track';
    if (prob >= 50) return 'bg-goal-attention';
    return 'bg-goal-at-risk';
  };

  const getProbabilityLabel = (prob: number) => {
    if (prob >= 90) return 'Excellent';
    if (prob >= 75) return 'On Track';
    if (prob >= 50) return 'Needs Attention';
    return 'At Risk';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const targetAmount = goal.targetAmount;

  return (
    <Card className={onClick ? 'hover:shadow-md transition-shadow' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              {goal.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {goal.description || goal.type.replace('_', ' ')}
            </CardDescription>
          </div>
          {goal.status && (
            <Badge variant={goal.status === 'active' ? 'default' : 'secondary'} className="ml-2">
              {goal.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Probability Badge */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : probability ? (
          <>
            {/* Probability Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Success Probability</span>
                <HelpTooltip content="Monte Carlo simulation with 10,000 iterations showing likelihood of achieving this goal" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{probability.probability.toFixed(1)}%</span>
                <Badge className={getProbabilityColor(probability.probability)}>
                  {getProbabilityLabel(probability.probability)}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Progress</span>
                <span className="font-medium">{probability.currentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={probability.currentProgress} className="h-2" />
            </div>

            {/* Target & Timeline */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
                <p className="text-sm font-bold">{formatCurrency(targetAmount)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Target Date</p>
                </div>
                <p className="text-sm font-bold">{formatDate(goal.targetDate)}</p>
              </div>
            </div>

            {/* Confidence Range */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">P10 (Pessimistic)</p>
                  <p className="font-semibold">{formatCurrency(probability.confidenceLow)}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">P90 (Optimistic)</p>
                  <p className="font-semibold">{formatCurrency(probability.confidenceHigh)}</p>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {probability.probability < 75 && probability.recommendedMonthlyContribution > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <TrendingDown className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Increase monthly contribution to{' '}
                    {formatCurrency(probability.recommendedMonthlyContribution)} to reach 75%
                    probability
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            {(showActions || onClick) && (
              <div className="flex gap-2 pt-2">
                {showActions && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleRefresh}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1.5" />
                    )}
                    Recalculate
                  </Button>
                )}
                {onClick && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={onClick}>
                    View goal
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No probability data available</p>
            <Button
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                loadProbability();
              }}
            >
              Calculate Probability
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
