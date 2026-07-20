'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Dialog, DialogContent } from '@dhanam-core/ui';
import {
  Search,
  Loader2,
  ArrowRight,
  Receipt,
  BarChart3,
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Target,
  TrendingUp,
  Settings,
  Plus,
  Download,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { transactionsApi } from '@/lib/api/transactions';

interface SearchResult {
  answer?: string;
  transactions?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category?: string;
  }>;
  categoryBreakdown?: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  confidence?: number;
  suggestions?: string[];
}

interface SearchCommandProps {
  spaceId: string;
}

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'navigate' | 'actions';
  action: () => void;
}

export function SearchCommand({ spaceId }: SearchCommandProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [directTransactions, setDirectTransactions] = useState<Array<{
    id: string;
    description: string;
    merchant?: string;
    amount: number;
    date: string;
  }> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
    setDirectTransactions(null);
  }, []);

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigate
      {
        id: 'nav-dashboard',
        label: t('searchCommand.commands.goToDashboard'),
        icon: LayoutDashboard,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/dashboard');
        },
      },
      {
        id: 'nav-transactions',
        label: t('searchCommand.commands.goToTransactions'),
        icon: Receipt,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/transactions');
        },
      },
      {
        id: 'nav-budgets',
        label: t('searchCommand.commands.goToBudgets'),
        icon: PiggyBank,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/budgets');
        },
      },
      {
        id: 'nav-accounts',
        label: t('searchCommand.commands.goToAccounts'),
        icon: Wallet,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/accounts');
        },
      },
      {
        id: 'nav-analytics',
        label: t('searchCommand.commands.goToAnalytics'),
        icon: TrendingUp,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/analytics');
        },
      },
      {
        id: 'nav-goals',
        label: t('searchCommand.commands.goToGoals'),
        icon: Target,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/goals');
        },
      },
      {
        id: 'nav-households',
        label: t('searchCommand.commands.goToHouseholds'),
        icon: Users,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/households');
        },
      },
      {
        id: 'nav-settings',
        label: t('searchCommand.commands.goToSettings'),
        icon: Settings,
        group: 'navigate',
        action: () => {
          handleClose();
          router.push('/settings');
        },
      },
      // Actions
      {
        id: 'action-new-txn',
        label: t('searchCommand.commands.newTransaction'),
        icon: Plus,
        group: 'actions',
        action: () => {
          handleClose();
          router.push('/transactions?create=true');
        },
      },
      {
        id: 'action-new-budget',
        label: t('searchCommand.commands.newBudget'),
        icon: Plus,
        group: 'actions',
        action: () => {
          handleClose();
          router.push('/budgets?create=true');
        },
      },
      {
        id: 'action-export',
        label: t('searchCommand.commands.exportCsv'),
        icon: Download,
        group: 'actions',
        action: () => {
          handleClose();
          router.push('/reports');
        },
      },
    ],
    [handleClose, router, t]
  );

  // Filter commands by query
  const filteredCommands = useMemo(
    () =>
      query.startsWith('>')
        ? commands.filter((c) =>
            c.label.toLowerCase().includes(query.slice(1).trim().toLowerCase())
          )
        : query.length === 0
          ? commands
          : [],
    [query, commands]
  );

  const showCommands = query.length === 0 || query.startsWith('>');

  // Cmd+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !spaceId || query.startsWith('>')) return;
    setIsSearching(true);
    try {
      const [data, txnData] = await Promise.allSettled([
        apiClient.get<SearchResult>(`/spaces/${spaceId}/search`, {
          q: query.trim(),
        }),
        transactionsApi.getTransactions(spaceId, { search: query.trim(), limit: 5 }),
      ]);
      setResults(data.status === 'fulfilled' ? data.value : null);
      setDirectTransactions(txnData.status === 'fulfilled' ? txnData.value.data : null);
    } catch {
      setResults(null);
      setDirectTransactions(null);
    } finally {
      setIsSearching(false);
    }
  }, [query, spaceId]);

  useEffect(() => {
    if (query.length < 3 || query.startsWith('>')) {
      setResults(null);
      setDirectTransactions(null);
      return;
    }
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // Keyboard navigation for commands
  useEffect(() => {
    if (!open || !showCommands) return;
    const items = filteredCommands;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].action();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, showCommands, filteredCommands, selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const navigateGroup = filteredCommands.filter((c) => c.group === 'navigate');
  const actionGroup = filteredCommands.filter((c) => c.group === 'actions');

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">{t('searchCommand.triggerLabel')}</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">&#x2318;</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder={t('searchCommand.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-12 w-full bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* Command palette (when empty or > prefix) */}
            {showCommands && filteredCommands.length > 0 && (
              <div className="p-2">
                {navigateGroup.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                      {t('searchCommand.navigate')}
                    </h4>
                    {navigateGroup.map((cmd) => {
                      const Icon = cmd.icon;
                      const globalIdx = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`flex w-full items-center gap-3 p-2 rounded text-sm text-left transition-colors ${
                            globalIdx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {cmd.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {actionGroup.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                      {t('searchCommand.actions')}
                    </h4>
                    {actionGroup.map((cmd) => {
                      const Icon = cmd.icon;
                      const globalIdx = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`flex w-full items-center gap-3 p-2 rounded text-sm text-left transition-colors ${
                            globalIdx === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {cmd.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {query.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 pt-2">
                    {t('searchCommand.commandHint')}{' '}
                    <kbd className="rounded border px-1 text-[10px]">&gt;</kbd>{' '}
                    {t('searchCommand.commandHintSuffix')}
                  </p>
                )}
              </div>
            )}

            {/* Search results */}
            {results && (
              <div className="p-4 space-y-4">
                {/* Answer Summary */}
                {results.answer && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{results.answer}</p>
                    {results.confidence != null && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {t('searchCommand.confidence', {
                          percent: Math.round(results.confidence * 100),
                        })}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Transaction Results */}
                {results.transactions && results.transactions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      {t('searchCommand.transactions')}
                    </h4>
                    {results.transactions.slice(0, 5).map((txn) => (
                      <button
                        type="button"
                        key={txn.id}
                        className="flex w-full items-center justify-between p-2 rounded hover:bg-accent cursor-pointer text-left"
                        onClick={() => {
                          handleClose();
                          router.push(`/transactions?highlight=${txn.id}`);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.date).toLocaleDateString()} ·{' '}
                            {txn.category || t('searchCommand.uncategorized')}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(txn.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Category Breakdown */}
                {results.categoryBreakdown && results.categoryBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {t('searchCommand.byCategory')}
                    </h4>
                    {results.categoryBreakdown.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between text-sm p-2"
                      >
                        <span>{cat.category}</span>
                        <span className="font-medium">
                          {formatCurrency(cat.total)} ({cat.count})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {results.suggestions && results.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('searchCommand.tryAlso')}
                    </h4>
                    {results.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-2 w-full text-left text-sm p-2 rounded hover:bg-accent"
                      >
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* View All Link */}
                {results.transactions && results.transactions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleClose();
                      router.push(`/transactions?q=${encodeURIComponent(query)}`);
                    }}
                  >
                    {t('searchCommand.viewAllResults')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Direct transaction results (shown when unified search has no txns) */}
            {!results?.transactions?.length &&
              directTransactions &&
              directTransactions.length > 0 && (
                <div className="p-4 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    {t('searchCommand.transactions')}
                  </h4>
                  {directTransactions.slice(0, 5).map((txn) => (
                    <button
                      type="button"
                      key={txn.id}
                      className="flex w-full items-center justify-between p-2 rounded hover:bg-accent cursor-pointer text-left"
                      onClick={() => {
                        handleClose();
                        router.push(`/transactions?search=${encodeURIComponent(query)}`);
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{txn.merchant || txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${txn.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {formatCurrency(txn.amount)}
                      </span>
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleClose();
                      router.push(`/transactions?search=${encodeURIComponent(query)}`);
                    }}
                  >
                    {t('searchCommand.viewAllResults')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

            {!results &&
              !directTransactions?.length &&
              !isSearching &&
              !showCommands &&
              query.length >= 3 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t('searchCommand.noResults')} &ldquo;{query}&rdquo;
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
