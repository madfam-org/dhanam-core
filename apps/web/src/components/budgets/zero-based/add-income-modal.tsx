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
import { Banknote, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

import { CreateIncomeEventDto } from '@/lib/api/zero-based';
import { getCurrencySymbol } from '@/lib/utils';

interface AddIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  onAddIncome: (dto: CreateIncomeEventDto) => Promise<void>;
  isLoading?: boolean;
}

const INCOME_SOURCE_KEYS = [
  'salary',
  'bonus',
  'freelance',
  'investmentIncome',
  'rentalIncome',
  'refund',
  'gift',
  'other',
] as const;

// Map i18n key to API value
const SOURCE_API_VALUE: Record<string, string> = {
  salary: 'salary',
  bonus: 'bonus',
  freelance: 'freelance',
  investmentIncome: 'investment',
  rentalIncome: 'rental',
  refund: 'refund',
  gift: 'gift',
  other: 'other',
};

export function AddIncomeModal({
  open,
  onOpenChange,
  currency,
  onAddIncome,
  isLoading = false,
}: AddIncomeModalProps) {
  const { t } = useTranslation('budgets');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [description, setDescription] = useState('');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setSource('');
      setCustomSource('');
      setDescription('');
      setReceivedAt(new Date().toISOString().split('T')[0]!);
      setError(null);
    }
  }, [open]);

  const numericAmount = parseFloat(amount) || 0;
  const apiSource = source === 'other' ? customSource : (SOURCE_API_VALUE[source] ?? source);
  const canSubmit = numericAmount > 0 && apiSource && receivedAt && !isLoading;
  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount <= 0) {
      setError(t('zeroBased.addIncomeModal.errAmountZero'));
      return;
    }

    if (!apiSource) {
      setError(t('zeroBased.addIncomeModal.errNoSource'));
      return;
    }

    if (!receivedAt) {
      setError(t('zeroBased.addIncomeModal.errNoDate'));
      return;
    }

    try {
      await onAddIncome({
        amount: numericAmount,
        currency,
        source: apiSource,
        description: description || undefined,
        receivedAt: new Date(receivedAt).toISOString(),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('zeroBased.addIncomeModal.errFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle>{t('zeroBased.addIncomeModal.title')}</DialogTitle>
              <DialogDescription>{t('zeroBased.addIncomeModal.description')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('zeroBased.addIncomeModal.amount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {symbol}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                className="pl-7 text-lg"
              />
            </div>
          </div>

          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">{t('zeroBased.addIncomeModal.source')}</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue placeholder={t('zeroBased.addIncomeModal.selectSource')} />
              </SelectTrigger>
              <SelectContent>
                {INCOME_SOURCE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`zeroBased.incomeEvents.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Source (if "Other" selected) */}
          {source === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-source">{t('zeroBased.addIncomeModal.customSource')}</Label>
              <Input
                id="custom-source"
                placeholder={t('zeroBased.addIncomeModal.customSourcePlaceholder')}
                value={customSource}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomSource(e.target.value)
                }
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="received-at">{t('zeroBased.addIncomeModal.dateReceived')}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="received-at"
                type="date"
                value={receivedAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceivedAt(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('zeroBased.addIncomeModal.descriptionLabel')}</Label>
            <Input
              id="description"
              placeholder={t('zeroBased.addIncomeModal.descriptionPlaceholder')}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('zeroBased.addIncomeModal.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading
                ? t('zeroBased.addIncomeModal.adding')
                : t('zeroBased.addIncomeModal.addIncome')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
