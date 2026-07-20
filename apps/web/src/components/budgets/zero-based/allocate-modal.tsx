'use client';

import { Currency, useTranslation } from '@dhanam-core/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@dhanam-core/ui';
import { Wallet, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

import { CategoryAllocationStatus } from '@/lib/api/zero-based';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

interface AllocateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryAllocationStatus[];
  unallocated: number;
  currency: Currency;
  preselectedCategoryId?: string;
  onAllocate: (categoryId: string, amount: number, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_AMOUNTS = [50, 100, 250, 500];

export function AllocateModal({
  open,
  onOpenChange,
  categories,
  unallocated,
  currency,
  preselectedCategoryId,
  onAllocate,
  isLoading = false,
}: AllocateModalProps) {
  const { t } = useTranslation('budgets');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(preselectedCategoryId || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or preselected category changes
  useEffect(() => {
    if (open) {
      setSelectedCategoryId(preselectedCategoryId || '');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [open, preselectedCategoryId]);

  const selectedCategory = categories.find((c) => c.categoryId === selectedCategoryId);
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= unallocated;
  const canSubmit = selectedCategoryId && isValidAmount && !isLoading;
  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCategoryId) {
      setError(t('zeroBased.allocateModal.errSelectCategory'));
      return;
    }

    if (numericAmount <= 0) {
      setError(t('zeroBased.allocateModal.errAmountZero'));
      return;
    }

    if (numericAmount > unallocated) {
      setError(
        t('zeroBased.allocateModal.errAmountExceeds', {
          amount: formatCurrency(unallocated, currency),
        })
      );
      return;
    }

    try {
      await onAllocate(selectedCategoryId, numericAmount, notes || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('zeroBased.allocateModal.errFailed'));
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    const newAmount = Math.min(quickAmount, unallocated);
    setAmount(newAmount.toString());
  };

  const handleAllocateAll = () => {
    setAmount(unallocated.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('zeroBased.allocateModal.title')}</DialogTitle>
              <DialogDescription>{t('zeroBased.allocateModal.description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Available to Allocate */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              {t('zeroBased.allocateModal.availableToAllocate')}
            </p>
            <p className="text-xl font-bold">{formatCurrency(unallocated, currency)}</p>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('zeroBased.allocateModal.category')}</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t('zeroBased.allocateModal.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName} ({t('zeroBased.categoryRow.available')}:{' '}
                    {formatCurrency(cat.available, currency)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('zeroBased.allocateModal.amount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {symbol}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={unallocated}
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAmount(quickAmount)}
                disabled={unallocated < quickAmount}
              >
                {symbol}
                {quickAmount}
              </Button>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAllocateAll}
              disabled={unallocated <= 0}
            >
              {t('zeroBased.allocateModal.allocateAll', {
                amount: formatCurrency(unallocated, currency),
              })}
            </Button>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('zeroBased.allocateModal.notes')}</Label>
            <Input
              id="notes"
              placeholder={t('zeroBased.allocateModal.notesPlaceholder')}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          {selectedCategory && numericAmount > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span>{selectedCategory.categoryName}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatCurrency(selectedCategory.allocated, currency)}
                </span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedCategory.allocated + numericAmount, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('zeroBased.allocateModal.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading
                ? t('zeroBased.allocateModal.allocating')
                : t('zeroBased.allocateModal.allocate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
