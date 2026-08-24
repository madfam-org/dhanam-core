// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { ReportShareStatus } from '@db';

import { SavedReportService } from './saved-report.service';

export interface ShareReportInput {
  reportId: string;
  shareWithEmail: string;
  role: string;
  message?: string;
}

export interface UpdateShareRoleInput {
  shareId: string;
  newRole: string;
}

@Injectable()
export class ReportCollaborationService {
  private readonly logger = new Logger(ReportCollaborationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly savedReportService: SavedReportService,
    private readonly auditService: AuditService
  ) {}

  async shareReport(userId: string, input: ShareReportInput) {
    this.logger.log(`User ${userId} sharing report ${input.reportId} with ${input.shareWithEmail}`);

    await this.savedReportService.verifyAccess(userId, input.reportId, ['manager', 'editor']);

    const shareWithUser = await this.prisma.user.findUnique({
      where: { email: input.shareWithEmail },
      select: { id: true, name: true, email: true },
    });

    if (!shareWithUser) {
      throw new NotFoundException(`User with email ${input.shareWithEmail} not found`);
    }

    const existingShare = await this.prisma.reportShare.findUnique({
      where: {
        reportId_sharedWith: {
          reportId: input.reportId,
          sharedWith: shareWithUser.id,
        },
      },
    });

    if (existingShare) {
      throw new BadRequestException('Report already shared with this user');
    }

    const share = await this.prisma.reportShare.create({
      data: {
        reportId: input.reportId,
        sharedWith: shareWithUser.id,
        role: input.role,
        invitedBy: userId,
        message: input.message,
        status: ReportShareStatus.pending,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    await this.prisma.savedReport.update({
      where: { id: input.reportId },
      data: { isShared: true },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARED',
      resource: 'ReportShare',
      resourceId: share.id,
      userId,
      metadata: {
        reportId: input.reportId,
        sharedWith: shareWithUser.email,
        role: input.role,
      },
    });

    this.logger.log(`Report ${input.reportId} shared with ${input.shareWithEmail}`);
    return share;
  }

  async acceptShare(userId: string, shareId: string) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!share) {
      throw new NotFoundException('Share invitation not found');
    }

    if (share.sharedWith !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (share.status !== ReportShareStatus.pending) {
      throw new BadRequestException(`Cannot accept invitation with status: ${share.status}`);
    }

    const updated = await this.prisma.reportShare.update({
      where: { id: shareId },
      data: {
        status: ReportShareStatus.accepted,
        acceptedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARE_ACCEPTED',
      resource: 'ReportShare',
      resourceId: shareId,
      userId,
      metadata: { reportId: share.reportId },
    });

    this.logger.log(`User ${userId} accepted report share ${shareId}`);
    return updated;
  }

  async declineShare(userId: string, shareId: string) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share invitation not found');
    }

    if (share.sharedWith !== userId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    if (share.status !== ReportShareStatus.pending) {
      throw new BadRequestException(`Cannot decline invitation with status: ${share.status}`);
    }

    await this.prisma.reportShare.update({
      where: { id: shareId },
      data: { status: ReportShareStatus.declined },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARE_DECLINED',
      resource: 'ReportShare',
      resourceId: shareId,
      userId,
      metadata: { reportId: share.reportId },
    });

    this.logger.log(`User ${userId} declined report share ${shareId}`);
  }

  async revokeShare(userId: string, shareId: string) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    await this.savedReportService.verifyAccess(userId, share.reportId, ['manager']);

    await this.prisma.reportShare.update({
      where: { id: shareId },
      data: { status: ReportShareStatus.revoked },
    });

    await this.auditService.logEvent({
      action: 'REPORT_SHARE_REVOKED',
      resource: 'ReportShare',
      resourceId: shareId,
      userId,
      metadata: { reportId: share.reportId },
    });

    this.logger.log(`User ${userId} revoked report share ${shareId}`);
  }

  async updateShareRole(userId: string, input: UpdateShareRoleInput) {
    const share = await this.prisma.reportShare.findUnique({
      where: { id: input.shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    await this.savedReportService.verifyAccess(userId, share.reportId, ['manager']);

    const updated = await this.prisma.reportShare.update({
      where: { id: input.shareId },
      data: { role: input.newRole },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(`Updated report share ${input.shareId} role to ${input.newRole}`);
    return updated;
  }

  async getReportShares(userId: string, reportId: string) {
    await this.savedReportService.verifyAccess(userId, reportId, ['viewer', 'editor', 'manager']);

    return this.prisma.reportShare.findMany({
      where: { reportId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSharedWithMe(userId: string) {
    const shares = await this.prisma.reportShare.findMany({
      where: {
        sharedWith: userId,
        status: ReportShareStatus.accepted,
      },
      include: {
        report: {
          include: {
            space: true,
            generatedReports: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return shares.map((share) => ({
      ...share.report,
      shareRole: share.role,
      sharedBy: share.inviter,
    }));
  }
}
