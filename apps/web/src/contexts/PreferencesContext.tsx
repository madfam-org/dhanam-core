'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { useAuth } from '@/lib/hooks/use-auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010/v1';

export interface UserPreferences {
  id: string;
  userId: string;

  // Notification preferences
  emailNotifications: boolean;
  transactionAlerts: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  securityAlerts: boolean;
  promotionalEmails: boolean;

  // Mobile/Push notifications
  pushNotifications: boolean;
  transactionPush: boolean;
  budgetPush: boolean;
  securityPush: boolean;

  // Privacy preferences
  dataSharing: boolean;
  analyticsTracking: boolean;
  personalizedAds: boolean;

  // Display preferences
  dashboardLayout: string;
  chartType: string;
  themeMode: string;
  compactView: boolean;
  showBalances: boolean;

  // Financial preferences
  defaultCurrency: 'MXN' | 'USD' | 'EUR';
  hideSensitiveData: boolean;
  autoCategorizeTxns: boolean;
  includeWeekends: boolean;

  // ESG preferences
  esgScoreVisibility: boolean;
  sustainabilityAlerts: boolean;
  impactReporting: boolean;

  // Backup and export
  autoBackup: boolean;
  backupFrequency: string | null;
  exportFormat: string;

  createdAt: string;
  updatedAt: string;
}

interface PreferencesContextValue {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  refreshPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  bulkUpdatePreferences: (updates: {
    notifications?: Partial<
      Pick<
        UserPreferences,
        | 'emailNotifications'
        | 'transactionAlerts'
        | 'budgetAlerts'
        | 'weeklyReports'
        | 'monthlyReports'
        | 'securityAlerts'
        | 'promotionalEmails'
        | 'pushNotifications'
        | 'transactionPush'
        | 'budgetPush'
        | 'securityPush'
      >
    >;
    privacy?: Partial<
      Pick<UserPreferences, 'dataSharing' | 'analyticsTracking' | 'personalizedAds'>
    >;
    display?: Partial<
      Pick<
        UserPreferences,
        'dashboardLayout' | 'chartType' | 'themeMode' | 'compactView' | 'showBalances'
      >
    >;
    financial?: Partial<
      Pick<
        UserPreferences,
        'defaultCurrency' | 'hideSensitiveData' | 'autoCategorizeTxns' | 'includeWeekends'
      >
    >;
    esg?: Partial<
      Pick<UserPreferences, 'esgScoreVisibility' | 'sustainabilityAlerts' | 'impactReporting'>
    >;
    backup?: Partial<Pick<UserPreferences, 'autoBackup' | 'backupFrequency' | 'exportFormat'>>;
  }) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, tokens } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!tokens) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/preferences`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [tokens]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!tokens) return;

      setError(null);

      try {
        const response = await fetch(`${API_BASE}/preferences`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        throw err;
      }
    },
    [tokens]
  );

  const bulkUpdatePreferences = useCallback(
    async (updates: {
      notifications?: Partial<
        Pick<
          UserPreferences,
          | 'emailNotifications'
          | 'transactionAlerts'
          | 'budgetAlerts'
          | 'weeklyReports'
          | 'monthlyReports'
          | 'securityAlerts'
          | 'promotionalEmails'
          | 'pushNotifications'
          | 'transactionPush'
          | 'budgetPush'
          | 'securityPush'
        >
      >;
      privacy?: Partial<
        Pick<UserPreferences, 'dataSharing' | 'analyticsTracking' | 'personalizedAds'>
      >;
      display?: Partial<
        Pick<
          UserPreferences,
          'dashboardLayout' | 'chartType' | 'themeMode' | 'compactView' | 'showBalances'
        >
      >;
      financial?: Partial<
        Pick<
          UserPreferences,
          'defaultCurrency' | 'hideSensitiveData' | 'autoCategorizeTxns' | 'includeWeekends'
        >
      >;
      esg?: Partial<
        Pick<UserPreferences, 'esgScoreVisibility' | 'sustainabilityAlerts' | 'impactReporting'>
      >;
      backup?: Partial<Pick<UserPreferences, 'autoBackup' | 'backupFrequency' | 'exportFormat'>>;
    }) => {
      if (!tokens) return;

      setError(null);

      try {
        const response = await fetch(`${API_BASE}/preferences/bulk`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to bulk update preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to bulk update preferences');
        throw err;
      }
    },
    [tokens]
  );

  const resetPreferences = useCallback(async () => {
    if (!tokens) return;

    setError(null);

    try {
      const response = await fetch(`${API_BASE}/preferences/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset preferences');
      throw err;
    }
  }, [tokens]);

  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Load preferences when user logs in
  useEffect(() => {
    if (user && tokens) {
      fetchPreferences();
    }
  }, [user, tokens, fetchPreferences]);

  const value: PreferencesContextValue = {
    preferences,
    isLoading,
    error,
    refreshPreferences,
    updatePreferences,
    bulkUpdatePreferences,
    resetPreferences,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
