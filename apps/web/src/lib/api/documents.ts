import { apiClient } from './client';

export interface DocumentMetadata {
  key: string;
  url: string;
  filename: string;
  fileType: string;
  fileSize?: number;
  category: string;
  uploadedAt: string;
}

export interface DocumentConfig {
  available: boolean;
  allowedFileTypes: string[];
  categories: string[];
  maxFileSizeMB: number;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

export interface ConfirmUploadDto {
  key: string;
  filename: string;
  fileType: string;
  fileSize: number;
  category?: string;
}

export const documentsApi = {
  /**
   * Get document upload configuration
   */
  getConfig: async (spaceId: string): Promise<DocumentConfig> => {
    return apiClient.get<DocumentConfig>(`/spaces/${spaceId}/manual-assets/document-config`);
  },

  /**
   * Get all documents for an asset
   */
  getDocuments: async (spaceId: string, assetId: string): Promise<DocumentMetadata[]> => {
    return apiClient.get<DocumentMetadata[]>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents`
    );
  },

  /**
   * Get presigned URL for upload
   */
  getUploadUrl: async (
    spaceId: string,
    assetId: string,
    filename: string,
    contentType: string,
    category?: string
  ): Promise<PresignedUploadUrl> => {
    const params = new URLSearchParams({ filename, contentType });
    if (category) params.set('category', category);
    return apiClient.post<PresignedUploadUrl>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/upload-url?${params.toString()}`
    );
  },

  /**
   * Confirm upload completion
   */
  confirmUpload: async (
    spaceId: string,
    assetId: string,
    dto: ConfirmUploadDto
  ): Promise<DocumentMetadata> => {
    return apiClient.post<DocumentMetadata>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/confirm`,
      dto
    );
  },

  /**
   * Get presigned download URL
   */
  getDownloadUrl: async (
    spaceId: string,
    assetId: string,
    documentKey: string
  ): Promise<string> => {
    const encodedKey = encodeURIComponent(documentKey);
    return apiClient.get<string>(
      `/spaces/${spaceId}/manual-assets/${assetId}/documents/${encodedKey}/download-url`
    );
  },

  /**
   * Delete a document
   */
  deleteDocument: async (spaceId: string, assetId: string, documentKey: string): Promise<void> => {
    const encodedKey = encodeURIComponent(documentKey);
    return apiClient.delete(`/spaces/${spaceId}/manual-assets/${assetId}/documents/${encodedKey}`);
  },

  /**
   * Upload a file using presigned URL flow
   */
  uploadFile: async (
    spaceId: string,
    assetId: string,
    file: File,
    category?: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentMetadata> => {
    // Step 1: Get presigned upload URL
    const { uploadUrl, key } = await documentsApi.getUploadUrl(
      spaceId,
      assetId,
      file.name,
      file.type,
      category
    );

    // Step 2: Upload directly to R2 using presigned URL
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(file);
    });

    // Step 3: Confirm upload
    return documentsApi.confirmUpload(spaceId, assetId, {
      key,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      category,
    });
  },
};
