'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Loader2, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

import { SimulationChart } from '@/components/simulations/SimulationChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  useSimulations,
  type MonteCarloConfig,
  type ScenarioComparisonResult,
} from '@/hooks/useSimulations';

const SCENARIOS = [
  { value: 'BEAR_MARKET', severity: 'medium' },
  { value: 'GREAT_RECESSION', severity: 'high' },
  { value: 'DOT_COM_BUST', severity: 'high' },
  { value: 'MILD_RECESSION', severity: 'low' },
  { value: 'MARKET_CORRECTION', severity: 'low' },
  { value: 'STAGFLATION', severity: 'high' },
  { value: 'DOUBLE_DIP_RECESSION', severity: 'high' },
  { value: 'LOST_DECADE', severity: 'extreme' },
  { value: 'FLASH_CRASH', severity: 'medium' },
  { value: 'BOOM_CYCLE', severity: 'positive' },
  { value: 'TECH_BUBBLE', severity: 'extreme' },
  { value: 'COVID_SHOCK', severity: 'medium' },
];

export default function ScenariosPage() {
  const { t } = useTranslation('projections');
  const { t: tCommon } = useTranslation('common');
  const { compareScenarios, loading, error } = useSimulations();
  const analytics = useAnalytics();

  const [config, setConfig] = useState<MonteCarloConfig>({
    initialBalance: 100000,
    monthlyContribution: 1000,
    months: 120,
    expectedReturn: 0.07,
    volatility: 0.15,
    iterations: 10000,
  });

  const [selectedScenario, setSelectedScenario] = useState('GREAT_RECESSION');
  const [comparison, setComparison] = useState<ScenarioComparisonResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transform MonteCarloConfig to the format expected by analyzeScenario
    const scenarioConfig = {
      initialBalance: config.initialBalance,
      monthlyContribution: config.monthlyContribution,
      years: Math.round(config.months / 12),
      expectedReturn: config.expectedReturn,
      returnVolatility: config.volatility,
      iterations: config.iterations,
    };
    const result = await compareScenarios(selectedScenario, scenarioConfig);
    if (result) {
      setComparison(result);

      // Track scenario comparison
      analytics.trackScenarioComparison(
        result.scenarioName ?? selectedScenario,
        result.comparison.medianDifference,
        result.comparison.medianDifferencePercent,
        result.comparison.worthStressTesting
      );
    }
  };

  const handleInputChange = (field: keyof MonteCarloConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-yellow-600',
      medium: 'bg-orange-600',
      high: 'bg-red-600',
      extreme: 'bg-purple-600',
      positive: 'bg-green-600',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-600';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{t('scenarios.page.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('scenarios.page.description')}</p>
      </div>

      {error && !comparison && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('scenarios.page.howItWorksTitle')}</AlertTitle>
        <AlertDescription>{t('scenarios.page.howItWorksDescription')}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('scenarios.page.portfolioConfiguration')}</CardTitle>
              <CardDescription>{t('scenarios.page.configureDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">{t('scenarios.page.initialBalance')}</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    value={config.initialBalance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('initialBalance', parseFloat(e.target.value))
                    }
                    min={0}
                    step={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    ${config.initialBalance.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">
                    {t('scenarios.page.monthlyContribution')}
                  </Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    value={config.monthlyContribution}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('monthlyContribution', parseFloat(e.target.value))
                    }
                    min={0}
                    step={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    ${config.monthlyContribution.toLocaleString()}
                    {t('scenarios.page.perMonth')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="months">{t('scenarios.page.timeHorizonMonths')}</Label>
                  <Input
                    id="months"
                    type="number"
                    value={config.months}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('months', parseInt(e.target.value))
                    }
                    min={12}
                    max={600}
                    step={12}
                  />
                  <p className="text-sm text-muted-foreground">
                    {(config.months / 12).toFixed(1)} {t('scenarios.page.years')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedReturn">
                    {t('scenarios.page.expectedReturnPercent')}
                  </Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    value={(config.expectedReturn * 100).toFixed(1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('expectedReturn', parseFloat(e.target.value) / 100)
                    }
                    min={-20}
                    max={20}
                    step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volatility">{t('scenarios.page.volatilityPercent')}</Label>
                  <Input
                    id="volatility"
                    type="number"
                    value={(config.volatility * 100).toFixed(1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('volatility', parseFloat(e.target.value) / 100)
                    }
                    min={0}
                    max={80}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scenario">{t('scenarios.page.selectScenario')}</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger id="scenario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENARIOS.map((scenario) => (
                        <SelectItem key={scenario.value} value={scenario.value}>
                          <div className="flex items-center gap-2">
                            {t(`scenarios.scenarioLabels.${scenario.value}`)}
                            <Badge
                              className={getSeverityColor(scenario.severity)}
                              variant="secondary"
                            >
                              {t(`scenarios.severityLabels.${scenario.severity}`)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('scenarios.page.runningSimulations')}
                    </>
                  ) : (
                    t('scenarios.page.compareScenarios')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {comparison ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    {comparison.scenarioName}
                  </CardTitle>
                  <CardDescription>{comparison.scenarioDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Impact Alert */}
                  {comparison.comparison.worthStressTesting && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('scenarios.page.significantImpact')}</AlertTitle>
                      <AlertDescription>
                        {t('scenarios.page.significantImpactDescription')}{' '}
                        <strong>
                          ${Math.abs(comparison.comparison.medianDifference).toLocaleString()}
                        </strong>{' '}
                        ({Math.abs(comparison.comparison.medianDifferencePercent).toFixed(1)}%).
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Comparison Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('scenarios.page.baselineNormal')}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Median:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.median.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P10:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.p10.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P90:</span>
                          <span className="font-semibold">
                            $
                            {comparison.baseline.p90.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('scenarios.page.with')} {comparison.scenarioName}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Median:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario?.median ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P10:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario?.p10 ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P90:</span>
                          <span className="font-semibold text-red-600">
                            $
                            {(comparison.scenario?.p90 ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difference Breakdown */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{t('scenarios.page.impactAnalysis')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t('scenarios.page.medianImpact')}</span>
                        <span className="font-semibold text-red-600">
                          ${Math.abs(comparison.comparison.medianDifference).toLocaleString()}(
                          {comparison.comparison.medianDifferencePercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('scenarios.page.worstCaseImpact')}</span>
                        <span className="font-semibold text-red-600">
                          ${Math.abs(comparison.comparison.p10Difference).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('scenarios.page.crisisDuration')}</span>
                        <span className="font-semibold">
                          {comparison.comparison.recoveryMonths ?? 0} {t('scenarios.page.months')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <SimulationChart
                timeSeries={comparison.baseline.timeSeries}
                title={t('scenarios.page.baselineProjection')}
                description={t('scenarios.page.baselineProjectionDescription')}
              />

              <SimulationChart
                timeSeries={comparison.scenario?.timeSeries ?? []}
                title={`${comparison.scenarioName} ${t('scenarios.page.projection')}`}
                description={comparison.scenarioDescription}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] lg:min-h-[500px] border border-dashed rounded-lg">
              <div className="flex flex-col items-center text-center p-8">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <TrendingDown className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('scenarios.page.noAnalysisYet')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  {t('scenarios.page.noAnalysisDescription')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    document.getElementById('initialBalance')?.focus();
                  }}
                >
                  {t('scenarios.page.getStarted')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
