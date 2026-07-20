// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from 'crypto';

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { R2StorageService } from '../storage/r2.service';

import { SavedReportService } from './saved-report.service';

@Injectable()
export class ReportShareTokenService {
  private readonly logger = new Logger(ReportShareTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly savedReportService: SavedReportService,
    private readonly r2StorageService: R2StorageService,
    private readonly auditService: AuditService
  ) {}

  async createToken(
    userId: string,
    reportId: string,
    options: {
      expiresInHours?: number;
      maxAccess?: number;
      generatedReportId?: string;
    } = {}
  ) {
    await this.savedReportService.verifyAccess(userId, reportId, ['editor', 'manager']);

    const { expiresInHours = 168, maxAccess, generatedReportId } = options;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const shareToken = await this.prisma.reportShareToken.create({
      data: {
        reportId,
        generatedReportId,
        token,
        createdBy: userId,
        maxAccess,
        expiresAt,
      },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARE_TOKEN_CREATED',
      resource: 'ReportShareToken',
      resourceId: shareToken.id,
      userId,
      metadata: { reportId, expiresInHours, maxAccess },
    });

    this.logger.log(`User ${userId} created share token for report ${reportId}`);

    return {
      id: shareToken.id,
      token: shareToken.token,
      expiresAt: shareToken.expiresAt,
      maxAccess: shareToken.maxAccess,
    };
  }

  async validateAndGetReport(token: string) {
    const shareToken = await this.prisma.reportShareToken.findUnique({
      where: { token },
      include: {
        report: {
          include: {
            generatedReports: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!shareToken) {
      throw new NotFoundException('Invalid share link');
    }

    if (shareToken.revokedAt) {
      throw new ForbiddenException('This share link has been revoked');
    }

    if (shareToken.expiresAt < new Date()) {
      throw new GoneException('This share link has expired');
    }

    if (shareToken.maxAccess !== null && shareToken.accessCount >= shareToken.maxAccess) {
      throw new GoneException('This share link has reached its access limit');
    }

    // Increment access count
    await this.prisma.reportShareToken.update({
      where: { id: shareToken.id },
      data: { accessCount: { increment: 1 } },
    });

    // Get the latest generated report or the specific one
    const generatedReportId =
      shareToken.generatedReportId || shareToken.report.generatedReports[0]?.id;

    if (!generatedReportId) {
      throw new NotFoundException('No generated report available for this link');
    }

    const generatedReport = await this.prisma.generatedReport.findUnique({
      where: { id: generatedReportId },
    });

    if (!generatedReport) {
      throw new NotFoundException('Generated report not found');
    }

    const downloadUrl = await this.r2StorageService.getPresignedDownloadUrl(
      generatedReport.r2Key,
      3600
    );

    await this.auditService.logEvent({
      action: 'REPORT_PUBLIC_ACCESS',
      resource: 'ReportShareToken',
      resourceId: shareToken.id,
      metadata: {
        reportId: shareToken.reportId,
        accessCount: shareToken.accessCount + 1,
      },
    });

    return {
      reportName: shareToken.report.name,
      format: generatedReport.format,
      generatedAt: generatedReport.createdAt,
      fileSize: generatedReport.fileSize,
      downloadUrl,
    };
  }

  async revokeToken(userId: string, tokenId: string) {
    const shareToken = await this.prisma.reportShareToken.findUnique({
      where: { id: tokenId },
    });

    if (!shareToken) {
      throw new NotFoundException('Share token not found');
    }

    await this.savedReportService.verifyAccess(userId, shareToken.reportId, ['editor', 'manager']);

    await this.prisma.reportShareToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARE_TOKEN_REVOKED',
      resource: 'ReportShareToken',
      resourceId: tokenId,
      userId,
    });

    this.logger.log(`User ${userId} revoked share token ${tokenId}`);
  }

  async listTokens(userId: string, reportId: string) {
    await this.savedReportService.verifyAccess(userId, reportId, ['editor', 'manager']);

    return this.prisma.reportShareToken.findMany({
      where: {
        reportId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async cleanupExpired() {
    const result = await this.prisma.reportShareToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired share tokens`);
    }

    return result.count;
  }
}