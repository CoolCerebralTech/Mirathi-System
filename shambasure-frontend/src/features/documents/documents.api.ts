// FILE: src/features/documents/documents.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Document,
  UpdateDocumentInput,
  AddDocumentVersionInput,
  DocumentQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentQuery) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  versions: (documentId: string) => [...documentKeys.detail(documentId), 'versions'] as const,
  download: (documentId: string) => [...documentKeys.detail(documentId), 'download'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getDocuments = async (params: DocumentQuery): Promise<PaginatedResponse<Document>> => {
  const response = await apiClient.get('/documents', { params });
  return response.data;
};

const getDocumentById = async (documentId: string): Promise<Document> => {
  const response = await apiClient.get(`/documents/${documentId}`);
  return response.data;
};

const uploadDocument = async (data: { file: File; metadata?: Record<string, unknown> }): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', data.file);
  
  if (data.metadata) {
    formData.append('metadata', JSON.stringify(data.metadata));
  }

  const response = await apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateDocument = async (params: { documentId: string; data: UpdateDocumentInput }): Promise<Document> => {
  const response = await apiClient.patch(`/documents/${params.documentId}`, params.data);
  return response.data;
};

const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/documents/${documentId}`);
};

const downloadDocument = async (documentId: string): Promise<Blob> => {
  const response = await apiClient.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

const addDocumentVersion = async (params: {
  documentId: string;
  file: File;
  data: AddDocumentVersionInput;
}): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', params.file);
  
  if (params.data.changeNote) {
    formData.append('changeNote', params.data.changeNote);
  }

  const response = await apiClient.post(
    `/documents/${params.documentId}/versions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of documents
 * 
 * @example
 * const { data: documentsPage, isLoading } = useDocuments({ page: 1, limit: 10 });
 */
export const useDocuments = (params: DocumentQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single document by ID
 * 
 * @example
 * const { data: document, isLoading } = useDocument(documentId);
 */
export const useDocument = (documentId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => getDocumentById(documentId),
    enabled: status === 'authenticated' && !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to upload a new document
 * Supports upload progress tracking
 * 
 * @example
 * const uploadMutation = useUploadDocument();
 * uploadMutation.mutate({ file: selectedFile, metadata: { assetId: '...' } });
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      console.error('Document upload failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update document metadata
 * 
 * @example
 * const updateMutation = useUpdateDocument();
 * updateMutation.mutate({ documentId: '...', data: { filename: 'new-name.pdf' } });
 */
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      console.error('Document update failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a document
 * 
 * @example
 * const deleteMutation = useDeleteDocument();
 * deleteMutation.mutate(documentId);
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      console.error('Document deletion failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to download a document
 * Returns a blob that can be used to create a download link
 * 
 * @example
 * const downloadMutation = useDownloadDocument();
 * downloadMutation.mutate(documentId, {
 *   onSuccess: (blob) => {
 *     const url = window.URL.createObjectURL(blob);
 *     const a = document.createElement('a');
 *     a.href = url;
 *     a.download = 'document.pdf';
 *     a.click();
 *   }
 * });
 */
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: downloadDocument,
    onError: (error) => {
      console.error('Document download failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to add a new version to an existing document
 * 
 * @example
 * const addVersionMutation = useAddDocumentVersion();
 * addVersionMutation.mutate({ 
 *   documentId: '...', 
 *   file: newFile, 
 *   data: { changeNote: 'Updated content' } 
 * });
 */
export const useAddDocumentVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDocumentVersion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(variables.documentId) });
    },
    onError: (error) => {
      console.error('Add document version failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Helper hook for upload progress tracking
 * Note: This requires axios onUploadProgress configuration
 */
export const useDocumentUploadProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      file: File; 
      metadata?: Record<string, unknown>;
      onProgress?: (progress: number) => void;
    }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      
      if (data.metadata) {
        formData.append('metadata', JSON.stringify(data.metadata));
      }

      const response = await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            data.onProgress?.(percentCompleted);
          }
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (error) => {
      console.error('Document upload failed:', extractErrorMessage(error));
    },
  });
};