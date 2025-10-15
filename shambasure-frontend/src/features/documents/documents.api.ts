// FILE: src/features/documents/documents.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type Document,
  DocumentSchema,
  type DocumentQuery,
  type UploadDocumentInput,
  type UpdateDocumentMetadataInput,
  type CreateDocumentVersionInput,
  type SuccessResponse,
  SuccessResponseSchema,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  DOCUMENTS: '/documents',
  DOCUMENT_BY_ID: (id: string) => `/documents/${id}`,
  DOCUMENT_VERSIONS: (id: string) => `/documents/${id}/versions`,
  DOWNLOAD_DOCUMENT_VERSION: (docId: string, versionId: string) =>
    `/documents/${docId}/versions/${versionId}/download`,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: DocumentQuery) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type UploadParams = {
  file: File;
  metadata: UploadDocumentInput;
  onProgress?: (progress: number) => void;
};

const getDocuments = async (
  params: DocumentQuery,
): Promise<Paginated<Document>> => {
  const { data } = await apiClient.get(ApiEndpoints.DOCUMENTS, { params });
  return createPaginatedResponseSchema(DocumentSchema).parse(data);
};

const getDocumentById = async (id: string): Promise<Document> => {
  const { data } = await apiClient.get(ApiEndpoints.DOCUMENT_BY_ID(id));
  return DocumentSchema.parse(data);
};

const uploadDocument = async ({
  file,
  metadata,
  onProgress,
}: UploadParams): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  // Append metadata as a JSON string blob, a common pattern for multipart forms
  formData.append('metadata', JSON.stringify(metadata));

  const { data } = await apiClient.post(ApiEndpoints.DOCUMENTS, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress?.(percent);
      }
    },
  });
  return DocumentSchema.parse(data);
};

const updateDocumentMetadata = async ({
  id,
  metadata,
}: {
  id: string;
  metadata: UpdateDocumentMetadataInput;
}): Promise<Document> => {
  const { data } = await apiClient.patch(
    ApiEndpoints.DOCUMENT_BY_ID(id),
    metadata,
  );
  return DocumentSchema.parse(data);
};

const deleteDocument = async (id: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.DOCUMENT_BY_ID(id));
  return SuccessResponseSchema.parse(data);
};

const addDocumentVersion = async ({
  id,
  ...versionData
}: {
  id: string;
  file: File;
  metadata: CreateDocumentVersionInput;
}): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', versionData.file);
  formData.append('metadata', JSON.stringify(versionData.metadata));

  const { data } = await apiClient.post(
    ApiEndpoints.DOCUMENT_VERSIONS(id),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return DocumentSchema.parse(data);
};

const downloadDocumentVersion = async ({
  documentId,
  versionId,
}: {
  documentId: string;
  versionId: string;
}) => {
  const response = await apiClient.get(
    ApiEndpoints.DOWNLOAD_DOCUMENT_VERSION(documentId, versionId),
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

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const useDocuments = (params: DocumentQuery = {}) =>
  useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
  });

export const useDocument = (id?: string, p0?: { enabled: boolean; }) =>
  useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useUpdateDocumentMetadata = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDocumentMetadata,
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id),
        updatedDocument,
      );
      toast.success('Document metadata updated');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success('Document deleted successfully');
    },
    onMutate: async (deletedId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueriesData<Paginated<Document>>(
        { queryKey: documentKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter((doc) => doc.id !== deletedId),
              }
            : undefined,
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useAddDocumentVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDocumentVersion,
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id),
        updatedDocument,
      );
      toast.success('New document version added');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDownloadDocumentVersion = () => {
  return useMutation({
    mutationFn: downloadDocumentVersion,
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};