'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { useAuth } from '@/lib/hooks/use-auth';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login?returnTo=/onboarding');
      return;
    }

    // Redirect to dashboard if already completed onboarding
    if (user?.onboardingCompleted) {
      router.push('/dashboard');
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {children}
      </div>
    </OnboardingProvider>
  );
}
