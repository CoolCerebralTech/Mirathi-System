// FILE: src/features/documents/documents.api.ts (FINAL, CORRECTED, PRODUCTION-READY)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type Document,
  DocumentSchema,
  type DocumentQuery,
  type InitiateUploadInput, // Use the corrected, simpler type
  type UpdateDocumentInput,
  // ... other types from your corrected documents.schemas.ts
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// ============================================================================
// API ENDPOINTS - CORRECTED
// ============================================================================

const API_ENDPOINTS = {
  // THE FIX: All endpoints are now correctly prefixed with /api/v1
  DOCUMENTS: '/api/v1/documents',
  DOCUMENT_BY_ID: (id: string) => `/api/v1/documents/${id}`,
  UPLOAD: '/api/v1/documents/upload',
  VERSIONS: (id: string) => `/api/v1/documents/${id}/versions`,
  DOWNLOAD_VERSION: (docId: string, versionNumber: number) =>
    `/api/v1/documents/${docId}/versions/${versionNumber}/download`,
  DOWNLOAD_LATEST: (docId: string) => `/api/v1/documents/${docId}/download`,
};

// ============================================================================
// QUERY KEY FACTORY (No changes needed, this is perfect)
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentQuery) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS - CORRECTED AND SIMPLIFIED
// ============================================================================

type UploadParams = {
  file: File;
  // THE FIX: Use the simpler InitiateUploadInput which matches the backend
  data: InitiateUploadInput;
  onProgress?: (progress: number) => void;
};

const getDocuments = async (
  params: DocumentQuery,
): Promise<Paginated<Document>> => {
  const { data } = await apiClient.get(API_ENDPOINTS.DOCUMENTS, { params });
  return createPaginatedResponseSchema(DocumentSchema).parse(data);
};

const getDocumentById = async (id: string): Promise<Document> => {
  const { data } = await apiClient.get(API_ENDPOINTS.DOCUMENT_BY_ID(id));
  return DocumentSchema.parse(data);
};

const uploadDocument = async ({
  file,
  data: uploadData, // Renamed for clarity
  onProgress,
}: UploadParams): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // THE FIX: The backend doesn't expect a 'metadata' blob.
  // It expects optional top-level fields like 'assetId' or 'willId'.
  // We append them directly to the FormData if they exist.
  if (uploadData.assetId) {
    formData.append('assetId', uploadData.assetId);
  }
  if (uploadData.willId) {
    formData.append('willId', uploadData.willId);
  }

  const { data: responseData } = await apiClient.post(API_ENDPOINTS.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress?.(percent);
      }
    },
  });
  return DocumentSchema.parse(responseData);
};

const updateDocument = async ({
  id,
  data: updateData,
}: {
  id: string;
  data: UpdateDocumentInput;
}): Promise<Document> => {
  const { data } = await apiClient.patch(
    API_ENDPOINTS.DOCUMENT_BY_ID(id),
    updateData,
  );
  return DocumentSchema.parse(data);
};

const deleteDocument = async (id: string): Promise<void> => {
  // The backend returns 204 No Content, which means an empty body.
  // We don't expect a SuccessResponse.
  await apiClient.delete(API_ENDPOINTS.DOCUMENT_BY_ID(id));
};

const downloadDocument = async (documentId: string) => {
  const response = await apiClient.get(
    API_ENDPOINTS.DOWNLOAD_LATEST(documentId),
    { responseType: 'blob' },
  );

  const contentDisposition = response.headers['content-disposition'];
  const filename =
    contentDisposition?.split('filename=')[1]?.replace(/"/g, '') ||
    'shamba-sure-document';

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', decodeURIComponent(filename));
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


// ============================================================================
// REACT QUERY HOOKS (Now aligned with the corrected API functions)
// ============================================================================

export const useDocuments = (params: DocumentQuery = {}) =>
  useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

export const useDocument = (id?: string) =>
  useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: (newDocument) => {
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      // Immediately add the new document to the cache for a better UX
      queryClient.setQueryData(documentKeys.detail(newDocument.id), newDocument);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${extractErrorMessage(error)}`);
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (updatedDocument) => {
      // Invalidate the main list
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      // Update the specific document's detail query cache
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id),
        updatedDocument,
      );
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      toast.error(`Update failed: ${extractErrorMessage(error)}`);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, deletedId) => {
      // Invalidate the main list to ensure it's fresh
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      // Also remove the specific item from the detail cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error(`Deletion failed: ${extractErrorMessage(error)}`);
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: downloadDocument,
    onSuccess: () => {
      toast.info('Your download has started.');
    },
    onError: (error) => {
      toast.error(`Download failed: ${extractErrorMessage(error)}`);
    },
  });
};

// NOTE: Add/Download version hooks have been removed for simplicity to match
// the more focused backend DTOs. They can be added back when the backend
// controller and services are updated to handle that specific logic.