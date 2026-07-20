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
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

import { CategoryAllocationStatus } from '@/lib/api/zero-based';
import { formatCurrency, getCurrencySymbol, cn } from '@/lib/utils';

interface MoveFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryAllocationStatus[];
  currency: Currency;
  preselectedFromCategoryId?: string;
  onMoveFunds: (
    fromCategoryId: string,
    toCategoryId: string,
    amount: number,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export function MoveFundsModal({
  open,
  onOpenChange,
  categories,
  currency,
  preselectedFromCategoryId,
  onMoveFunds,
  isLoading = false,
}: MoveFundsModalProps) {
  const { t } = useTranslation('budgets');
  const [fromCategoryId, setFromCategoryId] = useState<string>(preselectedFromCategoryId || '');
  const [toCategoryId, setToCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or preselected category changes
  useEffect(() => {
    if (open) {
      setFromCategoryId(preselectedFromCategoryId || '');
      setToCategoryId('');
      setAmount('');
      setNotes('');
      setError(null);
    }
  }, [open, preselectedFromCategoryId]);

  const fromCategory = categories.find((c) => c.categoryId === fromCategoryId);
  const toCategory = categories.find((c) => c.categoryId === toCategoryId);
  const maxAmount = fromCategory?.available || 0;
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= maxAmount;
  const canSubmit =
    fromCategoryId &&
    toCategoryId &&
    fromCategoryId !== toCategoryId &&
    isValidAmount &&
    !isLoading;

  // Filter out the source category from destination options
  const destinationCategories = categories.filter((c) => c.categoryId !== fromCategoryId);
  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromCategoryId) {
      setError(t('zeroBased.moveFundsModal.errNoSource'));
      return;
    }

    if (!toCategoryId) {
      setError(t('zeroBased.moveFundsModal.errNoDestination'));
      return;
    }

    if (fromCategoryId === toCategoryId) {
      setError(t('zeroBased.moveFundsModal.errSameCategory'));
      return;
    }

    if (numericAmount <= 0) {
      setError(t('zeroBased.moveFundsModal.errAmountZero'));
      return;
    }

    if (numericAmount > maxAmount) {
      setError(
        t('zeroBased.moveFundsModal.errAmountExceeds', { name: fromCategory?.categoryName ?? '' })
      );
      return;
    }

    try {
      await onMoveFunds(fromCategoryId, toCategoryId, numericAmount, notes || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('zeroBased.moveFundsModal.errFailed'));
    }
  };

  const handleSwapCategories = () => {
    if (fromCategoryId && toCategoryId) {
      const temp = fromCategoryId;
      setFromCategoryId(toCategoryId);
      setToCategoryId(temp);
      setAmount(''); // Reset amount since available funds may differ
    }
  };

  const handleMoveAll = () => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
              <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>{t('zeroBased.moveFundsModal.title')}</DialogTitle>
              <DialogDescription>{t('zeroBased.moveFundsModal.description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Category */}
          <div className="space-y-2">
            <Label htmlFor="from-category">{t('zeroBased.moveFundsModal.fromCategory')}</Label>
            <Select
              value={fromCategoryId}
              onValueChange={(val) => {
                setFromCategoryId(val);
                setAmount('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('zeroBased.moveFundsModal.selectSource')} />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.available > 0)
                  .map((cat) => (
                    <SelectItem key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName} ({t('zeroBased.categoryRow.available')}:{' '}
                      {formatCurrency(cat.available, currency)})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {fromCategory && (
              <p className="text-xs text-muted-foreground">
                {t('zeroBased.moveFundsModal.availableToMove')}{' '}
                <span className="font-medium">{formatCurrency(maxAmount, currency)}</span>
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSwapCategories}
              disabled={!fromCategoryId || !toCategoryId}
              className="text-muted-foreground"
            >
              <ArrowLeftRight className="h-4 w-4 rotate-90" />
              {t('zeroBased.moveFundsModal.swap')}
            </Button>
          </div>

          {/* To Category */}
          <div className="space-y-2">
            <Label htmlFor="to-category">{t('zeroBased.moveFundsModal.toCategory')}</Label>
            <Select value={toCategoryId} onValueChange={setToCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t('zeroBased.moveFundsModal.selectDestination')} />
              </SelectTrigger>
              <SelectContent>
                {destinationCategories.map((cat) => (
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
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">{t('zeroBased.moveFundsModal.amount')}</Label>
              {maxAmount > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleMoveAll}
                  className="h-auto p-0 text-xs"
                >
                  {t('zeroBased.moveFundsModal.moveAll')}
                </Button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {symbol}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={maxAmount}
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('zeroBased.moveFundsModal.notes')}</Label>
            <Input
              id="notes"
              placeholder={t('zeroBased.moveFundsModal.notesPlaceholder')}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          {fromCategory && toCategory && numericAmount > 0 && (
            <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{fromCategory.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(fromCategory.available, currency)}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span
                    className={cn(
                      'font-semibold',
                      fromCategory.available - numericAmount < 0
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                    )}
                  >
                    {formatCurrency(fromCategory.available - numericAmount, currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{toCategory.categoryName}</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(toCategory.available, currency)}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(toCategory.available + numericAmount, currency)}
                  </span>
                </div>
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
              {t('zeroBased.moveFundsModal.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading
                ? t('zeroBased.moveFundsModal.moving')
                : t('zeroBased.moveFundsModal.moveFunds')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
