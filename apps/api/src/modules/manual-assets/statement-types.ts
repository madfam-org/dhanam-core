// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Structured data extracted from an uploaded financial document (receipt,
 * invoice or account/bank statement) by the document-extraction engine.
 *
 * It lives alongside the document extraction and statement-materialization
 * services that consume it.
 */
export interface ExtractedTransactionData {
  /** ISO 8601 date string of the transaction */
  date: string;
  /** Total amount of the transaction */
  amount: number;
  /** ISO 4217 currency code (e.g. MXN, USD) */
  currency: string;
  /** Merchant / issuer name */
  merchant: string;
  /** RFC / Tax ID of the issuer if present */
  issuerRfc?: string;
  /** RFC / Tax ID of the recipient if present */
  recipientRfc?: string;
  /** Tax amount (IVA etc.) if itemized */
  taxAmount?: number;
  /** Description or concept */
  description?: string;
  /** Raw line items if available */
  lineItems?: Array<{ description: string; quantity?: number; unitPrice?: number; total: number }>;
  /** CFDI UUID if this was a CFDI invoice */
  cfdiUuid?: string;
  /** High-level document class for downstream review queues */
  documentType?: 'receipt' | 'invoice' | 'bank_statement' | 'account_statement' | 'other';
  /** Statement period start, when available */
  statementPeriodStart?: string;
  /** Statement period end, when available */
  statementPeriodEnd?: string;
  /** Masked account identifier, when available */
  accountLast4?: string;
  /** Statement opening balance */
  openingBalance?: number;
  /** Statement closing balance */
  closingBalance?: number;
  /** Extracted statement transaction rows, when available */
  transactions?: Array<{
    date: string;
    description: string;
    amount: number;
    balance?: number;
    currency?: string;
    merchant?: string;
  }>;
  /** Confidence score 0-1 from the extraction engine */
  confidence: number;
}
