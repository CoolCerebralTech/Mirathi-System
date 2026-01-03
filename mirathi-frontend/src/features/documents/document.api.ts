import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  DocumentResponseSchema,
  PaginatedDocumentsResponseSchema,
  UploadDocumentResponseSchema,
  UpdateDocumentResponseSchema,
  AccessControlResponseSchema,
  CreateDocumentVersionResponseSchema,
  DocumentVersionResponseSchema,
  
  type Document,
  type PaginatedDocumentsResponse,
  type QueryDocumentsInput,
  type SearchDocumentsInput,
  type UploadDocumentInput,
  type UpdateDocumentInput,
  type UpdateAccessInput,
  type DocumentVersion,
  type CreateDocumentVersionInput,
  type DocumentVersionQuery,
  type UploadDocumentResponse,
  type UpdateDocumentResponse,
  type AccessControlResponse,
  type CreateDocumentVersionResponse,
} from '../../types/document.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Prefix: /documents (Gateway) + /documents (Controller)
const API_BASE = '/documents/documents';

const ENDPOINTS = {
  DOCUMENTS: API_BASE,
  DOCUMENT: (id: string) => `${API_BASE}/${id}`,
  SEARCH: `${API_BASE}/search`,
  ACCESSIBLE: `${API_BASE}/accessible`,
  EXPIRING_SOON: `${API_BASE}/expiring-soon`,
  DOWNLOAD: (id: string) => `${API_BASE}/${id}/download`,
  DOWNLOAD_URL: (id: string) => `${API_BASE}/${id}/download-url`,
  ACCESS: (id: string) => `${API_BASE}/${id}/access`,
  RESTORE: (id: string) => `${API_BASE}/${id}/restore`,
  
  VERSIONS: (docId: string) => `${API_BASE}/${docId}/versions`,
  VERSION_LATEST: (docId: string) => `${API_BASE}/${docId}/versions/latest`,
  VERSION_BY_NUMBER: (docId: string, versionNum: number) => `${API_BASE}/${docId}/versions/${versionNum}`,
  VERSION_DOWNLOAD: (docId: string, versionNum: number) => `${API_BASE}/${docId}/versions/${versionNum}/download`,
  VERSION_DOWNLOAD_URL: (docId: string, versionNum: number) => `${API_BASE}/${docId}/versions/${versionNum}/download-url`,
  VERSION_STATS: (docId: string) => `${API_BASE}/${docId}/versions/stats/summary`,
  VERSION_STORAGE: (docId: string) => `${API_BASE}/${docId}/versions/stats/storage`,
} as const;

const MUTATION_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: Partial<QueryDocumentsInput> | Partial<SearchDocumentsInput>) => 
    [...documentKeys.lists(), filters] as const,
  accessible: (page: number, limit: number) => [...documentKeys.all, 'accessible', page, limit] as const,
  expiring: (days: number) => [...documentKeys.all, 'expiring', days] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,

  versions: (id: string) => [...documentKeys.detail(id), 'versions'] as const,
  versionList: (id: string, filters: Partial<DocumentVersionQuery>) => 
  [...documentKeys.versions(id), filters] as const,
  versionLatest: (id: string) => [...documentKeys.versions(id), 'latest'] as const,
  versionByNumber: (id: string, versionNum: number) => [...documentKeys.versions(id), versionNum] as const,
  versionStats: (id: string) => [...documentKeys.versions(id), 'stats'] as const,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface VersionStatsResponse {
  totalVersions: number;
  latestVersion: number;
  firstCreated: string;
  lastModified: string;
  totalStorageBytes: number;
}

interface VersionStorageResponse {
  storageUsageBytes: number;
}

interface DownloadUrlResponse {
  url: string;
}

type UploadParams = {
  file: File;
  data: UploadDocumentInput;
  onProgress?: (progress: number) => void;
};

type CreateVersionParams = {
  docId: string;
  file: File;
  data: CreateDocumentVersionInput;
  onProgress?: (progress: number) => void;
};

// ============================================================================
// API FUNCTIONS - DOCUMENTS
// ============================================================================

const queryDocuments = async (params: Partial<QueryDocumentsInput>): Promise<PaginatedDocumentsResponse> => {
  try {
    const { data } = await apiClient.get<PaginatedDocumentsResponse>(ENDPOINTS.DOCUMENTS, { params });
    return PaginatedDocumentsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Query failed:', { params, error: extractErrorMessage(error) });
    throw error;
  }
};

const searchDocuments = async (params: Partial<SearchDocumentsInput>): Promise<PaginatedDocumentsResponse> => {
  try {
    const { data } = await apiClient.get<PaginatedDocumentsResponse>(ENDPOINTS.SEARCH, { params });
    return PaginatedDocumentsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Search failed:', { params, error: extractErrorMessage(error) });
    throw error;
  }
};

const getAccessibleDocuments = async (page: number = 1, limit: number = 20): Promise<PaginatedDocumentsResponse> => {
  try {
    const { data } = await apiClient.get<PaginatedDocumentsResponse>(ENDPOINTS.ACCESSIBLE, {
      params: { page, limit },
    });
    return PaginatedDocumentsResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Get accessible failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getExpiringDocuments = async (withinDays: number = 30): Promise<Document[]> => {
  try {
    const { data } = await apiClient.get<Document[]>(ENDPOINTS.EXPIRING_SOON, {
      params: { withinDays },
    });
    return z.array(DocumentResponseSchema).parse(data);
  } catch (error) {
    console.error('[Document API] Get expiring failed:', { error: extractErrorMessage(error) });
    throw error;
  }
};

const getDocumentById = async (id: string): Promise<Document> => {
  try {
    const { data } = await apiClient.get<Document>(ENDPOINTS.DOCUMENT(id));
    return DocumentResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Get by ID failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const getDownloadUrl = async (id: string): Promise<string> => {
  try {
    const { data } = await apiClient.get<DownloadUrlResponse>(ENDPOINTS.DOWNLOAD_URL(id));
    return data.url;
  } catch (error) {
    console.error('[Document API] Get download URL failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const uploadDocument = async ({ file, data: uploadData, onProgress }: UploadParams): Promise<UploadDocumentResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(uploadData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // ✅ FIX: Special handling for object types
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // ✅ FIX: Always include metadata as an empty object if not provided
    if (!uploadData.metadata) {
      formData.append('metadata', JSON.stringify({}));
    }

    const { data } = await apiClient.post<UploadDocumentResponse>(
      `${ENDPOINTS.DOCUMENTS}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    );
    return UploadDocumentResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Upload failed:', { fileName: file.name, error: extractErrorMessage(error) });
    throw error;
  }
};

const updateDocument = async ({ id, data: updateData }: { id: string; data: UpdateDocumentInput }): Promise<UpdateDocumentResponse> => {
  try {
    const { data } = await apiClient.put<UpdateDocumentResponse>(ENDPOINTS.DOCUMENT(id), updateData);
    return UpdateDocumentResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Update failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const updateAccess = async ({ id, data: accessData }: { id: string; data: UpdateAccessInput }): Promise<AccessControlResponse> => {
  try {
    const { data } = await apiClient.put<AccessControlResponse>(ENDPOINTS.ACCESS(id), accessData);
    return AccessControlResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Access update failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const softDeleteDocument = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(ENDPOINTS.DOCUMENT(id));
  } catch (error) {
    console.error('[Document API] Soft delete failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

const restoreDocument = async (id: string): Promise<void> => {
  try {
    await apiClient.post(ENDPOINTS.RESTORE(id));
  } catch (error) {
    console.error('[Document API] Restore failed:', { id, error: extractErrorMessage(error) });
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - VERSIONS
// ============================================================================

const PaginatedVersionsSchema = z.object({
  data: z.array(DocumentVersionResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

const getDocumentVersions = async (
  docId: string,
  params: Partial<DocumentVersionQuery>
): Promise<PaginatedResponse<DocumentVersion>> => {
  try {
    const { data } = await apiClient.get(ENDPOINTS.VERSIONS(docId), { params });
    return PaginatedVersionsSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Get versions failed:', { docId, error: extractErrorMessage(error) });
    throw error;
  }
};

const getLatestVersion = async (docId: string): Promise<DocumentVersion> => {
  try {
    const { data } = await apiClient.get<DocumentVersion>(ENDPOINTS.VERSION_LATEST(docId));
    return DocumentVersionResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Get latest version failed:', { docId, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVersionByNumber = async (docId: string, versionNum: number): Promise<DocumentVersion> => {
  try {
    const { data } = await apiClient.get<DocumentVersion>(ENDPOINTS.VERSION_BY_NUMBER(docId, versionNum));
    return DocumentVersionResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Get version by number failed:', { docId, versionNum, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVersionDownloadUrl = async (docId: string, versionNum: number): Promise<string> => {
  try {
    const { data } = await apiClient.get<DownloadUrlResponse>(ENDPOINTS.VERSION_DOWNLOAD_URL(docId, versionNum));
    return data.url;
  } catch (error) {
    console.error('[Document API] Get version download URL failed:', { docId, versionNum, error: extractErrorMessage(error) });
    throw error;
  }
};

const createNewVersion = async ({ docId, file, data: versionData, onProgress }: CreateVersionParams): Promise<CreateDocumentVersionResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (versionData.changeNote) {
      formData.append('changeNote', versionData.changeNote);
    }

    const { data } = await apiClient.post<CreateDocumentVersionResponse>(
      ENDPOINTS.VERSIONS(docId),
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            onProgress?.(Math.round((e.loaded * 100) / e.total));
          }
        },
      }
    );
    return CreateDocumentVersionResponseSchema.parse(data);
  } catch (error) {
    console.error('[Document API] Create version failed:', { docId, error: extractErrorMessage(error) });
    throw error;
  }
};

const deleteVersion = async (docId: string, versionNum: number): Promise<void> => {
  try {
    await apiClient.delete(ENDPOINTS.VERSION_BY_NUMBER(docId, versionNum));
  } catch (error) {
    console.error('[Document API] Delete version failed:', { docId, versionNum, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVersionStats = async (docId: string): Promise<VersionStatsResponse> => {
  try {
    const { data } = await apiClient.get<VersionStatsResponse>(ENDPOINTS.VERSION_STATS(docId));
    return data;
  } catch (error) {
    console.error('[Document API] Get version stats failed:', { docId, error: extractErrorMessage(error) });
    throw error;
  }
};

const getVersionStorageUsage = async (docId: string): Promise<number> => {
  try {
    const { data } = await apiClient.get<VersionStorageResponse>(ENDPOINTS.VERSION_STORAGE(docId));
    return data.storageUsageBytes;
  } catch (error) {
    console.error('[Document API] Get version storage failed:', { docId, error: extractErrorMessage(error) });
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS - DOCUMENTS
// ============================================================================

export const useDocuments = (params: Partial<QueryDocumentsInput> = {}) =>
  useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => queryDocuments(params),
  });

export const useSearchDocuments = (params: Partial<SearchDocumentsInput> = {}) =>
  useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => searchDocuments(params),
    enabled: !!params.query,
  });

export const useAccessibleDocuments = (page: number = 1, limit: number = 20) =>
  useQuery({
    queryKey: documentKeys.accessible(page, limit),
    queryFn: () => getAccessibleDocuments(page, limit),
  });

export const useExpiringDocuments = (withinDays: number = 30) =>
  useQuery({
    queryKey: documentKeys.expiring(withinDays),
    queryFn: () => getExpiringDocuments(withinDays),
  });

export const useDocument = (id?: string) =>
  useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

export const useDocumentDownloadUrl = (id?: string) =>
  useQuery({
    queryKey: [...documentKeys.detail(id!), 'download-url'],
    queryFn: () => getDownloadUrl(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    ...MUTATION_CONFIG,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => toast.error('Upload failed', { description: extractErrorMessage(error) }),
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    ...MUTATION_CONFIG,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) });
      toast.success('Document updated successfully');
    },
    onError: (error) => toast.error('Update failed', { description: extractErrorMessage(error) }),
  });
};

export const useUpdateDocumentAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAccess,
    ...MUTATION_CONFIG,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.documentId) });
      toast.success('Access permissions updated');
    },
    onError: (error) => toast.error('Access update failed', { description: extractErrorMessage(error) }),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: softDeleteDocument,
    ...MUTATION_CONFIG,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      toast.success('Document moved to trash');
    },
    onError: (error) => toast.error('Delete failed', { description: extractErrorMessage(error) }),
  });
};

export const useRestoreDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreDocument,
    ...MUTATION_CONFIG,
    onSuccess: (_, restoredId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(restoredId) });
      toast.success('Document restored successfully');
    },
    onError: (error) => toast.error('Restore failed', { description: extractErrorMessage(error) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS - VERSIONS
// ============================================================================

export const useDocumentVersions = (
  docId: string, 
  params: Partial<DocumentVersionQuery> = { page: 1, limit: 10 }
) =>
  useQuery({
    queryKey: documentKeys.versionList(docId, params),
    queryFn: () => getDocumentVersions(docId, params),
    enabled: !!docId,
  });

export const useLatestVersion = (docId?: string) =>
  useQuery({
    queryKey: documentKeys.versionLatest(docId!),
    queryFn: () => getLatestVersion(docId!),
    enabled: !!docId,
  });

export const useVersionByNumber = (docId?: string, versionNum?: number) =>
  useQuery({
    queryKey: documentKeys.versionByNumber(docId!, versionNum!),
    queryFn: () => getVersionByNumber(docId!, versionNum!),
    enabled: !!docId && !!versionNum,
  });

export const useVersionDownloadUrl = (docId?: string, versionNum?: number) =>
  useQuery({
    queryKey: [...documentKeys.versionByNumber(docId!, versionNum!), 'download-url'],
    queryFn: () => getVersionDownloadUrl(docId!, versionNum!),
    enabled: !!docId && !!versionNum,
    staleTime: 1000 * 60 * 5,
  });

export const useVersionStats = (docId?: string) =>
  useQuery({
    queryKey: documentKeys.versionStats(docId!),
    queryFn: () => getVersionStats(docId!),
    enabled: !!docId,
  });

export const useVersionStorageUsage = (docId?: string) =>
  useQuery({
    queryKey: [...documentKeys.versionStats(docId!), 'storage'],
    queryFn: () => getVersionStorageUsage(docId!),
    enabled: !!docId,
  });

export const useCreateNewVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNewVersion,
    ...MUTATION_CONFIG,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(data.documentId) });
      toast.success(`Version ${data.versionNumber} created successfully`);
    },
    onError: (error) => toast.error('Failed to create version', { description: extractErrorMessage(error) }),
  });
};

export const useDeleteVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, versionNum }: { docId: string; versionNum: number }) =>
      deleteVersion(docId, versionNum),
    ...MUTATION_CONFIG,
    onSuccess: (_, { docId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(docId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(docId) });
      toast.success('Version deleted successfully');
    },
    onError: (error) => toast.error('Failed to delete version', { description: extractErrorMessage(error) }),
  });
};