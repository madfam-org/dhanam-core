'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@dhanam-core/ui';
import { Lightbulb } from 'lucide-react';
import { useMemo } from 'react';

export interface InsightsCardProps {
  netWorth?: number;
  previousNetWorth?: number;
  totalIncome?: number;
  totalExpenses?: number;
  topCategory?: { name: string; amount: number };
  recurringCount?: number;
  recurringTotal?: number;
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function generateInsights(props: InsightsCardProps): string[] {
  const {
    netWorth,
    previousNetWorth,
    totalIncome,
    totalExpenses,
    topCategory,
    recurringCount,
    recurringTotal,
  } = props;

  const insights: string[] = [];

  if (netWorth != null && previousNetWorth != null) {
    const diff = netWorth - previousNetWorth;
    if (diff > 0) {
      insights.push(`Your net worth grew by $${formatAmount(diff)} this month`);
    } else if (diff < 0) {
      insights.push(`Your net worth decreased by $${formatAmount(Math.abs(diff))} this month`);
    }
  }

  if (topCategory) {
    insights.push(
      `Your biggest spending category is ${topCategory.name} at $${formatAmount(topCategory.amount)}`
    );
  }

  if (totalExpenses != null && totalIncome != null && totalExpenses > totalIncome) {
    insights.push('You spent more than you earned this period');
  }

  if (recurringCount != null && recurringCount > 0 && recurringTotal != null) {
    insights.push(
      `You have ${recurringCount} recurring payments totaling $${formatAmount(recurringTotal)}/month`
    );
  }

  return insights.slice(0, 3);
}

export function InsightsCard(props: InsightsCardProps) {
  const insights = useMemo(() => generateInsights(props), [props]);

  const hasData =
    props.netWorth != null ||
    props.totalIncome != null ||
    props.totalExpenses != null ||
    props.topCategory != null ||
    props.recurringCount != null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" aria-hidden="true" />
        <CardTitle className="text-sm font-medium">Financial Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData || insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add transactions to see financial insights.
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Financial insights">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
