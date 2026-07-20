export type UUID = string;

export enum Currency {
  MXN = 'MXN',
  USD = 'USD',
  EUR = 'EUR',
  BRL = 'BRL',
  COP = 'COP',
  CAD = 'CAD',
}

export type Locale = 'en' | 'es' | 'pt-BR';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface Money {
  amount: number;
  currency: Currency;
}

export type Provider = 'belvo' | 'plaid' | 'bitso' | 'manual';
