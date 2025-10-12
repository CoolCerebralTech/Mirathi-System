// FILE: src/features/admin/admin-documents.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Document,
  DocumentQuery,
  DocumentStatus,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const adminDocumentsKeys = {
  all: ['admin', 'documents'] as const,
  lists: () => [...adminDocumentsKeys.all, 'list'] as const,
  list: (filters: DocumentQuery) => [...adminDocumentsKeys.lists(), filters] as const,
  details: () => [...adminDocumentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminDocumentsKeys.details(), id] as const,
  pending: () => [...adminDocumentsKeys.all, 'pending'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getDocuments = async (params: DocumentQuery): Promise<PaginatedResponse<Document>> => {
  const response = await apiClient.get('/admin/documents', { params });
  return response.data;
};

const getDocumentById = async (documentId: string): Promise<Document> => {
  const response = await apiClient.get(`/admin/documents/${documentId}`);
  return response.data;
};

const getPendingDocumentsCount = async (): Promise<{ count: number }> => {
  const response = await apiClient.get('/admin/documents/pending/count');
  return response.data;
};

const verifyDocument = async (documentId: string): Promise<Document> => {
  const response = await apiClient.patch(`/admin/documents/${documentId}/verify`);
  return response.data;
};

const rejectDocument = async (params: {
  documentId: string;
  reason?: string;
}): Promise<Document> => {
  const response = await apiClient.patch(
    `/admin/documents/${params.documentId}/reject`,
    { reason: params.reason }
  );
  return response.data;
};

const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/admin/documents/${documentId}`);
};

const downloadDocument = async (documentId: string): Promise<{ blob: Blob; filename: string }> => {
  const response = await apiClient.get(`/admin/documents/${documentId}/download`, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = `document-${documentId}`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch?.[1]) {
      filename = filenameMatch[1];
    }
  }

  return {
    blob: new Blob([response.data]),
    filename,
  };
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated documents (Admin only)
 */
export const useAdminDocuments = (params: DocumentQuery = {}) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminDocumentsKeys.list(params),
    queryFn: () => getDocuments(params),
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 1 * 60 * 1000, // 1 minute
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch single document details (Admin only)
 */
export const useAdminDocument = (documentId: string) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminDocumentsKeys.detail(documentId),
    queryFn: () => getDocumentById(documentId),
    enabled: status === 'authenticated' && userRole === 'ADMIN' && !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get count of pending documents
 */
export const usePendingDocumentsCount = () => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminDocumentsKeys.pending(),
    queryFn: getPendingDocumentsCount,
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook to verify a document (Admin only)
 */
export const useVerifyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyDocument,
    onSuccess: (data, documentId) => {
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.detail(documentId) });
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.pending() });
    },
    onError: (error) => {
      console.error('Verify document failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to reject a document (Admin only)
 */
export const useRejectDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectDocument,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.detail(variables.documentId) });
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.pending() });
    },
    onError: (error) => {
      console.error('Reject document failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a document (Admin only)
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.pending() });
    },
    onError: (error) => {
      console.error('Delete document failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to download a document (Admin only)
 */
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: downloadDocument,
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Download document failed:', extractErrorMessage(error));
    },
  });
};