// SPDX-License-Identifier: AGPL-3.0-or-later
import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';

import { Currency } from '@db';

export class UpdatePreferencesDto {
  // Notification preferences
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  transactionAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  budgetAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;

  @IsOptional()
  @IsBoolean()
  monthlyReports?: boolean;

  @IsOptional()
  @IsBoolean()
  securityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  promotionalEmails?: boolean;

  // Mobile/Push notifications
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  transactionPush?: boolean;

  @IsOptional()
  @IsBoolean()
  budgetPush?: boolean;

  @IsOptional()
  @IsBoolean()
  securityPush?: boolean;

  // Privacy preferences
  @IsOptional()
  @IsBoolean()
  dataSharing?: boolean;

  @IsOptional()
  @IsBoolean()
  analyticsTracking?: boolean;

  @IsOptional()
  @IsBoolean()
  personalizedAds?: boolean;

  // Display preferences
  @IsOptional()
  @IsString()
  dashboardLayout?: string;

  @IsOptional()
  @IsString()
  chartType?: string;

  @IsOptional()
  @IsString()
  themeMode?: string;

  @IsOptional()
  @IsBoolean()
  compactView?: boolean;

  @IsOptional()
  @IsBoolean()
  showBalances?: boolean;

  // Financial preferences
  @IsOptional()
  @IsEnum(Currency)
  defaultCurrency?: Currency;

  @IsOptional()
  @IsBoolean()
  hideSensitiveData?: boolean;

  @IsOptional()
  @IsBoolean()
  autoCategorizeTxns?: boolean;

  @IsOptional()
  @IsBoolean()
  includeWeekends?: boolean;

  // ESG preferences
  @IsOptional()
  @IsBoolean()
  esgScoreVisibility?: boolean;

  @IsOptional()
  @IsBoolean()
  sustainabilityAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  impactReporting?: boolean;

  // Backup and export
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  @IsOptional()
  @IsString()
  backupFrequency?: string;

  @IsOptional()
  @IsString()
  exportFormat?: string;
}

export class PreferencesResponseDto {
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
  defaultCurrency: Currency;
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

export class BulkPreferencesUpdateDto {
  @IsOptional()
  notifications?: Partial<{
    emailNotifications: boolean;
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    securityAlerts: boolean;
    promotionalEmails: boolean;
    pushNotifications: boolean;
    transactionPush: boolean;
    budgetPush: boolean;
    securityPush: boolean;
  }>;

  @IsOptional()
  privacy?: Partial<{
    dataSharing: boolean;
    analyticsTracking: boolean;
    personalizedAds: boolean;
  }>;

  @IsOptional()
  display?: Partial<{
    dashboardLayout: string;
    chartType: string;
    themeMode: string;
    compactView: boolean;
    showBalances: boolean;
  }>;

  @IsOptional()
  financial?: Partial<{
    defaultCurrency: Currency;
    hideSensitiveData: boolean;
    autoCategorizeTxns: boolean;
    includeWeekends: boolean;
  }>;

  @IsOptional()
  esg?: Partial<{
    esgScoreVisibility: boolean;
    sustainabilityAlerts: boolean;
    impactReporting: boolean;
  }>;

  @IsOptional()
  backup?: Partial<{
    autoBackup: boolean;
    backupFrequency: string;
    exportFormat: string;
  }>;
}

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const DASHBOARD_LAYOUTS = ['standard', 'compact', 'detailed'] as const;
export const CHART_TYPES = ['line', 'bar', 'pie', 'area'] as const;
export const EXPORT_FORMATS = ['csv', 'json', 'xlsx', 'pdf'] as const;
export const BACKUP_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;