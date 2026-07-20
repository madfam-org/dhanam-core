import { apiClient } from './client';

export interface Tag {
  id: string;
  spaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  _count: { transactions: number };
}

export interface CreateTagDto {
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateTagDto {
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export const tagsApi = {
  getTags: async (spaceId: string): Promise<Tag[]> => {
    return apiClient.get<Tag[]>(`/spaces/${spaceId}/tags`);
  },

  getTag: async (spaceId: string, tagId: string): Promise<Tag> => {
    return apiClient.get<Tag>(`/spaces/${spaceId}/tags/${tagId}`);
  },

  createTag: async (spaceId: string, dto: CreateTagDto): Promise<Tag> => {
    return apiClient.post<Tag>(`/spaces/${spaceId}/tags`, dto);
  },

  updateTag: async (spaceId: string, tagId: string, dto: UpdateTagDto): Promise<Tag> => {
    return apiClient.patch<Tag>(`/spaces/${spaceId}/tags/${tagId}`, dto);
  },

  deleteTag: async (spaceId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/tags/${tagId}`);
  },

  bulkAssign: async (
    spaceId: string,
    transactionIds: string[],
    tagIds: string[]
  ): Promise<{ assigned: number }> => {
    return apiClient.post<{ assigned: number }>(`/spaces/${spaceId}/tags/bulk-assign`, {
      transactionIds,
      tagIds,
    });
  },

  bulkRemove: async (
    spaceId: string,
    transactionIds: string[],
    tagIds: string[]
  ): Promise<{ removed: number }> => {
    return apiClient.post<{ removed: number }>(`/spaces/${spaceId}/tags/bulk-remove`, {
      transactionIds,
      tagIds,
    });
  },
};
