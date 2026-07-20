'use client';

import { Button, Card, CardContent, Alert, AlertDescription } from '@dhanam-core/ui';
import { MailIcon, CheckCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { onboardingApi } from '@/lib/api/onboarding';
import { useAuth } from '@/lib/hooks/use-auth';

import { useOnboarding } from '../onboarding-provider';

export function EmailVerificationStep() {
  const { user } = useAuth();
  const { updateStep, refreshStatus } = useOnboarding();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const handleContinue = useCallback(async () => {
    try {
      await updateStep('preferences');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    }
  }, [updateStep]);

  // Check if email is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      handleContinue();
    }
  }, [user?.emailVerified, handleContinue]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return () => {}; // No cleanup needed
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setError('');
    setMessage('');

    try {
      await onboardingApi.resendVerification();
      setMessage('Email de verificación enviado. Revisa tu bandeja de entrada.');
      setCanResend(false);
      setCountdown(60); // 60 second cooldown
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Error al enviar email de verificación';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setError('');

    try {
      await refreshStatus();
      // If still not verified after refresh, show message
      if (!user?.emailVerified) {
        setMessage('Email aún no verificado. Revisa tu bandeja de entrada y spam.');
      }
    } catch {
      setError('Error al verificar el estado del email');
    } finally {
      setIsChecking(false);
    }
  };

  if (user?.emailVerified) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Email verificado!</h1>
          <p className="text-lg text-gray-600">
            Tu dirección de correo ha sido confirmada exitosamente
          </p>
        </div>

        <Button size="lg" onClick={handleContinue}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <MailIcon className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verifica tu email</h1>
        <p className="text-lg text-gray-600 mb-2">Hemos enviado un enlace de verificación a:</p>
        <p className="text-xl font-medium text-indigo-600">{user?.email}</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones</h2>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                <p className="text-gray-700">Revisa tu bandeja de entrada de email</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                <p className="text-gray-700">
                  Busca el email de &quot;Dhanam - Verifica tu cuenta&quot;
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                <p className="text-gray-700">Haz clic en el botón &quot;Verificar mi email&quot;</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
                  4
                </span>
                <p className="text-gray-700">Regresa a esta página para continuar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={handleResendVerification}
          disabled={isResending || !canResend}
        >
          {isResending ? (
            <>
              <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : !canResend ? (
            `Reenviar en ${countdown}s`
          ) : (
            <>
              <MailIcon className="w-4 h-4 mr-2" />
              Reenviar email
            </>
          )}
        </Button>

        <Button onClick={handleCheckVerification} disabled={isChecking}>
          {isChecking ? (
            <>
              <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Ya verifiqué mi email
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          ¿No encuentras el email? Revisa tu carpeta de spam o promociones
        </p>
      </div>
    </div>
  );
}
