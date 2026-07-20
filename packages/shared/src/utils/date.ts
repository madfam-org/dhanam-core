import { format } from 'date-fns';

export function formatDate(date: Date, formatStr = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
