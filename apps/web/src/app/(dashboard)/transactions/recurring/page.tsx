'use client';

import { RecurringStatus, useTranslation } from '@dhanam-core/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  MoreVertical,
  RefreshCw,
  Check,
  X,
  Pause,
  Play,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { recurringApi, RecurringTransactionResponse } from '@/lib/api/recurring';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

const statusColors: Record<RecurringStatus, string> = {
  detected: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
  paused: 'bg-blue-100 text-blue-800',
};

export default function RecurringTransactionsPage() {
  const { t } = useTranslation('transactions');
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransactionResponse | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch recurring transactions
  const { data: recurringData, isLoading } = useQuery({
    queryKey: ['recurring', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.getRecurring(currentSpace.id, { includeDetected: true });
    },
    enabled: !!currentSpace,
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['recurring-summary', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.getSummary(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  // Detect patterns mutation
  const detectMutation = useMutation({
    mutationFn: () => {
      if (!currentSpace) throw new Error('No current space');
      setIsDetecting(true);
      return recurringApi.detect(currentSpace.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['recurring-summary', currentSpace?.id] });
      toast.success(t('recurring.toast.detected', { count: data.detected.length }));
      setIsDetecting(false);
    },
    onError: () => {
      toast.error(t('recurring.toast.detectFailed'));
      setIsDetecting(false);
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.confirm(currentSpace.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['recurring-summary', currentSpace?.id] });
      toast.success(t('recurring.toast.confirmed'));
    },
    onError: () => {
      toast.error(t('recurring.toast.confirmFailed'));
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (id: string) => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.dismiss(currentSpace.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', currentSpace?.id] });
      toast.success(t('recurring.toast.dismissed'));
    },
    onError: () => {
      toast.error(t('recurring.toast.dismissFailed'));
    },
  });

  // Toggle pause mutation
  const togglePauseMutation = useMutation({
    mutationFn: (id: string) => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.togglePause(currentSpace.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', currentSpace?.id] });
      toast.success(t('recurring.toast.statusUpdated'));
    },
    onError: () => {
      toast.error(t('recurring.toast.statusFailed'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!currentSpace) throw new Error('No current space');
      return recurringApi.delete(currentSpace.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring', currentSpace?.id] });
      queryClient.invalidateQueries({ queryKey: ['recurring-summary', currentSpace?.id] });
      toast.success(t('recurring.toast.deleted'));
    },
    onError: () => {
      toast.error(t('recurring.toast.deleteFailed'));
    },
  });

  const confirmed = recurringData?.filter((r) => r.status === 'confirmed') || [];
  const detected = recurringData?.filter((r) => r.status === 'detected') || [];
  const paused = recurringData?.filter((r) => r.status === 'paused') || [];

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('recurring.title')}</h1>
          <p className="text-muted-foreground">{t('recurring.description')}</p>
        </div>
        <Button onClick={() => detectMutation.mutate()} disabled={isDetecting}>
          {isDetecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {t('recurring.detectPatterns')}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('recurring.monthlyTotal')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalMonthly, summary.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('recurring.perYear', {
                  amount: formatCurrency(summary.totalAnnual, summary.currency),
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('recurring.active')}</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeCount}</div>
              <p className="text-xs text-muted-foreground">{t('recurring.confirmedRecurring')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('recurring.detected')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.detectedCount}</div>
              <p className="text-xs text-muted-foreground">{t('recurring.awaitingConfirmation')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('recurring.upcoming')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.upcomingThisMonth?.length || 0}</div>
              <p className="text-xs text-muted-foreground">{t('recurring.thisMonth')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="confirmed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="confirmed">
              {t('recurring.tabs.active', { count: confirmed.length })}
            </TabsTrigger>
            <TabsTrigger value="detected">
              {t('recurring.tabs.detected', { count: detected.length })}
            </TabsTrigger>
            <TabsTrigger value="paused">
              {t('recurring.tabs.paused', { count: paused.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    {t('recurring.emptyConfirmed.title')}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('recurring.emptyConfirmed.description')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {confirmed.map((recurring) => (
                  <RecurringCard
                    key={recurring.id}
                    recurring={recurring}
                    onTogglePause={() => togglePauseMutation.mutate(recurring.id)}
                    onDelete={() => deleteMutation.mutate(recurring.id)}
                    onViewDetails={() => setSelectedRecurring(recurring)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="detected" className="space-y-4">
            {detected.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    {t('recurring.emptyDetected.title')}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('recurring.emptyDetected.description')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {detected.map((recurring) => (
                  <DetectedCard
                    key={recurring.id}
                    recurring={recurring}
                    onConfirm={() => confirmMutation.mutate(recurring.id)}
                    onDismiss={() => dismissMutation.mutate(recurring.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            {paused.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Pause className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{t('recurring.emptyPaused.title')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('recurring.emptyPaused.description')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {paused.map((recurring) => (
                  <RecurringCard
                    key={recurring.id}
                    recurring={recurring}
                    onTogglePause={() => togglePauseMutation.mutate(recurring.id)}
                    onDelete={() => deleteMutation.mutate(recurring.id)}
                    onViewDetails={() => setSelectedRecurring(recurring)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Details Dialog */}
      <Dialog
        open={!!selectedRecurring}
        onOpenChange={(open) => !open && setSelectedRecurring(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedRecurring && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecurring.merchantName}</DialogTitle>
                <DialogDescription>
                  {t(`recurring.frequency.${selectedRecurring.frequency}` as const)} •{' '}
                  {formatCurrency(selectedRecurring.expectedAmount, selectedRecurring.currency)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('recurring.dialog.lastOccurrence')}
                    </p>
                    <p className="font-medium">
                      {selectedRecurring.lastOccurrence
                        ? formatDate(selectedRecurring.lastOccurrence)
                        : t('recurring.na')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('recurring.dialog.nextExpected')}
                    </p>
                    <p className="font-medium">
                      {selectedRecurring.nextExpected
                        ? formatDate(selectedRecurring.nextExpected)
                        : t('recurring.na')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('recurring.dialog.occurrences')}
                    </p>
                    <p className="font-medium">{selectedRecurring.occurrenceCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('recurring.dialog.confidence')}
                    </p>
                    <p className="font-medium">{Math.round(selectedRecurring.confidence * 100)}%</p>
                  </div>
                </div>

                {selectedRecurring.recentTransactions?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {t('recurring.dialog.recentTransactions')}
                    </p>
                    <div className="space-y-2">
                      {selectedRecurring.recentTransactions.slice(0, 5).map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">{txn.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                          </div>
                          <p className="font-medium text-red-600">
                            {formatCurrency(-txn.amount, selectedRecurring.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRecurring(null)}>
                  {t('recurring.dialog.close')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Recurring Card Component
function RecurringCard({
  recurring,
  onTogglePause,
  onDelete,
  onViewDetails,
}: {
  recurring: RecurringTransactionResponse;
  onTogglePause: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}) {
  const { t } = useTranslation('transactions');

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-muted rounded-full">
            <Repeat className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{recurring.merchantName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t(`recurring.frequency.${recurring.frequency}` as const)}</span>
              <span>•</span>
              <span>
                {t('recurring.card.next', {
                  date: recurring.nextExpected
                    ? formatDate(recurring.nextExpected)
                    : t('recurring.na'),
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-red-600">
              {formatCurrency(-recurring.expectedAmount, recurring.currency)}
            </p>
            <Badge className={statusColors[recurring.status]}>{recurring.status}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Open actions for ${recurring.merchantName}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                {t('recurring.card.viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePause}>
                {recurring.status === 'paused' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t('recurring.card.resume')}
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    {t('recurring.card.pause')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('recurring.card.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Detected Card Component
function DetectedCard({
  recurring,
  onConfirm,
  onDismiss,
}: {
  recurring: RecurringTransactionResponse;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('transactions');

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium">{recurring.merchantName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t('recurring.card.detectedLabel', {
                  frequency: t(`recurring.frequency.${recurring.frequency}` as const),
                })}
              </span>
              <span>•</span>
              <span>{t('recurring.card.occurrences', { count: recurring.occurrenceCount })}</span>
              <span>•</span>
              <span>
                {t('recurring.card.confidence', {
                  percent: Math.round(recurring.confidence * 100),
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <p className="font-medium text-red-600">
              {formatCurrency(-recurring.expectedAmount, recurring.currency)}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onConfirm}>
            <Check className="h-4 w-4 mr-1" />
            {t('recurring.card.confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
