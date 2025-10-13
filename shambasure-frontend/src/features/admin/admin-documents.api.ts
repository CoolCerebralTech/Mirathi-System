// FILE: src/features/admin/admin-documents.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { type Document, type DocumentQuery } from '../../types';
import type { PaginatedResponse } from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const adminDocumentsKeys = {
  all: ['admin', 'documents'] as const,
  lists: () => [...adminDocumentsKeys.all, 'list'] as const,
  list: (filters: DocumentQuery) => [...adminDocumentsKeys.lists(), filters] as const,
  details: () => [...adminDocumentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminDocumentsKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

// UPGRADE: Endpoint points to /documents/admin/all as per controller
const getDocuments = async (params: DocumentQuery): Promise<PaginatedResponse<Document>> => {
  const response = await apiClient.get('/documents/admin/all', { params });
  return response.data;
};

// NOTE: Admin getDocumentById, getPendingDocumentsCount are removed as they don't have
// corresponding endpoints in the documents.controller.ts you shared. Admin users
// can use the regular useDocument hook which has auth checks.

const verifyDocument = async (documentId: string): Promise<Document> => {
  const response = await apiClient.patch(`/documents/${documentId}/verify`);
  return response.data;
};

const rejectDocument = async (documentId: string): Promise<Document> => {
  const response = await apiClient.patch(`/documents/${documentId}/reject`);
  return response.data;
};

// UPGRADE: Simplified download logic
const downloadDocument = async (documentId: string): Promise<void> => {
  const response = await apiClient.get(`/documents/${documentId}/download`, { responseType: 'blob' });
  const contentDisposition = response.headers['content-disposition'];
  const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'downloaded-file';
  
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
// REACT QUERY HOOKS
// ============================================================================

export const useAdminDocuments = (params: DocumentQuery = {}) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: adminDocumentsKeys.list(params),
    queryFn: () => getDocuments(params),
    enabled: user?.role === 'ADMIN',
  });
};

export const useVerifyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyDocument,
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.lists() });
      // Also update the specific user-facing document query if it's in the cache
      queryClient.setQueryData(['documents', 'detail', updatedDocument.id], updatedDocument);
    },
  });
};

export const useRejectDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectDocument,
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: adminDocumentsKeys.lists() });
      queryClient.setQueryData(['documents', 'detail', updatedDocument.id], updatedDocument);
    },
  });
};

export const useAdminDownloadDocument = () => {
  return useMutation({ mutationFn: downloadDocument });
};