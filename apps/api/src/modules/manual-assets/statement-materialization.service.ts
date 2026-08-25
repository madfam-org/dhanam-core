// SPDX-License-Identifier: AGPL-3.0-or-later
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@core/prisma/prisma.service';
import {
  buildStatementTransactionId,
  normalizeStatementDate,
  SUPPORTED_STATEMENT_CURRENCIES,
} from '@core/utils/statement-import.util';
import type { Account, Currency, Prisma } from '@db';

import type { ExtractedTransactionData } from './statement-types';

export interface StatementMaterializationResult {
  accountId: string;
  createdCount: number;
  skippedDuplicates: number;
}

type StatementRow = NonNullable<ExtractedTransactionData['transactions']>[number];

/**
 * Materializes LLM-extracted statement rows into Transaction records.
 *
 * Sign convention matches existing providers (Belvo INFLOW → positive,
 * OUTFLOW → negative): extracted amounts are stored as-is, signed.
 * Dedup is idempotent via the (accountId, providerTransactionId) unique
 * constraint with a deterministic content hash, so re-uploading the same
 * statement creates nothing new.
 */
@Injectable()
export class StatementMaterializationService {
  private readonly logger = new Logger(StatementMaterializationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Validate the target account belongs to the space, failing fast otherwise. */
  async resolveAccount(spaceId: string, accountId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, spaceId, deletedAt: null },
    });
    if (!account) {
      throw new BadRequestException('Account not found or does not belong to this space');
    }
    return account;
  }

  async materialize(params: {
    account: Pick<Account, 'id' | 'currency'>;
    transactions: StatementRow[];
    importRecordId: string;
    confidence: number;
  }): Promise<StatementMaterializationResult> {
    const { account, transactions, importRecordId, confidence } = params;

    const rows: Prisma.TransactionCreateManyInput[] = [];
    for (const tx of transactions) {
      const isoDate = normalizeStatementDate(tx.date);
      if (!isoDate || typeof tx.amount !== 'number' || !Number.isFinite(tx.amount)) {
        this.logger.warn(
          `Skipping unusable extracted row (date=${tx.date}, amount=${tx.amount}) for record ${importRecordId}`
        );
        continue;
      }
      const description = (tx.description || '').trim() || 'Statement transaction';
      const currency =
        tx.currency && SUPPORTED_STATEMENT_CURRENCIES.has(tx.currency.toUpperCase())
          ? (tx.currency.toUpperCase() as Currency)
          : account.currency;

      rows.push({
        accountId: account.id,
        providerTransactionId: buildStatementTransactionId(
          account.id,
          isoDate,
          tx.amount,
          description
        ),
        amount: tx.amount,
        currency,
        description,
        merchant: tx.merchant?.trim() || null,
        // Noon UTC avoids day-shift across timezones (same idiom as LM import)
        date: new Date(`${isoDate}T12:00:00Z`),
        pending: false,
        reviewed: false,
        metadata: { source: 'statement-ingest', importRecordId, confidence },
      });
    }

    if (rows.length === 0) {
      return { accountId: account.id, createdCount: 0, skippedDuplicates: 0 };
    }

    // skipDuplicates leans on the (accountId, providerTransactionId) unique
    // constraint — re-runs and intra-batch repeats insert nothing.
    const { count } = await this.prisma.transaction.createMany({
      data: rows,
      skipDuplicates: true,
    });

    this.logger.log(
      `Materialized ${count}/${rows.length} statement transactions for account ${account.id} (record ${importRecordId})`
    );

    return {
      accountId: account.id,
      createdCount: count,
      skippedDuplicates: rows.length - count,
    };
  }
}
