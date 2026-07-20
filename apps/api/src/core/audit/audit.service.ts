// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from '@nestjs/common';

import { CryptoService } from '@core/crypto/crypto.service';
import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

export interface AuditEventData {
  action: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditService {
  private lastHash: string = '0';

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cryptoService: CryptoService
  ) {}

  async logEvent(data: AuditEventData): Promise<void> {
    try {
      const metadataStr = data.metadata ? JSON.stringify(data.metadata) : null;
      const timestamp = new Date();

      // HMAC chain: each record includes hash of previous for tamper detection
      const chainInput = `${this.lastHash}|${data.action}|${data.userId || ''}|${timestamp.toISOString()}|${metadataStr || ''}`;
      const chainHash = this.cryptoService.hmac(chainInput);
      this.lastHash = chainHash;

      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: metadataStr
            ? JSON.stringify({ ...JSON.parse(metadataStr), _chain: chainHash })
            : JSON.stringify({ _chain: chainHash }),
          severity: data.severity || 'low',
          timestamp,
        },
      });

      if (data.severity === 'critical' || data.severity === 'high') {
        this.logger.warn(
          `Security event: ${data.action} - ${data.resource || 'unknown'} by ${data.userId || 'anonymous'}`,
          'AuditService'
        );
      }
    } catch (error) {
      this.logger.error('Failed to log audit event', (error as Error).message, 'AuditService');
    }
  }

  async log(data: AuditEventData): Promise<void> {
    return this.logEvent(data);
  }

  /**
   * Export audit logs for a user (GDPR compliance)
   */
  async exportUserAuditLogs(userId: string): Promise<any[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });
    return logs.map((log) => ({
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      timestamp: log.timestamp,
      severity: log.severity,
    }));
  }

  /**
   * Apply retention policy: archive/delete old audit logs
   */
  async applyRetentionPolicy(retentionDays: number = 365): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoff },
        retainUntil: { lt: new Date() },
      },
    });

    this.logger.log(`Retention policy applied: ${result.count} audit logs purged`, 'AuditService');
    return result.count;
  }

  // Convenience methods
  async logAuthSuccess(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'AUTH_SUCCESS',
      resource: 'auth',
      userId,
      ipAddress,
      userAgent,
      severity: 'low',
    });
  }

  async logAuthFailure(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'AUTH_FAILURE',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { attemptedEmail: email },
      severity: 'medium',
    });
  }

  async logPasswordReset(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'PASSWORD_RESET',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'high',
    });
  }

  async logTotpEnabled(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'TOTP_ENABLED',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'medium',
    });
  }

  async logTotpDisabled(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      action: 'TOTP_DISABLED',
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      severity: 'high',
    });
  }

  async logSuspiciousActivity(
    action: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      action,
      resource: 'security',
      userId,
      ipAddress,
      metadata,
      severity: 'critical',
    });
  }

  async logDataAccess(
    resource: string,
    resourceId: string,
    userId: string,
    action: 'READ' | 'WRITE' | 'DELETE'
  ): Promise<void> {
    await this.logEvent({
      action: `DATA_${action}`,
      resource,
      resourceId,
      userId,
      severity: action === 'DELETE' ? 'high' : 'low',
    });
  }

  async logProviderConnection(
    provider: string,
    userId: string,
    spaceId: string,
    success: boolean,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      action: success ? 'PROVIDER_CONNECTED' : 'PROVIDER_CONNECTION_FAILED',
      resource: 'provider',
      resourceId: spaceId,
      userId,
      ipAddress,
      metadata: { provider },
      severity: success ? 'medium' : 'high',
    });
  }
}