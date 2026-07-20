'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Currency } from '@dhanam-core/shared';
import { useMemo, useCallback, useRef } from 'react';

import type { CalendarDay } from '@/lib/api/analytics';

import { CalendarDayCell } from './calendar-day-cell';

function resolveLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  days: CalendarDay[];
  currency: Currency;
  selectedDay: CalendarDay | null;
  focusedDay: number;
  onSelectDay: (day: CalendarDay) => void;
  onFocusDay: (dayNum: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarGrid({
  year,
  month,
  days,
  currency,
  selectedDay,
  focusedDay,
  onSelectDay,
  onFocusDay,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const { t } = useTranslation('transactions');
  const locale = resolveLocale();
  const gridRef = useRef<HTMLDivElement>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build lookup map
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of days) {
      const dateKey = day.date.slice(0, 10);
      map.set(dateKey, day);
    }
    return map;
  }, [days]);

  // Max transactions for density scaling
  const maxTransactions = useMemo(
    () => Math.max(1, ...days.map((d) => d.transactionCount)),
    [days]
  );

  const now = new Date();

  // Day-of-week headers (locale-aware)
  const dayHeaders = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      // Jan 7 2024 is a Sunday — offset by i gives each weekday
      const sunday = new Date(2024, 0, 7 + i);
      return {
        short: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(sunday),
        narrow: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(sunday),
      };
    });
  }, [locale]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, dayNum: number) => {
      let newDay: number;
      switch (e.key) {
        case 'ArrowLeft':
          newDay = dayNum - 1;
          break;
        case 'ArrowRight':
          newDay = dayNum + 1;
          break;
        case 'ArrowUp':
          newDay = dayNum - 7;
          break;
        case 'ArrowDown':
          newDay = dayNum + 7;
          break;
        case 'Home':
          newDay = 1;
          break;
        case 'End':
          newDay = daysInMonth;
          break;
        case 'PageUp':
          e.preventDefault();
          onPrevMonth();
          return;
        case 'PageDown':
          e.preventDefault();
          onNextMonth();
          return;
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayData = dayMap.get(dateStr);
          if (dayData) onSelectDay(dayData);
          return;
        }
        default:
          return;
      }

      e.preventDefault();
      if (newDay >= 1 && newDay <= daysInMonth) {
        onFocusDay(newDay);
        // Focus the button
        const btn = gridRef.current?.querySelector(`[data-day="${newDay}"]`) as HTMLElement;
        btn?.focus();
      }
    },
    [daysInMonth, year, month, dayMap, onSelectDay, onFocusDay, onPrevMonth, onNextMonth]
  );

  return (
    <div ref={gridRef} role="grid" aria-label={t('calendar.title')}>
      {/* Day Headers */}
      <div role="row" className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {dayHeaders.map((header, i) => (
          <div
            key={i}
            role="columnheader"
            className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            <span className="hidden md:inline">{header.short}</span>
            <span className="md:hidden">{header.narrow}</span>
          </div>
        ))}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
        {/* Empty cells before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div
            key={`empty-${i}`}
            role="gridcell"
            className="bg-background min-h-[80px] md:min-h-[80px] p-2"
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayData = dayMap.get(dateStr);
          const isToday =
            dayNum === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const isSelected = selectedDay?.date.slice(0, 10) === dateStr;

          return (
            <div key={dayNum} data-day={dayNum} role="presentation">
              <CalendarDayCell
                dayNum={dayNum}
                dateStr={dateStr}
                dayData={dayData}
                isToday={isToday}
                isSelected={isSelected}
                maxTransactions={maxTransactions}
                currency={currency}
                tabIndex={dayNum === focusedDay ? 0 : -1}
                onSelect={onSelectDay}
                onKeyDown={handleKeyDown}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
