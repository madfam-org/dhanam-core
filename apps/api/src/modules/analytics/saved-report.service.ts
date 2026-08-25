// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { ReportShareStatus } from '@db';

import { SpacesService } from '../spaces/spaces.service';

import { CreateSavedReportDto } from './dto/create-saved-report.dto';
import { UpdateSavedReportDto } from './dto/update-saved-report.dto';

@Injectable()
export class SavedReportService {
  private readonly logger = new Logger(SavedReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spacesService: SpacesService,
    private readonly auditService: AuditService
  ) {}

  async create(userId: string, dto: CreateSavedReportDto) {
    await this.spacesService.verifyUserAccess(userId, dto.spaceId, 'member');

    const report = await this.prisma.savedReport.create({
      data: {
        spaceId: dto.spaceId,
        createdBy: userId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        schedule: dto.schedule,
        format: dto.format || 'pdf',
        filters: dto.filters as any,
        enabled: dto.enabled ?? true,
      },
    });

    await this.auditService.logEvent({
      action: 'REPORT_CREATED',
      resource: 'SavedReport',
      resourceId: report.id,
      userId,
      metadata: { spaceId: dto.spaceId, name: dto.name },
    });

    this.logger.log(`User ${userId} created saved report ${report.id}`);
    return report;
  }

  async findAll(userId: string, spaceId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const ownReports = await this.prisma.savedReport.findMany({
      where: { spaceId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        generatedReports: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { shares: true, generatedReports: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return ownReports;
  }

  async findOne(userId: string, reportId: string) {
    const report = await this.prisma.savedReport.findUnique({
      where: { id: reportId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        generatedReports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { shares: true, generatedReports: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found');
    }

    await this.verifyAccess(userId, reportId, ['viewer', 'editor', 'manager']);
    return report;
  }

  async update(userId: string, reportId: string, dto: UpdateSavedReportDto) {
    await this.verifyAccess(userId, reportId, ['editor', 'manager']);

    const report = await this.prisma.savedReport.update({
      where: { id: reportId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.schedule !== undefined && { schedule: dto.schedule }),
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.filters !== undefined && { filters: dto.filters as any }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });

    await this.auditService.logEvent({
      action: 'REPORT_UPDATED',
      resource: 'SavedReport',
      resourceId: reportId,
      userId,
    });

    this.logger.log(`User ${userId} updated saved report ${reportId}`);
    return report;
  }

  async delete(userId: string, reportId: string) {
    await this.verifyAccess(userId, reportId, ['manager']);

    const report = await this.prisma.savedReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found');
    }

    await this.prisma.savedReport.delete({ where: { id: reportId } });

    await this.auditService.logEvent({
      action: 'REPORT_DELETED',
      resource: 'SavedReport',
      resourceId: reportId,
      userId,
      metadata: { name: report.name },
    });

    this.logger.log(`User ${userId} deleted saved report ${reportId}`);
  }

  async verifyAccess(userId: string, reportId: string, requiredRoles: string[]): Promise<void> {
    const report = await this.prisma.savedReport.findUnique({
      where: { id: reportId },
      include: {
        space: {
          include: {
            userSpaces: { where: { userId } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Saved report not found');
    }

    // Owner (via space membership) has full access
    if (report.space.userSpaces.length > 0) {
      return;
    }

    // Check shared access
    const share = await this.prisma.reportShare.findFirst({
      where: {
        reportId,
        sharedWith: userId,
        status: ReportShareStatus.accepted,
      },
    });

    if (!share) {
      throw new ForbiddenException('You do not have access to this report');
    }

    if (!requiredRoles.includes(share.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(', ')}, You have: ${share.role}`
      );
    }
  }
}
