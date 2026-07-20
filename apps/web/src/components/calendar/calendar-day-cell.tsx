'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Currency } from '@dhanam-core/shared';

import type { CalendarDay } from '@/lib/api/analytics';
import { formatCurrency, cn } from '@/lib/utils';

interface CalendarDayCellProps {
  dayNum: number;
  dateStr: string;
  dayData: CalendarDay | undefined;
  isToday: boolean;
  isSelected: boolean;
  maxTransactions: number;
  currency: Currency;
  tabIndex: number;
  onSelect: (day: CalendarDay) => void;
  onKeyDown: (e: React.KeyboardEvent, dayNum: number) => void;
}

export function CalendarDayCell({
  dayNum,
  dayData,
  isToday,
  isSelected,
  maxTransactions,
  currency,
  tabIndex,
  onSelect,
  onKeyDown,
}: CalendarDayCellProps) {
  const { t } = useTranslation('transactions');
  const hasTransactions = dayData && dayData.transactionCount > 0;

  // Density: 1-5 scale based on transaction count relative to month max
  const density =
    hasTransactions && maxTransactions > 0
      ? Math.min(5, Math.max(1, Math.ceil((dayData.transactionCount / maxTransactions) * 5)))
      : 0;

  const densityBorder =
    density > 0
      ? `border-b-2 ${
          density <= 1
            ? 'border-primary/10'
            : density <= 2
              ? 'border-primary/20'
              : density <= 3
                ? 'border-primary/30'
                : density <= 4
                  ? 'border-primary/40'
                  : 'border-primary/50'
        }`
      : '';

  // Build accessible label
  const ariaLabel = hasTransactions
    ? `${dayNum}, ${dayData.transactionCount === 1 ? t('calendar.transactionCount', { count: 1 }) : t('calendar.transactionCountPlural', { count: dayData.transactionCount })}, ${t('calendar.net')} ${formatCurrency(dayData.net, currency)}`
    : `${dayNum}`;

  return (
    <button
      role="gridcell"
      aria-selected={isSelected}
      aria-current={isToday ? 'date' : undefined}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onClick={() => dayData && onSelect(dayData)}
      onKeyDown={(e) => onKeyDown(e, dayNum)}
      className={cn(
        'bg-background min-h-[80px] md:min-h-[80px] p-2 text-left transition-colors hover:bg-muted/50',
        isSelected && 'ring-2 ring-primary ring-inset',
        hasTransactions ? 'cursor-pointer' : 'cursor-default',
        densityBorder
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isToday &&
              'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
          )}
        >
          {dayNum}
        </span>
      </div>
      {hasTransactions && (
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            {dayData.transactionCount === 1
              ? t('calendar.transactionCount', { count: 1 })
              : t('calendar.transactionCountPlural', { count: dayData.transactionCount })}
          </p>
          <p
            className={cn(
              'text-xs font-medium',
              dayData.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {formatCurrency(dayData.net, currency)}
          </p>
          {/* Mobile: show colored dot instead of text */}
          <div className="flex gap-0.5 md:hidden">
            {dayData.income > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {dayData.expenses > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
          </div>
        </div>
      )}
    </button>
  );
}
