// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';

export type ActivityType =
  | 'login'
  | 'page_view'
  | 'transaction_view'
  | 'account_sync'
  | 'budget_update'
  | 'settings_change'
  | 'report_generation'
  | 'manual_check_in';

/**
 * Service to track user activity for the Life Beat feature
 * Updates lastActivityAt on meaningful user actions
 */
@Injectable()
export class ActivityTrackerService {
  private readonly logger = new Logger(ActivityTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record user activity and update lastActivityAt
   * This is called on meaningful user actions to track engagement
   */
  async recordActivity(userId: string, _activityType: ActivityType): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActivityAt: new Date() },
      });
    } catch (error) {
      // Don't throw - activity tracking should not break normal operations
      this.logger.error(`Failed to record activity for user ${userId}:`, error);
    }
  }

  /**
   * Get last activity timestamp for a user
   */
  async getLastActivity(userId: string): Promise<Date | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastActivityAt: true, lastLoginAt: true },
    });

    // Return most recent activity - either explicit activity or login
    if (user?.lastActivityAt && user?.lastLoginAt) {
      return user.lastActivityAt > user.lastLoginAt ? user.lastActivityAt : user.lastLoginAt;
    }

    return user?.lastActivityAt || user?.lastLoginAt || null;
  }

  /**
   * Get days since last activity
   */
  async getDaysSinceActivity(userId: string): Promise<number | null> {
    const lastActivity = await this.getLastActivity(userId);

    if (!lastActivity) {
      return null;
    }

    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Manual "I'm alive" check-in from the Life Beat UI
   * Resets all inactivity tracking
   */
  async manualCheckIn(userId: string): Promise<{ success: boolean; nextCheckDate: Date }> {
    const now = new Date();

    // Update activity timestamp
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: now },
    });

    // Mark any pending inactivity alerts as responded
    await this.prisma.inactivityAlert.updateMany({
      where: {
        userId,
        responded: false,
      },
      data: {
        responded: true,
        respondedAt: now,
      },
    });

    // Calculate next expected check-in (30 days from now)
    const nextCheckDate = new Date(now);
    nextCheckDate.setDate(nextCheckDate.getDate() + 30);

    this.logger.log(`User ${userId} performed manual check-in`);

    return { success: true, nextCheckDate };
  }

  /**
   * Get Life Beat status for a user
   */
  async getLifeBeatStatus(userId: string): Promise<{
    enabled: boolean;
    lastActivity: Date | null;
    daysSinceActivity: number | null;
    alertDays: number[];
    executorCount: number;
    pendingAlerts: Array<{ level: number; sentAt: Date }>;
    legalAgreed: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        lifeBeatEnabled: true,
        lifeBeatAlertDays: true,
        lifeBeatLegalAgreedAt: true,
        lastActivityAt: true,
        lastLoginAt: true,
        executorAssignments: {
          select: { id: true },
        },
        inactivityAlerts: {
          where: { responded: false },
          select: { alertLevel: true, sentAt: true },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const lastActivity =
      user.lastActivityAt && user.lastLoginAt
        ? user.lastActivityAt > user.lastLoginAt
          ? user.lastActivityAt
          : user.lastLoginAt
        : user.lastActivityAt || user.lastLoginAt;

    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      enabled: user.lifeBeatEnabled,
      lastActivity,
      daysSinceActivity,
      alertDays: user.lifeBeatAlertDays,
      executorCount: user.executorAssignments.length,
      pendingAlerts: user.inactivityAlerts.map((a) => ({
        level: a.alertLevel,
        sentAt: a.sentAt,
      })),
      legalAgreed: !!user.lifeBeatLegalAgreedAt,
    };
  }

  /**
   * Enable Life Beat feature (requires legal agreement)
   */
  async enableLifeBeat(
    userId: string,
    alertDays: number[] = [30, 60, 90]
  ): Promise<{ success: boolean }> {
    // Validate alert days are reasonable
    const validDays = alertDays.filter((d) => d >= 7 && d <= 365).sort((a, b) => a - b);

    if (validDays.length === 0) {
      throw new Error('At least one valid alert day is required (7-365 days)');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lifeBeatEnabled: true,
        lifeBeatAlertDays: validDays,
        lifeBeatLegalAgreedAt: new Date(),
        lastActivityAt: new Date(), // Start fresh
      },
    });

    this.logger.log(`Life Beat enabled for user ${userId}`);
    return { success: true };
  }

  /**
   * Disable Life Beat feature
   */
  async disableLifeBeat(userId: string): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lifeBeatEnabled: false,
      },
    });

    // Cancel any pending alerts
    await this.prisma.inactivityAlert.updateMany({
      where: {
        userId,
        responded: false,
      },
      data: {
        responded: true,
        respondedAt: new Date(),
      },
    });

    this.logger.log(`Life Beat disabled for user ${userId}`);
    return { success: true };
  }
}