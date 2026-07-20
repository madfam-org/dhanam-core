/**
 * i18n Module
 * Centralized internationalization for Dhanam Ledger
 * Supports English (en), Spanish (es), and Portuguese-BR (pt-BR)
 */

export {
  translations,
  type TranslationNamespace,
  type Translations,
  type AppLocale,
  type LandingLocale,
  LANDING_LOCALES,
  normalizeLandingLocale,
} from './translations-map';

// Legacy export for backwards compatibility
export { translations as i18n } from './translations-map';

// Export React components and hooks
export { I18nProvider, I18nContext, withI18n } from '../contexts/I18nContext';
export type { I18nContextValue, I18nProviderProps } from '../contexts/I18nContext';
export { useTranslation, useLocale } from '../hooks/useTranslation';

// Server-safe translation helpers (RSC, metadata, OG routes)
export { getTranslation, getNamespaceTranslation } from './get-translation';
