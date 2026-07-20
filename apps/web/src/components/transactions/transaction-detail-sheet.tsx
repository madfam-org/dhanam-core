'use client';

import { Transaction, Category } from '@dhanam-core/shared';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Card,
  CardContent,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Save,
  X,
  Loader2,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { transactionsApi } from '@/lib/api/transactions';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  categories: Category[];
  onUpdate: () => void;
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  spaceId,
  categories,
  onUpdate,
}: TransactionDetailSheetProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    description: '',
    amount: 0,
    date: '',
    merchant: '',
    categoryId: '',
  });

  const metadata = transaction?.metadata as Record<string, unknown> | undefined;
  const merchant = (metadata?.merchant as string) ?? null;
  const notes = (metadata?.notes as string) ?? null;
  const originalName = (metadata?.originalName as string) ?? null;

  // Similar transactions query
  const { data: similarTransactions, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ['similar-transactions', spaceId, merchant],
    queryFn: () =>
      transactionsApi.getTransactions(spaceId, {
        search: merchant!,
        limit: 6,
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    enabled: open && !!merchant,
  });

  // Filter out current transaction from similar results
  const filteredSimilar =
    similarTransactions?.data?.filter((t) => t.id !== transaction?.id).slice(0, 5) ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.updateTransaction>[2]) => {
      if (!transaction) throw new Error('No transaction selected');
      return transactionsApi.updateTransaction(spaceId, transaction.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', spaceId] });
      onUpdate();
      setIsEditing(false);
      toast.success('Transaction updated');
    },
    onError: () => {
      toast.error('Failed to update transaction');
    },
  });

  const handleStartEditing = () => {
    if (!transaction) return;
    setEditValues({
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0] ?? '',
      merchant: merchant ?? '',
      categoryId: transaction.categoryId ?? '',
    });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    updateMutation.mutate({
      description: editValues.description,
      amount: editValues.amount,
      date: new Date(editValues.date),
      merchant: editValues.merchant || undefined,
      categoryId: editValues.categoryId || undefined,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsEditing(false);
    }
    onOpenChange(nextOpen);
  };

  if (!transaction) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="sm:max-w-md" />
      </Sheet>
    );
  }

  const categoryForTransaction =
    transaction.category ?? categories.find((c) => c.id === transaction.categoryId);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{transaction.description}</SheetTitle>
          <SheetDescription className="text-left">{merchant ?? 'No merchant'}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Key Details */}
          {!isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>Amount</span>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </CardContent>
                </Card>

                {/* Date */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Date</span>
                    </div>
                    <p className="text-sm font-medium">{formatDate(transaction.date)}</p>
                  </CardContent>
                </Card>

                {/* Account */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Account</span>
                    </div>
                    <p className="text-sm font-medium truncate">{transaction.accountId}</p>
                  </CardContent>
                </Card>

                {/* Category */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span>Category</span>
                    </div>
                    {categoryForTransaction ? (
                      <Badge variant="secondary" className="text-xs">
                        {categoryForTransaction.icon && (
                          <span className="mr-1">{categoryForTransaction.icon}</span>
                        )}
                        {categoryForTransaction.name}
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">Uncategorized</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {transaction.pending ? (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Cleared
                  </Badge>
                )}
                {transaction.excludeFromTotals && (
                  <Badge variant="outline" className="text-xs">
                    Excluded from totals
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {(() => {
                const tags = (transaction as unknown as Record<string, unknown>).tags;
                if (!Array.isArray(tags) || tags.length === 0) return null;
                return (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(tags as Array<{ id: string; name: string; color?: string | null }>).map(
                        (tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                );
              })()}

              <Button variant="outline" size="sm" onClick={handleStartEditing}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </Button>
            </>
          ) : (
            /* Edit Form */
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editValues.amount}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editValues.date}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-merchant">Merchant</Label>
                <Input
                  id="edit-merchant"
                  value={editValues.merchant}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, merchant: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editValues.categoryId}
                  onValueChange={(value) =>
                    setEditValues((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEditing}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-3.5 w-3.5 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Notes / Metadata */}
          {(notes || (originalName && originalName !== transaction.description)) && (
            <>
              <div className="space-y-2">
                {originalName && originalName !== transaction.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Original name</p>
                    <p className="text-sm">{originalName}</p>
                  </div>
                )}
                {notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{notes}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Similar Transactions */}
          {merchant && (
            <div>
              <p className="text-sm font-medium mb-3">Similar Transactions</p>
              {isLoadingSimilar ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSimilar.length > 0 ? (
                <div className="space-y-2">
                  {filteredSimilar.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                      </div>
                      <p
                        className={`ml-3 font-medium whitespace-nowrap ${
                          t.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(t.amount, t.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No other transactions from this merchant
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
