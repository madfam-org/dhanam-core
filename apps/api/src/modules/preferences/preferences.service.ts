// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, Logger } from '@nestjs/common';

import { UserPreferences, Currency } from '@db';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

import { UpdatePreferencesDto, PreferencesResponseDto, BulkPreferencesUpdateDto } from './dto';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getUserPreferences(userId: string): Promise<PreferencesResponseDto> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPreferences = await this.createDefaultPreferences(userId);
      return this.mapToResponseDto(defaultPreferences);
    }

    return this.mapToResponseDto(preferences);
  }

  async updateUserPreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<PreferencesResponseDto> {
    // Ensure preferences exist
    await this.ensurePreferencesExist(userId);

    const previousPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const updatedPreferences = await this.prisma.userPreferences.update({
      where: { userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Log preferences update with changes
    const changes = this.getChanges(previousPreferences!, dto);
    if (Object.keys(changes).length > 0) {
      await this.auditService.logEvent({
        action: 'preferences_updated',
        resource: 'user',
        resourceId: userId,
        userId,
        metadata: {
          changes,
          updatedFields: Object.keys(changes),
        },
      });
    }

    this.logger.log(`User ${userId} updated ${Object.keys(changes).length} preferences`);
    return this.mapToResponseDto(updatedPreferences);
  }

  async bulkUpdatePreferences(
    userId: string,
    dto: BulkPreferencesUpdateDto
  ): Promise<PreferencesResponseDto> {
    await this.ensurePreferencesExist(userId);

    const previousPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Flatten the bulk update structure
    const flatUpdate: Partial<UserPreferences> = {};

    if (dto.notifications) {
      Object.assign(flatUpdate, dto.notifications);
    }
    if (dto.privacy) {
      Object.assign(flatUpdate, dto.privacy);
    }
    if (dto.display) {
      Object.assign(flatUpdate, dto.display);
    }
    if (dto.financial) {
      Object.assign(flatUpdate, dto.financial);
    }
    if (dto.esg) {
      Object.assign(flatUpdate, dto.esg);
    }
    if (dto.backup) {
      Object.assign(flatUpdate, dto.backup);
    }

    const updatedPreferences = await this.prisma.userPreferences.update({
      where: { userId },
      data: {
        ...flatUpdate,
        updatedAt: new Date(),
      },
    });

    // Log bulk update
    await this.auditService.logEvent({
      action: 'preferences_bulk_updated',
      resource: 'user',
      resourceId: userId,
      userId,
      metadata: {
        categories: Object.keys(dto),
        totalChanges: Object.keys(flatUpdate).length,
        changes: this.getChanges(previousPreferences!, flatUpdate),
      },
    });

    this.logger.log(
      `User ${userId} bulk updated preferences in ${Object.keys(dto).length} categories`
    );
    return this.mapToResponseDto(updatedPreferences);
  }

  async resetPreferences(userId: string): Promise<PreferencesResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true, timezone: true, preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete existing preferences
    if (user.preferences) {
      await this.prisma.userPreferences.delete({
        where: { userId },
      });
    }

    // Create fresh default preferences
    const defaultPreferences = await this.createDefaultPreferences(userId);

    await this.auditService.logEvent({
      action: 'preferences_reset',
      resource: 'user',
      resourceId: userId,
      userId,
    });

    this.logger.log(`User ${userId} reset preferences to defaults`);
    return this.mapToResponseDto(defaultPreferences);
  }

  async getPreferencesSummary(userId: string): Promise<{
    totalSettings: number;
    categories: Record<string, number>;
    lastUpdated: string | null;
    customizations: number;
  }> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return {
        totalSettings: 0,
        categories: {},
        lastUpdated: null,
        customizations: 0,
      };
    }

    const defaults = this.getDefaultPreferences();
    const customizations = this.countCustomizations(preferences, defaults);

    return {
      totalSettings: Object.keys(preferences).length - 4, // Exclude id, userId, createdAt, updatedAt
      categories: {
        notifications: 11,
        privacy: 3,
        display: 5,
        financial: 4,
        esg: 3,
        backup: 3,
      },
      lastUpdated: preferences.updatedAt.toISOString(),
      customizations,
    };
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true, timezone: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultCurrency = user.locale === 'es' ? Currency.MXN : Currency.USD;

    const preferences = await this.prisma.userPreferences.create({
      data: {
        userId,
        defaultCurrency,
        // All other fields will use schema defaults
      },
    });

    this.logger.log(`Created default preferences for user ${userId}`);
    return preferences;
  }

  private async ensurePreferencesExist(userId: string): Promise<void> {
    const exists = await this.prisma.userPreferences.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!exists) {
      await this.createDefaultPreferences(userId);
    }
  }

  private mapToResponseDto(preferences: UserPreferences): PreferencesResponseDto {
    return {
      id: preferences.id,
      userId: preferences.userId,
      emailNotifications: preferences.emailNotifications,
      transactionAlerts: preferences.transactionAlerts,
      budgetAlerts: preferences.budgetAlerts,
      weeklyReports: preferences.weeklyReports,
      monthlyReports: preferences.monthlyReports,
      securityAlerts: preferences.securityAlerts,
      promotionalEmails: preferences.promotionalEmails,
      pushNotifications: preferences.pushNotifications,
      transactionPush: preferences.transactionPush,
      budgetPush: preferences.budgetPush,
      securityPush: preferences.securityPush,
      dataSharing: preferences.dataSharing,
      analyticsTracking: preferences.analyticsTracking,
      personalizedAds: preferences.personalizedAds,
      dashboardLayout: preferences.dashboardLayout,
      chartType: preferences.chartType,
      themeMode: preferences.themeMode,
      compactView: preferences.compactView,
      showBalances: preferences.showBalances,
      defaultCurrency: preferences.defaultCurrency,
      hideSensitiveData: preferences.hideSensitiveData,
      autoCategorizeTxns: preferences.autoCategorizeTxns,
      includeWeekends: preferences.includeWeekends,
      esgScoreVisibility: preferences.esgScoreVisibility,
      sustainabilityAlerts: preferences.sustainabilityAlerts,
      impactReporting: preferences.impactReporting,
      autoBackup: preferences.autoBackup,
      backupFrequency: preferences.backupFrequency ?? null,
      exportFormat: preferences.exportFormat,
      createdAt: preferences.createdAt.toISOString(),
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }

  private getChanges(
    previous: UserPreferences,
    updates: Partial<UserPreferences>
  ): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    for (const [key, newValue] of Object.entries(updates)) {
      if (key in previous && previous[key as keyof UserPreferences] !== newValue) {
        changes[key] = {
          from: previous[key as keyof UserPreferences],
          to: newValue,
        };
      }
    }

    return changes;
  }

  private getDefaultPreferences() {
    // Return the default values that match the schema
    return {
      emailNotifications: true,
      transactionAlerts: true,
      budgetAlerts: true,
      weeklyReports: true,
      monthlyReports: true,
      securityAlerts: true,
      promotionalEmails: false,
      pushNotifications: true,
      transactionPush: true,
      budgetPush: true,
      securityPush: true,
      dataSharing: false,
      analyticsTracking: true,
      personalizedAds: false,
      dashboardLayout: 'standard',
      chartType: 'line',
      themeMode: 'light',
      compactView: false,
      showBalances: true,
      defaultCurrency: Currency.MXN,
      hideSensitiveData: false,
      autoCategorizeTxns: true,
      includeWeekends: true,
      esgScoreVisibility: true,
      sustainabilityAlerts: false,
      impactReporting: false,
      autoBackup: false,
      backupFrequency: null,
      exportFormat: 'csv',
    };
  }

  private countCustomizations(current: UserPreferences, defaults: any): number {
    let count = 0;

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (key in current && current[key as keyof UserPreferences] !== defaultValue) {
        count++;
      }
    }

    return count;
  }
}
