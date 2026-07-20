'use client';

import { TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Goal } from '@/hooks/useGoals';

interface GoalProbabilityTimelineProps {
  goals: Goal[];
}

interface ProbabilityHistoryEntry {
  month: number;
  probability: number;
}

export function GoalProbabilityTimeline({ goals }: GoalProbabilityTimelineProps) {
  // Filter goals that have probability data
  const goalsWithProbability = goals.filter(
    (g) => g.status === 'active' && typeof g.currentProbability === 'number'
  );

  if (goalsWithProbability.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goal Probability Trends</CardTitle>
          <CardDescription>90-day probability history for your active goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <LineChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No probability data yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
              Goals with probability tracking will appear here once you have active goals with
              progress data
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/goals">View Goals</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall trend across all goals
  const calculateTrend = (goal: Goal) => {
    if (!goal.probabilityHistory || !Array.isArray(goal.probabilityHistory)) {
      return { trend: 'stable', change: 0 };
    }

    const history = goal.probabilityHistory as ProbabilityHistoryEntry[];
    if (history.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const oldest = history[0]?.probability ?? 0;
    const newest = history[history.length - 1]?.probability ?? 0;
    const change = newest - oldest;

    if (Math.abs(change) < 1) return { trend: 'stable', change: 0 };
    return { trend: change > 0 ? 'improving' : 'declining', change };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-success';
    if (trend === 'declining') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const formatPercentageChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Calculate SVG path for sparkline
  const generateSparkline = (history: ProbabilityHistoryEntry[], width: number, height: number) => {
    if (!history || history.length < 2) return '';

    const points = history.map((entry, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (entry.probability / 100) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Probability Trends</CardTitle>
        <CardDescription>90-day probability history for your active goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goalsWithProbability.map((goal) => {
            const { trend, change } = calculateTrend(goal);
            const history = (goal.probabilityHistory || []) as ProbabilityHistoryEntry[];
            const currentProb =
              typeof goal.currentProbability === 'number' ? goal.currentProbability : 0;

            return (
              <div
                key={goal.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{goal.name}</h4>
                    {getTrendIcon(trend)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-lg">{currentProb.toFixed(1)}%</span>
                    {change !== 0 && (
                      <span className={`text-xs ${getTrendColor(trend)}`}>
                        {formatPercentageChange(change)} this quarter
                      </span>
                    )}
                  </div>
                </div>

                {/* Sparkline */}
                {history.length >= 2 && (
                  <div className="w-32 h-12">
                    <svg width="128" height="48" className="overflow-visible">
                      {/* Background grid */}
                      <line
                        x1="0"
                        y1="24"
                        x2="128"
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-200"
                        strokeDasharray="2,2"
                      />

                      {/* Trend line */}
                      <path
                        d={generateSparkline(history, 128, 48)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={
                          trend === 'improving'
                            ? 'text-success'
                            : trend === 'declining'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }
                      />

                      {/* Data points */}
                      {history.map((entry, index) => {
                        const x = (index / (history.length - 1)) * 128;
                        const y = 48 - (entry.probability / 100) * 48;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="2"
                            fill="currentColor"
                            className={
                              trend === 'improving'
                                ? 'text-success'
                                : trend === 'declining'
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                            }
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Improving</p>
              <p className="text-2xl font-bold text-success">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'improving').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stable</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'stable').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Declining</p>
              <p className="text-2xl font-bold text-destructive">
                {goalsWithProbability.filter((g) => calculateTrend(g).trend === 'declining').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
