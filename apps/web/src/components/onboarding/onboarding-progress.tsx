'use client';

import { CheckIcon } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
}

const stepLabels = [
  'Bienvenida',
  'Email',
  'Preferencias',
  'Espacio',
  'Cuentas',
  'Presupuesto',
  'Tour',
];

export function OnboardingProgress({ currentStep, totalSteps, progress }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progreso de configuración</span>
          <span>{Math.round(progress)}% completado</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            // const _isUpcoming = index > currentStep;

            return (
              <div key={label} className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                        : 'bg-gray-200 text-gray-500'
                  }
                `}
                >
                  {isCompleted ? <CheckIcon className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>

                {/* Step label */}
                <span
                  className={`
                  mt-2 text-xs font-medium text-center
                  ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}
                `}
                >
                  {label}
                </span>

                {/* Connector line */}
                {index < stepLabels.length - 1 && (
                  <div
                    className={`
                    absolute top-4 left-1/2 w-full h-0.5 -z-10
                    ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden text-center">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-500">
            Paso {currentStep + 1} de {totalSteps}
          </span>
          <span className="text-sm font-medium text-indigo-600">{stepLabels[currentStep]}</span>
        </div>
      </div>
    </div>
  );
}
