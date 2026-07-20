'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@dhanam-core/ui';
import { BuildingIcon, UserIcon, CheckIcon } from 'lucide-react';
import { useState } from 'react';

import { useOnboarding } from '../onboarding-provider';

export function SpaceSetupStep() {
  const { updateStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await updateStep('connect_accounts');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckIcon className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Tu espacio personal está listo!</h1>
        <p className="text-lg text-gray-600">
          Hemos configurado automáticamente tu espacio personal para gestionar tus finanzas
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <UserIcon className="w-6 h-6 text-green-600" />
              <span>Espacio Personal</span>
              <div className="ml-auto px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                Activo
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gestión de finanzas personales</span>
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Presupuestos individuales</span>
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Análisis de gastos personales</span>
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <BuildingIcon className="w-6 h-6 text-gray-400" />
              <span className="text-gray-600">Espacio Empresarial</span>
              <div className="ml-auto px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                Opcional
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Podrás crear un espacio empresarial más adelante para separar tus finanzas de negocio.
            </p>
            <div className="text-sm text-gray-500">
              Incluye: Contabilidad empresarial, reportes fiscales, gestión de equipo
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-indigo-900 mb-2">
          ¿Qué puedes hacer en tu espacio personal?
        </h3>
        <ul className="space-y-2 text-sm text-indigo-800">
          <li className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4 text-indigo-600" />
            <span>Conectar cuentas bancarias y wallets crypto</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4 text-indigo-600" />
            <span>Crear y gestionar presupuestos mensuales</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4 text-indigo-600" />
            <span>Analizar el impacto ESG de tus inversiones crypto</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4 text-indigo-600" />
            <span>Recibir alertas y reportes personalizados</span>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <Button size="lg" onClick={handleContinue} disabled={isLoading} className="px-8">
          {isLoading ? 'Cargando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
}
