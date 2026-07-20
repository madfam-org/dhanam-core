import { apiClient } from './client';

export interface LifeBeatStatus {
  enabled: boolean;
  lastActivity: string | null;
  daysSinceActivity: number | null;
  alertDays: number[];
  executorCount: number;
  pendingAlerts: Array<{ level: number; sentAt: string }>;
  legalAgreed: boolean;
}

export interface CheckInResponse {
  success: boolean;
  nextCheckDate: string;
}

export const usersApi = {
  /**
   * Get Life Beat status
   */
  getLifeBeatStatus: async (): Promise<LifeBeatStatus> => {
    return apiClient.get<LifeBeatStatus>('/users/life-beat/status');
  },

  /**
   * Enable Life Beat
   */
  enableLifeBeat: async (data: { alertDays: number[] }): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/users/life-beat/enable', data);
  },

  /**
   * Disable Life Beat
   */
  disableLifeBeat: async (): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>('/users/life-beat/disable');
  },

  /**
   * Check in (I'm alive)
   */
  checkIn: async (): Promise<CheckInResponse> => {
    return apiClient.post<CheckInResponse>('/users/life-beat/check-in');
  },
};
