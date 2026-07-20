// SPDX-License-Identifier: AGPL-3.0-or-later
import { STORAGE_LIMITS } from '@dhanam-core/shared';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { Prisma, DocumentCategory, DocumentStatus } from '@db';

import { SpacesService } from '../spaces/spaces.service';
import { R2StorageService } from '../storage/r2.service';

import { CsvPreviewService, CsvPreviewResult } from './csv-preview.service';
import {
  RequestUploadUrlDto,
  ConfirmUploadDto,
  ListDocumentsQueryDto,
  UpdateCsvMappingDto,
} from './dto';

/** 50 MB per file for non-admin users */
const MAX_FILE_SIZE = STORAGE_LIMITS.MAX_FILE_SIZE_BYTES;
/** 500 MB total per space for non-admin users */
const MAX_SPACE_STORAGE = STORAGE_LIMITS.MAX_SPACE_STORAGE_BYTES;
/** CSVs under this size get synchronous preview generation */
const CSV_SYNC_THRESHOLD = STORAGE_LIMITS.CSV_PREVIEW_THRESHOLD_BYTES;

export interface StorageUsageResult {
  used: number;
  limit: number;
  remaining: number;
  documentCount: number;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private r2Storage: R2StorageService,
    private auditService: AuditService,
    private csvPreviewService: CsvPreviewService,
  ) {}

  // ──────────────────────────── Quota helpers ────────────────────────────

  async getStorageUsage(spaceId: string, maxStorage?: number): Promise<StorageUsageResult> {
    const limit = maxStorage ?? MAX_SPACE_STORAGE;
    const result = await this.prisma.document.aggregate({
      where: { spaceId, deletedAt: null },
      _sum: { fileSize: true },
      _count: true,
    });

    const used = result._sum.fileSize ?? 0;
    return {
      used,
      limit: limit === Infinity ? -1 : limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
      documentCount: result._count,
    };
  }

  private async checkQuota(spaceId: string, bytes: number, isAdmin: boolean): Promise<void> {
    if (isAdmin) return;

    if (bytes > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    const limits = { storageBytes: Infinity };
    const maxStorage = limits.storageBytes;
    if (maxStorage === Infinity) return;

    const usage = await this.getStorageUsage(spaceId, maxStorage);
    if (usage.used + bytes > maxStorage) {
      throw new BadRequestException(
        `Space storage quota exceeded. Used: ${Math.round(usage.used / (1024 * 1024))}MB / ${Math.round(maxStorage / (1024 * 1024))}MB`
      );
    }
  }

  // ──────────────────────────── Core CRUD ────────────────────────────

  async requestUploadUrl(
    spaceId: string,
    userId: string,
    dto: RequestUploadUrlDto,
    isAdmin: boolean = false
  ) {
    if (!isAdmin) {
      await this.spacesService.verifyUserAccess(userId, spaceId, 'member');
    }

    if (!this.r2Storage.isAvailable()) {
      throw new BadRequestException('Document storage is not configured');
    }

    // Soft quota check with estimated size
    if (dto.estimatedSize) {
      await this.checkQuota(spaceId, dto.estimatedSize, isAdmin);
    }

    const category = dto.category ?? DocumentCategory.general;

    const presigned = await this.r2Storage.getPresignedUploadUrlGeneric(
      spaceId,
      dto.filename,
      dto.contentType,
      category
    );

    // Create document record in pending state
    const document = await this.prisma.document.create({
      data: {
        spaceId,
        uploadedBy: userId,
        filename: dto.filename,
        contentType: dto.contentType,
        fileSize: dto.estimatedSize ?? 0,
        r2Key: presigned.key,
        category,
        status: DocumentStatus.pending_upload,
        manualAssetId: dto.manualAssetId ?? null,
        accountId: dto.accountId ?? null,
      },
    });

    await this.auditService.logEvent({
      userId,
      action: 'document.upload_requested',
      resource: 'document',
      resourceId: document.id,
      metadata: { spaceId, filename: dto.filename, category },
    });

    return {
      documentId: document.id,
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      expiresAt: presigned.expiresAt,
    };
  }

  async confirmUpload(
    spaceId: string,
    userId: string,
    documentId: string,
    dto: ConfirmUploadDto,
    isAdmin: boolean = false
  ) {
    if (!isAdmin) {
      await this.spacesService.verifyUserAccess(userId, spaceId, 'member');
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== DocumentStatus.pending_upload) {
      throw new BadRequestException('Document upload already confirmed');
    }

    // Verify file exists in R2 and get actual size
    const actualSize = await this.r2Storage.getFileSize(document.r2Key);
    if (actualSize === null) {
      throw new BadRequestException('File was not uploaded to storage');
    }

    // Hard quota check with actual size
    await this.checkQuota(spaceId, actualSize, isAdmin);

    const isCsv = dto.contentType === 'text/csv' || document.contentType === 'text/csv';
    let newStatus: DocumentStatus = DocumentStatus.uploaded;
    let csvPreview: CsvPreviewResult | null = null;

    // Generate CSV preview for small files synchronously
    if (isCsv && actualSize <= CSV_SYNC_THRESHOLD) {
      try {
        newStatus = DocumentStatus.processing;
        csvPreview = await this.csvPreviewService.generatePreview(document.r2Key);
        newStatus = DocumentStatus.ready;
      } catch (err) {
        this.logger.warn(`CSV preview failed for ${documentId}: ${(err as Error).message}`);
        newStatus = DocumentStatus.failed;
      }
    } else if (isCsv) {
      // Large CSV — mark as processing (follow-up BullMQ job can handle it)
      newStatus = DocumentStatus.processing;
    }

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        filename: dto.filename,
        contentType: dto.contentType,
        fileSize: actualSize,
        status: newStatus,
        csvPreview: csvPreview as unknown as Prisma.InputJsonValue,
        errorMessage: newStatus === DocumentStatus.failed ? 'CSV preview generation failed' : null,
      },
    });

    await this.auditService.logEvent({
      userId,
      action: 'document.upload_confirmed',
      resource: 'document',
      resourceId: documentId,
      metadata: { spaceId, fileSize: actualSize, status: newStatus },
    });

    return updated;
  }

  async findAll(spaceId: string, userId: string, query: ListDocumentsQueryDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const where: Prisma.DocumentWhereInput = {
      spaceId,
      deletedAt: null,
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
      ...(query.contentType && { contentType: query.contentType }),
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllAdmin(query: ListDocumentsQueryDto) {
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
      ...(query.contentType && { contentType: query.contentType }),
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(spaceId: string, userId: string, documentId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async findOneAdmin(documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getDownloadUrl(spaceId: string, userId: string, documentId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const url = await this.r2Storage.getPresignedDownloadUrl(document.r2Key);

    await this.auditService.logEvent({
      userId,
      action: 'document.downloaded',
      resource: 'document',
      resourceId: documentId,
      metadata: { spaceId, filename: document.filename },
    });

    return { downloadUrl: url, filename: document.filename };
  }

  async deleteDocument(spaceId: string, userId: string, documentId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Soft-delete in DB
    await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Delete from R2
    try {
      await this.r2Storage.deleteFile(document.r2Key);
    } catch (err) {
      this.logger.warn(`Failed to delete R2 file ${document.r2Key}: ${(err as Error).message}`);
    }

    await this.auditService.logEvent({
      userId,
      action: 'document.deleted',
      resource: 'document',
      resourceId: documentId,
      metadata: { spaceId, filename: document.filename },
      severity: 'medium',
    });
  }

  async deleteDocumentAdmin(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Hard-delete in DB for admin
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    // Delete from R2
    try {
      await this.r2Storage.deleteFile(document.r2Key);
    } catch (err) {
      this.logger.warn(`Failed to delete R2 file ${document.r2Key}: ${(err as Error).message}`);
    }

    await this.auditService.logEvent({
      userId,
      action: 'document.admin_deleted',
      resource: 'document',
      resourceId: documentId,
      metadata: { spaceId: document.spaceId, filename: document.filename },
      severity: 'high',
    });
  }

  async updateCsvMapping(
    spaceId: string,
    userId: string,
    documentId: string,
    dto: UpdateCsvMappingDto
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.contentType !== 'text/csv') {
      throw new BadRequestException('CSV mapping can only be set on CSV documents');
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        csvMapping: dto as unknown as Prisma.InputJsonValue,
      },
    });
  }
}