'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button } from '@dhanam-core/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function resolveLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

interface MonthNavigatorProps {
  year: number;
  month: number; // 0-indexed
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function MonthNavigator({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthNavigatorProps) {
  const { t } = useTranslation('transactions');
  const locale = resolveLocale();
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  );

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold capitalize">{monthLabel}</h2>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          {t('calendar.today')}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          aria-label={t('calendar.prevMonth')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
