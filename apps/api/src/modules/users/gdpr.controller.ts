// SPDX-License-Identifier: AGPL-3.0-or-later
import * as zlib from 'zlib';

import {
  Controller,
  Get,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { AuditService } from '@core/audit/audit.service';
import { CurrentUser, AuthenticatedUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';

@ApiTags('GDPR')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all user data (GDPR)' })
  @ApiResponse({ status: 200, description: 'User data archive' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv', 'zip'],
    description: 'Export format: json (default), csv, or zip',
  })
  async exportUserData(
    @CurrentUser() user: AuthenticatedUser,
    @Query('format') format?: 'json' | 'csv' | 'zip',
    @Res({ passthrough: true }) res?: Response
  ) {
    const exportFormat = format || 'json';

    if (!['json', 'csv', 'zip'].includes(exportFormat)) {
      throw new BadRequestException('Invalid format. Must be one of: json, csv, zip');
    }

    const userId = user.userId;

    const [userData, spaces, accounts, transactions, auditLogs, preferences] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          locale: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          onboardingCompleted: true,
        },
      }),
      this.prisma.userSpace.findMany({
        where: { userId },
        include: { space: true },
      }),
      this.prisma.account.findMany({
        where: { space: { userSpaces: { some: { userId } } } },
        select: {
          id: true,
          name: true,
          type: true,
          provider: true,
          currency: true,
          balance: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { account: { space: { userSpaces: { some: { userId } } } } },
        select: {
          id: true,
          amount: true,
          currency: true,
          description: true,
          merchant: true,
          date: true,
          createdAt: true,
        },
        take: 10000, // Limit for performance
      }),
      this.auditService.exportUserAuditLogs(userId),
      this.prisma.userPreferences.findUnique({ where: { userId } }),
    ]);

    await this.auditService.logEvent({
      action: 'GDPR_DATA_EXPORT',
      resource: 'user',
      resourceId: userId,
      userId,
      severity: 'high',
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData,
      spaces: spaces.map((us) => ({
        id: us.space.id,
        name: us.space.name,
        type: us.space.type,
        role: us.role,
      })),
      accounts,
      transactions,
      auditLogs,
      preferences,
    };

    if (exportFormat === 'csv') {
      const csvContent = this.buildGdprCsv(exportData);

      res?.setHeader('Content-Type', 'text/csv');
      res?.setHeader('Content-Disposition', 'attachment; filename="dhanam-gdpr-export.csv"');
      return csvContent;
    }

    if (exportFormat === 'zip') {
      const zipBuffer = await this.buildGdprZip(exportData);

      res?.setHeader('Content-Type', 'application/zip');
      res?.setHeader('Content-Disposition', 'attachment; filename="dhanam-gdpr-export.zip"');
      return zipBuffer;
    }

    // Default: json
    return exportData;
  }

  /**
   * Build CSV representation of GDPR export data
   */
  private buildGdprCsv(data: Record<string, any>): string {
    const sections: string[] = [];

    // User section
    if (data.user) {
      sections.push('# User Data');
      sections.push(Object.keys(data.user).join(','));
      sections.push(
        Object.values(data.user)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
    }

    // Spaces section
    if (data.spaces?.length > 0) {
      sections.push('');
      sections.push('# Spaces');
      sections.push(Object.keys(data.spaces[0]).join(','));
      for (const space of data.spaces) {
        sections.push(
          Object.values(space)
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',')
        );
      }
    }

    // Accounts section
    if (data.accounts?.length > 0) {
      sections.push('');
      sections.push('# Accounts');
      sections.push(Object.keys(data.accounts[0]).join(','));
      for (const account of data.accounts) {
        sections.push(
          Object.values(account)
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',')
        );
      }
    }

    // Transactions section
    if (data.transactions?.length > 0) {
      sections.push('');
      sections.push('# Transactions');
      sections.push(Object.keys(data.transactions[0]).join(','));
      for (const txn of data.transactions) {
        sections.push(
          Object.values(txn)
            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
            .join(',')
        );
      }
    }

    return sections.join('\n');
  }

  /**
   * Build ZIP archive containing individual CSVs for each data category
   * Uses a minimal ZIP implementation with Node's built-in zlib
   */
  private async buildGdprZip(data: Record<string, any>): Promise<Buffer> {
    const files: Array<{ name: string; content: Buffer }> = [];

    // User data CSV
    if (data.user) {
      const header = Object.keys(data.user).join(',');
      const row = Object.values(data.user)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',');
      files.push({ name: 'user.csv', content: Buffer.from(`${header}\n${row}`) });
    }

    // Accounts CSV
    if (data.accounts?.length > 0) {
      const header = Object.keys(data.accounts[0]).join(',');
      const rows = data.accounts.map((a: Record<string, any>) =>
        Object.values(a)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
      files.push({ name: 'accounts.csv', content: Buffer.from(`${header}\n${rows.join('\n')}`) });
    }

    // Transactions CSV
    if (data.transactions?.length > 0) {
      const header = Object.keys(data.transactions[0]).join(',');
      const rows = data.transactions.map((t: Record<string, any>) =>
        Object.values(t)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
      files.push({
        name: 'transactions.csv',
        content: Buffer.from(`${header}\n${rows.join('\n')}`),
      });
    }

    // Spaces CSV
    if (data.spaces?.length > 0) {
      const header = Object.keys(data.spaces[0]).join(',');
      const rows = data.spaces.map((s: Record<string, any>) =>
        Object.values(s)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      );
      files.push({ name: 'spaces.csv', content: Buffer.from(`${header}\n${rows.join('\n')}`) });
    }

    // Budgets/preferences as JSON
    if (data.preferences) {
      files.push({
        name: 'preferences.json',
        content: Buffer.from(JSON.stringify(data.preferences, null, 2)),
      });
    }

    // Audit logs as JSON
    if (data.auditLogs?.length > 0) {
      files.push({
        name: 'audit-logs.json',
        content: Buffer.from(JSON.stringify(data.auditLogs, null, 2)),
      });
    }

    return this.createZipArchive(files);
  }

  /**
   * Minimal ZIP archive builder using Node's built-in zlib.
   * Creates a valid ZIP file without external dependencies.
   */
  private async createZipArchive(files: Array<{ name: string; content: Buffer }>): Promise<Buffer> {
    const localFileHeaders: Buffer[] = [];
    const centralDirectoryEntries: Buffer[] = [];
    let offset = 0;

    for (const file of files) {
      const compressedContent = await new Promise<Buffer>((resolve, reject) => {
        zlib.deflateRaw(file.content, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const nameBuffer = Buffer.from(file.name, 'utf-8');
      const crc = this.crc32(file.content);

      // Local file header
      const localHeader = Buffer.alloc(30 + nameBuffer.length);
      localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
      localHeader.writeUInt16LE(20, 4); // Version needed to extract
      localHeader.writeUInt16LE(0, 6); // General purpose bit flag
      localHeader.writeUInt16LE(8, 8); // Compression method (deflate)
      localHeader.writeUInt16LE(0, 10); // Last mod file time
      localHeader.writeUInt16LE(0, 12); // Last mod file date
      localHeader.writeUInt32LE(crc, 14); // CRC-32
      localHeader.writeUInt32LE(compressedContent.length, 18); // Compressed size
      localHeader.writeUInt32LE(file.content.length, 22); // Uncompressed size
      localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
      localHeader.writeUInt16LE(0, 28); // Extra field length
      nameBuffer.copy(localHeader, 30);

      localFileHeaders.push(localHeader, compressedContent);

      // Central directory entry
      const centralEntry = Buffer.alloc(46 + nameBuffer.length);
      centralEntry.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
      centralEntry.writeUInt16LE(20, 4); // Version made by
      centralEntry.writeUInt16LE(20, 6); // Version needed to extract
      centralEntry.writeUInt16LE(0, 8); // General purpose bit flag
      centralEntry.writeUInt16LE(8, 10); // Compression method (deflate)
      centralEntry.writeUInt16LE(0, 12); // Last mod file time
      centralEntry.writeUInt16LE(0, 14); // Last mod file date
      centralEntry.writeUInt32LE(crc, 16); // CRC-32
      centralEntry.writeUInt32LE(compressedContent.length, 20); // Compressed size
      centralEntry.writeUInt32LE(file.content.length, 24); // Uncompressed size
      centralEntry.writeUInt16LE(nameBuffer.length, 28); // File name length
      centralEntry.writeUInt16LE(0, 30); // Extra field length
      centralEntry.writeUInt16LE(0, 32); // File comment length
      centralEntry.writeUInt16LE(0, 34); // Disk number start
      centralEntry.writeUInt16LE(0, 36); // Internal file attributes
      centralEntry.writeUInt32LE(0, 38); // External file attributes
      centralEntry.writeUInt32LE(offset, 42); // Relative offset of local header
      nameBuffer.copy(centralEntry, 46);

      centralDirectoryEntries.push(centralEntry);
      offset += localHeader.length + compressedContent.length;
    }

    // End of central directory record
    const centralDirSize = centralDirectoryEntries.reduce((sum, e) => sum + e.length, 0);
    const endOfCentralDir = Buffer.alloc(22);
    endOfCentralDir.writeUInt32LE(0x06054b50, 0); // End of central directory signature
    endOfCentralDir.writeUInt16LE(0, 4); // Number of this disk
    endOfCentralDir.writeUInt16LE(0, 6); // Disk where central directory starts
    endOfCentralDir.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
    endOfCentralDir.writeUInt16LE(files.length, 10); // Total number of central directory records
    endOfCentralDir.writeUInt32LE(centralDirSize, 12); // Size of central directory
    endOfCentralDir.writeUInt32LE(offset, 16); // Offset of start of central directory
    endOfCentralDir.writeUInt16LE(0, 20); // Comment length

    return Buffer.concat([...localFileHeaders, ...centralDirectoryEntries, endOfCentralDir]);
  }

  /**
   * CRC-32 calculation for ZIP file entries
   */
  private crc32(buf: Buffer): number {
    const table = GdprController.getCrc32Table();
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private static crc32Table: number[] | null = null;

  private static getCrc32Table(): number[] {
    if (GdprController.crc32Table) return GdprController.crc32Table;

    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
      }
      table.push(crc >>> 0);
    }
    GdprController.crc32Table = table;
    return table;
  }

  @Delete('erasure')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request account deletion (GDPR right to erasure)' })
  @ApiResponse({ status: 202, description: 'Deletion scheduled (30-day waiting period)' })
  async requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    const userId = user.userId;

    // Soft delete: set deletedAt, account will be purged after 30 days
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.auditService.logEvent({
      action: 'GDPR_DELETION_REQUESTED',
      resource: 'user',
      resourceId: userId,
      userId,
      severity: 'critical',
    });

    return {
      message:
        'Account deletion scheduled. Your account will be permanently deleted after 30 days. Contact support to cancel.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
