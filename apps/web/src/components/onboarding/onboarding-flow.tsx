'use client';

import { Alert, AlertDescription, Button } from '@dhanam-core/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OnboardingHeader } from './onboarding-header';
import { OnboardingProgress } from './onboarding-progress';
import { useOnboarding } from './onboarding-provider';
import { CompletionStep } from './steps/completion-step';
import { EmailVerificationStep } from './steps/email-verification-step';
import { FeatureTourStep } from './steps/feature-tour-step';
import { FirstBudgetStep } from './steps/first-budget-step';
import { PreferencesStep } from './steps/preferences-step';
import { SpaceSetupStep } from './steps/space-setup-step';
import { WelcomeStep } from './steps/welcome-step';

export function OnboardingFlow() {
  const router = useRouter();
  const { status, isLoading, error, refreshStatus } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepComponents = {
    welcome: WelcomeStep,
    email_verification: EmailVerificationStep,
    preferences: PreferencesStep,
    space_setup: SpaceSetupStep,
    first_budget: FirstBudgetStep,
    feature_tour: FeatureTourStep,
    completed: CompletionStep,
  };

  useEffect(() => {
    if (status?.completed) {
      router.push('/dashboard');
      return;
    }

    if (status?.currentStep) {
      const stepOrder = [
        'welcome',
        'email_verification',
        'preferences',
        'space_setup',
        'first_budget',
        'feature_tour',
        'completed',
      ];
      const index = stepOrder.indexOf(status.currentStep);
      if (index >= 0) {
        setCurrentStepIndex(index);
      }
    }
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={refreshStatus} variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se pudo cargar el estado del onboarding</p>
          <Button onClick={refreshStatus} variant="outline">
            Recargar
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = status.currentStep || 'welcome';
  const StepComponent = stepComponents[currentStep as keyof typeof stepComponents];

  if (!StepComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Paso del onboarding no encontrado: {currentStep}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Ir al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <OnboardingHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OnboardingProgress
          currentStep={currentStepIndex}
          totalSteps={7}
          progress={status.progress}
        />

        <div className="mt-8">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}
