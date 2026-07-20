import { Currency } from '@dhanam-core/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Locale-aware currency formatter.
 * Reads locale from document.documentElement.lang (set by I18nProvider).
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (amount == null || isNaN(amount)) return '\u2014';
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  const locale = lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Locale-aware currency symbol extractor.
 * Returns the symbol for a given currency (e.g. "$" for MXN/USD, "€" for EUR).
 */
export function getCurrencySymbol(currency: Currency): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  const locale = lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
  return (
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '$'
  );
}

/**
 * Resolve the user's locale from the document lang attribute.
 */
function resolveLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang.startsWith('pt') ? 'pt-BR' : lang.startsWith('en') ? 'en-US' : 'es-MX';
}

/**
 * Normalize a date input (Date object, ISO string, or YYYY-MM-DD) into a Date.
 */
function toDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  // Handle YYYY-MM-DD strings by appending time to avoid timezone offset issues
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(date + 'T00:00:00');
  }
  return new Date(date);
}

/**
 * Locale-aware date formatter.
 * Handles Date objects, ISO strings, and YYYY-MM-DD strings.
 */
export function formatDate(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(resolveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Locale-aware short date formatter for compact displays.
 * Outputs e.g. "Apr 15" instead of "Apr 15, 2026".
 */
export function formatDateShort(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(resolveLocale(), {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Locale-aware date+time formatter.
 */
export function formatDateTime(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat(resolveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
