'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Currency } from '@dhanam-core/shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@dhanam-core/ui';
import { useMemo } from 'react';

import { MerchantIcon } from '@/components/transactions/merchant-icon';
import type { CalendarDay } from '@/lib/api/analytics';
import { formatCurrency, cn } from '@/lib/utils';

function resolveLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

interface DayDetailSheetProps {
  selectedDay: CalendarDay | null;
  currency: Currency;
  onClose: () => void;
}

export function DayDetailSheet({ selectedDay, currency, onClose }: DayDetailSheetProps) {
  const { t } = useTranslation('transactions');
  const locale = resolveLocale();

  const dayTitle = selectedDay
    ? new Date(selectedDay.date).toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Group transactions by category
  const categoryGroups = useMemo(() => {
    if (!selectedDay?.transactions) return [];
    const groups = new Map<
      string,
      {
        name: string;
        color: string | null;
        txns: NonNullable<CalendarDay['transactions']>;
        total: number;
      }
    >();
    for (const txn of selectedDay.transactions) {
      const key = txn.categoryName || '__uncategorized__';
      if (!groups.has(key)) {
        groups.set(key, {
          name: txn.categoryName || t('calendar.uncategorized'),
          color: txn.categoryColor,
          txns: [],
          total: 0,
        });
      }
      const g = groups.get(key)!;
      g.txns.push(txn);
      g.total += txn.amount;
    }
    return Array.from(groups.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [selectedDay, t]);

  return (
    <Sheet open={!!selectedDay} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="capitalize">{dayTitle}</SheetTitle>
          {selectedDay && (
            <SheetDescription>
              {selectedDay.transactionCount === 1
                ? t('calendar.transactionCount', { count: 1 })
                : t('calendar.transactionCountPlural', { count: selectedDay.transactionCount })}
            </SheetDescription>
          )}
        </SheetHeader>

        {selectedDay && (
          <div className="space-y-4 mt-4">
            {/* Income / Expenses summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-center">
                <p className="text-xs text-muted-foreground">{t('calendar.income')}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedDay.income, currency)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2 text-center">
                <p className="text-xs text-muted-foreground">{t('calendar.expenses')}</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedDay.expenses, currency)}
                </p>
              </div>
            </div>

            {/* Category-grouped transactions */}
            {categoryGroups.map((group) => (
              <div key={group.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {group.color && (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {group.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      group.total >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {formatCurrency(group.total, currency)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.txns.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MerchantIcon
                          merchant={txn.merchant}
                          description={txn.description}
                          size={28}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{txn.description}</p>
                          {txn.merchant && (
                            <p className="text-xs text-muted-foreground truncate">{txn.merchant}</p>
                          )}
                        </div>
                      </div>
                      <p
                        className={cn(
                          'text-sm font-medium shrink-0 ml-2',
                          txn.amount < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {formatCurrency(txn.amount, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
