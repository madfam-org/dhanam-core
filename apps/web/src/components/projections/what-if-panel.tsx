'use client';

import { Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
import { useState } from 'react';

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
import type { WhatIfScenario, ProjectionResult } from '@/lib/api/projections';

interface WhatIfPanelProps {
  templates: WhatIfScenario[];
  onCompare: (scenarios: WhatIfScenario[]) => Promise<void>;
  comparisonResults?: {
    baseline: ProjectionResult;
    scenarios: { scenario: WhatIfScenario; result: ProjectionResult }[];
  };
  isLoading?: boolean;
  currency?: string;
}

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function WhatIfPanel({
  templates,
  onCompare,
  comparisonResults,
  isLoading,
  currency = 'USD',
}: WhatIfPanelProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<WhatIfScenario[]>([]);
  const [customScenario, setCustomScenario] = useState<Partial<WhatIfScenario>>({
    name: '',
    description: '',
    modifications: {},
  });

  const addTemplateScenario = (template: WhatIfScenario) => {
    if (selectedScenarios.length >= 3) return;
    if (selectedScenarios.some((s) => s.name === template.name)) return;
    setSelectedScenarios([...selectedScenarios, template]);
  };

  const removeScenario = (name: string) => {
    setSelectedScenarios(selectedScenarios.filter((s) => s.name !== name));
  };

  const addCustomScenario = () => {
    if (!customScenario.name) return;
    const scenario: WhatIfScenario = {
      name: customScenario.name,
      description: customScenario.description || '',
      modifications: customScenario.modifications || {},
    };
    setSelectedScenarios([...selectedScenarios, scenario]);
    setCustomScenario({ name: '', description: '', modifications: {} });
  };

  const handleCompare = async () => {
    if (selectedScenarios.length === 0) return;
    await onCompare(selectedScenarios);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          What-If Analysis
        </CardTitle>
        <CardDescription>
          Compare different scenarios to see how changes affect your financial future
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Templates */}
        <div>
          <Label className="text-sm font-medium">Quick Scenarios</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {templates.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => addTemplateScenario(template)}
                disabled={
                  selectedScenarios.length >= 3 ||
                  selectedScenarios.some((s) => s.name === template.name)
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Scenario */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Custom Scenario</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="scenario-name" className="text-xs">
                Name
              </Label>
              <Input
                id="scenario-name"
                placeholder="My scenario"
                value={customScenario.name}
                onChange={(e) => setCustomScenario({ ...customScenario, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="scenario-type" className="text-xs">
                Modification Type
              </Label>
              <Select
                onValueChange={(value) => {
                  const mods: Record<string, number> = {};
                  if (value === 'retirement_early') mods.retirementAge = -5;
                  if (value === 'retirement_late') mods.retirementAge = 5;
                  if (value === 'inflation_high') mods.inflationRate = 0.04;
                  if (value === 'inflation_low') mods.inflationRate = 0.02;
                  setCustomScenario({
                    ...customScenario,
                    modifications: mods as unknown as Partial<WhatIfScenario['modifications']>,
                  });
                }}
              >
                <SelectTrigger id="scenario-type">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retirement_early">Retire 5 years early</SelectItem>
                  <SelectItem value="retirement_late">Retire 5 years later</SelectItem>
                  <SelectItem value="inflation_high">Higher inflation (4%)</SelectItem>
                  <SelectItem value="inflation_low">Lower inflation (2%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addCustomScenario}
            disabled={!customScenario.name || selectedScenarios.length >= 3}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Custom Scenario
          </Button>
        </div>

        {/* Selected Scenarios */}
        {selectedScenarios.length > 0 && (
          <div>
            <Label className="text-sm font-medium">
              Selected Scenarios ({selectedScenarios.length}/3)
            </Label>
            <div className="space-y-2 mt-2">
              {selectedScenarios.map((scenario) => (
                <div
                  key={scenario.name}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeScenario(scenario.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compare Button */}
        <Button
          onClick={handleCompare}
          disabled={selectedScenarios.length === 0 || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Compare Scenarios
            </>
          )}
        </Button>

        {/* Comparison Results */}
        {comparisonResults && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-medium">Comparison Results</Label>

            {/* Baseline */}
            <div className="p-3 rounded-lg border bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Baseline</span>
                <Badge variant="outline">Current Plan</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Net Worth at Peak:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(
                      comparisonResults.baseline.summary.peakNetWorth.amount,
                      currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FI Year:</span>
                  <span className="ml-2 font-medium">
                    {comparisonResults.baseline.summary.financialIndependenceYear || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Retirement Income:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency(
                      comparisonResults.baseline.summary.projectedRetirementIncome / 12,
                      currency
                    )}
                    /mo
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span className="ml-2 font-medium">
                    {comparisonResults.baseline.summary.riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Scenarios */}
            {comparisonResults.scenarios.map(({ scenario, result }) => {
              const peakDiff =
                result.summary.peakNetWorth.amount -
                comparisonResults.baseline.summary.peakNetWorth.amount;
              const incomeDiff =
                result.summary.projectedRetirementIncome -
                comparisonResults.baseline.summary.projectedRetirementIncome;

              return (
                <div key={scenario.name} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{scenario.name}</span>
                    <Badge
                      variant={peakDiff >= 0 ? 'default' : 'destructive'}
                      className="font-mono"
                    >
                      {peakDiff >= 0 ? '+' : ''}
                      {formatCurrency(peakDiff, currency)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Net Worth at Peak:</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(result.summary.peakNetWorth.amount, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FI Year:</span>
                      <span className="ml-2 font-medium">
                        {result.summary.financialIndependenceYear || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retirement Income:</span>
                      <span
                        className={`ml-2 font-medium ${incomeDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(result.summary.projectedRetirementIncome / 12, currency)}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Score:</span>
                      <span
                        className={`ml-2 font-medium ${result.summary.riskScore < comparisonResults.baseline.summary.riskScore ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {result.summary.riskScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
