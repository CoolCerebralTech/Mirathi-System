// src/api/documents.ts
// ============================================================================
// Documents API Service
// ============================================================================
// - Encapsulates all API calls for the /documents endpoints.
// - Handles standard CRUD operations for document metadata.
// - Implements special logic for file uploads using `FormData`.
// - Implements special logic for file downloads by handling binary blobs.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { Document, PaginatedDocumentsResponse, AddDocumentVersionRequest } from '../types';

/**
 * Fetches a paginated list of the current user's documents.
 */
export const getMyDocuments = async (): Promise<PaginatedDocumentsResponse> => {
    const response = await apiClient.get<PaginatedDocumentsResponse>('/documents');
    return response.data;
};

/**
 * Uploads a new document.
 * @param file The file object to upload.
 */
export const uploadDocument = async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Document>('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Adds a new version to an existing document.
 * @param documentId The ID of the document to version.
 * @param data The version data including the new file.
 */
export const addDocumentVersion = async (documentId: string, data: AddDocumentVersionRequest): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.changeNote) {
        formData.append('changeNote', data.changeNote);
    }
    const response = await apiClient.post<Document>(`/documents/${documentId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}


/**
 * Deletes a document by its ID.
 * @param documentId The ID of the document to delete.
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
};

/**
 * Downloads a document's file.
 * Triggers a file download prompt in the browser.
 * @param documentId The ID of the document to download.
 * @param filename The desired filename for the downloaded file.
 */
export const downloadDocument = async (documentId: string, filename: string): Promise<void> => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
        responseType: 'blob', // Important: tells axios to expect binary data
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Set the filename for the download
    // Append to the document, click, and then remove
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
};