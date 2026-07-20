'use client';

import { Button, Card, CardContent } from '@dhanam-core/ui';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  RocketIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/hooks/use-auth';

export function CompletionStep() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Refresh user data to get updated onboarding status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const completionFeatures = [
    {
      icon: CheckCircleIcon,
      title: 'Configuración completa',
      description: 'Tu cuenta está lista para usar con todas las preferencias configuradas',
    },
    {
      icon: SparklesIcon,
      title: 'Experiencia personalizada',
      description: 'Dhanam se adaptará a tus preferencias de idioma, moneda y notificaciones',
    },
    {
      icon: RocketIcon,
      title: 'Todo listo para comenzar',
      description: 'Accede a todas las funcionalidades desde tu dashboard personalizado',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
          <TrophyIcon className="w-16 h-16 text-white" />
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <SparklesIcon
                key={i}
                className="w-6 h-6 text-yellow-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-4">¡Felicidades, {user?.name}! 🎉</h1>
      <p className="text-xl text-gray-600 mb-8">
        Has completado exitosamente la configuración de tu cuenta de Dhanam. Ya tienes acceso a
        todas las herramientas para gestionar tus finanzas.
      </p>

      {/* Completion features */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {completionFeatures.map((feature, index) => (
          <Card key={index} className="border-2 border-green-100 bg-green-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What's next */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 mb-8">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">🚀 ¿Qué puedes hacer ahora?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Explora tu Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Ve un resumen completo de tu situación financiera
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Conecta tus cuentas</h3>
                  <p className="text-sm text-gray-600">
                    Vincula bancos y wallets para sincronización automática
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Crea presupuestos</h3>
                  <p className="text-sm text-gray-600">
                    Establece límites de gasto y recibe alertas automáticas
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Analiza ESG</h3>
                  <p className="text-sm text-gray-600">
                    Revisa el impacto ambiental de tus inversiones crypto
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 ¿Necesitas ayuda?</h3>
        <p className="text-yellow-800 text-sm mb-3">
          Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de Dhanam
        </p>
        <div className="flex justify-center space-x-6 text-sm text-yellow-700">
          <span>📚 Centro de ayuda</span>
          <span>💬 Chat de soporte</span>
          <span>📧 support@example.com</span>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={handleGoToDashboard}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-lg"
        >
          Ir a mi Dashboard
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          ¡Comienza a tomar control de tus finanzas hoy mismo!
        </p>
      </div>
    </div>
  );
}
