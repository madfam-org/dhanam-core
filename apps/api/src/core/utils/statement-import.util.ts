// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from 'crypto';

/**
 * Currencies accepted verbatim from statement rows. Shared by both statement
 * import paths (LLM materializer and CSV-mapping executor) so they can never
 * drift apart; anything else falls back to the account currency.
 */
export const SUPPORTED_STATEMENT_CURRENCIES: ReadonlySet<string> = new Set([
  'MXN',
  'USD',
  'EUR',
  'CAD',
]);

/**
 * Deterministic provider transaction ID for statement-derived transactions.
 *
 * Both statement import paths (LLM document extraction and the CSV-mapping
 * executor) share this scheme so re-importing the same statement —
 * through either path — dedups against the (accountId, providerTransactionId)
 * unique constraint. Amount is canonicalized to 2 decimals and the description
 * is whitespace-collapsed/lowercased so trivially different renderings of the
 * same row still collide.
 */
export function buildStatementTransactionId(
  accountId: string,
  isoDate: string,
  amount: number,
  description: string
): string {
  const normalizedDescription = description.trim().replace(/\s+/g, ' ').toLowerCase();
  const digest = createHash('sha256')
    .update(`${accountId}|${isoDate}|${amount.toFixed(2)}|${normalizedDescription}`)
    .digest('hex');
  return `stmt-${digest.slice(0, 16)}`;
}

/**
 * Normalize a statement date string to ISO YYYY-MM-DD, or null when unparseable.
 *
 * When `dateFormat` is provided (e.g. "DD/MM/YYYY" from the stored CSV mapping)
 * tokens are matched positionally. Without a format, ISO dates pass through and
 * ambiguous d/m/y strings default to DD/MM/YYYY (MX bank convention), swapping
 * only when the month slot is impossible (>12).
 */
export function normalizeStatementDate(
  raw: string | null | undefined,
  dateFormat?: string
): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const parts = value.split(/[/\-.]/).map((part) => part.trim());

  if (dateFormat) {
    const formatParts = dateFormat.toUpperCase().split(/[/\-.]/);
    if (formatParts.length === parts.length) {
      let day: number | undefined;
      let month: number | undefined;
      let year: number | undefined;
      formatParts.forEach((token, index) => {
        const num = Number(parts[index]);
        if (token.startsWith('D')) day = num;
        else if (token.startsWith('M')) month = num;
        else if (token.startsWith('Y')) year = num;
      });
      return buildIsoDate(year, month, day);
    }
  }

  // ISO / YYYY-MM-DD (also matches ISO datetime prefixes)
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return buildIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY/MM/DD
    return buildIsoDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
  }

  if (parts.length === 3 && parts[2].length === 4) {
    // DD/MM/YYYY by default (MX banks); swap when the month slot is impossible
    let day = Number(parts[0]);
    let month = Number(parts[1]);
    const year = Number(parts[2]);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    return buildIsoDate(year, month, day);
  }

  return null;
}

/**
 * Parse a statement amount cell into a number, or null when empty/unparseable.
 * Handles currency symbols, thousands separators (both "1,234.56" and
 * "1.234,56"), and accounting-style parentheses negatives.
 *
 * Single-separator values are handled symmetrically for "." and ",":
 * a value matching `\d{1,3}([.,]\d{3})+` is grouped thousands ("1.234" → 1234,
 * "1,234" → 1234, "1.234.567" → 1234567); any other single occurrence is a
 * decimal separator ("1.5" → 1.5, "1234,56" → 1234.56, "1.2345" → 1.2345).
 */
export function parseStatementAmount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  let value = String(raw).trim();
  if (!value) return null;

  let negative = false;
  if (/^\(.*\)$/.test(value)) {
    negative = true;
    value = value.slice(1, -1);
  }

  // Strip currency symbols, codes, and whitespace
  value = value.replace(/[^\d.,\-+]/g, '');
  if (value.startsWith('-')) negative = true;
  value = value.replace(/^[-+]/, '');
  if (!value) return null;

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // European style: 1.234,56
      value = value.replace(/\./g, '').replace(',', '.');
    } else {
      // US/MX style: 1,234.56
      value = value.replace(/,/g, '');
    }
  } else if (lastComma > -1 || lastDot > -1) {
    // Exactly one separator kind present — treat "." and "," symmetrically
    const separator = lastComma > -1 ? ',' : '.';
    if (/^\d{1,3}([.,]\d{3})+$/.test(value)) {
      // Grouped thousands: 1,234 / 1.234 / 1.234.567
      value = value.split(separator).join('');
    } else if (value.indexOf(separator) === value.lastIndexOf(separator)) {
      // Single occurrence outside the grouping shape → decimal separator:
      // 1,5 / 10.23 / 1234,56 / 1.2345 (>=4-digit tail parses as plain float)
      value = value.replace(separator, '.');
    } else {
      // Repeated separators that don't form clean 3-digit groups (e.g. the
      // Indian-style 1,23,456) — strip them all as thousands separators
      value = value.split(separator).join('');
    }
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

function buildIsoDate(year?: number, month?: number, day?: number): string | null {
  if (!year || !month || !day) return null;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Reject impossible calendar dates (e.g. 31/02) via UTC round-trip
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
