import { Currency, Money } from '../types';
import { CURRENCIES } from '../constants/currencies';

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: CURRENCIES[currency].decimals,
    maximumFractionDigits: CURRENCIES[currency].decimals,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  const cleanValue = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanValue);
}

export function createMoney(amount: number, currency: Currency): Money {
  return { amount, currency };
}

export function convertCurrency(money: Money, toCurrency: Currency, exchangeRate: number): Money {
  if (money.currency === toCurrency) {
    return money;
  }

  return {
    amount: money.amount * exchangeRate,
    currency: toCurrency,
  };
}
