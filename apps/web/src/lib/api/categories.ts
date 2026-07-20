import { Category } from '@dhanam-core/shared';

import { apiClient } from './client';

export interface CreateCategoryDto {
  budgetId: string;
  name: string;
  budgetedAmount: number;
  color?: string;
  icon?: string;
  description?: string;
  isIncome?: boolean;
  excludeFromBudget?: boolean;
  excludeFromTotals?: boolean;
  groupName?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  budgetedAmount?: number;
  color?: string;
  icon?: string;
  description?: string;
  isIncome?: boolean;
  excludeFromBudget?: boolean;
  excludeFromTotals?: boolean;
  groupName?: string;
  sortOrder?: number;
}

export const categoriesApi = {
  getCategories: async (spaceId: string): Promise<Category[]> => {
    return apiClient.get<Category[]>(`/spaces/${spaceId}/categories`);
  },

  getCategoriesByBudget: async (spaceId: string, budgetId: string): Promise<Category[]> => {
    return apiClient.get<Category[]>(`/spaces/${spaceId}/categories/budget/${budgetId}`);
  },

  getCategory: async (spaceId: string, categoryId: string): Promise<Category> => {
    return apiClient.get<Category>(`/spaces/${spaceId}/categories/${categoryId}`);
  },

  getCategorySpending: async (
    spaceId: string,
    categoryId: string
  ): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(
      `/spaces/${spaceId}/categories/${categoryId}/spending`
    );
  },

  createCategory: async (spaceId: string, dto: CreateCategoryDto): Promise<Category> => {
    return apiClient.post<Category>(`/spaces/${spaceId}/categories`, dto);
  },

  updateCategory: async (
    spaceId: string,
    categoryId: string,
    dto: UpdateCategoryDto
  ): Promise<Category> => {
    return apiClient.patch<Category>(`/spaces/${spaceId}/categories/${categoryId}`, dto);
  },

  deleteCategory: async (spaceId: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/categories/${categoryId}`);
  },
};
