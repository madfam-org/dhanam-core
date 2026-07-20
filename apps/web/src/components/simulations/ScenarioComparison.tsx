'use client';

import { Loader2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimulations, type ScenarioComparisonResult } from '@/hooks/useSimulations';

interface ScenarioComparisonProps {
  baselineConfig: {
    initialBalance: number;
    monthlyContribution: number;
    years: number;
    expectedReturn: number;
    returnVolatility: number;
    iterations?: number;
    inflationRate?: number;
  };
}

const SCENARIO_OPTIONS = [
  {
    value: 'job_loss',
    label: 'Job Loss (6 months)',
    severity: 'severe',
  },
  {
    value: 'market_crash',
    label: 'Market Crash (-30%)',
    severity: 'severe',
  },
  {
    value: 'recession',
    label: 'Economic Recession',
    severity: 'moderate',
  },
  {
    value: 'medical_emergency',
    label: 'Medical Emergency ($50k)',
    severity: 'moderate',
  },
  {
    value: 'inflation_spike',
    label: 'High Inflation (5 years)',
    severity: 'moderate',
  },
  {
    value: 'disability',
    label: 'Long-term Disability',
    severity: 'severe',
  },
  {
    value: 'market_correction',
    label: 'Market Correction (-10%)',
    severity: 'mild',
  },
];

export function ScenarioComparison({ baselineConfig }: ScenarioComparisonProps) {
  const { analyzeScenario, loading, error } = useSimulations();
  const [selectedScenario, setSelectedScenario] = useState<string>('market_crash');
  const [result, setResult] = useState<ScenarioComparisonResult | null>(null);

  const handleAnalyze = async () => {
    const scenarioResult = await analyzeScenario(selectedScenario, baselineConfig);
    if (scenarioResult) {
      setResult(scenarioResult);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'significant':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScenarioSeverityBadge = (severity: string) => {
    const colors = {
      mild: 'bg-blue-100 text-blue-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      severe: 'bg-red-100 text-red-800',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Stress Testing</CardTitle>
          <CardDescription>
            Test how your financial plan holds up against adverse life events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIO_OPTIONS.map((scenario) => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Scenario'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{result.scenario.name}</CardTitle>
                  <CardDescription>{result.scenario.description}</CardDescription>
                </div>
                <Badge className={getScenarioSeverityBadge(result.scenario.severity)}>
                  {result.scenario.severity.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Impact Severity</p>
                  <Badge
                    className={`${getSeverityColor(result.comparison.impactSeverity)} px-4 py-2 text-lg`}
                  >
                    {result.comparison.impactSeverity.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Worth Stress Testing?</p>
                  <Badge
                    className={
                      result.comparison.worthStressTesting
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {result.comparison.worthStressTesting ? 'YES' : 'NO'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Median Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Baseline</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(result.baseline.median)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stressed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(result.stressed.median)}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className="text-xl font-semibold text-red-600">
                    -{formatCurrency(result.comparison.medianDifference)} (
                    {result.comparison.medianDifferencePercent.toFixed(1)}%)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Recovery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.comparison.recoveryYears !== null ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Time to recover to 90% of baseline
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {result.comparison.recoveryYears === 0
                        ? 'Immediate'
                        : `${result.comparison.recoveryYears} years`}
                    </p>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Recovery</AlertTitle>
                    <AlertDescription>
                      This scenario would cause permanent damage to your financial plan.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!result && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Select a scenario and click Analyze to see results</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
