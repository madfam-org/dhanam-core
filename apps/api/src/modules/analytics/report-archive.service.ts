// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from 'crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { ReportFormat } from '@db';

import { R2StorageService } from '../storage/r2.service';

import { ReportService } from './report.service';
import { SavedReportService } from './saved-report.service';

const FORMAT_CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json',
};

const FORMAT_EXTENSION: Record<string, string> = {
  pdf: 'pdf',
  csv: 'csv',
  excel: 'xlsx',
  json: 'json',
};

@Injectable()
export class ReportArchiveService {
  private readonly logger = new Logger(ReportArchiveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
    private readonly savedReportService: SavedReportService,
    private readonly r2StorageService: R2StorageService,
    private readonly auditService: AuditService
  ) {}

  async generateAndArchive(savedReportId: string, userId: string) {
    const savedReport = await this.prisma.savedReport.findUnique({
      where: { id: savedReportId },
    });

    if (!savedReport) {
      throw new NotFoundException('Saved report not found');
    }

    await this.savedReportService.verifyAccess(userId, savedReportId, [
      'viewer',
      'editor',
      'manager',
    ]);

    const filters = (savedReport.filters as any) || {};
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const endDate = filters.endDate
      ? new Date(filters.endDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 0);

    // Generate report buffer based on format
    let buffer: Buffer;
    const format = savedReport.format as ReportFormat;

    switch (format) {
      case 'pdf':
        buffer = await this.reportService.generatePdfReport(
          savedReport.spaceId,
          startDate,
          endDate
        );
        break;
      case 'csv': {
        const csvContent = await this.reportService.generateCsvExport(
          savedReport.spaceId,
          startDate,
          endDate
        );
        buffer = Buffer.from(csvContent, 'utf-8');
        break;
      }
      case 'excel':
        buffer = await this.reportService.generateExcelExport(
          savedReport.spaceId,
          startDate,
          endDate
        );
        break;
      case 'json': {
        const jsonContent = await this.reportService.generateJsonExport(
          savedReport.spaceId,
          startDate,
          endDate
        );
        buffer = Buffer.from(jsonContent, 'utf-8');
        break;
      }
      default:
        buffer = await this.reportService.generatePdfReport(
          savedReport.spaceId,
          startDate,
          endDate
        );
    }

    const timestamp = Date.now();
    const ext = FORMAT_EXTENSION[format] || 'pdf';
    const contentType = FORMAT_CONTENT_TYPE[format] || 'application/pdf';
    const filename = `${savedReport.name}-${timestamp}.${ext}`;

    const uploaded = await this.r2StorageService.uploadFile(
      savedReport.spaceId,
      `reports/${savedReportId}/${randomBytes(8).toString('hex')}`,
      buffer,
      filename,
      contentType,
      'report'
    );

    // Create generated report record
    const generatedReport = await this.prisma.generatedReport.create({
      data: {
        savedReportId,
        spaceId: savedReport.spaceId,
        generatedBy: userId,
        format,
        startDate,
        endDate,
        r2Key: uploaded.key,
        fileSize: buffer.length,
      },
    });

    // Update lastRunAt
    await this.prisma.savedReport.update({
      where: { id: savedReportId },
      data: { lastRunAt: new Date() },
    });

    await this.auditService.logEvent({
      action: 'REPORT_GENERATED',
      resource: 'GeneratedReport',
      resourceId: generatedReport.id,
      userId,
      metadata: {
        savedReportId,
        format,
        fileSize: buffer.length,
      },
    });

    this.logger.log(`Generated report ${generatedReport.id} for saved report ${savedReportId}`);

    // Return download URL
    const downloadUrl = await this.r2StorageService.getPresignedDownloadUrl(uploaded.key, 3600);

    return { generatedReport, downloadUrl };
  }

  async getHistory(reportId: string, limit = 20) {
    return this.prisma.generatedReport.findMany({
      where: { savedReportId: reportId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        generator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getDownloadUrl(generatedReportId: string, userId: string) {
    const generated = await this.prisma.generatedReport.findUnique({
      where: { id: generatedReportId },
      include: { savedReport: true },
    });

    if (!generated) {
      throw new NotFoundException('Generated report not found');
    }

    await this.savedReportService.verifyAccess(userId, generated.savedReportId, [
      'viewer',
      'editor',
      'manager',
    ]);

    // Increment download count
    await this.prisma.generatedReport.update({
      where: { id: generatedReportId },
      data: { downloadCount: { increment: 1 } },
    });

    await this.auditService.logEvent({
      action: 'REPORT_DOWNLOADED',
      resource: 'GeneratedReport',
      resourceId: generatedReportId,
      userId,
    });

    const downloadUrl = await this.r2StorageService.getPresignedDownloadUrl(generated.r2Key, 3600);

    return { downloadUrl, generatedReport: generated };
  }

  async deleteGenerated(generatedReportId: string, userId: string) {
    const generated = await this.prisma.generatedReport.findUnique({
      where: { id: generatedReportId },
    });

    if (!generated) {
      throw new NotFoundException('Generated report not found');
    }

    await this.savedReportService.verifyAccess(userId, generated.savedReportId, ['manager']);

    // Delete from R2
    await this.r2StorageService.deleteFile(generated.r2Key);

    // Delete from DB
    await this.prisma.generatedReport.delete({
      where: { id: generatedReportId },
    });

    await this.auditService.logEvent({
      action: 'GENERATED_REPORT_DELETED',
      resource: 'GeneratedReport',
      resourceId: generatedReportId,
      userId,
    });

    this.logger.log(`User ${userId} deleted generated report ${generatedReportId}`);
  }
}
