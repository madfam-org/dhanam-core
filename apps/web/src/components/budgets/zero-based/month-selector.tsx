'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button } from '@dhanam-core/ui';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM format
  onMonthChange: (month: string) => void;
}

function parseMonth(month: string): { year: number; month: number } {
  const [year, monthNum] = month.split('-').map(Number);
  return { year: year!, month: monthNum! };
}

function getIntlLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

function formatMonth(month: string): string {
  const { year, month: monthNum } = parseMonth(month);
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleDateString(getIntlLocale(), { month: 'long', year: 'numeric' });
}

function getPreviousMonth(month: string): string {
  const { year, month: monthNum } = parseMonth(month);
  const date = new Date(year, monthNum - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getNextMonth(month: string): string {
  const { year, month: monthNum } = parseMonth(month);
  const date = new Date(year, monthNum, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth();
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {
  const { t } = useTranslation('budgets');
  const previousMonth = getPreviousMonth(currentMonth);
  const nextMonth = getNextMonth(currentMonth);
  const isCurrent = isCurrentMonth(currentMonth);

  return (
    <div className="flex items-center gap-2">
      {/* Previous Month Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMonthChange(previousMonth)}
        aria-label={formatMonth(previousMonth)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Current Month Display */}
      <div className="flex min-w-[180px] items-center justify-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">{formatMonth(currentMonth)}</span>
        {isCurrent && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            {t('zeroBased.monthSelector.current')}
          </span>
        )}
      </div>

      {/* Next Month Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMonthChange(nextMonth)}
        aria-label={formatMonth(nextMonth)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Jump to Current Month (if not current) */}
      {!isCurrent && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMonthChange(getCurrentMonth())}
          className="ml-2"
        >
          {t('zeroBased.monthSelector.today')}
        </Button>
      )}
    </div>
  );
}

// Full month navigation with quick jumps
export function MonthNavigator({ currentMonth, onMonthChange }: MonthSelectorProps) {
  const { t } = useTranslation('budgets');
  const todayMonth = getCurrentMonth();

  // Generate last 6 months for quick access
  const quickMonths: string[] = [];
  let tempMonth = todayMonth;
  for (let i = 0; i < 6; i++) {
    quickMonths.push(tempMonth);
    tempMonth = getPreviousMonth(tempMonth);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <MonthSelector currentMonth={currentMonth} onMonthChange={onMonthChange} />
      </div>

      {/* Quick Month Buttons */}
      <div className="flex flex-wrap gap-1 border-t pt-3">
        {quickMonths.map((month) => (
          <Button
            key={month}
            variant={month === currentMonth ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onMonthChange(month)}
            className="text-xs"
          >
            {new Date(parseMonth(month).year, parseMonth(month).month - 1, 1).toLocaleDateString(
              getIntlLocale(),
              { month: 'short' }
            )}
            {month === todayMonth && (
              <span className="ml-1 rounded bg-primary/20 px-1 text-[10px]">
                {t('zeroBased.monthSelector.now')}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
