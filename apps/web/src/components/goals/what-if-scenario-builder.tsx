'use client';

import { Loader2, Lightbulb, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGoals,
  type Goal,
  type WhatIfScenario,
  type GoalProbabilityResult,
} from '@/hooks/useGoals';

import { HelpTooltip } from '../demo/help-tooltip';

interface WhatIfScenarioBuilderProps {
  goal: Goal;
  currentProbability?: GoalProbabilityResult;
}

export function WhatIfScenarioBuilder({ goal, currentProbability }: WhatIfScenarioBuilderProps) {
  const { runWhatIfScenario } = useGoals();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoalProbabilityResult | null>(null);

  const targetAmount = goal.targetAmount;

  // Scenario inputs
  const [scenario, setScenario] = useState<WhatIfScenario>({
    monthlyContribution: undefined,
    targetAmount: undefined,
    targetDate: undefined,
    expectedReturn: undefined,
    volatility: undefined,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRunScenario = async () => {
    setLoading(true);
    try {
      // Filter out undefined values
      const cleanScenario: WhatIfScenario = {};
      if (scenario.monthlyContribution !== undefined)
        cleanScenario.monthlyContribution = scenario.monthlyContribution;
      if (scenario.targetAmount !== undefined) cleanScenario.targetAmount = scenario.targetAmount;
      if (scenario.targetDate !== undefined) cleanScenario.targetDate = scenario.targetDate;
      if (scenario.expectedReturn !== undefined)
        cleanScenario.expectedReturn = scenario.expectedReturn / 100; // Convert % to decimal
      if (scenario.volatility !== undefined) cleanScenario.volatility = scenario.volatility / 100; // Convert % to decimal

      const scenarioResult = await runWhatIfScenario(goal.id, cleanScenario);
      if (scenarioResult) {
        setResult(scenarioResult);
      }
    } catch (error) {
      console.error('Failed to run what-if scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScenario({
      monthlyContribution: undefined,
      targetAmount: undefined,
      targetDate: undefined,
      expectedReturn: undefined,
      volatility: undefined,
    });
    setResult(null);
  };

  const getProbabilityChange = () => {
    if (!currentProbability || !result) return null;
    const change = result.probability - currentProbability.probability;
    return {
      value: change,
      isPositive: change > 0,
      percentage: Math.abs(change),
    };
  };

  const probabilityChange = getProbabilityChange();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What-If Scenario Builder
          </CardTitle>
          <CardDescription>
            Adjust parameters to see how they affect your goal's probability of success
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Values Reference */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Current Goal Parameters:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Target Amount:</span>{' '}
                <span className="font-medium">{formatCurrency(targetAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target Date:</span>{' '}
                <span className="font-medium">
                  {new Date(goal.targetDate).toLocaleDateString()}
                </span>
              </div>
              {currentProbability && (
                <div>
                  <span className="text-muted-foreground">Current Probability:</span>{' '}
                  <span className="font-medium">{currentProbability.probability.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Scenario Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyContribution" className="flex items-center gap-1">
                Monthly Contribution
                <HelpTooltip content="Amount you plan to contribute each month" />
              </Label>
              <Input
                id="monthlyContribution"
                type="number"
                placeholder="e.g., 500"
                value={scenario.monthlyContribution || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setScenario({
                    ...scenario,
                    monthlyContribution: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAmount" className="flex items-center gap-1">
                Target Amount
                <HelpTooltip content="Goal amount you want to reach" />
              </Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder={`Current: ${formatCurrency(targetAmount)}`}
                value={scenario.targetAmount || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setScenario({
                    ...scenario,
                    targetAmount: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate" className="flex items-center gap-1">
                Target Date
                <HelpTooltip content="When you want to achieve this goal" />
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={scenario.targetDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setScenario({ ...scenario, targetDate: e.target.value || undefined })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedReturn" className="flex items-center gap-1">
                Expected Annual Return (%)
                <HelpTooltip content="Expected annual investment return percentage" />
              </Label>
              <Input
                id="expectedReturn"
                type="number"
                step="0.1"
                placeholder="e.g., 7.0 (default)"
                value={scenario.expectedReturn || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setScenario({
                    ...scenario,
                    expectedReturn: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volatility" className="flex items-center gap-1">
                Volatility (%)
                <HelpTooltip content="Annual volatility/risk percentage" />
              </Label>
              <Input
                id="volatility"
                type="number"
                step="0.1"
                placeholder="e.g., 15.0 (default)"
                value={scenario.volatility || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setScenario({ ...scenario, volatility: parseFloat(e.target.value) || undefined })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleRunScenario} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                'Run Scenario'
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Results</CardTitle>
            <CardDescription>Probability based on your adjusted parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Probability Comparison */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Scenario Probability</p>
                <p className="text-3xl font-bold">{result.probability.toFixed(1)}%</p>
              </div>
              {probabilityChange && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Change from Current</p>
                  <div className="flex items-center gap-2">
                    {probabilityChange.isPositive ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <span
                      className={`text-2xl font-bold ${
                        probabilityChange.isPositive ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {probabilityChange.isPositive ? '+' : '-'}
                      {probabilityChange.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confidence Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">P10 (Pessimistic)</p>
                <p className="text-lg font-bold">{formatCurrency(result.confidenceLow)}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">P90 (Optimistic)</p>
                <p className="text-lg font-bold">{formatCurrency(result.confidenceHigh)}</p>
              </div>
            </div>

            {/* Projected Completion */}
            {result.projectedCompletion && (
              <div className="p-3 bg-info/10 rounded-lg">
                <p className="text-sm font-medium text-info">
                  Projected Completion: {new Date(result.projectedCompletion).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Recommendations */}
            {result.probability < 75 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Suggestion</p>
                  <p className="text-sm">
                    To reach 75% probability, consider increasing monthly contributions to{' '}
                    {formatCurrency(result.recommendedMonthlyContribution)}.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {result.probability >= 90 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Excellent!</p>
                  <p className="text-sm">
                    This scenario gives you a {result.probability.toFixed(1)}% chance of success.
                    You're in great shape!
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
