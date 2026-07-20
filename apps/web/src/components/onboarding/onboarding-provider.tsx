'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { useAnalytics } from '@/hooks/useAnalytics';
import { onboardingApi } from '@/lib/api/onboarding';
import { useAuth } from '@/lib/hooks/use-auth';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export interface OnboardingStatus {
  completed: boolean;
  currentStep: string | null;
  completedAt: string | null;
  progress: number;
  stepStatus: Record<string, boolean>;
  remainingSteps: string[];
  optionalSteps: string[];
}

interface OnboardingContextType {
  status: OnboardingStatus | null;
  steps: OnboardingStep[];
  isLoading: boolean;
  error: string | null;
  updateStep: (step: string, data?: Record<string, unknown>) => Promise<void>;
  completeOnboarding: (skipOptional?: boolean) => Promise<void>;
  skipStep: (step: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Dhanam!',
    description: 'Te damos la bienvenida a tu plataforma de gestión financiera',
    required: true,
  },
  {
    id: 'email_verification',
    title: 'Verifica tu email',
    description: 'Confirma tu dirección de correo electrónico para mayor seguridad',
    required: true,
  },
  {
    id: 'preferences',
    title: 'Configura tus preferencias',
    description: 'Personaliza tu experiencia con idioma, moneda y notificaciones',
    required: true,
  },
  {
    id: 'space_setup',
    title: 'Configura tu espacio',
    description: 'Crea y personaliza tu espacio financiero personal',
    required: true,
  },
  {
    id: 'connect_accounts',
    title: 'Conecta tus cuentas',
    description: 'Vincula tus cuentas bancarias y wallets para sincronizar datos',
    required: false,
  },
  {
    id: 'first_budget',
    title: 'Crea tu primer presupuesto',
    description: 'Establece límites de gastos y toma control de tus finanzas',
    required: false,
  },
  {
    id: 'feature_tour',
    title: 'Tour de funciones',
    description: 'Descubre todas las herramientas que tienes disponibles',
    required: false,
  },
];

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useAuth();
  const analytics = useAnalytics();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const steps = ONBOARDING_STEPS.map((step) => ({
    ...step,
    completed: status?.stepStatus[step.id] || false,
  }));

  const refreshStatus = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await onboardingApi.getStatus();
      setStatus(response);
    } catch (err) {
      setError('Error al cargar el estado del onboarding');
      console.error('Error fetching onboarding status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateStep = async (step: string, data?: Record<string, unknown>) => {
    try {
      setError(null);
      const response = await onboardingApi.updateStep(step, data);
      setStatus(response);
      analytics.track('onboarding_step_completed', { step, data });
    } catch (err) {
      setError('Error al actualizar el paso del onboarding');
      throw err;
    }
  };

  const completeOnboarding = async (skipOptional = false) => {
    try {
      setError(null);
      const response = await onboardingApi.complete(skipOptional);
      setStatus(response);
      const durationSeconds = user?.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 1000)
        : undefined;
      if (user?.id && durationSeconds !== undefined) {
        analytics.trackOnboardingComplete(user.id, durationSeconds);
      }
    } catch (err) {
      setError('Error al completar el onboarding');
      throw err;
    }
  };

  const skipStep = async (step: string) => {
    try {
      setError(null);
      const response = await onboardingApi.skipStep(step);
      setStatus(response);
      analytics.track('onboarding_step_skipped', { step });
    } catch (err) {
      setError('Error al saltar el paso');
      throw err;
    }
  };

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      refreshStatus();
    } else if (user?.onboardingCompleted) {
      setIsLoading(false);
    }
  }, [user, refreshStatus]);

  const value: OnboardingContextType = {
    status,
    steps,
    isLoading,
    error,
    updateStep,
    completeOnboarding,
    skipStep,
    refreshStatus,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
