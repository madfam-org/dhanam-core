import { Currency } from '../types';

export const CURRENCIES: Record<
  Currency,
  {
    code: Currency;
    symbol: string;
    name: string;
    decimals: number;
  }
> = {
  [Currency.MXN]: {
    code: Currency.MXN,
    symbol: '$',
    name: 'Mexican Peso',
    decimals: 2,
  },
  [Currency.USD]: {
    code: Currency.USD,
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  [Currency.EUR]: {
    code: Currency.EUR,
    symbol: '€',
    name: 'Euro',
    decimals: 2,
  },
  [Currency.BRL]: {
    code: Currency.BRL,
    symbol: 'R$',
    name: 'Brazilian Real',
    decimals: 2,
  },
  [Currency.COP]: {
    code: Currency.COP,
    symbol: '$',
    name: 'Colombian Peso',
    decimals: 0,
  },
  [Currency.CAD]: {
    code: Currency.CAD,
    symbol: '$',
    name: 'Canadian Dollar',
    decimals: 2,
  },
};

export const DEFAULT_CURRENCY: Currency = Currency.MXN;
