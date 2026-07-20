'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@dhanam-core/ui';
import {
  Banknote,
  Plus,
  CheckCircle2,
  Clock,
  Briefcase,
  Gift,
  TrendingUp,
  Home,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';

import { IncomeEventSummary, IncomeEvent } from '@/lib/api/zero-based';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface IncomeEventsListProps {
  incomeEvents: IncomeEventSummary[] | IncomeEvent[];
  currency: Currency;
  onAddIncome: () => void;
  compact?: boolean;
}

function getSourceIcon(source: string) {
  switch (source.toLowerCase()) {
    case 'salary':
    case 'paycheck':
      return Briefcase;
    case 'freelance':
    case 'contract':
      return MoreHorizontal;
    case 'investment':
    case 'dividend':
      return TrendingUp;
    case 'rental':
      return Home;
    case 'refund':
      return RotateCcw;
    case 'gift':
      return Gift;
    default:
      return Banknote;
  }
}

// Map source keys to i18n translation keys
const SOURCE_I18N_MAP: Record<string, string> = {
  salary: 'salary',
  paycheck: 'salary',
  bonus: 'bonus',
  freelance: 'freelance',
  contract: 'freelance',
  investment: 'investmentIncome',
  dividend: 'investmentIncome',
  rental: 'rentalIncome',
  refund: 'refund',
  gift: 'gift',
  other: 'other',
};

export function IncomeEventsList({
  incomeEvents,
  currency,
  onAddIncome,
  compact = false,
}: IncomeEventsListProps) {
  const { t } = useTranslation('budgets');
  const [expanded, setExpanded] = useState(false);
  const totalIncome = incomeEvents.reduce((sum, event) => sum + event.amount, 0);
  const allocatedCount = incomeEvents.filter((e) => e.isAllocated).length;

  function getSourceLabel(source: string): string {
    const key = SOURCE_I18N_MAP[source.toLowerCase()];
    if (key) return t(`zeroBased.incomeEvents.${key}`);
    // Fallback: capitalize first letter
    return source
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  if (compact) {
    const visibleEvents = expanded ? incomeEvents : incomeEvents.slice(0, 5);
    const hiddenCount = incomeEvents.length - 5;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('zeroBased.incomeEvents.recentIncome')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddIncome}
              aria-label={t('zeroBased.incomeEvents.addIncome')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {incomeEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('zeroBased.incomeEvents.noIncomeYet')}
            </p>
          ) : (
            visibleEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <span>{getSourceLabel(event.source)}</span>
                </div>
                <span className="font-medium">{formatCurrency(event.amount, currency)}</span>
              </div>
            ))
          )}
          {!expanded && hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-xs text-muted-foreground text-center hover:text-foreground transition-colors"
            >
              {t('zeroBased.incomeEvents.nMore', { count: hiddenCount })}
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('zeroBased.incomeEvents.incomeEventsTitle')}</CardTitle>
            <CardDescription>
              {t('zeroBased.incomeEvents.eventsAllocated', {
                count: incomeEvents.length,
                allocated: allocatedCount,
              })}
            </CardDescription>
          </div>
          <Button onClick={onAddIncome} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('zeroBased.incomeEvents.addIncome')}
          </Button>
        </div>
        {/* Total Summary */}
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 mt-2">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t('zeroBased.incomeEvents.totalIncome')}
          </p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {incomeEvents.length === 0 ? (
          <div className="py-8 text-center">
            <Banknote className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">{t('zeroBased.incomeEvents.noIncomeYet')}</p>
            <p className="text-sm text-muted-foreground">
              {t('zeroBased.incomeEvents.clickAddIncome')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomeEvents.map((event) => {
              const Icon = getSourceIcon(event.source);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        event.isAllocated
                          ? 'bg-emerald-100 dark:bg-emerald-900/50'
                          : 'bg-amber-100 dark:bg-amber-900/50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          event.isAllocated
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{getSourceLabel(event.source)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.receivedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {formatCurrency(event.amount, currency)}
                    </span>
                    {event.isAllocated ? (
                      <div className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('zeroBased.incomeEvents.allocatedBadge')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                        <Clock className="h-3 w-3" />
                        {t('zeroBased.incomeEvents.pendingBadge')}
                      </div>
                    )}
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
