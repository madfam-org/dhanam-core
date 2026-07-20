import { apiClient } from './client';

// ===============================
// Types
// ===============================

export interface ManualAsset {
  id: string;
  spaceId: string;
  name: string;
  type:
    | 'real_estate'
    | 'vehicle'
    | 'collectible'
    | 'private_equity'
    | 'business'
    | 'retirement_account'
    | 'other';
  currentValue: number;
  currency: string;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ManualAssetSummary {
  totalAssets: number;
  totalValue: number;
  byType: Record<string, { count: number; value: number }>;
  lastUpdated: string;
}

export interface CashFlow {
  id: string;
  assetId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  recurring?: boolean;
  recurrencePattern?: string;
  createdAt: string;
}

export interface CreateCashFlowDto {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
  recurring?: boolean;
  recurrencePattern?: string;
}

export interface PerformanceAnalysis {
  assetId: string;
  assetName: string;
  currentValue: number;
  purchasePrice: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  annualizedReturn: number;
  holdingPeriodDays: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  yieldPercent: number;
  performance: {
    period: string;
    startValue: number;
    endValue: number;
    change: number;
    changePercent: number;
  }[];
}

export interface PEPortfolioAnalysis {
  spaceId: string;
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  irr: number;
  tvpi: number;
  dpi: number;
  holdings: {
    assetId: string;
    assetName: string;
    type: string;
    invested: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    allocation: number;
  }[];
  cashFlowSummary: {
    totalContributions: number;
    totalDistributions: number;
    netCashFlow: number;
  };
  analysisDate: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  category?: string;
  description?: string;
  uploadedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  documentKey: string;
  expiresAt: string;
}

export interface DocumentConfig {
  maxFileSizeMb: number;
  allowedTypes: string[];
  maxDocumentsPerAsset: number;
}

export interface Valuation {
  id: string;
  assetId: string;
  value: number;
  currency: string;
  source: 'manual' | 'api';
  effectiveDate: string;
  notes?: string;
  createdAt: string;
}

export interface CreateValuationDto {
  value: number;
  currency?: string;
  source?: 'manual' | 'api';
  effectiveDate?: string;
  notes?: string;
}

// ===============================
// API Methods
// ===============================

export const manualAssetsApi = {
  // ===============================
  // Core Asset Operations
  // ===============================

  /**
   * List all manual assets for a space
   */
  listAssets: async (spaceId: string): Promise<ManualAsset[]> => {
    return apiClient.get<ManualAsset[]>(`/spaces/${spaceId}/manual-assets`);
  },

  /**
   * Get a summary of manual assets for a space
   */
  getAssetSummary: async (spaceId: string): Promise<ManualAssetSummary> => {
    return apiClient.get<ManualAssetSummary>(`/spaces/${spaceId}/manual-assets/summary`);
  },

  /**
   * Get a specific manual asset
   */
  getAsset: async (spaceId: string, assetId: string): Promise<ManualAsset> => {
    return apiClient.get<ManualAsset>(`/spaces/${spaceId}/manual-assets/${assetId}`);
  },

  /**
   * Create a new manual asset
   */
  createAsset: async (
    spaceId: string,
    data: Omit<ManualAsset, 'id' | 'spaceId' | 'createdAt' | 'updatedAt'>
  ): Promise<ManualAsset> => {
    return apiClient.post<ManualAsset>(`/spaces/${spaceId}/manual-assets`, data);
  },

  /**
   * Delete a manual asset
   */
  deleteAsset: async (spaceId: string, assetId: string): Promise<void> => {
    return apiClient.delete(`/spaces/${spaceId}/manual-assets/${assetId}`);
  },

  // ===============================
  // Valuations
  // ===============================

  /**
   * Add a new valuation for an asset
   */
  addValuation: async (
    spaceId: string,
    assetId: string,
    data: CreateValuationDto
  ): Promise<Valuation> => {
    return apiClient.post<Valuation>(
      `/spaces/${spaceId}/manual-assets/${assetId}/valuations`,
      data
    );
  },

  // ===============================
  // Cash Flow Management
  // ===============================

  /**
   * List cash flows for an asset
   */
  listCashFlows: async (spaceId: string, assetId: string): Promise<CashFlow[]> => {
    return apiClient.get<CashFlow[]>(`/spaces/${spaceId}/manual-assets/${assetId}/cash-flows`);
  },

  /**
   * Create a new cash flow entry
   */
  createCashFlow: async (
    spaceId: string,
    assetId: string,
    data: CreateCashFlowDto
  ): Promise<CashFlow> => {
    return apiClient.post<CashFlow>(`/spaces/${spaceId}/manual-assets/${assetId}/cash-flows`, data);
  },

  /**
   * Delete a cash flow entry
   */
  deleteCashFlow: async (spaceId: string, assetId: string, cashFlowId: string): Promise<void> => {
    return apiClient.delete(`/spaces/${spaceId}/manual-assets/${assetId}/cash-flows/${cashFlowId}`);
  },

  // ===============================
  // Performance Analysis
  // ===============================

  /**
   * Get performance analysis for a specific asset
   */
  getPerformanceAnalysis: async (
    spaceId: string,
    assetId: string
  ): Promise<PerformanceAnalysis> => {
    return apiClient.get<PerformanceAnalysis>(
      `/spaces/${spaceId}/manual-assets/${assetId}/performance`
    );
  },

  // ===============================
  // PE Portfolio Analytics
  // ===============================

  /**
   * Get private equity portfolio analysis
   */
  getPEPortfolioAnalysis: async (spaceId: string): Promise<PEPortfolioAnalysis> => {
    return apiClient.get<PEPortfolioAnalysis>(`/spaces/${spaceId}/manual-assets/pe/portfolio`);
  },

  // ===============================
  // Document Management
  // ===============================

  /**
   * Get document configuration and limits
   */
  getDocumentConfig: async (spaceId: string): Promise<DocumentConfig> => {
    return apiClient.get<DocumentConfig>(`/spaces/${spaceId}/manual-assets/document-config`);
  },

  /**
   * List documents for an asset
   */
  listDocuments: async (spaceId: string, assetId: string): Promise<AssetDocument[]> => {
    return apiClient.get<AssetDocument[]>(`/spaces/${spaceId}/manual-assets/${assetId}/documents`);
  },

  /**
   * Get a pre-signed upload URL for uploading a document
   */
  getUploadUrl: async (
    spaceId: string,
    assetId: string,
    filename: string,
    contentType: string,
    category?: string
  ): Promise<UploadUrlResponse> => {
    return apiClient.post<UploadUrlResponse>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/upload-url`,
      { filename, contentType, category }
    );
  },

  /**
   * Confirm a document upload was completed successfully
   */
  confirmUpload: async (
    spaceId: string,
    assetId: string,
    documentKey: string,
    description?: string
  ): Promise<AssetDocument> => {
    return apiClient.post<AssetDocument>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/confirm`,
      { documentKey, description }
    );
  },

  /**
   * Get a pre-signed download URL for a document
   */
  getDownloadUrl: async (
    spaceId: string,
    assetId: string,
    documentKey: string
  ): Promise<{ downloadUrl: string; expiresAt: string }> => {
    return apiClient.get(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/${documentKey}/download-url`
    );
  },

  /**
   * Delete a document
   */
  deleteDocument: async (spaceId: string, assetId: string, documentKey: string): Promise<void> => {
    return apiClient.delete(`/spaces/${spaceId}/manual-assets/${assetId}/documents/${documentKey}`);
  },
};
