'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@dhanam-core/ui';
import {
  PiggyBankIcon,
  PlusIcon,
  ArrowRightIcon,
  SkipForwardIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  BarChart3Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useOnboarding } from '../onboarding-provider';

export function FirstBudgetStep() {
  const router = useRouter();
  const { updateStep, skipStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleCreateBudget = () => {
    // Navigate to budget creation page
    router.push('/budgets/new?onboarding=true');
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await updateStep('feature_tour');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await skipStep('first_budget');
    } catch (error) {
      console.error('Error skipping step:', error);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <PiggyBankIcon className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Crea tu primer presupuesto</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Los presupuestos te ayudan a controlar tus gastos y alcanzar tus metas financieras. ¡Es
          más fácil de lo que piensas!
        </p>
      </div>

      {/* Benefits Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Control total</h3>
            <p className="text-sm text-gray-600">Ve exactamente en qué gastas tu dinero cada mes</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Alertas inteligentes</h3>
            <p className="text-sm text-gray-600">Te avisamos cuando te acerques a tus límites</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3Icon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Análisis avanzado</h3>
            <p className="text-sm text-gray-600">Reportes detallados de tus hábitos de gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Budget CTA */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlusIcon className="w-6 h-6 text-green-600" />
              <span>Crear mi primer presupuesto</span>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Configura límites de gasto por categoría (alimentación, transporte, entretenimiento,
            etc.) y recibe alertas automáticas para mantener el control.
          </p>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Ejemplo de presupuesto mensual:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">🍕 Alimentación</span>
                <span className="font-medium">$8,000 MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🚗 Transporte</span>
                <span className="font-medium">$3,000 MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🎬 Entretenimiento</span>
                <span className="font-medium">$2,000 MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🛒 Compras</span>
                <span className="font-medium">$4,000 MXN</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total mensual</span>
                <span className="text-green-600">$17,000 MXN</span>
              </div>
            </div>
          </div>

          <Button onClick={handleCreateBudget} className="w-full bg-green-600 hover:bg-green-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Crear presupuesto ahora
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Tips para tu primer presupuesto:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Empieza con categorías básicas: alimentación, transporte, servicios</li>
          <li>• Revisa tus gastos de los últimos 3 meses como referencia</li>
          <li>• Incluye un 10-15% extra para gastos imprevistos</li>
          <li>• Puedes ajustar los límites en cualquier momento</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handleSkip}
          disabled={isSkipping}
          className="px-6"
        >
          <SkipForwardIcon className="w-4 h-4 mr-2" />
          {isSkipping ? 'Saltando...' : 'Lo haré después'}
        </Button>

        <Button size="lg" onClick={handleContinue} disabled={isLoading} className="px-6">
          {isLoading ? 'Cargando...' : 'Ya creé mi presupuesto'}
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Recuerda: los presupuestos se pueden crear y modificar en cualquier momento desde el
          dashboard
        </p>
      </div>
    </div>
  );
}
