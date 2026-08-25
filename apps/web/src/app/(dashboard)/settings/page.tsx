'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Bell,
  Shield,
  Palette,
  DollarSign,
  Leaf,
  HardDrive,
  RotateCcw,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { preferencesApi, UserPreferences } from '@/lib/api/preferences';

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.getPreferences(),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) => preferencesApi.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success(t('toast.preferencesUpdated'));
    },
    onError: () => {
      toast.error(t('toast.updateFailed'));
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => preferencesApi.resetPreferences(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success(t('toast.resetSuccess'));
      setIsResetting(false);
    },
    onError: () => {
      toast.error(t('toast.resetFailed'));
      setIsResetting(false);
    },
  });

  const handleToggle = (key: keyof UserPreferences) => {
    if (!preferences) return;
    updateMutation.mutate({ [key]: !preferences[key] });
  };

  const handleSelectChange = (key: keyof UserPreferences, value: string) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-destructive font-medium">{t('error.loadFailed')}</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : t('error.unexpected')}
        </p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t('error.noPreferences')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsResetting(true)}
          disabled={resetMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('button.resetDefaults')}
        </Button>
      </div>

      {/* Reset Confirmation */}
      {isResetting && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('reset.confirm')}</p>
                <p className="text-sm text-muted-foreground">{t('reset.warning')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsResetting(false)}>
                  {t('button.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('button.reset')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('section.notifications.title')}
          </CardTitle>
          <CardDescription>{t('section.notifications.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('notificationsPage.email.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationsPage.email.description')}
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('notificationsPage.transactions.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationsPage.transactions.description')}
              </p>
            </div>
            <Switch
              checked={preferences.transactionAlerts}
              onCheckedChange={() => handleToggle('transactionAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('notificationsPage.budget.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationsPage.budget.description')}
              </p>
            </div>
            <Switch
              checked={preferences.budgetAlerts}
              onCheckedChange={() => handleToggle('budgetAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('notificationsPage.weeklyReports.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationsPage.weeklyReports.description')}
              </p>
            </div>
            <Switch
              checked={preferences.weeklyReports}
              onCheckedChange={() => handleToggle('weeklyReports')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('notificationsPage.security.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('notificationsPage.security.description')}
              </p>
            </div>
            <Switch
              checked={preferences.securityAlerts}
              onCheckedChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('section.privacy.title')}
          </CardTitle>
          <CardDescription>{t('section.privacy.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('privacy.analytics.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('privacy.analytics.description')}</p>
            </div>
            <Switch
              checked={preferences.analyticsTracking}
              onCheckedChange={() => handleToggle('analyticsTracking')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('privacy.hideSensitive.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('privacy.hideSensitive.description')}
              </p>
            </div>
            <Switch
              checked={preferences.hideSensitiveData}
              onCheckedChange={() => handleToggle('hideSensitiveData')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('section.display.title')}
          </CardTitle>
          <CardDescription>{t('section.display.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('display.theme.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('display.theme.description')}</p>
            </div>
            <Select
              value={preferences.themeMode}
              onValueChange={(value) => handleSelectChange('themeMode', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('display.theme.light')}</SelectItem>
                <SelectItem value="dark">{t('display.theme.dark')}</SelectItem>
                <SelectItem value="system">{t('display.theme.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('display.compactView.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('display.compactView.description')}
              </p>
            </div>
            <Switch
              checked={preferences.compactView}
              onCheckedChange={() => handleToggle('compactView')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('display.showBalances.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('display.showBalances.description')}
              </p>
            </div>
            <Switch
              checked={preferences.showBalances}
              onCheckedChange={() => handleToggle('showBalances')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('section.financial.title')}
          </CardTitle>
          <CardDescription>{t('section.financial.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('financial.defaultCurrency.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('financial.defaultCurrency.description')}
              </p>
            </div>
            <Select
              value={preferences.defaultCurrency}
              onValueChange={(value) => handleSelectChange('defaultCurrency', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('financial.autoCategorize.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('financial.autoCategorize.description')}
              </p>
            </div>
            <Switch
              checked={preferences.autoCategorizeTxns}
              onCheckedChange={() => handleToggle('autoCategorizeTxns')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ESG */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            {t('section.esg.title')}
          </CardTitle>
          <CardDescription>{t('section.esg.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('esg.showScores.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('esg.showScores.description')}</p>
            </div>
            <Switch
              checked={preferences.esgScoreVisibility}
              onCheckedChange={() => handleToggle('esgScoreVisibility')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('esg.sustainabilityAlerts.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('esg.sustainabilityAlerts.description')}
              </p>
            </div>
            <Switch
              checked={preferences.sustainabilityAlerts}
              onCheckedChange={() => handleToggle('sustainabilityAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('esg.impactReporting.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('esg.impactReporting.description')}
              </p>
            </div>
            <Switch
              checked={preferences.impactReporting}
              onCheckedChange={() => handleToggle('impactReporting')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t('section.backup.title')}
          </CardTitle>
          <CardDescription>{t('section.backup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Import from other apps
              </Label>
              <p className="text-sm text-muted-foreground">
                Lunch Money, YNAB, Monarch, and CSV — migrate your financial history.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/settings/import">Import</Link>
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('backup.autoBackup.label')}</Label>
              <p className="text-sm text-muted-foreground">{t('backup.autoBackup.description')}</p>
            </div>
            <Switch
              checked={preferences.autoBackup}
              onCheckedChange={() => handleToggle('autoBackup')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('backup.exportFormat.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('backup.exportFormat.description')}
              </p>
            </div>
            <Select
              value={preferences.exportFormat}
              onValueChange={(value) => handleSelectChange('exportFormat', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
