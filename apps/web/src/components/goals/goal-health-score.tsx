'use client';

import { Target, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type Goal } from '@/hooks/useGoals';

import { HelpTooltip } from '../demo/help-tooltip';

interface GoalHealthScoreProps {
  goals: Goal[];
}

export function GoalHealthScore({ goals }: GoalHealthScoreProps) {
  // Filter active goals with probability data
  const activeGoals = goals.filter(
    (g) => g.status === 'active' && typeof g.currentProbability === 'number'
  );

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Goal Health Score</CardTitle>
            <HelpTooltip content="Aggregate health of all your financial goals based on Monte Carlo probability analysis" />
          </div>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No active goals with probability data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate health metrics
  const excellentGoals = activeGoals.filter((g) => {
    const prob = g.currentProbability as number;
    return prob >= 90;
  });

  const onTrackGoals = activeGoals.filter((g) => {
    const prob = g.currentProbability as number;
    return prob >= 75 && prob < 90;
  });

  const needsAttentionGoals = activeGoals.filter((g) => {
    const prob = g.currentProbability as number;
    return prob >= 50 && prob < 75;
  });

  const atRiskGoals = activeGoals.filter((g) => {
    const prob = g.currentProbability as number;
    return prob < 50;
  });

  const totalGoals = activeGoals.length;
  const healthyGoals = excellentGoals.length + onTrackGoals.length;
  const healthPercentage = (healthyGoals / totalGoals) * 100;

  // Calculate overall health score (weighted average of probabilities)
  const totalProbability = activeGoals.reduce((sum, g) => {
    const prob = g.currentProbability as number;
    return sum + prob;
  }, 0);
  const averageProbability = totalProbability / totalGoals;

  // Determine overall health status
  const getHealthStatus = () => {
    if (healthPercentage >= 75)
      return {
        label: 'Excellent',
        color: 'text-goal-excellent',
        icon: CheckCircle2,
      };
    if (healthPercentage >= 50)
      return {
        label: 'Good',
        color: 'text-goal-on-track',
        icon: CheckCircle2,
      };
    if (healthPercentage >= 25)
      return {
        label: 'Fair',
        color: 'text-goal-attention',
        icon: AlertCircle,
      };
    return {
      label: 'Needs Work',
      color: 'text-goal-at-risk',
      icon: XCircle,
    };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Goal Health Score</CardTitle>
          <HelpTooltip content="Aggregate health of all your financial goals based on Monte Carlo probability analysis" />
        </div>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Health */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {healthyGoals}/{totalGoals}
              </p>
              <p className="text-sm text-muted-foreground">goals on track</p>
            </div>
            <div className="flex items-center gap-2">
              <HealthIcon className={`h-8 w-8 ${healthStatus.color}`} />
              <div className="text-right">
                <p className={`text-xl font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
                <p className="text-sm text-muted-foreground">{healthPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Average Probability */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Average Success Probability</span>
              <span className="text-sm font-bold">{averageProbability.toFixed(1)}%</span>
            </div>
            <Progress value={averageProbability} className="h-2" />
          </div>

          {/* Breakdown by Status */}
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Goal Breakdown:</p>

            {/* Excellent */}
            {excellentGoals.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-goal-excellent" />
                  <span className="text-muted-foreground">Excellent (≥90%)</span>
                </div>
                <span className="font-medium">{excellentGoals.length}</span>
              </div>
            )}

            {/* On Track */}
            {onTrackGoals.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-goal-on-track" />
                  <span className="text-muted-foreground">On Track (75-89%)</span>
                </div>
                <span className="font-medium">{onTrackGoals.length}</span>
              </div>
            )}

            {/* Needs Attention */}
            {needsAttentionGoals.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-goal-attention" />
                  <span className="text-muted-foreground">Needs Attention (50-74%)</span>
                </div>
                <span className="font-medium">{needsAttentionGoals.length}</span>
              </div>
            )}

            {/* At Risk */}
            {atRiskGoals.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-goal-at-risk" />
                  <span className="text-muted-foreground">At Risk (&lt;50%)</span>
                </div>
                <span className="font-medium">{atRiskGoals.length}</span>
              </div>
            )}
          </div>

          {/* Action Items */}
          {atRiskGoals.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-destructive font-medium">
                {atRiskGoals.length} goal
                {atRiskGoals.length > 1 ? 's' : ''} need
                {atRiskGoals.length === 1 ? 's' : ''} immediate attention
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
