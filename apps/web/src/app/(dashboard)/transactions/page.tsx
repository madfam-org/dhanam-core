'use client';

import { Transaction, useTranslation } from '@dhanam-core/shared';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Plus,
  MoreVertical,
  Loader2,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

import { MerchantIcon } from '@/components/transactions/merchant-icon';
import { TransactionDetailSheet } from '@/components/transactions/transaction-detail-sheet';
import {
  TransactionFilters,
  EMPTY_FILTERS,
  type TransactionFilterValues,
} from '@/components/transactions/transaction-filters';
import { Badge } from '@/components/ui/badge';
import { accountsApi } from '@/lib/api/accounts';
import { categoriesApi } from '@/lib/api/categories';
import { transactionsApi } from '@/lib/api/transactions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

const ITEMS_PER_PAGE = 25;
const TRANSACTION_ROW_HEIGHT = 80;

// Category color map for badges
const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dining: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  groceries: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  transportation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  utilities: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  health: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  healthcare: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  salary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  subscriptions: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  rent: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  housing: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  travel: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  insurance: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  investments: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  crypto: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  defi: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  personal: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  business: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function getCategoryBadgeClass(categoryName: string): string {
  const key = categoryName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 'bg-muted text-muted-foreground';
}

function getDateRange(range: TransactionFilterValues['dateRange']): {
  startDate?: Date;
  endDate?: Date;
} {
  const now = new Date();
  switch (range) {
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start };
    }
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start, endDate: end };
    }
    case 'last-90': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { startDate: start };
    }
    default:
      return {};
  }
}

export default function TransactionsPage() {
  const { t } = useTranslation('transactions');
  const { t: tCommon } = useTranslation('common');
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [, setCorrectionTransaction] = useState<Transaction | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilterValues>(EMPTY_FILTERS);
  const parentRef = useRef<HTMLDivElement>(null);

  // Build API filter from UI filter state
  const apiFilter = useMemo(() => {
    const dateRange = getDateRange(filters.dateRange);
    return {
      page,
      limit: ITEMS_PER_PAGE,
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
      search: filters.search || undefined,
      categoryId: filters.categoryId,
      accountId: filters.accountId,
      ...dateRange,
      ...(filters.type === 'income' ? { minAmount: 0 } : {}),
      ...(filters.type === 'expense' ? { maxAmount: -0.01 } : {}),
    };
  }, [page, filters]);

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError,
  } = useQuery({
    queryKey: ['transactions', currentSpace?.id, apiFilter],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.getTransactions(currentSpace.id, apiFilter);
    },
    enabled: !!currentSpace,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return accountsApi.getAccounts(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return categoriesApi.getCategories(currentSpace.id);
    },
    enabled: !!currentSpace,
    staleTime: 5 * 60 * 1000, // 5 min — categories are reference data that rarely changes
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.createTransaction>[1]) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.createTransaction(currentSpace.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setIsCreateOpen(false);
      toast.success(t('toast.createSuccess'));
    },
    onError: () => {
      toast.error(t('toast.createFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof transactionsApi.updateTransaction>[2];
    }) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.updateTransaction(currentSpace.id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      setSelectedTransaction(null);
      toast.success(t('toast.updateSuccess'));
    },
    onError: () => {
      toast.error(t('toast.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) => {
      if (!currentSpace) throw new Error('No current space');
      return transactionsApi.deleteTransaction(currentSpace.id, transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts', currentSpace?.id] });
      toast.success(t('toast.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('toast.deleteFailed'));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      accountId: formData.get('accountId') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: new Date(formData.get('date') as string),
      description: formData.get('description') as string,
      merchant: (formData.get('merchant') as string) || undefined,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedTransaction.id,
      data: {
        amount: parseFloat(formData.get('amount') as string),
        date: new Date(formData.get('date') as string),
        description: formData.get('description') as string,
        merchant: (formData.get('merchant') as string) || undefined,
      },
    });
  };

  const handleFilterChange = useCallback((newFilters: TransactionFilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: transactionsData?.data?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TRANSACTION_ROW_HEIGHT,
    overscan: 5,
  });

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('button.addTransaction')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>{t('dialog.create.title')}</DialogTitle>
                <DialogDescription>{t('dialog.create.description')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountId">{t('form.account')}</Label>
                  <Select name="accountId" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance, account.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('form.amount')}</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">{t('form.date')}</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">{t('form.description')}</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder={t('form.descriptionPlaceholder')}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="merchant">{t('form.merchantOptional')}</Label>
                  <Input
                    id="merchant"
                    name="merchant"
                    placeholder={t('form.merchantPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('button.createTransaction')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <TransactionFilters
        categories={categories}
        accounts={accounts}
        value={filters}
        onChange={handleFilterChange}
      />

      {isLoadingTransactions ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] })
              }
            >
              {tCommon('tryAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : transactionsData?.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground text-center mb-4">{t('empty.description')}</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('empty.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('list.title')}</CardTitle>
            <CardDescription>
              {transactionsData?.total} {t('list.found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Virtualized list container */}
            <div ref={parentRef} className="h-[500px] overflow-auto" style={{ contain: 'strict' }}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const transaction = transactionsData?.data?.[virtualItem.index];
                  if (!transaction) return null;
                  const account = accounts?.find((a) => a.id === transaction.accountId);

                  const merchant: string | null =
                    (transaction as any).merchant ??
                    (transaction.metadata as Record<string, string> | undefined)?.merchant ??
                    null;
                  const isAICategorized = !!(
                    transaction.metadata as Record<string, string> | undefined
                  )?.categorizedBy;

                  return (
                    <div
                      key={transaction.id}
                      className="absolute top-0 left-0 w-full"
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors mx-1 my-1">
                        <div className="flex items-center gap-4">
                          {/* Merchant Icon instead of generic Receipt */}
                          <MerchantIcon
                            merchant={merchant}
                            description={transaction.description}
                            size={36}
                          />
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(transaction.date)}
                              {account && (
                                <>
                                  <span>·</span>
                                  <span>{account.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Category Badge */}
                          {transaction.category ? (
                            <button
                              type="button"
                              onClick={() => setCorrectionTransaction(transaction)}
                              className="rounded-full"
                            >
                              <Badge
                                variant="secondary"
                                className={`text-xs flex items-center gap-1 ${getCategoryBadgeClass(transaction.category.name)}`}
                              >
                                {isAICategorized && <Sparkles className="h-3 w-3" />}
                                {transaction.category.icon && (
                                  <span>{transaction.category.icon}</span>
                                )}
                                {transaction.category.name}
                              </Badge>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCorrectionTransaction(transaction)}
                              className="rounded-full"
                            >
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                + Categorize
                              </Badge>
                            </button>
                          )}

                          <div className="text-right">
                            <p
                              className={`font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency || currentSpace?.currency
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account?.name || t('list.unknownAccount')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailTransaction(transaction)}
                          >
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label={`Open actions for ${transaction.description}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
                                {t('action.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setCorrectionTransaction(transaction)}
                              >
                                {t('action.categorize') || 'Categorize'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(transaction.id)}
                                className="text-destructive"
                              >
                                {t('action.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {transactionsData && transactionsData.total > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(page * ITEMS_PER_PAGE, transactionsData.total)} of{' '}
                  {transactionsData.total} transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('pagination.previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {Math.ceil(transactionsData.total / ITEMS_PER_PAGE)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * ITEMS_PER_PAGE >= transactionsData.total}
                  >
                    {t('pagination.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedTransaction}
        onOpenChange={(open: boolean) => !open && setSelectedTransaction(null)}
      >
        <DialogContent>
          {selectedTransaction && (
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle>{t('dialog.edit.title')}</DialogTitle>
                <DialogDescription>{t('dialog.edit.description')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">{t('form.amount')}</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={selectedTransaction.amount}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">{t('form.date')}</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={new Date(selectedTransaction.date).toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">{t('form.description')}</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={selectedTransaction.description}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-merchant">{t('form.merchantOptional')}</Label>
                  <Input id="edit-merchant" name="merchant" defaultValue="" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('button.updateTransaction')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Sheet */}
      <TransactionDetailSheet
        transaction={detailTransaction}
        open={!!detailTransaction}
        onOpenChange={(open) => {
          if (!open) setDetailTransaction(null);
        }}
        spaceId={currentSpace.id}
        categories={categories ?? []}
        onUpdate={() =>
          queryClient.invalidateQueries({ queryKey: ['transactions', currentSpace?.id] })
        }
      />
    </div>
  );
}
