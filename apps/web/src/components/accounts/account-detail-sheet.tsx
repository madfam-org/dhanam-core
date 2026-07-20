'use client';

import { Account } from '@dhanam-core/shared';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Input,
  Label,
  Badge,
  Card,
  CardContent,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { formatCurrency } from '@/lib/utils';

interface AccountDetailSheetProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onUpdate: () => void;
}

export function AccountDetailSheet({
  account,
  open,
  onOpenChange,
  spaceId,
  onUpdate,
}: AccountDetailSheetProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => {
    if (account) {
      setEditName(account.name);
      setEditBalance(String(account.balance));
    }
    setIsEditing(false);
  }, [account]);

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
  } = useQuery({
    queryKey: ['transactions', spaceId, account?.id, 'recent'],
    queryFn: () =>
      transactionsApi.getTransactions(spaceId, {
        accountId: account?.id as string,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    enabled: !!account && open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; balance: number }) => {
      if (!account) throw new Error('No account selected');
      return accountsApi.updateAccount(spaceId, account.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', spaceId, account?.id, 'recent'],
      });
      onUpdate();
      setIsEditing(false);
      toast.success('Account updated');
    },
    onError: () => {
      toast.error('Failed to update account');
    },
  });

  const handleSave = () => {
    const balance = parseFloat(editBalance);
    if (!editName.trim()) {
      toast.error('Account name is required');
      return;
    }
    if (isNaN(balance)) {
      toast.error('Balance must be a valid number');
      return;
    }
    updateMutation.mutate({ name: editName.trim(), balance });
  };

  const handleCancel = () => {
    if (account) {
      setEditName(account.name);
      setEditBalance(String(account.balance));
    }
    setIsEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        {account ? (
          <>
            <SheetHeader>
              <SheetTitle>{account.name}</SheetTitle>
              <SheetDescription>
                <span className="inline-flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {account.type}
                  </Badge>
                  {account.provider !== 'manual' && (
                    <Badge variant="outline" className="text-xs">
                      {account.provider}
                    </Badge>
                  )}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Balance Card */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last updated{' '}
                    {new Date(account.lastSyncedAt || account.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Account name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-balance">Balance</Label>
                    <Input
                      id="edit-balance"
                      type="number"
                      step="0.01"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Account
                </Button>
              )}

              {/* Recent Transactions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Recent Transactions</h3>
                {isLoadingTransactions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : isTransactionsError ? (
                  <p className="text-sm text-muted-foreground">Failed to load transactions.</p>
                ) : !transactionsData?.data?.length ? (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                  <ul className="divide-y" role="list">
                    {transactionsData.data.map((txn) => (
                      <li key={txn.id} className="flex items-center justify-between py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`ml-4 shrink-0 text-sm font-medium ${
                            txn.amount < 0
                              ? 'text-destructive'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
