'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Search, Table2 } from 'lucide-react';
import { useState } from 'react';

import { accountsApi } from '@/lib/api/accounts';
import { analyticsApi, AnalyticsQueryParams, AnalyticsQueryResult } from '@/lib/api/analytics';
import { categoriesApi } from '@/lib/api/categories';
import { tagsApi } from '@/lib/api/tags';
import { formatCurrency } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

type GroupByOption = 'month' | 'category' | 'merchant' | 'account' | 'tag';

function getDefaultDates() {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export default function QueryPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [groupBy, setGroupBy] = useState<GroupByOption>('month');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [tagId, setTagId] = useState<string>('');
  const [results, setResults] = useState<AnalyticsQueryResult[] | null>(null);

  // Reference data for filters
  const { data: categories } = useQuery({
    queryKey: ['categories', spaceId],
    queryFn: () => categoriesApi.getCategories(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', spaceId],
    queryFn: () => accountsApi.getAccounts(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags', spaceId],
    queryFn: () => tagsApi.getTags(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });

  const queryMutation = useMutation({
    mutationFn: (params: AnalyticsQueryParams) => analyticsApi.executeQuery(spaceId!, params),
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) return;

    const params: AnalyticsQueryParams = {
      startDate,
      endDate,
      groupBy,
    };
    if (categoryId) params.categoryId = categoryId;
    if (accountId) params.accountId = accountId;
    if (merchant) params.merchant = merchant;
    if (tagId) params.tagId = tagId;

    queryMutation.mutate(params);
  };

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">Select a space to run queries.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyze</h1>
        <p className="text-muted-foreground">
          Build custom queries to explore your financial data.
        </p>
      </div>

      {/* Query Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Query Builder</CardTitle>
          <CardDescription>Select a date range, grouping, and optional filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="query-start">Start Date</Label>
                <Input
                  id="query-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query-end">End Date</Label>
                <Input
                  id="query-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query-group">Group By</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                  <SelectTrigger id="query-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Filters */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="query-category">Category (optional)</Label>
                <Select
                  value={categoryId || '__all__'}
                  onValueChange={(v) => setCategoryId(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger id="query-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query-account">Account (optional)</Label>
                <Select
                  value={accountId || '__all__'}
                  onValueChange={(v) => setAccountId(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger id="query-account">
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All accounts</SelectItem>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query-merchant">Merchant (optional)</Label>
                <Input
                  id="query-merchant"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Filter by merchant"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="query-tag">Tag (optional)</Label>
                <Select
                  value={tagId || '__all__'}
                  onValueChange={(v) => setTagId(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger id="query-tag">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All tags</SelectItem>
                    {tags?.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={queryMutation.isPending}>
              {queryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Run Query
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {queryMutation.isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {queryMutation.isError && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">Query failed</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please check your parameters and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {results !== null && !queryMutation.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Results
            </CardTitle>
            <CardDescription>
              {results.length} group{results.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No results for this query. Try adjusting your filters or date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Transactions</th>
                      <th className="text-right py-3 px-4 font-medium">Income</th>
                      <th className="text-right py-3 px-4 font-medium">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr
                        key={row.groupKey}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{row.groupLabel}</td>
                        <td className="py-3 px-4 text-right">{row.transactionCount}</td>
                        <td className="py-3 px-4 text-right text-green-600">
                          {formatCurrency(row.income, currentSpace?.currency ?? 'MXN')}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          {formatCurrency(Math.abs(row.expenses), currentSpace?.currency ?? 'MXN')}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-medium ${
                            row.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(row.totalAmount, currentSpace?.currency ?? 'MXN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-medium">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right">
                        {results.reduce((s, r) => s + r.transactionCount, 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {formatCurrency(
                          results.reduce((s, r) => s + r.income, 0),
                          currentSpace?.currency ?? 'MXN'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">
                        {formatCurrency(
                          Math.abs(results.reduce((s, r) => s + r.expenses, 0)),
                          currentSpace?.currency ?? 'MXN'
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          results.reduce((s, r) => s + r.totalAmount, 0) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(
                          results.reduce((s, r) => s + r.totalAmount, 0),
                          currentSpace?.currency ?? 'MXN'
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
