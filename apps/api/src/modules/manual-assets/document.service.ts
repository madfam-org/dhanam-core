// SPDX-License-Identifier: AGPL-3.0-or-later
import { STORAGE_LIMITS } from '@dhanam-core/shared';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { R2StorageService, PresignedUrlResult } from '../storage/r2.service';

export interface DocumentMetadata {
  key: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  category: string;
  uploadedAt: string;
}

export interface ConfirmUploadDto {
  key: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category?: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = STORAGE_LIMITS.MAX_FILE_SIZE_BYTES;

const DOCUMENT_CATEGORIES = [
  'deed',
  'title',
  'appraisal',
  'insurance',
  'contract',
  'receipt',
  'statement',
  'certificate',
  'photo',
  'general',
];

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private r2Storage: R2StorageService
  ) {}

  /**
   * Check if document storage is available
   */
  isStorageAvailable(): boolean {
    return this.r2Storage.isAvailable();
  }

  /**
   * Get a presigned URL for uploading a document
   */
  async getUploadUrl(
    spaceId: string,
    userId: string,
    assetId: string,
    filename: string,
    contentType: string,
    category: string = 'general'
  ): Promise<PresignedUrlResult> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify asset exists
    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(contentType)) {
      throw new BadRequestException(
        `File type ${contentType} is not allowed. Allowed types: PDF, images, Office documents, CSV`
      );
    }

    // Validate category
    if (!DOCUMENT_CATEGORIES.includes(category)) {
      throw new BadRequestException(
        `Invalid category. Allowed categories: ${DOCUMENT_CATEGORIES.join(', ')}`
      );
    }

    return this.r2Storage.getPresignedUploadUrl(spaceId, assetId, filename, contentType, category);
  }

  /**
   * Confirm upload completion and add document to asset
   */
  async confirmUpload(
    spaceId: string,
    userId: string,
    assetId: string,
    dto: ConfirmUploadDto
  ): Promise<DocumentMetadata> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Validate file size
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Verify the file was actually uploaded
    const fileExists = await this.r2Storage.fileExists(dto.key);
    if (!fileExists) {
      throw new BadRequestException('File was not uploaded successfully');
    }

    const newDocument: DocumentMetadata = {
      key: dto.key,
      url: this.r2Storage.getPublicUrl(dto.key),
      filename: dto.filename,
      fileType: dto.fileType,
      fileSize: dto.fileSize,
      category: dto.category || 'general',
      uploadedAt: new Date().toISOString(),
    };

    // Get existing documents and add new one
    const existingDocs = (asset.documents as unknown as unknown as DocumentMetadata[]) || [];
    const updatedDocs = [...existingDocs, newDocument];

    await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: { documents: updatedDocs as any },
    });

    return newDocument;
  }

  /**
   * Get all documents for an asset
   */
  async getDocuments(
    spaceId: string,
    userId: string,
    assetId: string
  ): Promise<DocumentMetadata[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return (asset.documents as unknown as DocumentMetadata[]) || [];
  }

  /**
   * Get a presigned download URL for a document
   */
  async getDownloadUrl(
    spaceId: string,
    userId: string,
    assetId: string,
    documentKey: string
  ): Promise<string> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Verify document belongs to this asset
    const documents = (asset.documents as unknown as DocumentMetadata[]) || [];
    const document = documents.find((d) => d.key === documentKey);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.r2Storage.getPresignedDownloadUrl(documentKey);
  }

  /**
   * Delete a document from an asset
   */
  async deleteDocument(
    spaceId: string,
    userId: string,
    assetId: string,
    documentKey: string
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Find and remove document from list
    const documents = (asset.documents as unknown as DocumentMetadata[]) || [];
    const documentIndex = documents.findIndex((d) => d.key === documentKey);

    if (documentIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    // Delete from R2
    await this.r2Storage.deleteFile(documentKey);

    // Update asset documents
    const updatedDocs = documents.filter((d) => d.key !== documentKey);
    await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: { documents: updatedDocs as any },
    });
  }

  /**
   * Get allowed file types
   */
  getAllowedFileTypes(): string[] {
    return ALLOWED_FILE_TYPES;
  }

  /**
   * Get document categories
   */
  getDocumentCategories(): string[] {
    return DOCUMENT_CATEGORIES;
  }
}
