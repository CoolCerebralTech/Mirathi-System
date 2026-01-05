// frontend/src/api/document.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '@/api/client';

import {
  DocumentSchema,
  InitiateUploadResponseSchema,
  ProcessUploadResponseSchema,
  VerifyDocumentResponseSchema,
  DocumentForVerificationSchema,
  DownloadUrlResponseSchema,
  
  type Document,
  type DocumentStatus,
  type InitiateUploadRequest,
  type InitiateUploadResponse,
  type ProcessUploadResponse,
  type VerifyDocumentRequest,
  type VerifyDocumentResponse,
  type DocumentForVerification,
  type DownloadUrlResponse,
} from '../../types/document.types';
import { z } from 'zod';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/documents';
const VERIFICATION_BASE = '/verification';

const ENDPOINTS = {
  // User endpoints
  INITIATE_UPLOAD: `${API_BASE}/initiate-upload`,
  UPLOAD: (documentId: string) => `${API_BASE}/upload/${documentId}`,
  USER_DOCUMENTS: API_BASE,
  DOCUMENT: (id: string) => `${API_BASE}/${id}`,
  DOCUMENT_VIEW: (id: string) => `${API_BASE}/${id}/view`,
  
  // Verifier endpoints
  PENDING_VERIFICATION: `${VERIFICATION_BASE}/pending`,
  DOCUMENT_FOR_VERIFICATION: (id: string) => `${VERIFICATION_BASE}/documents/${id}`,
  VERIFY: `${VERIFICATION_BASE}/verify`,
} as const;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  userDocuments: (status?: DocumentStatus) => 
    [...documentKeys.lists(), 'user', status] as const,
  pendingVerification: () => 
    [...documentKeys.lists(), 'pending-verification'] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  verificationDetail: (id: string) => 
    [...documentKeys.details(), 'verification', id] as const,
  viewUrl: (id: string) => [...documentKeys.detail(id), 'view-url'] as const,
};

// ============================================================================
// API FUNCTIONS - USER OPERATIONS
// ============================================================================

/**
 * Step 1: Initiate document upload
 */
const initiateUpload = async (
  data: InitiateUploadRequest
): Promise<InitiateUploadResponse> => {
  try {
    const response = await apiClient.post<InitiateUploadResponse>(
      ENDPOINTS.INITIATE_UPLOAD,
      data
    );
    return InitiateUploadResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Initiate upload failed:', error);
    throw error;
  }
};

/**
 * Step 2: Upload file and process with OCR
 */
const uploadDocument = async (
  documentId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ProcessUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ProcessUploadResponse>(
      ENDPOINTS.UPLOAD(documentId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            const progress = Math.round((event.loaded * 100) / event.total);
            onProgress?.(progress);
          }
        },
      }
    );

    return ProcessUploadResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Upload failed:', error);
    throw error;
  }
};

/**
 * Get user's documents (optionally filter by status)
 */
const getUserDocuments = async (status?: DocumentStatus): Promise<Document[]> => {
  try {
    const params = status ? { status } : undefined;
    const response = await apiClient.get<Document[]>(
      ENDPOINTS.USER_DOCUMENTS,
      { params }
    );
    return z.array(DocumentSchema).parse(response.data);
  } catch (error) {
    console.error('[Document API] Get user documents failed:', error);
    throw error;
  }
};

/**
 * Get document by ID
 */
const getDocumentById = async (id: string): Promise<Document> => {
  try {
    const response = await apiClient.get<Document>(ENDPOINTS.DOCUMENT(id));
    return DocumentSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Get document failed:', error);
    throw error;
  }
};

/**
 * Get presigned URL to view document
 */
const getDocumentViewUrl = async (id: string): Promise<DownloadUrlResponse> => {
  try {
    const response = await apiClient.get<DownloadUrlResponse>(
      ENDPOINTS.DOCUMENT_VIEW(id)
    );
    return DownloadUrlResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Get view URL failed:', error);
    throw error;
  }
};

/**
 * Delete document (soft delete)
 */
const deleteDocument = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(ENDPOINTS.DOCUMENT(id));
  } catch (error) {
    console.error('[Document API] Delete failed:', error);
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - VERIFIER OPERATIONS
// ============================================================================

/**
 * Get all pending verification documents
 */
const getPendingDocuments = async (): Promise<Document[]> => {
  try {
    const response = await apiClient.get<Document[]>(
      ENDPOINTS.PENDING_VERIFICATION
    );
    return z.array(DocumentSchema).parse(response.data);
  } catch (error) {
    console.error('[Document API] Get pending documents failed:', error);
    throw error;
  }
};

/**
 * Get document for verification with view URL
 */
const getDocumentForVerification = async (
  id: string
): Promise<DocumentForVerification> => {
  try {
    const response = await apiClient.get<DocumentForVerification>(
      ENDPOINTS.DOCUMENT_FOR_VERIFICATION(id)
    );
    return DocumentForVerificationSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Get document for verification failed:', error);
    throw error;
  }
};

/**
 * Verify document (approve or reject)
 */
const verifyDocument = async (
  data: VerifyDocumentRequest
): Promise<VerifyDocumentResponse> => {
  try {
    const response = await apiClient.post<VerifyDocumentResponse>(
      ENDPOINTS.VERIFY,
      data
    );
    return VerifyDocumentResponseSchema.parse(response.data);
  } catch (error) {
    console.error('[Document API] Verification failed:', error);
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS - USER OPERATIONS
// ============================================================================

/**
 * Hook to get user's documents
 */
export const useUserDocuments = (status?: DocumentStatus) => {
  return useQuery({
    queryKey: documentKeys.userDocuments(status),
    queryFn: () => getUserDocuments(status),
  });
};

/**
 * Hook to get single document
 */
export const useDocument = (id?: string) => {
  return useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to get document view URL
 */
export const useDocumentViewUrl = (id?: string) => {
  return useQuery({
    queryKey: documentKeys.viewUrl(id!),
    queryFn: () => getDocumentViewUrl(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook to upload document (2-step process)
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentName,
      file,
      onProgress,
    }: {
      documentName: string;
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      // Step 1: Initiate upload
      const { documentId } = await initiateUpload({ documentName });

      // Step 2: Upload file
      const result = await uploadDocument(documentId, file, onProgress);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Upload failed', {
        description: extractErrorMessage(error),
      });
    },
  });
};

/**
 * Hook to delete document
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error('Delete failed', {
        description: extractErrorMessage(error),
      });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS - VERIFIER OPERATIONS
// ============================================================================

/**
 * Hook to get pending verification documents
 */
export const usePendingDocuments = () => {
  return useQuery({
    queryKey: documentKeys.pendingVerification(),
    queryFn: getPendingDocuments,
  });
};

/**
 * Hook to get document for verification
 */
export const useDocumentForVerification = (id?: string) => {
  return useQuery({
    queryKey: documentKeys.verificationDetail(id!),
    queryFn: () => getDocumentForVerification(id!),
    enabled: !!id,
  });
};

/**
 * Hook to verify document
 */
export const useVerifyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.pendingVerification() 
      });
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.detail(data.documentId) 
      });
      
      const message = data.status === 'VERIFIED'
        ? 'Document verified successfully'
        : 'Document rejected';
      
      toast.success(message);
    },
    onError: (error) => {
      toast.error('Verification failed', {
        description: extractErrorMessage(error),
      });
    },
  });
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export const documentApi = {
  // User operations
  initiateUpload,
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  getDocumentViewUrl,
  deleteDocument,
  
  // Verifier operations
  getPendingDocuments,
  getDocumentForVerification,
  verifyDocument,
};