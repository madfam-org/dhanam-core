'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Alert,
  AlertDescription,
} from '@dhanam-core/ui';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authApi } from '~/lib/api/auth';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface TotpVerifyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (tokens: AuthTokens) => void;
  tempTokens: AuthTokens;
}

export function TotpVerify({ open, onOpenChange, onSuccess, tempTokens }: TotpVerifyProps) {
  const { t } = useTranslation('auth');
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => authApi.verifyTwoFactor({ code }),
    onSuccess: () => {
      toast.success(t('totp.authSuccess'));
      onSuccess(tempTokens);
      onOpenChange(false);
      setTotpCode('');
      setUseBackupCode(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { code?: string })?.code === 'INVALID_TOTP'
          ? useBackupCode
            ? t('totp.invalidBackupCode')
            : t('totp.invalidCode')
          : t('totp.verificationFailed');
      toast.error(message);
      setTotpCode('');
    },
  });

  const handleVerify = () => {
    if ((useBackupCode && totpCode.length === 8) || (!useBackupCode && totpCode.length === 6)) {
      verifyMutation.mutate(totpCode);
    }
  };

  const handleCodeChange = (value: string) => {
    const maxLength = useBackupCode ? 8 : 6;
    const sanitized = useBackupCode
      ? value.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength)
      : value.replace(/\D/g, '').slice(0, maxLength);
    setTotpCode(sanitized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {t('totp.verifyTitle')}
          </DialogTitle>
          <DialogDescription>{t('totp.verifyDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('totp.verifyNotice')}</AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="totp-code" className="text-sm font-medium">
                {useBackupCode ? t('totp.backupCodeLabel') : t('totp.verificationCodeLabel')}
              </label>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTotpCode('');
                }}
                className="h-auto p-0 text-xs"
              >
                {useBackupCode ? t('totp.useAuthenticatorApp') : t('totp.useBackupCodeLink')}
              </Button>
            </div>

            <Input
              id="totp-code"
              type="text"
              placeholder={useBackupCode ? 'ABC12345' : '000000'}
              value={totpCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleCodeChange(e.target.value)
              }
              className={`text-center font-mono text-lg tracking-widest ${
                useBackupCode ? '' : 'tracking-widest'
              }`}
              maxLength={useBackupCode ? 8 : 6}
            />

            <Button
              onClick={handleVerify}
              disabled={
                (useBackupCode && totpCode.length !== 8) ||
                (!useBackupCode && totpCode.length !== 6) ||
                verifyMutation.isPending
              }
              className="w-full"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('totp.verifying')}
                </>
              ) : (
                t('totp.verifyAndLogin')
              )}
            </Button>

            {useBackupCode && (
              <p className="text-xs text-center text-muted-foreground">
                {t('totp.backupCodeSingleUse')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
