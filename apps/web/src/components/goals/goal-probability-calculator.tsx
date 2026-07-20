'use client';

import { Loader2, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { SimulationChart } from '@/components/simulations/SimulationChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoals, type GoalProbabilityResult } from '@/hooks/useGoals';

interface GoalProbabilityCalculatorProps {
  goal: {
    id: string;
    name: string;
    type: string;
    targetAmount: number;
    targetDate: string;
    currentValue: number;
    monthlyContribution: number;
    currency: string;
  };
  onSimulate?: (results: GoalProbabilityResult) => void;
}

export function GoalProbabilityCalculator({ goal, onSimulate }: GoalProbabilityCalculatorProps) {
  const { getGoalProbability } = useGoals();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GoalProbabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetDate = new Date(goal.targetDate);
  const monthsRemaining = Math.max(
    0,
    Math.round((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  );

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the real Monte Carlo API
      const result = await getGoalProbability(goal.id);

      if (!result) {
        throw new Error('Failed to calculate probability - no result returned');
      }

      setResults(result);
      if (onSimulate) {
        onSimulate(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate probability');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    // Probability is 0-100
    if (probability >= 90) return 'text-goal-excellent';
    if (probability >= 75) return 'text-goal-on-track';
    if (probability >= 50) return 'text-goal-attention';
    return 'text-goal-at-risk';
  };

  const getProbabilityBadge = (probability: number) => {
    // Probability is 0-100
    if (probability >= 90) return <Badge className="bg-goal-excellent">Excellent</Badge>;
    if (probability >= 75) return <Badge className="bg-goal-on-track">On Track</Badge>;
    if (probability >= 50) return <Badge variant="secondary">Needs Attention</Badge>;
    return <Badge variant="destructive">At Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Probability Analysis
          </CardTitle>
          <CardDescription>
            Monte Carlo simulation for "{goal.name}" ({goal.type})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">
                {goal.currency} {goal.currentValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Amount</p>
              <p className="text-2xl font-bold">
                {goal.currency} {goal.targetAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Contribution</p>
              <p className="text-lg font-semibold">
                {goal.currency} {goal.monthlyContribution.toLocaleString()}/mo
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="text-lg font-semibold">
                {Math.floor(monthsRemaining / 12)} years, {monthsRemaining % 12} months
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleCalculate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Run Probability Analysis'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Probability of Success</CardTitle>
              <CardDescription>
                Likelihood of reaching {goal.currency} {goal.targetAmount.toLocaleString()} by{' '}
                {targetDate.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-4xl font-bold ${getProbabilityColor(results.probability)}`}
                  >
                    {results.probability.toFixed(1)}%
                  </span>
                  {getProbabilityBadge(results.probability)}
                </div>
                <Progress value={results.probability} className="h-3" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Value (P50)</p>
                  <p className="text-xl font-bold">
                    {goal.currency}{' '}
                    {Math.round(
                      results.timeline[results.timeline.length - 1]?.median || 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Progress</p>
                  <p className="text-xl font-bold">{results.currentProgress.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {goal.currency} {goal.targetAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold mb-2">90% Confidence Range</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">P10 (Pessimistic)</p>
                    <p className="text-lg font-semibold">
                      {goal.currency} {Math.round(results.confidenceLow).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">P90 (Optimistic)</p>
                    <p className="text-lg font-semibold">
                      {goal.currency} {Math.round(results.confidenceHigh).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {results.probability < 75 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Action Needed</p>
                <p className="text-sm">To improve your probability of success to 75%, consider:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>
                    • Increasing monthly contributions to {goal.currency}{' '}
                    {Math.round(results.recommendedMonthlyContribution).toLocaleString()}
                    {goal.monthlyContribution > 0 && (
                      <span className="text-muted-foreground">
                        {' '}
                        (+{goal.currency}
                        {Math.round(
                          results.recommendedMonthlyContribution - goal.monthlyContribution
                        ).toLocaleString()}
                        )
                      </span>
                    )}
                  </li>
                  <li>• Extending your target date to allow more time for growth</li>
                  <li>• Adjusting your target amount if possible</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {results.probability >= 75 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">On Track!</p>
                <p className="text-sm">
                  You have a {results.probability.toFixed(1)}% chance of reaching your goal. Keep up
                  the great work
                  {goal.monthlyContribution > 0 && (
                    <>
                      {' '}
                      with your monthly contributions of {goal.currency}{' '}
                      {goal.monthlyContribution.toLocaleString()}
                    </>
                  )}
                  .
                </p>
                {results.projectedCompletion && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    Projected completion:{' '}
                    {new Date(results.projectedCompletion).toLocaleDateString()}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <SimulationChart
            timeSeries={(results.timeSeries || results.simulation?.timeSeries || []).map((ts) => ({
              ...ts,
              mean: ts.median * 1.01, // Approximate mean as slightly above median
            }))}
            title="Goal Progress Projection"
            description="Projected growth with 10th-90th percentile confidence range"
          />
        </>
      )}
    </div>
  );
}
