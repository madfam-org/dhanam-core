/**
 * I18n Context
 * React context for managing locale and translations
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { translations, type Translations } from '../i18n';
import type { Locale } from '../types';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Translations;
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
  storageKey?: string;
}

const SUPPORTED_LOCALES: Locale[] = ['en', 'es', 'pt-BR'];

function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * I18nProvider
 * Provides i18n context to the application
 *
 * Features:
 * - Persists locale to localStorage
 * - Auto-detects browser locale
 * - Falls back to Spanish (LATAM-first)
 *
 * @example
 * <I18nProvider defaultLocale="es">
 *   <App />
 * </I18nProvider>
 */
export function I18nProvider({
  children,
  defaultLocale,
  storageKey = 'dhanam_locale',
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // 1. Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored && isSupportedLocale(stored)) {
        return stored;
      }
    }

    // 2. Use provided default
    if (defaultLocale) {
      return defaultLocale;
    }

    // 3. Auto-detect from browser
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pt')) return 'pt-BR';
      if (browserLang.startsWith('en')) return 'en';
      // Default to Spanish for LATAM-first approach
    }

    // 4. Fallback to Spanish (LATAM-first)
    return 'es';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newLocale);
    }
  };

  // Update HTML lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    setLocale,
    translations,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * withI18n HOC
 * Higher-order component to inject i18n props
 *
 * @example
 * export default withI18n(MyComponent);
 */
export function withI18n<P extends object>(Component: React.ComponentType<P & I18nContextValue>) {
  return function WithI18nComponent(props: P) {
    return (
      <I18nContext.Consumer>
        {(context) => {
          if (!context) {
            throw new Error('withI18n must be used within an I18nProvider');
          }
          return <Component {...props} {...context} />;
        }}
      </I18nContext.Consumer>
    );
  };
}
