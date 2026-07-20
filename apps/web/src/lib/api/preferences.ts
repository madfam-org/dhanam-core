import { apiClient } from './client';

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

export interface PreferencesSummary {
  notificationsEnabled: number;
  privacyScore: number;
  dataExportReady: boolean;
}

export const preferencesApi = {
  /**
   * Get user preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get<UserPreferences>('/preferences');
  },

  /**
   * Get preferences summary
   */
  getPreferencesSummary: async (): Promise<PreferencesSummary> => {
    return apiClient.get<PreferencesSummary>('/preferences/summary');
  },

  /**
   * Update preferences
   */
  updatePreferences: async (updates: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiClient.patch<UserPreferences>('/preferences', updates);
  },

  /**
   * Bulk update preferences by category
   */
  bulkUpdatePreferences: async (updates: {
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
  }): Promise<UserPreferences> => {
    return apiClient.put<UserPreferences>('/preferences/bulk', updates);
  },

  /**
   * Reset preferences to defaults
   */
  resetPreferences: async (): Promise<UserPreferences> => {
    return apiClient.post<UserPreferences>('/preferences/reset');
  },
};
