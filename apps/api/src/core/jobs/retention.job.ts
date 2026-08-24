// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * Retention Job - Data lifecycle management
 * Schedule: Daily via BullMQ cron
 * SOC 2 Control: Data retention and disposal
 */
@Injectable()
export class RetentionJob {
  private readonly logger = new Logger(RetentionJob.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  /**
   * Main retention job - runs daily
   */
  async execute(): Promise<void> {
    this.logger.log('Starting retention job...');

    await this.purgeSoftDeletedUsers();
    await this.purgeExpiredSessions();
    await this.archiveOldAuditLogs();

    this.logger.log('Retention job complete');
  }

  /**
   * Permanently delete users who were soft-deleted 30+ days ago
   */
  private async purgeSoftDeletedUsers(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const usersToDelete = await this.prisma.user.findMany({
      where: {
        deletedAt: { lt: cutoff },
        isActive: false,
      },
      select: { id: true, email: true },
    });

    for (const user of usersToDelete) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Delete owned spaces with no other owners
          const ownedSpaces = await tx.userSpace.findMany({
            where: { userId: user.id, role: 'owner' },
            include: { space: { include: { userSpaces: true } } },
          });

          for (const us of ownedSpaces) {
            const otherOwners = us.space.userSpaces.filter(
              (s) => s.userId !== user.id && s.role === 'owner'
            );
            if (otherOwners.length === 0) {
              await tx.space.delete({ where: { id: us.spaceId } });
            }
          }

          await tx.user.delete({ where: { id: user.id } });
        });

        this.logger.log(`Purged soft-deleted user: ${user.id}`);
      } catch (error) {
        this.logger.error(`Failed to purge user ${user.id}: ${error}`);
      }
    }

    if (usersToDelete.length > 0) {
      await this.auditService.logEvent({
        action: 'RETENTION_USERS_PURGED',
        resource: 'user',
        metadata: { count: usersToDelete.length },
        severity: 'high',
      });
    }
  }

  /**
   * Clean up expired sessions
   */
  private async purgeExpiredSessions(): Promise<void> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} expired sessions`);
    }
  }

  /**
   * Archive old audit logs past retention period
   */
  private async archiveOldAuditLogs(): Promise<void> {
    const purged = await this.auditService.applyRetentionPolicy(365);
    if (purged > 0) {
      this.logger.log(`Archived ${purged} old audit logs`);
    }
  }
}
