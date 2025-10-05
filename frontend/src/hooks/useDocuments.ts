// src/hooks/useDocuments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyDocuments, uploadDocument, deleteDocument, downloadDocument } from '../api/documents';
import type { Document } from '../types';

// A unique key for this query, used for caching and invalidation
const documentsQueryKey = ['documents', 'me'];

export const useDocuments = () => {
  const queryClient = useQueryClient();

  // useQuery handles all fetching, caching, loading, and error states for us
  const { data: documents, isLoading, isError } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: getMyDocuments,
    select: (data) => data.data, // We only want the array of documents from the response
    initialData: { data: [], meta: {} as any }, // Provide an initial empty state
  });

  // useMutation handles the upload action
  const { mutate: upload, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: (newDocument) => {
      toast.success('Document uploaded successfully!');
      // Invalidate and refetch the documents list to show the new one
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: () => {
      toast.error('Upload failed. Please try again.');
    },
  });

  // useMutation handles the delete action
  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      toast.success('Document deleted.');
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: () => {
      toast.error('Failed to delete document.');
    },
  });
  
  // useMutation for downloads (manages loading/error state via toasts)
  const { mutate: download, isPending: isDownloading } = useMutation({
    mutationFn: (vars: {id: string, filename: string}) => downloadDocument(vars.id, vars.filename),
    onSuccess: () => toast.success('Download started!'),
    onError: () => toast.error('Download failed.'),
  });

  return {
    documents: documents || [],
    isLoading,
    isError,
    uploadDocument: upload,
    isUploading,
    deleteDocument: remove,
    isDeleting,
    downloadDocument: download,
    isDownloading,
  };
};