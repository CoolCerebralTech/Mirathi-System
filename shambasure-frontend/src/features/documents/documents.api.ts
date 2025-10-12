// FILE: src/features/documents/documents.api.ts (Finalized)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Document,
  UpdateDocumentInput,
  AddDocumentVersionInput,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY (Your implementation is excellent)
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: any) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getDocuments = async (params: any): Promise<any> => { /* ... no changes needed ... */ };
const getDocumentById = async (documentId: string): Promise<Document> => { /* ... no changes needed ... */ };

// ARCHITECTURAL UPGRADE: Merged upload and progress logic into one function.
const uploadDocument = async (params: {
  file: File;
  onProgress?: (progress: number) => void;
}): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', params.file);

  const response = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        params.onProgress?.(percent);
      }
    },
  });
  return response.data;
};

const updateDocument = async (params: { documentId: string; data: UpdateDocumentInput }): Promise<Document> => { /* ... no changes needed ... */ };
const deleteDocument = async (documentId: string): Promise<void> => { /* ... no changes needed ... */ };

const addDocumentVersion = async (params: {
  documentId: string;
  file: File;
  data: AddDocumentVersionInput;
}): Promise<Document> => { /* ... no changes needed ... */ };

// ARCHITECTURAL UPGRADE: Abstract the download logic into the API function.
const downloadDocument = async (documentId: string): Promise<void> => {
  const response = await apiClient.get(`/documents/${documentId}/download`, { responseType: 'blob' });
  const contentDisposition = response.headers['content-disposition'];
  const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'downloaded-file';
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', decodeURIComponent(filename)); // Decode URI component for names with spaces etc.
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useDocuments = (params: any = {}) => { /* ... no changes needed ... */ };
export const useDocument = (documentId: string) => { /* ... no changes needed ... */ };

// ARCHITECTURAL UPGRADE: A single, powerful upload hook.
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
};

export const useUpdateDocument = () => { /* ... your implementation was excellent, no changes needed ... */ };
export const useDeleteDocument = () => { /* ... your implementation was excellent, no changes needed ... */ };
export const useAddDocumentVersion = () => { /* ... your implementation was excellent, no changes needed ... */ };

// ARCHITECTURAL UPGRADE: The download hook is now much simpler to use in a component.
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: downloadDocument,
    onError: (error) => {
      console.error('Document download failed:', error);
      // You can also use toast notifications here for user feedback
    },
  });
};

// ARCHITECTURAL UPGRADE: The dedicated progress hook is no longer needed.