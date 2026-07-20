'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from '@dhanam-core/ui';
import { Search, SortAsc, SortDesc, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';

import { CategoryAllocationStatus } from '@/lib/api/zero-based';

import { CategoryRow, CategoryRowCompact } from './category-row';

interface CategoryAllocationListProps {
  categories: CategoryAllocationStatus[];
  currency: Currency;
  onAllocate: (categoryId: string) => void;
  onMoveFunds: (categoryId: string) => void;
  onEditGoal: (categoryId: string) => void;
}

type SortField = 'name' | 'allocated' | 'spent' | 'available';
type SortDirection = 'asc' | 'desc';
type FilterOption = 'all' | 'overspent' | 'underfunded' | 'on-track';

export function CategoryAllocationList({
  categories,
  currency,
  onAllocate,
  onMoveFunds,
  onEditGoal,
}: CategoryAllocationListProps) {
  const { t } = useTranslation('budgets');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filter, setFilter] = useState<FilterOption>('all');

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((cat) => cat.categoryName.toLowerCase().includes(query));
    }

    // Apply status filter
    switch (filter) {
      case 'overspent':
        result = result.filter((cat) => cat.isOverspent);
        break;
      case 'underfunded':
        result = result.filter(
          (cat) => !cat.isOverspent && cat.goalProgress !== undefined && cat.goalProgress < 100
        );
        break;
      case 'on-track':
        result = result.filter(
          (cat) => !cat.isOverspent && (cat.goalProgress === undefined || cat.goalProgress >= 100)
        );
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case 'allocated':
          comparison = a.allocated - b.allocated;
          break;
        case 'spent':
          comparison = a.spent - b.spent;
          break;
        case 'available':
          comparison = a.available - b.available;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, searchQuery, sortField, sortDirection, filter]);

  // Summary stats
  const overspentCount = categories.filter((c) => c.isOverspent).length;
  const underfundedCount = categories.filter(
    (c) => !c.isOverspent && c.goalProgress !== undefined && c.goalProgress < 100
  ).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = sortDirection === 'asc' ? SortAsc : SortDesc;

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: t('zeroBased.categoryList.filterAll') },
    { value: 'overspent', label: t('zeroBased.categoryList.filterOverspent') },
    { value: 'underfunded', label: t('zeroBased.categoryList.filterUnderfunded') },
    { value: 'on-track', label: t('zeroBased.categoryList.filterOnTrack') },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'name', label: t('zeroBased.categoryList.sortName') },
    { value: 'allocated', label: t('zeroBased.categoryList.sortAllocated') },
    { value: 'available', label: t('zeroBased.categoryList.sortAvailable') },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('zeroBased.categoryList.title')}</CardTitle>
            <CardDescription>
              {t('zeroBased.categoryList.categories', { count: categories.length })}
              {overspentCount > 0 && (
                <>
                  {' \u2022 '}
                  <span className="text-red-600 dark:text-red-400">
                    {t('zeroBased.categoryList.overspent', { count: overspentCount })}
                  </span>
                </>
              )}
              {underfundedCount > 0 && (
                <>
                  {' \u2022 '}
                  <span className="text-amber-600 dark:text-amber-400">
                    {t('zeroBased.categoryList.underfunded', { count: underfundedCount })}
                  </span>
                </>
              )}
            </CardDescription>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('zeroBased.categoryList.searchPlaceholder')}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-sm text-muted-foreground">
            {t('zeroBased.categoryList.filterLabel')}
          </span>
          <div className="flex gap-1">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex-1" />

          <span className="text-sm text-muted-foreground">
            {t('zeroBased.categoryList.sortLabel')}
          </span>
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortField === option.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleSort(option.value)}
                className="gap-1"
              >
                {option.label}
                {sortField === option.value && <SortIcon className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Overspent Warning */}
        {overspentCount > 0 && filter === 'all' && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {overspentCount === 1
                ? t('zeroBased.categoryList.overspentWarningSingular')
                : t('zeroBased.categoryList.overspentWarning', { count: overspentCount })}
            </span>
          </div>
        )}

        {/* Category List */}
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery || filter !== 'all'
              ? t('zeroBased.categoryList.emptyFiltered')
              : t('zeroBased.categoryList.emptyNone')}
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden space-y-2 md:block">
              {filteredCategories.map((category) => (
                <CategoryRow
                  key={category.categoryId}
                  category={category}
                  currency={currency}
                  onAllocate={onAllocate}
                  onMoveFunds={onMoveFunds}
                  onEditGoal={onEditGoal}
                />
              ))}
            </div>

            {/* Mobile View */}
            <div className="space-y-2 md:hidden">
              {filteredCategories.map((category) => (
                <CategoryRowCompact
                  key={category.categoryId}
                  category={category}
                  currency={currency}
                  onAllocate={onAllocate}
                  onMoveFunds={onMoveFunds}
                  onEditGoal={onEditGoal}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
