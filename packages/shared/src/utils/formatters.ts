/**
 * Formatters
 * Locale-aware formatting for currency, dates, numbers
 * Supports MXN, USD, EUR, BRL, COP, CAD with proper locale formatting
 */

import type { Locale } from '../types';

export type Currency = 'MXN' | 'USD' | 'EUR' | 'BRL' | 'COP' | 'CAD' | 'BTC' | 'ETH';

const FIAT_CURRENCIES = new Set(['MXN', 'USD', 'EUR', 'BRL', 'COP', 'CAD']);

/**
 * Map application locale to BCP-47 Intl locale string
 */
export function toIntlLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    es: 'es-MX',
    en: 'en-US',
    'pt-BR': 'pt-BR',
  };
  return map[locale] || 'es-MX';
}

/**
 * Format currency with locale-specific formatting
 * @example formatCurrency(1234.56, 'MXN', 'es') => "$1,234.56 MXN"
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'MXN',
  locale: Locale = 'es'
): string {
  const localeString = toIntlLocale(locale);

  // Crypto currencies use different formatting
  if (currency === 'BTC' || currency === 'ETH') {
    return (
      new Intl.NumberFormat(localeString, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      }).format(amount) + ` ${currency}`
    );
  }

  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency: FIAT_CURRENCIES.has(currency) ? currency : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date with locale-specific formatting
 * @example formatDate(new Date(), 'es') => "17 de noviembre de 2025"
 */
export function formatDate(
  date: Date | string,
  locale: Locale = 'es',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeString = toIntlLocale(locale);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(localeString, options || defaultOptions).format(dateObj);
}

/**
 * Format date as short format
 * @example formatDateShort(new Date(), 'es') => "17/11/2025"
 */
export function formatDateShort(date: Date | string, locale: Locale = 'es'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeString = toIntlLocale(locale);

  return new Intl.DateTimeFormat(localeString, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Format date and time
 * @example formatDateTime(new Date(), 'es') => "17 de nov. de 2025, 14:30"
 */
export function formatDateTime(date: Date | string, locale: Locale = 'es'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeString = toIntlLocale(locale);

  return new Intl.DateTimeFormat(localeString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago")
 * @example formatRelativeTime(2, 'day', 'es') => "hace 2 días"
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: Locale = 'es'
): string {
  const localeString = toIntlLocale(locale);

  return new Intl.RelativeTimeFormat(localeString, {
    numeric: 'auto',
  }).format(value, unit);
}

/**
 * Format number with locale-specific formatting
 * @example formatNumber(1234567.89, 'es') => "1,234,567.89"
 */
export function formatNumber(
  value: number,
  locale: Locale = 'es',
  options?: Intl.NumberFormatOptions
): string {
  const localeString = toIntlLocale(locale);

  return new Intl.NumberFormat(localeString, options).format(value);
}

/**
 * Format percentage
 * @example formatPercentage(0.1234, 'es') => "12.34%"
 */
export function formatPercentage(
  value: number,
  locale: Locale = 'es',
  decimals: number = 2
): string {
  const localeString = toIntlLocale(locale);

  return new Intl.NumberFormat(localeString, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format compact number (e.g., 1.2K, 3.4M)
 * @example formatCompactNumber(1234567, 'es') => "1.2 M"
 */
export function formatCompactNumber(value: number, locale: Locale = 'es'): string {
  const localeString = toIntlLocale(locale);

  return new Intl.NumberFormat(localeString, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Format timespan (e.g., "2h 30m")
 */
export function formatTimespan(seconds: number, _locale: Locale = 'es'): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format file size
 * @example formatFileSize(1536, 'es') => "1.5 KB"
 */
export function formatFileSize(bytes: number, locale: Locale = 'es'): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatNumber(size, locale, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
}

/**
 * Parse formatted currency string to number
 * @example parseCurrency("$1,234.56") => 1234.56
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol
 * @example getCurrencySymbol('MXN', 'es') => "$"
 */
export function getCurrencySymbol(currency: Currency, locale: Locale = 'es'): string {
  const localeString = toIntlLocale(locale);

  if (currency === 'BTC' || currency === 'ETH') {
    return currency;
  }

  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency: FIAT_CURRENCIES.has(currency) ? currency : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, '')
    .trim();
}

/**
 * Format transaction amount with sign
 * @example formatTransactionAmount(-150, 'MXN', 'es') => "-$150.00 MXN"
 */
export function formatTransactionAmount(
  amount: number,
  currency: Currency = 'MXN',
  locale: Locale = 'es'
): string {
  const sign = amount >= 0 ? '+' : '';
  return sign + formatCurrency(amount, currency, locale);
}

/**
 * Format ESG score
 * @example formatESGScore(85.5) => "85.5"
 */
export function formatESGScore(score: number): string {
  return score.toFixed(1);
}
