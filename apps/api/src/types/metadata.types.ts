// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Type definitions for Prisma JSON metadata fields
 * This file provides type safety for the metadata field on various Prisma models
 */

/**
 * Account metadata types by provider
 */

// Plaid account metadata
export interface PlaidAccountMetadata {
  mask?: string;
  officialName?: string;
  itemId: string;
  balances: {
    available?: number;
    current?: number;
    limit?: number;
    iso_currency_code?: string;
    unofficial_currency_code?: string;
  };
}

// Bitso account metadata
export interface BitsoAccountMetadata {
  cryptoCurrency: string;
  cryptoAmount: number;
  availableAmount: number;
  lockedAmount: number;
  usdPrice: number;
  lastPriceUpdate: string;
  clientId: string;
}

// Blockchain (manual) account metadata
export interface BlockchainAccountMetadata {
  address: string;
  cryptoCurrency: string;
  cryptoBalance: string;
  label?: string;
  network: string;
  lastBlock: number;
  readOnly: boolean;
  addedAt: string;
  xpub?: string;
  derivationPath?: string;
  deletedAt?: string;
  deletedBy?: string;
}

// Belvo account metadata
export interface BelvoAccountMetadata {
  externalId: string;
  institution: string;
  category: string;
  type: string;
  number?: string;
  mask?: string;
  linkId: string;
}

// Union type for all account metadata
export type AccountMetadata =
  PlaidAccountMetadata | BitsoAccountMetadata | BlockchainAccountMetadata | BelvoAccountMetadata;

/**
 * Provider connection metadata types
 */

export interface PlaidConnectionMetadata {
  cursor?: string;
  lastSyncAt?: string;
  pendingExpiration?: boolean;
  expirationWarningAt?: string;
  error?: string;
  erroredAt?: string;
  revokedAt?: string;
}

export interface BitsoConnectionMetadata {
  encryptedApiSecret: string;
  externalId?: string;
  autoSync: boolean;
  connectedAt: string;
  accountStatus?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface BelvoConnectionMetadata {
  institutionName: string;
  institutionType: string;
  externalId?: string;
  autoSync: boolean;
  connectedAt: string;
  lastRefreshedAt?: string;
}

export type ProviderConnectionMetadata =
  PlaidConnectionMetadata | BitsoConnectionMetadata | BelvoConnectionMetadata;

/**
 * Transaction metadata types
 */

/**
 * Metadata attached to transactions imported from an external aggregation
 * source. Generic — dhanam-core ships no bundled aggregation connectors.
 */
export interface ImportedTransactionMetadata {
  externalCategory?: string[];
  externalCategoryId?: string;
  accountOwner?: string;
  authorizedDate?: string;
  location?: any;
  paymentMeta?: any;
}

export interface ExchangeTransactionMetadata {
  tradeId: number;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  fees: {
    amount: number;
    currency: string;
  };
  exchangeRate: number;
}

export interface BlockchainTransactionMetadata {
  txHash: string;
  from: string;
  to: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  fee: string;
  blockNumber: number;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
}

export type TransactionMetadata =
  ImportedTransactionMetadata | ExchangeTransactionMetadata | BlockchainTransactionMetadata;

/**
 * Asset valuation metadata
 */
export interface AssetValuationMetadata {
  cryptoCurrency: string;
  cryptoBalance: string | number;
  usdPrice: number;
  network?: string;
  cryptoAmount?: number;
}

/**
 * Budget metadata
 */
export interface BudgetMetadata {
  description?: string;
  createdBy: string;
  tags?: string[];
}

/**
 * Category metadata
 */
export interface CategoryMetadata {
  icon?: string;
  color?: string;
  description?: string;
}

/**
 * Rule metadata (for transaction categorization)
 */
export interface RuleMetadata {
  createdBy: string;
  lastMatchedAt?: string;
  matchCount?: number;
  examples?: string[];
}

/**
 * Audit log metadata
 */
export interface AuditLogMetadata {
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  [key: string]: any;
}

/**
 * Webhook event metadata
 */
export interface WebhookEventMetadata {
  eventType: string;
  provider: string;
  payload: Record<string, any>;
  signature?: string;
}

/**
 * Type guard functions
 */

export function isPlaidAccountMetadata(metadata: unknown): metadata is PlaidAccountMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'itemId' in metadata &&
    'balances' in metadata
  );
}

export function isBitsoAccountMetadata(metadata: unknown): metadata is BitsoAccountMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'cryptoCurrency' in metadata &&
    'cryptoAmount' in metadata &&
    'clientId' in metadata
  );
}

export function isBlockchainAccountMetadata(
  metadata: unknown
): metadata is BlockchainAccountMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'address' in metadata &&
    'cryptoCurrency' in metadata &&
    'network' in metadata
  );
}

export function isBelvoAccountMetadata(metadata: unknown): metadata is BelvoAccountMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'linkId' in metadata &&
    'institution' in metadata
  );
}
