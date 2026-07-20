/**
 * useTranslation Hook
 * React hook for accessing translations
 *
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * t('common.save'); // => "Save" or "Guardar"
 */

import { useContext } from 'react';
import { I18nContext } from '../contexts/I18nContext';
import type { TranslationNamespace } from '../i18n';
import { resolveICU } from '../i18n/icu';

function lookupKey(obj: any, keys: string[]): string | undefined {
  let value: any = obj;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return undefined;
  }
  return typeof value === 'string' ? value : value?.toString();
}

export function useTranslation(namespace?: TranslationNamespace) {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { locale, setLocale, translations } = context;

  /**
   * Translate a key
   * @param key - Translation key in dot notation (e.g., "save" or "common.save" or "howItWorks.title")
   * @param params - Optional parameters for interpolation
   *
   * Fallback chain: requested locale → es (Spanish) → raw key
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Always use namespace if provided - keys are relative to the namespace
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');

    // Try requested locale first, then fall back to Spanish, then raw key
    let value = lookupKey(translations[locale], keys);
    if (value === undefined && locale !== 'es') {
      value = lookupKey((translations as any)['es'], keys);
    }
    if (value === undefined) {
      console.warn(`Translation key not found: ${fullKey} for locale: ${locale}`);
      return key;
    }

    // {{param}} interpolation
    if (params) {
      value = value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() ?? match;
      });
    }

    // ICU plural/select resolution
    if (params && (value.includes(', plural,') || value.includes(', select,'))) {
      value = resolveICU(value, params, locale);
    }

    return value;
  };

  /**
   * Check if a translation key exists
   */
  const hasKey = (key: string): boolean => {
    const keys = key.split('.');
    return lookupKey(translations[locale], keys) !== undefined;
  };

  /**
   * Get all translations for a namespace
   */
  const getNamespace = (ns: TranslationNamespace) => {
    return (translations[locale] as any)[ns];
  };

  return {
    t,
    hasKey,
    getNamespace,
    locale,
    setLocale,
  };
}

/**
 * useLocale Hook
 * Lightweight hook for just locale access/updates
 */
export function useLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }

  return {
    locale: context.locale,
    setLocale: context.setLocale,
  };
}
