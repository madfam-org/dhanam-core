/**
 * Server-safe translation lookup (no React context).
 * Used by Next.js RSC pages, metadata, and OG image routes.
 */

import {
  translations,
  type AppLocale,
  type LandingLocale,
  type TranslationNamespace,
  normalizeLandingLocale,
  LANDING_LOCALES,
} from './translations-map';

export type { AppLocale, LandingLocale, TranslationNamespace };
export { normalizeLandingLocale, LANDING_LOCALES };

function lookupKey(obj: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  let value: unknown = obj;
  for (const k of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    value = (value as Record<string, unknown>)[k];
  }
  return typeof value === 'string' ? value : undefined;
}

export function getTranslation(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value = lookupKey(translations[locale] as Record<string, unknown>, keys);

  if (value === undefined && locale !== 'es') {
    value = lookupKey(translations.es as Record<string, unknown>, keys);
  }

  if (value === undefined) {
    return key;
  }

  if (params) {
    value = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey: string) => {
      return params[paramKey]?.toString() ?? match;
    });
  }

  return value;
}

export function getNamespaceTranslation(
  locale: AppLocale,
  namespace: TranslationNamespace,
  key: string,
  params?: Record<string, string | number>
): string {
  return getTranslation(locale, `${namespace}.${key}`, params);
}
