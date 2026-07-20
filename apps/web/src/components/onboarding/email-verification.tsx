/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 type incompatibility with Suspense requires cast to any */
'use client';

import { Button, Card, CardContent, Alert, AlertDescription } from '@dhanam-core/ui';
import { CheckCircleIcon, XCircleIcon, MailIcon, LoaderIcon, HomeIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense as SuspenseBase, useEffect, useState } from 'react';

import { onboardingApi } from '@/lib/api/onboarding';

// React 19 compatibility
const Suspense = SuspenseBase as any;

function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Token de verificación no proporcionado');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await onboardingApi.verifyEmail(token);

        if (response.success) {
          setStatus('success');
          setMessage(response.message);

          // Redirect to onboarding immediately
          setIsRedirecting(true);
          router.push('/onboarding');
        } else {
          setStatus('error');
          setMessage(response.message);
        }
      } catch (error: unknown) {
        setStatus('error');
        const errorMessage =
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response &&
          error.response.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
            ? error.response.data.message
            : 'Error al verificar el email. El token puede haber expirado.';
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <LoaderIcon className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando tu email...</h2>
            <p className="text-gray-600">
              Por favor espera mientras confirmamos tu dirección de correo
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Email verificado!</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              {isRedirecting ? (
                <div className="flex items-center justify-center space-x-2 text-indigo-600">
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  <span>Redirigiendo a la configuración...</span>
                </div>
              ) : (
                <Button onClick={() => router.push('/onboarding')} className="w-full">
                  Continuar configuración
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or invalid states
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error de verificación</h2>

          <Alert variant="destructive" className="mb-6 text-left">
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={() => router.push('/onboarding')} className="w-full">
              <MailIcon className="w-4 h-4 mr-2" />
              Solicitar nuevo enlace
            </Button>

            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              <HomeIcon className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Si el problema persiste, contacta a soporte técnico
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailVerification() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <LoaderIcon className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando...</h2>
            </CardContent>
          </Card>
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  );
}
