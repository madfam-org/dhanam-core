import { authStore } from '../../stores/auth';

import { apiClient } from './client';

export interface ReportType {
  id: string;
  name: string;
  type: 'pdf' | 'csv';
  createdAt: string;
}

export interface GenerateReportParams {
  spaceId: string;
  startDate: string;
  endDate: string;
  format?: 'pdf' | 'csv' | 'excel' | 'json';
}

export interface SavedReport {
  id: string;
  spaceId: string;
  createdBy: string;
  name: string;
  description?: string;
  type: string;
  schedule?: string;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  filters?: Record<string, unknown>;
  enabled: boolean;
  isShared: boolean;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; email: string };
  generatedReports?: GeneratedReport[];
  _count?: { shares: number; generatedReports: number };
}

export interface GeneratedReport {
  id: string;
  savedReportId: string;
  spaceId: string;
  generatedBy: string;
  format: string;
  startDate: string;
  endDate: string;
  r2Key: string;
  fileSize: number;
  downloadCount: number;
  expiresAt?: string;
  createdAt: string;
  generator?: { id: string; name: string; email: string };
}

export interface ReportShare {
  id: string;
  reportId: string;
  sharedWith: string;
  invitedBy: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  message?: string;
  acceptedAt?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  inviter: { id: string; name: string; email: string };
}

export interface ShareToken {
  id: string;
  token: string;
  expiresAt: string;
  maxAccess?: number;
  accessCount: number;
  createdAt: string;
  creator?: { id: string; name: string; email: string };
}

export interface SharedReport extends SavedReport {
  shareRole: string;
  sharedBy: { id: string; name: string; email: string };
}

export interface InvestorReportPacketRequest {
  spaceId: string;
  startDate: string;
  endDate: string;
  recipients: string[];
  name?: string;
  message?: string;
  expiresInHours?: number;
}

export interface InvestorReportPacketResponse {
  reportId: string;
  generatedReportId: string;
  shareTokenId: string;
  reportName: string;
  publicUrl: string;
  ownerDownloadUrl: string;
  expiresAt: string;
  recipientsQueued: number;
}

export const reportsApi = {
  // ── Existing ────────────────────────────────────────

  getAvailableReports: async (spaceId: string): Promise<{ reports: ReportType[] }> => {
    return apiClient.get<{ reports: ReportType[] }>(`/reports/${spaceId}`);
  },

  getPdfReportUrl: (spaceId: string, startDate: string, endDate: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    return `${baseUrl}/reports/${spaceId}/download/pdf?startDate=${startDate}&endDate=${endDate}`;
  },

  getCsvExportUrl: (spaceId: string, startDate: string, endDate: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    return `${baseUrl}/reports/${spaceId}/download/csv?startDate=${startDate}&endDate=${endDate}`;
  },

  downloadPdfReport: async (spaceId: string, startDate: string, endDate: string): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/pdf?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.getState().accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  },

  downloadCsvExport: async (spaceId: string, startDate: string, endDate: string): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/csv?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.getState().accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    return response.blob();
  },

  // ── New format downloads ────────────────────────────

  downloadExcelExport: async (
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/excel?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.getState().accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download Excel export');
    }

    return response.blob();
  },

  downloadJsonExport: async (
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/json?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.getState().accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download JSON export');
    }

    return response.blob();
  },

  // ── Saved Reports CRUD ─────────────────────────────

  createSavedReport: async (data: {
    spaceId: string;
    name: string;
    description?: string;
    type: string;
    schedule?: string;
    format?: string;
    filters?: Record<string, unknown>;
  }): Promise<SavedReport> => {
    return apiClient.post<SavedReport>('/reports/saved', data);
  },

  getSavedReports: async (spaceId: string): Promise<SavedReport[]> => {
    return apiClient.get<SavedReport[]>(`/reports/saved/space/${spaceId}`);
  },

  getSavedReport: async (id: string): Promise<SavedReport> => {
    return apiClient.get<SavedReport>(`/reports/saved/${id}`);
  },

  updateSavedReport: async (
    id: string,
    data: Partial<
      Pick<SavedReport, 'name' | 'description' | 'schedule' | 'format' | 'filters' | 'enabled'>
    >
  ): Promise<SavedReport> => {
    return apiClient.patch<SavedReport>(`/reports/saved/${id}`, data);
  },

  deleteSavedReport: async (id: string): Promise<void> => {
    return apiClient.delete(`/reports/saved/${id}`);
  },

  generateSavedReport: async (
    id: string
  ): Promise<{ generatedReport: GeneratedReport; downloadUrl: string }> => {
    return apiClient.post(`/reports/saved/${id}/generate`);
  },

  getReportHistory: async (id: string): Promise<GeneratedReport[]> => {
    return apiClient.get<GeneratedReport[]>(`/reports/saved/${id}/history`);
  },

  downloadGeneratedReport: async (
    generatedId: string
  ): Promise<{ downloadUrl: string; generatedReport: GeneratedReport }> => {
    return apiClient.get(`/reports/saved/generated/${generatedId}/download`);
  },

  // ── Sharing ────────────────────────────────────────

  shareReport: async (
    reportId: string,
    data: { shareWithEmail: string; role: string; message?: string }
  ): Promise<ReportShare> => {
    return apiClient.post<ReportShare>(`/reports/${reportId}/share`, data);
  },

  getReportShares: async (reportId: string): Promise<ReportShare[]> => {
    return apiClient.get<ReportShare[]>(`/reports/${reportId}/shares`);
  },

  acceptShare: async (shareId: string): Promise<void> => {
    return apiClient.post(`/reports/shares/${shareId}/accept`);
  },

  declineShare: async (shareId: string): Promise<void> => {
    return apiClient.post(`/reports/shares/${shareId}/decline`);
  },

  revokeShare: async (shareId: string): Promise<void> => {
    return apiClient.delete(`/reports/shares/${shareId}`);
  },

  updateShareRole: async (shareId: string, role: string): Promise<void> => {
    return apiClient.patch(`/reports/shares/${shareId}/role`, { role });
  },

  getSharedWithMe: async (): Promise<SharedReport[]> => {
    return apiClient.get<SharedReport[]>('/reports/shared-with-me');
  },

  // ── Share Links ────────────────────────────────────

  createShareLink: async (
    reportId: string,
    options?: { expiresInHours?: number; maxAccess?: number; generatedReportId?: string }
  ): Promise<ShareToken> => {
    return apiClient.post<ShareToken>(`/reports/${reportId}/share-link`, options || {});
  },

  getShareLinks: async (reportId: string): Promise<ShareToken[]> => {
    return apiClient.get<ShareToken[]>(`/reports/${reportId}/share-links`);
  },

  revokeShareLink: async (tokenId: string): Promise<void> => {
    return apiClient.delete(`/reports/share-links/${tokenId}`);
  },

  // ── Investor Packets ───────────────────────────────

  createInvestorPacket: async (
    data: InvestorReportPacketRequest
  ): Promise<InvestorReportPacketResponse> => {
    return apiClient.post<InvestorReportPacketResponse>('/reports/investor-packets', data);
  },

  // ── Public Access ──────────────────────────────────

  getPublicReport: async (
    token: string
  ): Promise<{
    reportName: string;
    format: string;
    generatedAt: string;
    fileSize: number;
    downloadUrl: string;
  }> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const response = await fetch(`${baseUrl}/reports/public/${token}`);

    if (!response.ok) {
      throw new Error('Failed to access report');
    }

    return response.json();
  },
};
