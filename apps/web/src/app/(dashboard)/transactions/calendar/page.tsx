'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Currency } from '@dhanam-core/shared';
import { Card, CardContent, CardHeader } from '@dhanam-core/ui';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { useState, useCallback } from 'react';

import {
  CalendarGrid,
  CalendarSkeleton,
  DayDetailPanel,
  DayDetailSheet,
  MonthNavigator,
  MonthlySummary,
} from '@/components/calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import { analyticsApi, type CalendarDay } from '@/lib/api/analytics';
import { useSpaceStore } from '@/stores/space';

export default function CalendarPage() {
  const { t } = useTranslation('transactions');
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;
  const currency = (currentSpace?.currency ?? 'USD') as Currency;
  const isMobile = useIsMobile();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [focusedDay, setFocusedDay] = useState(1);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', spaceId, year, month + 1],
    queryFn: () => analyticsApi.getCalendarData(spaceId!, year, month + 1),
    enabled: !!spaceId,
  });

  const days = calendarData?.days ?? [];

  const goToPrevMonth = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setFocusedDay(1);
  }, [month]);

  const goToNextMonth = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setFocusedDay(1);
  }, [month]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
    setFocusedDay(today.getDate());
  }, []);

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">{t('calendar.noSpaceSelected')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">{t('calendar.selectSpacePrompt')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('calendar.title')}</h1>
        <p className="text-muted-foreground">{t('calendar.description')}</p>
      </div>

      {/* Monthly Summary */}
      {!isLoading && days.length > 0 && <MonthlySummary days={days} currency={currency} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <MonthNavigator
                year={year}
                month={month}
                onPrevMonth={goToPrevMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
              />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <CalendarSkeleton />
              ) : (
                <CalendarGrid
                  year={year}
                  month={month}
                  days={days}
                  currency={currency}
                  selectedDay={selectedDay}
                  focusedDay={focusedDay}
                  onSelectDay={setSelectedDay}
                  onFocusDay={setFocusedDay}
                  onPrevMonth={goToPrevMonth}
                  onNextMonth={goToNextMonth}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day Detail — Desktop: sidebar, Mobile: bottom sheet */}
        {!isMobile && (
          <div className="lg:col-span-1">
            <DayDetailPanel
              selectedDay={selectedDay}
              currency={currency}
              onClose={() => setSelectedDay(null)}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <DayDetailSheet
          selectedDay={selectedDay}
          currency={currency}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
