'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Info } from 'lucide-react';
import { useState } from 'react';

import { RetirementCalculatorForm } from '@/components/simulations/RetirementCalculatorForm';
import { RetirementResults } from '@/components/simulations/RetirementResults';
import { SimulationChart } from '@/components/simulations/SimulationChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RetirementSimulationResult } from '@/hooks/useSimulations';

export default function RetirementPage() {
  const { t } = useTranslation('projections');
  const { t: tCommon } = useTranslation('common');
  const [results, setResults] = useState<RetirementSimulationResult | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleResults = (result: RetirementSimulationResult) => {
    setHasError(false);
    setResults(result);
  };
  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{t('main.retirementPlanning')}</h1>
        <p className="text-muted-foreground mt-2">{t('retirement.pageDescription')}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('retirement.howItWorks')}</AlertTitle>
        <AlertDescription>{t('retirement.howItWorksBody')}</AlertDescription>
      </Alert>

      {hasError && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>{tCommon('somethingWentWrong')}</AlertTitle>
          <AlertDescription>{tCommon('loadFailed')}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calculator Form */}
        <div className="lg:col-span-1">
          <RetirementCalculatorForm onResults={handleResults} onError={handleError} />
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2">
          {results ? (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">{t('retirement.tabs.summary')}</TabsTrigger>
                <TabsTrigger value="projections">{t('retirement.tabs.projections')}</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-6">
                <RetirementResults results={results} />
              </TabsContent>

              <TabsContent value="projections" className="space-y-6">
                <SimulationChart
                  timeSeries={results.simulation.timeSeries}
                  title={t('retirement.portfolioProjections')}
                  description={t('retirement.twoPhaseSimulation')}
                />

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{t('retirement.finalBalance')}</p>
                    <p className="text-lg font-semibold">
                      $
                      {results.simulation.median.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('retirement.median')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{t('retirement.worst10')}</p>
                    <p className="text-lg font-semibold text-red-600">
                      $
                      {results.simulation.p10.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('retirement.10thPercentile')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{t('retirement.best10')}</p>
                    <p className="text-lg font-semibold text-green-600">
                      $
                      {results.simulation.p90.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('retirement.90thPercentile')}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-[600px] border border-dashed rounded-lg">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Info className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('retirement.noProjectionYet')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t('retirement.enterDetailsPrompt')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">{t('retirement.understandingResults')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">{t('retirement.successRate')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('retirement.successRateDescription')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('retirement.percentiles')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('retirement.percentilesDescription')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('retirement.safeWithdrawalRate')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('retirement.safeWithdrawalRateDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
