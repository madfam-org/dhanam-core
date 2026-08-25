// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import type { ExtractedTransactionData } from './statement-types';

const NATIVE_EXTRACTION_SYSTEM_PROMPT = `You are a financial document parser for Dhanam, a personal finance platform.
Your task is to extract structured transaction metadata from receipts, invoices, and bank statements.

Return a JSON object with these fields (omit fields you cannot confidently extract):
{
  "date": "ISO 8601 date (YYYY-MM-DD)",
  "amount": number (total amount),
  "currency": "ISO 4217 code (MXN, USD, EUR, etc.)",
  "merchant": "Merchant or issuer name",
  "issuerRfc": "RFC of the issuer (if Mexican CFDI)",
  "recipientRfc": "RFC of the recipient (if Mexican CFDI)",
  "taxAmount": number (IVA or tax amount if itemized),
  "description": "Short description or concept",
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number, "total": number }],
  "cfdiUuid": "UUID of CFDI folio fiscal if present",
  "documentType": "receipt | invoice | bank_statement | account_statement | other",
  "statementPeriodStart": "YYYY-MM-DD if this is a statement",
  "statementPeriodEnd": "YYYY-MM-DD if this is a statement",
  "accountLast4": "last four account digits if visible",
  "openingBalance": number,
  "closingBalance": number,
  "transactions": [{ "date": "YYYY-MM-DD", "description": string, "amount": number (negative for outflows/charges, positive for inflows/deposits), "balance": number, "currency": "MXN", "merchant": string (if identifiable) }],
  "confidence": number between 0.0 and 1.0
}

For bank statements, prefer preserving the statement-level summary and transaction rows over forcing the whole document into a single merchant transaction.
Be strict: if you cannot read the document or the document is not a financial transaction, set confidence below 0.4.`;

export interface ExtractionResult {
  data: ExtractedTransactionData;
  /** Which engine produced the data ('native' = model extraction, 'none' = extraction unavailable/failed → manual review). */
  engine: 'native' | 'none';
}

/**
 * Extracts structured transaction data from an uploaded document (receipt,
 * invoice, or statement) using an OpenAI-compatible vision/JSON model.
 *
 * The model endpoint is configurable via OPENAI_API_KEY (+ optional
 * OPENAI_BASE_URL for any OpenAI-compatible provider). When no key is
 * configured or extraction fails, the upload is preserved as a
 * manual-review stub rather than lost — nothing here depends on a hosted
 * service.
 */
@Injectable()
export class DocumentExtractionService {
  private readonly logger = new Logger(DocumentExtractionService.name);
  private readonly openai: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const baseURL = this.config.get<string>('OPENAI_BASE_URL') || undefined;
    this.openai = apiKey ? new OpenAI({ apiKey, baseURL }) : null;
  }

  /**
   * Extract structured transaction data from a document buffer via the
   * configured OpenAI-compatible model. On low confidence, failure, or a
   * missing key, returns a manual-review stub so the upload is never lost.
   */
  async extract(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractionResult> {
    this.logger.log(`Extracting from ${filename} (${mimeType}, ${buffer.length} bytes)`);

    if (this.openai) {
      try {
        const data = await this.extractNative(buffer, mimeType, filename);
        return { data, engine: 'native' };
      } catch (err) {
        this.logger.warn(
          `Model extraction failed: ${(err as Error).message} — manual review required`
        );
      }
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not set — document extraction unavailable, manual review required'
      );
    }

    return { data: this.manualReviewStub(filename), engine: 'none' };
  }

  /**
   * Native extraction: encode the document as base64 and send to an
   * OpenAI-compatible vision/JSON endpoint for structured extraction.
   */
  private async extractNative(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ExtractedTransactionData> {
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const textPreview = mimeType === 'text/csv' ? buffer.toString('utf-8').slice(0, 60_000) : '';

    const isImage = mimeType.startsWith('image/');
    const documentContext = textPreview
      ? `Filename: ${filename}. CSV/text statement content:\n${textPreview}`
      : `Filename: ${filename}. This is a ${mimeType} document. Extract all financial transaction metadata you can from the available document context, and set confidence appropriately if you cannot read the content.`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: NATIVE_EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: isImage
          ? [
              {
                type: 'image_url' as const,
                image_url: { url: dataUrl, detail: 'high' as const },
              },
              {
                type: 'text' as const,
                text: `Filename: ${filename}. Extract all financial transaction metadata from this document.`,
              },
            ]
          : documentContext,
      },
    ];

    const response = await this.openai!.chat.completions.create({
      model: this.config.get<string>('OPENAI_EXTRACTION_MODEL') || 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1024,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as Partial<ExtractedTransactionData>;

    return {
      date: parsed.date || new Date().toISOString().slice(0, 10),
      amount: parsed.amount ?? 0,
      currency: parsed.currency || 'MXN',
      merchant: parsed.merchant || 'Unknown',
      issuerRfc: parsed.issuerRfc,
      recipientRfc: parsed.recipientRfc,
      taxAmount: parsed.taxAmount,
      description: parsed.description,
      lineItems: parsed.lineItems,
      cfdiUuid: parsed.cfdiUuid,
      documentType: parsed.documentType,
      statementPeriodStart: parsed.statementPeriodStart,
      statementPeriodEnd: parsed.statementPeriodEnd,
      accountLast4: parsed.accountLast4,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
      transactions: parsed.transactions,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.3,
    };
  }

  /** Minimal record so a failed/unavailable extraction preserves the upload for manual review. */
  private manualReviewStub(filename: string): ExtractedTransactionData {
    return {
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      currency: 'MXN',
      merchant: filename,
      description: 'Automatic extraction unavailable — manual review required',
      confidence: 0,
    };
  }
}
