'use client';

import { useTranslation } from '@dhanam-core/shared';
import type { Category } from '@dhanam-core/shared';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';

export interface TransactionFilterValues {
  search: string;
  categoryId: string | undefined;
  accountId: string | undefined;
  dateRange: 'all' | 'this-month' | 'last-month' | 'last-90';
  type: 'all' | 'income' | 'expense';
}

const EMPTY_FILTERS: TransactionFilterValues = {
  search: '',
  categoryId: undefined,
  accountId: undefined,
  dateRange: 'all',
  type: 'all',
};

interface TransactionFiltersProps {
  categories: Category[] | undefined;
  accounts: Array<{ id: string; name: string }> | undefined;
  value: TransactionFilterValues;
  onChange: (filters: TransactionFilterValues) => void;
}

export function TransactionFilters({
  categories,
  accounts,
  value,
  onChange,
}: TransactionFiltersProps) {
  const { t } = useTranslation('transactions');
  const [searchInput, setSearchInput] = useState(value.search);

  const update = useCallback(
    (patch: Partial<TransactionFilterValues>) => {
      onChange({ ...value, ...patch });
    },
    [value, onChange]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      update({ search: searchInput });
    }
  };

  const hasFilters =
    value.search ||
    value.categoryId ||
    value.accountId ||
    value.dateRange !== 'all' ||
    value.type !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('filter.searchPlaceholder') || 'Search transactions...'}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={() => update({ search: searchInput })}
          className="pl-9 h-9"
        />
      </div>

      {/* Category */}
      <Select
        value={value.categoryId ?? '__all__'}
        onValueChange={(v) => update({ categoryId: v === '__all__' ? undefined : v })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder={t('filter.category') || 'Category'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filter.allCategories') || 'All categories'}</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ''}
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Account */}
      <Select
        value={value.accountId ?? '__all__'}
        onValueChange={(v) => update({ accountId: v === '__all__' ? undefined : v })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder={t('filter.account') || 'Account'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('filter.allAccounts') || 'All accounts'}</SelectItem>
          {accounts?.map((acc) => (
            <SelectItem key={acc.id} value={acc.id}>
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Select
        value={value.dateRange}
        onValueChange={(v) => update({ dateRange: v as TransactionFilterValues['dateRange'] })}
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.allTime') || 'All time'}</SelectItem>
          <SelectItem value="this-month">{t('filter.thisMonth') || 'This month'}</SelectItem>
          <SelectItem value="last-month">{t('filter.lastMonth') || 'Last month'}</SelectItem>
          <SelectItem value="last-90">{t('filter.last90') || 'Last 90 days'}</SelectItem>
        </SelectContent>
      </Select>

      {/* Income / Expense toggle */}
      <Select
        value={value.type}
        onValueChange={(v) => update({ type: v as TransactionFilterValues['type'] })}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter.all') || 'All'}</SelectItem>
          <SelectItem value="income">{t('filter.income') || 'Income'}</SelectItem>
          <SelectItem value="expense">{t('filter.expenses') || 'Expenses'}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2"
          onClick={() => {
            setSearchInput('');
            onChange(EMPTY_FILTERS);
          }}
        >
          <X className="h-4 w-4 mr-1" />
          {t('filter.clear') || 'Clear'}
        </Button>
      )}
    </div>
  );
}

export { EMPTY_FILTERS };
