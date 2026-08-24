'use client';

import { Currency, type AccountType } from '@dhanam-core/shared';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { accountsApi } from '~/lib/api/accounts';
import { useSpaceStore } from '~/stores/space';

const ACCOUNT_TYPES: AccountType[] = [
  'checking',
  'savings',
  'credit',
  'investment',
  'crypto',
  'other',
];
const CURRENCIES: Currency[] = [Currency.MXN, Currency.USD, Currency.EUR, Currency.CAD];

/**
 * Accounts page (dhanam-core).
 *
 * dhanam-core tracks manually-entered accounts and balances. Automatic account
 * aggregation (open-banking / exchange connectors) is not part of the open
 * core, so this page manages accounts created by hand or imported from CSV.
 */
export default function AccountsPage() {
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<Currency>(currentSpace?.currency ?? Currency.MXN);
  const [balance, setBalance] = useState('0');

  const spaceId = currentSpace?.id;

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', spaceId],
    queryFn: () => accountsApi.getAccounts(spaceId as string),
    enabled: !!spaceId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      accountsApi.createAccount(spaceId as string, {
        name,
        type,
        currency,
        balance: parseFloat(balance) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', spaceId] });
      setOpen(false);
      setName('');
      setBalance('0');
    },
  });

  if (!currentSpace) {
    return <p className="text-muted-foreground">Select a space to view accounts.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manually-tracked accounts in {currentSpace.name}.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a manual account</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((tt) => (
                      <SelectItem key={tt} value={tt}>
                        {tt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? '…' : 'Create account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle className="text-base">{account.name}</CardTitle>
                <CardDescription>
                  {account.type} · {account.currency}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {Number(account.balance).toLocaleString(undefined, {
                    style: 'currency',
                    currency: account.currency,
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No accounts yet. Add one manually or import a statement.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
