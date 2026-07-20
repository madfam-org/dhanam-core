'use client';

import { CheckCircle2, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { RetirementSimulationResult } from '@/hooks/useSimulations';

interface RetirementResultsProps {
  results: RetirementSimulationResult;
}

export function RetirementResults({ results }: RetirementResultsProps) {
  const { accumulationPhase, withdrawalPhase, recommendations } = results;
  const simulationConfig = results.simulation.config as
    | { monthlyContribution?: number; expectedReturn?: number; volatility?: number }
    | undefined;

  const successRate = withdrawalPhase.probabilityOfNotRunningOut;
  const isOnTrack = successRate >= 0.75;
  const isExcellent = successRate >= 0.9;
  const isAtRisk = successRate < 0.5;

  const getSuccessColor = () => {
    if (isExcellent) return 'text-green-600';
    if (isOnTrack) return 'text-blue-600';
    if (isAtRisk) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Retirement Readiness</CardTitle>
          <CardDescription>
            Probability of not running out of money during retirement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-4xl font-bold ${getSuccessColor()}`}>
                {(successRate * 100).toFixed(1)}%
              </span>
              {isExcellent && <Badge className="bg-green-600">Excellent</Badge>}
              {isOnTrack && !isExcellent && <Badge className="bg-blue-600">On Track</Badge>}
              {!isOnTrack && !isAtRisk && <Badge variant="secondary">Needs Improvement</Badge>}
              {isAtRisk && <Badge variant="destructive">At Risk</Badge>}
            </div>
            <Progress value={successRate * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Based on {results.simulation.finalValues.length.toLocaleString()} Monte Carlo
              simulations
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.increaseContributionBy && (
        <Alert variant={isAtRisk ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              To reach a 75% success rate, increase your monthly contribution by{' '}
              <strong>${recommendations.increaseContributionBy.toLocaleString()}</strong>.
            </p>
            <p className="text-sm">
              This would bring your total monthly savings to approximately $
              {(
                recommendations.increaseContributionBy +
                (simulationConfig?.monthlyContribution ?? 0)
              ).toLocaleString()}
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      {recommendations.canRetireEarlierBy && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Great News!</AlertTitle>
          <AlertDescription>
            Based on your current trajectory, you could potentially retire{' '}
            <strong>{recommendations.canRetireEarlierBy} years earlier</strong> while maintaining
            the same lifestyle.
          </AlertDescription>
        </Alert>
      )}

      {/* Accumulation Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Accumulation Phase
          </CardTitle>
          <CardDescription>
            Building your retirement nest egg ({accumulationPhase.yearsToRetirement} years)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Expected Nest Egg (Median)</p>
              <p className="text-2xl font-bold">
                $
                {accumulationPhase.finalBalanceMedian.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Contributions</p>
              <p className="text-2xl font-bold">
                $
                {accumulationPhase.totalContributions.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-2">90% Confidence Range</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Worst 10%</p>
                <p className="text-lg font-semibold">
                  $
                  {accumulationPhase.finalBalanceP10.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Most Likely</p>
                <p className="text-lg font-semibold">
                  $
                  {accumulationPhase.finalBalanceMedian.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Best 10%</p>
                <p className="text-lg font-semibold">
                  $
                  {accumulationPhase.finalBalanceP90.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Withdrawal Phase
          </CardTitle>
          <CardDescription>
            Spending your retirement savings ({withdrawalPhase.yearsInRetirement} years)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Years Money Lasts (Median)</p>
              <p className="text-2xl font-bold">
                {withdrawalPhase.medianYearsOfSustainability.toFixed(1)} years
              </p>
              {withdrawalPhase.medianYearsOfSustainability > withdrawalPhase.yearsInRetirement && (
                <p className="text-xs text-green-600 mt-1">Outlasts life expectancy ✓</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Safe Monthly Withdrawal</p>
              <p className="text-2xl font-bold">
                $
                {withdrawalPhase.safeWithdrawalRate.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">For 75% success rate</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Expenses:</span>
                <span className="font-semibold">
                  ${withdrawalPhase.netMonthlyNeed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Coverage from Portfolio:</span>
                <span>
                  {(
                    (withdrawalPhase.safeWithdrawalRate / withdrawalPhase.netMonthlyNeed) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Nest Egg */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Target Retirement Savings
          </CardTitle>
          <CardDescription>Recommended nest egg at retirement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold">
                $
                {recommendations.targetNestEgg.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Provides {(withdrawalPhase.probabilityOfNotRunningOut * 100).toFixed(0)}% confidence
                of not running out
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">How to Get There</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Save ${((simulationConfig?.monthlyContribution ?? 0) * 12).toLocaleString()} per
                    year for {accumulationPhase.yearsToRetirement} years
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Maintain {((simulationConfig?.expectedReturn ?? 0) * 100).toFixed(1)}% annual
                    return with {((simulationConfig?.volatility ?? 0) * 100).toFixed(0)}% volatility
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Withdraw ${withdrawalPhase.netMonthlyNeed.toLocaleString()}
                    /month in retirement
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
