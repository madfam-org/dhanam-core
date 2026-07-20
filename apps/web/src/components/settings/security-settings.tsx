'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Separator,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Smartphone, Key, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TotpSetup } from '~/components/auth/totp-setup';

export function SecuritySettings() {
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  const { data: totpStatus, isLoading } = useQuery({
    queryKey: ['totp-status'],
    queryFn: () => ({ enabled: false, backupCodesRemaining: 0 }),
  });

  const disableTotpMutation = useMutation({
    mutationFn: () => Promise.resolve(),
    onSuccess: () => {
      toast.success(t('toast.twoFactorDisabled'));
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
    },
    onError: () => {
      toast.error(t('toast.failedToDisable2FA'));
    },
  });

  const generateBackupCodesMutation = useMutation({
    mutationFn: () => Promise.resolve({ backupCodes: ['CODE1', 'CODE2'] }),
    onSuccess: (data) => {
      const codes = data.backupCodes.join('\n');
      const blob = new Blob([codes], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dhanam-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('toast.backupCodesGenerated'));
      queryClient.invalidateQueries({ queryKey: ['totp-status'] });
    },
    onError: () => {
      toast.error(t('toast.failedToGenerateBackupCodes'));
    },
  });

  const handleTotpSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['totp-status'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('securityPage.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('securityPage.description')}</p>
      </div>

      <Separator />

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('securityPage.twoFactorTitle')}
          </CardTitle>
          <CardDescription>{t('securityPage.twoFactorDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('securityPage.authenticatorApp')}</p>
              <p className="text-sm text-muted-foreground">
                {totpStatus?.enabled
                  ? t('securityPage.twoFactorEnabled')
                  : t('securityPage.twoFactorPrompt')}
              </p>
            </div>
            <Badge variant={totpStatus?.enabled ? 'default' : 'secondary'}>
              {totpStatus?.enabled ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  {tCommon('enabled')}
                </>
              ) : (
                tCommon('disabled')
              )}
            </Badge>
          </div>

          {totpStatus?.enabled ? (
            <div className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('securityPage.accountProtected', { count: totpStatus.backupCodesRemaining })}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateBackupCodesMutation.mutate()}
                  disabled={generateBackupCodesMutation.isPending}
                  size="sm"
                >
                  {generateBackupCodesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t('securityPage.generating')}
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-3 w-3" />
                      {t('securityPage.newBackupCodes')}
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => disableTotpMutation.mutate()}
                  disabled={disableTotpMutation.isPending}
                  size="sm"
                >
                  {disableTotpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      {t('securityPage.disabling')}
                    </>
                  ) : (
                    t('security.disableTwoFactor')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert className="border-warning/30 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  {t('securityPage.accountNotProtected')}
                </AlertDescription>
              </Alert>

              <Button onClick={() => setShowTotpSetup(true)}>
                <Shield className="mr-2 h-4 w-4" />
                {t('securityPage.enableTwoFactor')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TotpSetup
        open={showTotpSetup}
        onOpenChange={setShowTotpSetup}
        onSuccess={handleTotpSuccess}
      />
    </div>
  );
}
