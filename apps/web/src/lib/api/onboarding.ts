import { apiClient } from './client';

export interface OnboardingStatus {
  completed: boolean;
  currentStep: string | null;
  completedAt: string | null;
  progress: number;
  stepStatus: Record<string, boolean>;
  remainingSteps: string[];
  optionalSteps: string[];
}

export interface UpdatePreferencesData {
  locale?: string;
  timezone?: string;
  currency?: string;
  emailNotifications?: boolean;
  transactionAlerts?: boolean;
  budgetAlerts?: boolean;
  weeklyReports?: boolean;
  monthlyReports?: boolean;
}

export const onboardingApi = {
  // Get onboarding status
  getStatus: async (): Promise<OnboardingStatus> => {
    return apiClient.get<OnboardingStatus>('/onboarding/status');
  },

  // Update onboarding step
  updateStep: async (step: string, data?: Record<string, unknown>): Promise<OnboardingStatus> => {
    return apiClient.put<OnboardingStatus>('/onboarding/step', { step, data });
  },

  // Complete onboarding
  complete: async (skipOptional = false): Promise<OnboardingStatus> => {
    return apiClient.post<OnboardingStatus>('/onboarding/complete', {
      skipOptional,
      metadata: {
        source: 'web',
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Skip optional step
  skipStep: async (step: string): Promise<OnboardingStatus> => {
    return apiClient.post<OnboardingStatus>(`/onboarding/skip/${step}`);
  },

  // Update user preferences
  updatePreferences: async (preferences: UpdatePreferencesData): Promise<{ success: boolean }> => {
    return apiClient.put<{ success: boolean }>('/onboarding/preferences', preferences);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/onboarding/verify-email', {
      token,
    });
  },

  // Resend email verification
  resendVerification: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/onboarding/resend-verification');
  },

  // Reset onboarding (for testing/support)
  reset: async (): Promise<OnboardingStatus> => {
    return apiClient.post<OnboardingStatus>('/onboarding/reset');
  },
};
