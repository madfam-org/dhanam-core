'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import { Button } from '@dhanam-core/ui';
import { Plus, ArrowLeftRight, Target, AlertCircle } from 'lucide-react';

import { CategoryAllocationStatus } from '@/lib/api/zero-based';
import { formatCurrency, cn } from '@/lib/utils';

interface CategoryRowProps {
  category: CategoryAllocationStatus;
  currency: Currency;
  onAllocate: (categoryId: string) => void;
  onMoveFunds: (categoryId: string) => void;
  onEditGoal: (categoryId: string) => void;
}

// Generate a consistent color based on category name
function getCategoryColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-cyan-500',
    'bg-rose-500',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || 'bg-gray-500';
}

export function CategoryRow({
  category,
  currency,
  onAllocate,
  onMoveFunds,
  onEditGoal,
}: CategoryRowProps) {
  const { t } = useTranslation('budgets');
  const colorClass = getCategoryColor(category.categoryName);

  const goalTypeLabels: Record<string, string> = {
    monthly_spending: t('zeroBased.categoryRow.goalMonthly'),
    target_balance: t('zeroBased.categoryRow.goalTarget'),
    weekly_spending: t('zeroBased.categoryRow.goalWeekly'),
    percentage_income: t('zeroBased.categoryRow.goalPercentIncome'),
  };

  const availableClass = cn(
    'text-right font-semibold',
    category.isOverspent
      ? 'text-red-600 dark:text-red-400'
      : category.available > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-muted-foreground'
  );

  return (
    <div className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      {/* Main Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Category Name with Color Dot */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={cn('h-3 w-3 flex-shrink-0 rounded-full', colorClass)} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{category.categoryName}</p>
            {category.goalType && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>{goalTypeLabels[category.goalType] ?? ''}</span>
                {category.goalTarget && (
                  <span>• {formatCurrency(category.goalTarget, currency)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground">{t('zeroBased.categoryRow.allocated')}</p>
            <p className="font-medium">{formatCurrency(category.allocated, currency)}</p>
          </div>
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground">{t('zeroBased.categoryRow.spent')}</p>
            <p className="font-medium">{formatCurrency(category.spent, currency)}</p>
          </div>
          <div className="w-24">
            <p className="text-xs text-muted-foreground">{t('zeroBased.categoryRow.available')}</p>
            <div className="flex items-center justify-end gap-1">
              {category.isOverspent && <AlertCircle className="h-4 w-4 text-red-500" />}
              <p className={availableClass}>{formatCurrency(category.available, currency)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons — visible on hover and keyboard focus-within */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAllocate(category.categoryId)}
            aria-label={t('zeroBased.categoryRow.allocateFunds')}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveFunds(category.categoryId)}
            aria-label={t('zeroBased.categoryRow.moveFunds')}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditGoal(category.categoryId)}
            aria-label={t('zeroBased.categoryRow.editGoal')}
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Goal Progress Bar (if goal exists) */}
      {category.goalProgress !== undefined && category.goalTarget && (
        <div className="ml-6 flex items-center gap-3">
          <div
            className={cn(
              'h-2 flex-1 rounded-full',
              category.goalProgress >= 100
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <div
              className={cn(
                'h-full rounded-full',
                category.goalProgress >= 100 ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(category.goalProgress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t('zeroBased.categoryRow.funded', { percent: Math.round(category.goalProgress) })}
          </span>
        </div>
      )}

      {/* Carryover Indicator */}
      {category.carryoverAmount > 0 && (
        <p className="ml-6 text-xs text-blue-600 dark:text-blue-400">
          {t('zeroBased.categoryRow.fromLastMonth', {
            amount: formatCurrency(category.carryoverAmount, currency),
          })}
        </p>
      )}
    </div>
  );
}

// Compact version for mobile
export function CategoryRowCompact({
  category,
  currency,
  onAllocate,
  onMoveFunds,
  onEditGoal,
}: {
  category: CategoryAllocationStatus;
  currency: Currency;
  onAllocate: (categoryId: string) => void;
  onMoveFunds: (categoryId: string) => void;
  onEditGoal: (categoryId: string) => void;
}) {
  const { t } = useTranslation('budgets');
  const colorClass = getCategoryColor(category.categoryName);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <div className={cn('h-2 w-2 rounded-full', colorClass)} />
        <span className="font-medium">{category.categoryName}</span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'font-semibold',
            category.isOverspent
              ? 'text-red-600 dark:text-red-400'
              : category.available > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground'
          )}
        >
          {formatCurrency(category.available, currency)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAllocate(category.categoryId)}
          aria-label={t('zeroBased.categoryRow.allocateFunds')}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveFunds(category.categoryId)}
          aria-label={t('zeroBased.categoryRow.moveFunds')}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditGoal(category.categoryId)}
          aria-label={t('zeroBased.categoryRow.editGoal')}
        >
          <Target className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
