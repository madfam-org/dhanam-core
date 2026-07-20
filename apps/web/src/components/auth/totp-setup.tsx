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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from '@dhanam-core/ui';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Shield, Smartphone, AlertTriangle, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authApi } from '~/lib/api/auth';

interface TotpSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TotpSetup({ open, onOpenChange, onSuccess }: TotpSetupProps) {
  const { t } = useTranslation('auth');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState<Record<string, boolean>>({});

  const setupMutation = useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    },
    onError: () => {
      toast.error(t('totp.setupFailed'));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => authApi.verifyTwoFactor({ code }),
    onSuccess: () => {
      // Generate mock backup codes for demo
      const mockBackupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      setBackupCodes(mockBackupCodes);
      setStep('backup');
    },
    onError: () => {
      toast.error(t('totp.invalidCode'));
      setTotpCode('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => Promise.resolve(), // 2FA is enabled after successful verification
    onSuccess: () => {
      toast.success(t('totp.enabledSuccess'));
      onSuccess();
      onOpenChange(false);
      resetState();
    },
    onError: () => {
      toast.error(t('totp.enableFailed'));
    },
  });

  const resetState = () => {
    setTotpCode('');
    setBackupCodes([]);
    setQrCodeUrl('');
    setSecret('');
    setStep('setup');
    setCopiedSecret(false);
    setCopiedCodes({});
  };

  const copyToClipboard = async (text: string, type: 'secret' | string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedCodes((prev) => ({ ...prev, [type]: true }));
        setTimeout(() => setCopiedCodes((prev) => ({ ...prev, [type]: false })), 2000);
      }
      toast.success(t('totp.copiedToClipboard'));
    } catch {
      toast.error(t('totp.copyFailed'));
    }
  };

  const handleStart = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (totpCode.length === 6) {
      verifyMutation.mutate(totpCode);
    }
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            {t('totp.setupTitle')}
          </DialogTitle>
          <DialogDescription>{t('totp.setupDescription')}</DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>{t('totp.authenticatorAppNotice')}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('totp.setupExplanation')}</p>

              <Button onClick={handleStart} disabled={setupMutation.isPending} className="w-full">
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('totp.settingUp')}
                  </>
                ) : (
                  t('totp.startSetup')
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('totp.scanQrCode')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}

                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('totp.enterSecretManually')}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={secret} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(secret, 'secret')}
                    >
                      {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <label htmlFor="totp-code" className="text-sm font-medium">
                  {t('totp.enterCodeLabel')}
                </label>
                <Input
                  id="totp-code"
                  type="text"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="text-center font-mono text-lg tracking-widest mt-1"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={totpCode.length !== 6 || verifyMutation.isPending}
                className="w-full"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('totp.verifying')}
                  </>
                ) : (
                  t('totp.verifyCode')
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {t('totp.backupCodesWarning')}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('totp.backupCodesTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <div key={code} className="flex items-center gap-1">
                      <Input value={code} readOnly className="font-mono text-xs" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, code)}
                        className="px-2"
                      >
                        {copiedCodes[code] ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="w-full"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('totp.enabling2FA')}
                  </>
                ) : (
                  t('totp.completeSetup')
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">{t('totp.keepCodesSafe')}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
