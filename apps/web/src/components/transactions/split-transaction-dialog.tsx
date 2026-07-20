'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Separator,
} from '@dhanam-core/ui';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface SplitItem {
  userId: string;
  userName: string;
  amount: number;
  percentage?: number;
  note?: string;
}

interface SplitTransactionDialogProps {
  transactionId: string;
  transactionAmount: number;
  spaceId: string;
  householdMembers: Array<{ id: string; name: string; email: string }>;
  onSplit?: () => void;
}

export function SplitTransactionDialog({
  transactionId,
  transactionAmount,
  spaceId,
  householdMembers,
  onSplit,
}: SplitTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: React 19 type incompatibility with @dhanam-core/ui Button requires cast
  const ButtonCompat = Button as any;

  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
  const remaining = Math.abs(transactionAmount) - totalSplit;

  const addSplit = () => {
    if (splits.length >= householdMembers.length) {
      return;
    }

    // Default to equal split of remaining amount
    const defaultAmount = remaining / (householdMembers.length - splits.length);

    setSplits([
      ...splits,
      {
        userId: '',
        userName: '',
        amount: Math.max(0, defaultAmount),
        percentage: undefined,
        note: '',
      },
    ]);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const updateSplit = (
    index: number,
    field: keyof SplitItem,
    value: string | number | undefined
  ) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value } as SplitItem;

    // Update percentage when amount changes
    if (field === 'amount' && transactionAmount !== 0) {
      const item = newSplits[index];
      if (item && typeof value === 'number') {
        item.percentage = (value / Math.abs(transactionAmount)) * 100;
      }
    }

    setSplits(newSplits);
  };

  const selectUser = (index: number, userId: string) => {
    const user = householdMembers.find((m) => m.id === userId);
    if (user) {
      updateSplit(index, 'userId', userId);
      updateSplit(index, 'userName', user.name);
    }
  };

  const handleSubmit = async () => {
    if (splits.length < 2) {
      alert('At least 2 splits required');
      return;
    }

    if (Math.abs(remaining) > 0.01) {
      alert('Splits must add up to transaction amount');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/transactions/${transactionId}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          splits: splits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage,
            note: s.note,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to split transaction');
      }

      setOpen(false);
      setSplits([]);
      onSplit?.();
    } catch (error) {
      console.error('Error splitting transaction:', error);
      alert('Failed to split transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonCompat variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Split
        </ButtonCompat>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Split Transaction</DialogTitle>
          <DialogDescription>
            Divide this {formatCurrency(Math.abs(transactionAmount))} expense among household
            members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm font-medium">Transaction Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(Math.abs(transactionAmount))}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Remaining</p>
              <p
                className={`text-2xl font-bold ${remaining > 0.01 ? 'text-destructive' : 'text-green-600'}`}
              >
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`user-${index}`}>Person</Label>
                      <Select
                        value={split.userId}
                        onValueChange={(value: string) => selectUser(index, value)}
                      >
                        <SelectTrigger id={`user-${index}`}>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          {householdMembers
                            .filter((m) => !splits.some((s, i) => i !== index && s.userId === m.id))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`amount-${index}`}>Amount</Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateSplit(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`percent-${index}`}>%</Label>
                      <Input
                        id={`percent-${index}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={split.percentage?.toFixed(1) || ''}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Note (optional)"
                    value={split.note || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateSplit(index, 'note', e.target.value)
                    }
                  />
                </div>
                <ButtonCompat
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSplit(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </ButtonCompat>
              </div>
            ))}
          </div>

          {splits.length < householdMembers.length && (
            <ButtonCompat variant="outline" onClick={addSplit} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </ButtonCompat>
          )}
        </div>

        <DialogFooter>
          <ButtonCompat variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </ButtonCompat>
          <ButtonCompat onClick={handleSubmit} disabled={loading || Math.abs(remaining) > 0.01}>
            {loading ? 'Splitting...' : 'Split Transaction'}
          </ButtonCompat>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
