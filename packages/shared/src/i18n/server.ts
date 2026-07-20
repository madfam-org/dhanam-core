/**
 * Server-safe i18n entry — no React context or hooks.
 * Use in Next.js RSC pages, generateMetadata, and OG routes.
 */

export {
  getTranslation,
  getNamespaceTranslation,
  normalizeLandingLocale,
  LANDING_LOCALES,
} from './get-translation';

export type { AppLocale, LandingLocale } from './translations-map';
export type { TranslationNamespace } from './translations-map';
