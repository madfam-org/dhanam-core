// SPDX-License-Identifier: AGPL-3.0-or-later
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse';

import { AuditService } from '@core/audit/audit.service';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  buildStatementTransactionId,
  normalizeStatementDate,
  parseStatementAmount,
  SUPPORTED_STATEMENT_CURRENCIES,
} from '@core/utils/statement-import.util';
import { DocumentStatus, Prisma } from '@db';
import type { Currency } from '@db';

import { SpacesService } from '../spaces/spaces.service';
import { R2StorageService } from '../storage/r2.service';

import { CsvPreviewService } from './csv-preview.service';
import { ImportCsvTransactionsDto } from './dto';

export interface CsvImportResult {
  documentId: string;
  accountId: string;
  created: number;
  skipped: number;
  errors: number;
}

/** Shape persisted by PATCH :id/csv-mapping (UpdateCsvMappingDto stored verbatim). */
interface StoredCsvMapping {
  /** { csvColumn: dhanamField } */
  mapping?: Record<string, string>;
  dateFormat?: string;
  delimiter?: string;
}

/**
 * Deterministic executor for the stored CSV column mapping: parses the full
 * CSV from R2 and creates deduplicated Transaction rows — no LLM involved.
 *
 * Sign convention matches existing providers (Belvo INFLOW → positive,
 * OUTFLOW → negative): a single mapped `amount` column is stored signed as-is;
 * separate debit/credit (Cargo/Abono) columns resolve to credit − |debit|.
 */
@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private r2Storage: R2StorageService,
    private csvPreviewService: CsvPreviewService,
    private auditService: AuditService
  ) {}

  async importTransactions(
    spaceId: string,
    userId: string,
    documentId: string,
    dto: ImportCsvTransactionsDto
  ): Promise<CsvImportResult> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, spaceId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.contentType !== 'text/csv') {
      throw new BadRequestException('Transaction import is only supported for CSV documents');
    }
    if (document.status === DocumentStatus.pending_upload) {
      throw new BadRequestException(
        'Document file was never uploaded — complete the upload before importing transactions'
      );
    }

    const stored = document.csvMapping as StoredCsvMapping | null;
    if (!stored?.mapping || Object.keys(stored.mapping).length === 0) {
      throw new BadRequestException(
        'Document has no CSV column mapping — save a mapping via PATCH csv-mapping first'
      );
    }

    const accountId = dto.accountId ?? document.accountId;
    if (!accountId) {
      throw new BadRequestException(
        'An accountId is required (in the request body or on the document)'
      );
    }
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, spaceId, deletedAt: null },
    });
    if (!account) {
      throw new BadRequestException('Account not found or does not belong to this space');
    }

    // Invert { csvColumn: dhanamField } → field-to-column lookup
    const fieldToColumn = new Map<string, string>();
    for (const [column, field] of Object.entries(stored.mapping)) {
      fieldToColumn.set(field, column);
    }
    const dateColumn = fieldToColumn.get('date');
    const descriptionColumn = fieldToColumn.get('description');
    const amountColumn = fieldToColumn.get('amount');
    const debitColumn = fieldToColumn.get('debit');
    const creditColumn = fieldToColumn.get('credit');
    const currencyColumn = fieldToColumn.get('currency');
    const merchantColumn = fieldToColumn.get('merchant');

    if (!dateColumn || !descriptionColumn || (!amountColumn && !debitColumn && !creditColumn)) {
      throw new BadRequestException(
        'CSV mapping must map date, description, and amount (or debit/credit) columns'
      );
    }

    const buffer = await this.r2Storage.downloadFile(document.r2Key);
    const content = buffer.toString('utf-8');
    const delimiter = stored.delimiter || this.csvPreviewService.detectDelimiter(content);
    const records = await this.parseCsv(content, delimiter);

    let errors = 0;
    const rows: Prisma.TransactionCreateManyInput[] = [];
    for (const record of records) {
      const isoDate = normalizeStatementDate(record[dateColumn], stored.dateFormat);
      const amount = this.resolveAmount(record, amountColumn, debitColumn, creditColumn);
      const description = (record[descriptionColumn] ?? '').trim();
      if (!isoDate || amount === null || !description) {
        errors++;
        continue;
      }

      const currencyRaw = currencyColumn ? record[currencyColumn]?.trim().toUpperCase() : undefined;
      const currency =
        currencyRaw && SUPPORTED_STATEMENT_CURRENCIES.has(currencyRaw)
          ? (currencyRaw as Currency)
          : account.currency;

      rows.push({
        accountId: account.id,
        // Same dedup scheme as the LLM statement materializer (buildStatementTransactionId),
        // so the two paths dedup against each other for identical rows
        providerTransactionId: buildStatementTransactionId(
          account.id,
          isoDate,
          amount,
          description
        ),
        amount,
        currency,
        description,
        merchant: merchantColumn ? record[merchantColumn]?.trim() || null : null,
        // Noon UTC avoids day-shift across timezones (same idiom as LM import)
        date: new Date(`${isoDate}T12:00:00Z`),
        pending: false,
        reviewed: false,
        metadata: { source: 'csv-import', documentId: document.id },
      });
    }

    const { count } =
      rows.length > 0
        ? await this.prisma.transaction.createMany({ data: rows, skipDuplicates: true })
        : { count: 0 };
    const skipped = rows.length - count;

    // A run that created nothing while rows failed to parse means the mapping
    // (or the file) is broken — surface that instead of a misleading "ready".
    const fullyFailed = count === 0 && errors > 0;
    await this.prisma.document.update({
      where: { id: document.id },
      data: fullyFailed
        ? {
            status: DocumentStatus.failed,
            errorMessage: `CSV import created 0 transactions: ${errors} unparseable row(s), ${skipped} duplicate(s)`,
          }
        : { status: DocumentStatus.ready, errorMessage: null },
    });

    await this.auditService.logEvent({
      userId,
      action: 'document.csv_imported',
      resource: 'document',
      resourceId: document.id,
      metadata: { spaceId, accountId: account.id, created: count, skipped, errors },
    });

    this.logger.log(
      `CSV import for document ${document.id} → account ${account.id}: created=${count} skipped=${skipped} errors=${errors}`
    );

    return {
      documentId: document.id,
      accountId: account.id,
      created: count,
      skipped,
      errors,
    };
  }

  private resolveAmount(
    record: Record<string, string>,
    amountColumn?: string,
    debitColumn?: string,
    creditColumn?: string
  ): number | null {
    if (amountColumn) {
      return parseStatementAmount(record[amountColumn]);
    }
    const debit = debitColumn ? parseStatementAmount(record[debitColumn]) : null;
    const credit = creditColumn ? parseStatementAmount(record[creditColumn]) : null;
    if (debit === null && credit === null) return null;
    // Cargo (debit) → outflow (negative), Abono (credit) → inflow (positive).
    // abs() tolerates banks that already print charges as negative.
    return (credit ?? 0) - Math.abs(debit ?? 0);
  }

  /** Parse the full CSV into header-keyed records, respecting the detected delimiter. */
  private parseCsv(content: string, delimiter: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const records: Record<string, string>[] = [];
      const parser = parse({
        delimiter,
        columns: true,
        bom: true,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', () => {
        let record: Record<string, string>;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });
      parser.on('error', (err) => {
        this.logger.error(`CSV parse error during import: ${err.message}`);
        reject(new BadRequestException(`Could not parse CSV: ${err.message}`));
      });
      parser.on('end', () => resolve(records));

      parser.write(content);
      parser.end();
    });
  }
}
