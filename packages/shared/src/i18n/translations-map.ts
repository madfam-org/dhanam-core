/**
 * Canonical translation map — shared by React i18n and server-safe getters.
 */

import * as en from './en';
import * as es from './es';
import * as ptBR from './pt-BR';

export const translations = {
  en: {
    common: en.common,
    auth: en.auth,
    transactions: en.transactions,
    budgets: en.budgets,
    accounts: en.accounts,
    spaces: en.spaces,
    wealth: en.wealth,
    errors: en.errors,
    validations: en.validations,
    estatePlanning: en.estatePlanning,
    households: en.households,
    email: en.email,
    apiErrors: en.apiErrors,
    dashboard: en.dashboard,
    settings: en.settings,
    projections: en.projections,
    assets: en.assets,
    goals: en.goals,
    analytics: en.analytics,
    reports: en.reports,
    legal: en.legal,
    platformImport: en.platformImport,
  },
  es: {
    common: es.common,
    auth: es.auth,
    transactions: es.transactions,
    budgets: es.budgets,
    accounts: es.accounts,
    spaces: es.spaces,
    wealth: es.wealth,
    errors: es.errors,
    validations: es.validations,
    estatePlanning: es.estatePlanning,
    households: es.households,
    email: es.email,
    apiErrors: es.apiErrors,
    dashboard: es.dashboard,
    settings: es.settings,
    projections: es.projections,
    assets: es.assets,
    goals: es.goals,
    analytics: es.analytics,
    reports: es.reports,
    legal: es.legal,
    platformImport: es.platformImport,
  },
  'pt-BR': {
    common: ptBR.common,
    auth: ptBR.auth,
    transactions: ptBR.transactions,
    budgets: ptBR.budgets,
    accounts: ptBR.accounts,
    spaces: ptBR.spaces,
    wealth: ptBR.wealth,
    errors: ptBR.errors,
    validations: ptBR.validations,
    estatePlanning: ptBR.estatePlanning,
    households: ptBR.households,
    email: ptBR.email,
    apiErrors: ptBR.apiErrors,
    dashboard: ptBR.dashboard,
    settings: ptBR.settings,
    projections: ptBR.projections,
    assets: ptBR.assets,
    goals: ptBR.goals,
    analytics: ptBR.analytics,
    reports: ptBR.reports,
    legal: ptBR.legal,
    platformImport: ptBR.platformImport,
  },
} as const;

export type TranslationNamespace = keyof typeof translations.es;
export type Translations = typeof translations;

export type AppLocale = keyof typeof translations;

export const LANDING_LOCALES = ['es', 'en', 'pt-BR'] as const;
export type LandingLocale = (typeof LANDING_LOCALES)[number];

export function normalizeLandingLocale(raw: string): LandingLocale {
  if (raw === 'en' || raw === 'es' || raw === 'pt-BR') {
    return raw;
  }
  return 'es';
}
