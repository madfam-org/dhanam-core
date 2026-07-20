'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@dhanam-core/ui';
import { RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { CategoryAllocationStatus, RolloverMonthDto } from '@/lib/api/zero-based';
import { formatCurrency } from '@/lib/utils';

interface RolloverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: string; // YYYY-MM format
  categories: CategoryAllocationStatus[];
  currency: Currency;
  onRollover: (dto: RolloverMonthDto) => Promise<void>;
  isLoading?: boolean;
}

function getIntlLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year!, monthNum! - 1, 1);
  return date.toLocaleDateString(getIntlLocale(), { month: 'long', year: 'numeric' });
}

function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year!, monthNum! - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function RolloverModal({
  open,
  onOpenChange,
  currentMonth,
  categories,
  currency,
  onRollover,
  isLoading = false,
}: RolloverModalProps) {
  const { t } = useTranslation('budgets');
  const [error, setError] = useState<string | null>(null);

  // Reset error when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  // Categories with positive available balance (can be rolled over)
  const rolloverCategories = categories.filter((cat) => cat.available > 0);
  const totalRollover = rolloverCategories.reduce((sum, cat) => sum + cat.available, 0);

  const previousMonth = getPreviousMonth(currentMonth);

  const handleRollover = async () => {
    setError(null);

    if (rolloverCategories.length === 0) {
      setError(t('zeroBased.rolloverModal.errNoCategories'));
      return;
    }

    try {
      await onRollover({
        fromMonth: previousMonth,
        toMonth: currentMonth,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('zeroBased.rolloverModal.errFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>{t('zeroBased.rolloverModal.title')}</DialogTitle>
              <DialogDescription>{t('zeroBased.rolloverModal.description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rollover Summary */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('zeroBased.rolloverModal.from')}</p>
              <p className="font-semibold">{formatMonthDisplay(previousMonth)}</p>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('zeroBased.rolloverModal.to')}</p>
              <p className="font-semibold">{formatMonthDisplay(currentMonth)}</p>
            </div>
          </div>

          {/* Total Rollover Amount */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('zeroBased.rolloverModal.totalToRollover')}
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalRollover, currency)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {rolloverCategories.length === 1
                ? t('zeroBased.rolloverModal.fromOneCategory')
                : t('zeroBased.rolloverModal.fromNCategories', {
                    count: rolloverCategories.length,
                  })}
            </p>
          </div>

          {/* Categories to Rollover */}
          {rolloverCategories.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              <p className="text-sm font-medium">
                {t('zeroBased.rolloverModal.categoriesWithUnspent')}
              </p>
              {rolloverCategories.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <span>{cat.categoryName}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(cat.available, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
              <p>{t('zeroBased.rolloverModal.noFundsToRollover')}</p>
              <p className="text-sm">{t('zeroBased.rolloverModal.allBudgetsSpent')}</p>
            </div>
          )}

          {/* Warning about overspent categories */}
          {categories.some((cat) => cat.isOverspent) && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-300">
              <strong>Note:</strong> {t('zeroBased.rolloverModal.overspentNote')}
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('zeroBased.rolloverModal.cancel')}
          </Button>
          <Button onClick={handleRollover} disabled={rolloverCategories.length === 0 || isLoading}>
            {isLoading
              ? t('zeroBased.rolloverModal.rollingOver')
              : t('zeroBased.rolloverModal.rolloverAmount', {
                  amount: formatCurrency(totalRollover, currency),
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
