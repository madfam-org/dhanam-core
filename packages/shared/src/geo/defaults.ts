import type { Locale } from '../types';

export interface GeoDefaults {
  locale: Locale;
  currency: string;
  timezone: string;
  region: 'latam' | 'na' | 'eu' | 'other';
  pricingRegion: 1 | 2 | 3 | 4;
}

const EU_COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'SE',
];

const COUNTRY_DEFAULTS: Record<string, GeoDefaults> = {
  MX: {
    locale: 'es',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    region: 'latam',
    pricingRegion: 3,
  },
  US: {
    locale: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    region: 'na',
    pricingRegion: 1,
  },
  CA: {
    locale: 'en',
    currency: 'CAD',
    timezone: 'America/Toronto',
    region: 'na',
    pricingRegion: 1,
  },
  BR: {
    locale: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    region: 'latam',
    pricingRegion: 3,
  },
  CO: {
    locale: 'es',
    currency: 'COP',
    timezone: 'America/Bogota',
    region: 'latam',
    pricingRegion: 3,
  },
  AR: {
    locale: 'es',
    currency: 'ARS',
    timezone: 'America/Buenos_Aires',
    region: 'latam',
    pricingRegion: 3,
  },
  CL: {
    locale: 'es',
    currency: 'CLP',
    timezone: 'America/Santiago',
    region: 'latam',
    pricingRegion: 3,
  },
  PE: {
    locale: 'es',
    currency: 'PEN',
    timezone: 'America/Lima',
    region: 'latam',
    pricingRegion: 3,
  },
  ES: { locale: 'es', currency: 'EUR', timezone: 'Europe/Madrid', region: 'eu', pricingRegion: 2 },
  FR: { locale: 'en', currency: 'EUR', timezone: 'Europe/Paris', region: 'eu', pricingRegion: 2 },
  DE: { locale: 'en', currency: 'EUR', timezone: 'Europe/Berlin', region: 'eu', pricingRegion: 1 },
  IT: { locale: 'en', currency: 'EUR', timezone: 'Europe/Rome', region: 'eu', pricingRegion: 2 },
  NL: {
    locale: 'en',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    region: 'eu',
    pricingRegion: 1,
  },
  PT: {
    locale: 'pt-BR',
    currency: 'EUR',
    timezone: 'Europe/Lisbon',
    region: 'eu',
    pricingRegion: 2,
  },
  GB: { locale: 'en', currency: 'GBP', timezone: 'Europe/London', region: 'eu', pricingRegion: 1 },
  AU: {
    locale: 'en',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    region: 'other',
    pricingRegion: 1,
  },
  IN: {
    locale: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    region: 'other',
    pricingRegion: 4,
  },
  JP: { locale: 'en', currency: 'JPY', timezone: 'Asia/Tokyo', region: 'other', pricingRegion: 2 },
  KR: { locale: 'en', currency: 'KRW', timezone: 'Asia/Seoul', region: 'other', pricingRegion: 2 },
};

const EU_FALLBACK: GeoDefaults = {
  locale: 'en',
  currency: 'EUR',
  timezone: 'Europe/Madrid',
  region: 'eu',
  pricingRegion: 2,
};
const FALLBACK: GeoDefaults = {
  locale: 'es',
  currency: 'MXN',
  timezone: 'America/Mexico_City',
  region: 'latam',
  pricingRegion: 3,
};

export function getGeoDefaults(countryCode: string | null | undefined): GeoDefaults {
  if (!countryCode) return FALLBACK;

  const code = countryCode.toUpperCase();

  if (COUNTRY_DEFAULTS[code]) return COUNTRY_DEFAULTS[code];
  if (EU_COUNTRIES.includes(code)) return EU_FALLBACK;

  return FALLBACK;
}
