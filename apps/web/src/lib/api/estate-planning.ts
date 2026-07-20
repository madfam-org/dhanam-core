import { apiClient } from './client';

export interface Executor {
  id: string;
  email: string;
  name: string;
  relationship: string;
  priority: number;
  verified: boolean;
  verifiedAt: string | null;
  accessGranted: boolean;
  accessExpiresAt: string | null;
}

export interface AddExecutorDto {
  email: string;
  name: string;
  relationship: string;
  priority?: number;
}

export interface ExecutorAccessLog {
  action: string;
  resourceType: string | null;
  createdAt: string;
  executorEmail: string;
}

export const estatePlanningApi = {
  /**
   * Get all executors
   */
  getExecutors: async (): Promise<Executor[]> => {
    return apiClient.get<Executor[]>('/estate-planning/executors');
  },

  /**
   * Add an executor
   */
  addExecutor: async (data: AddExecutorDto): Promise<{ id: string; verificationSent: boolean }> => {
    return apiClient.post<{ id: string; verificationSent: boolean }>(
      '/estate-planning/executors',
      data
    );
  },

  /**
   * Remove an executor
   */
  removeExecutor: async (executorId: string): Promise<{ removed: boolean }> => {
    return apiClient.delete<{ removed: boolean }>(`/estate-planning/executors/${executorId}`);
  },

  /**
   * Get executor access audit log
   */
  getAccessLog: async (executorId?: string): Promise<ExecutorAccessLog[]> => {
    const url = executorId
      ? `/estate-planning/executors/${executorId}/access-log`
      : '/estate-planning/access-log';
    return apiClient.get<ExecutorAccessLog[]>(url);
  },
};
