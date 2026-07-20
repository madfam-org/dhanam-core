// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as _getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * AWS SDK v3 versions ship `S3Client` (from `@aws-sdk/client-s3`) and the
 * generic `Client<...>` shape that `getSignedUrl` declares as its first arg
 * in `@aws-sdk/s3-request-presigner`. They're structurally identical at
 * runtime but TypeScript treats them as separate nominal types because the
 * presigner's `ServiceInputTypes` is a Service-specific union that doesn't
 * narrow against the concrete S3 client.
 *
 * `_getSignedUrl as Function` discards the over-specific declared signature.
 * The wrapper exposes the runtime contract: `(client, command, options) =>
 * Promise<string>`, which is what every call site actually relies on.
 */
const getSignedUrl: (
  client: unknown,
  command: unknown,
  options?: { expiresIn?: number }
) => Promise<string> = _getSignedUrl as unknown as (
  client: unknown,
  command: unknown,
  options?: { expiresIn?: number }
) => Promise<string>;

export interface UploadedDocument {
  key: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedAt: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
  ]);

  // Magic bytes for common file types
  private static readonly MAGIC_BYTES: Record<string, number[]> = {
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/gif': [0x47, 0x49, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const explicitEndpoint = this.configService.get<string>('R2_ENDPOINT');
    let accountId = this.configService.get<string>('R2_ACCOUNT_ID');

    // Cloudflare R2 endpoints are always https://<accountId>.r2.cloudflarestorage.com.
    // Some deployments provision only R2_ENDPOINT (e.g. a shared Vault secret
    // that doesn't carry a separate account id) — derive the account id from
    // it so the public-URL fallback below still works without R2_ACCOUNT_ID.
    if (!accountId && explicitEndpoint) {
      accountId = explicitEndpoint.match(/^https?:\/\/([^./]+)\.r2\.cloudflarestorage\.com/i)?.[1];
    }

    // An explicit R2_ENDPOINT always wins over the accountId-derived default.
    const endpoint =
      explicitEndpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'dhanam-documents';
    this.publicUrl =
      this.configService.get<string>('R2_PUBLIC_URL') ||
      (accountId ? `https://${this.bucket}.${accountId}.r2.cloudflarestorage.com` : '');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('R2 Storage initialized');
    } else {
      this.logger.warn('R2 Storage not configured - document uploads will be disabled');
    }
  }

  /**
   * Check if R2 storage is configured and available
   */
  isAvailable(): boolean {
    return this.s3Client !== null;
  }

  /**
   * Validate file before upload (SOC 2 file upload controls)
   */
  validateUpload(buffer: Buffer, contentType: string, filename: string): void {
    // Size check
    if (buffer.length > R2StorageService.MAX_FILE_SIZE) {
      throw new Error(
        `File exceeds maximum size of ${R2StorageService.MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // MIME type check
    if (!R2StorageService.ALLOWED_MIME_TYPES.has(contentType)) {
      throw new Error(`File type '${contentType}' is not allowed`);
    }

    // Extension check
    const ext = filename.split('.').pop()?.toLowerCase();
    const allowedExtensions = new Set([
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'pdf',
      'csv',
      'xlsx',
      'xls',
    ]);
    if (!ext || !allowedExtensions.has(ext)) {
      throw new Error(`File extension '.${ext}' is not allowed`);
    }

    // Magic bytes check for binary formats
    const expectedMagic = R2StorageService.MAGIC_BYTES[contentType];
    if (expectedMagic) {
      const fileHeader = Array.from(buffer.subarray(0, expectedMagic.length));
      const matches = expectedMagic.every((byte, i) => fileHeader[i] === byte);
      if (!matches) {
        throw new Error('File content does not match declared content type');
      }
    }
  }

  /**
   * Generate a presigned URL for direct browser upload
   */
  async getPresignedUploadUrl(
    spaceId: string,
    assetId: string,
    filename: string,
    contentType: string,
    category: string = 'general'
  ): Promise<PresignedUrlResult> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    if (!R2StorageService.ALLOWED_MIME_TYPES.has(contentType)) {
      throw new Error(`File type '${contentType}' is not allowed`);
    }

    const extension = filename.split('.').pop() || '';
    const key = `spaces/${spaceId}/assets/${assetId}/${category}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'space-id': spaceId,
        'asset-id': assetId,
        category,
      },
    });

    const expiresIn = 3600; // 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      uploadUrl,
      key,
      expiresAt,
    };
  }

  /**
   * Generate a presigned URL for downloading a document
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Upload a file directly (for server-side uploads)
   */
  async uploadFile(
    spaceId: string,
    assetId: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
    category: string = 'general'
  ): Promise<UploadedDocument> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    this.validateUpload(buffer, contentType, filename);

    const extension = filename.split('.').pop() || '';
    const key = `spaces/${spaceId}/assets/${assetId}/${category}/${uuidv4()}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          'original-filename': filename,
          'space-id': spaceId,
          'asset-id': assetId,
          category,
        },
      })
    );

    const url = `${this.publicUrl}/${key}`;

    return {
      key,
      url,
      filename,
      fileType: contentType,
      fileSize: buffer.length,
      category,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    this.logger.log(`Deleted file: ${key}`);
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the public URL for a file (if bucket has public access)
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Generate a presigned URL for direct browser upload (standalone documents, no asset required)
   */
  async getPresignedUploadUrlGeneric(
    spaceId: string,
    filename: string,
    contentType: string,
    category: string = 'general',
    metadata?: Record<string, string>
  ): Promise<PresignedUrlResult> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    if (!R2StorageService.ALLOWED_MIME_TYPES.has(contentType)) {
      throw new Error(`File type '${contentType}' is not allowed`);
    }

    const extension = filename.split('.').pop() || '';
    const key = `spaces/${spaceId}/documents/${category}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'original-filename': filename,
        'space-id': spaceId,
        category,
        ...metadata,
      },
    });

    const expiresIn = 3600; // 1 hour
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      uploadUrl,
      key,
      expiresAt,
    };
  }

  /**
   * Get the file size of an object in R2 via HeadObject
   */
  async getFileSize(key: string): Promise<number | null> {
    if (!this.s3Client) {
      return null;
    }

    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return response.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Download a file from R2 as a Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('R2 Storage is not configured');
    }

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    const stream = response.Body;
    if (!stream) {
      throw new Error('Empty response body from R2');
    }

    // Convert readable stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}