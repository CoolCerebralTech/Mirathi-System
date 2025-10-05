// src/types/document.types.ts
// ============================================================================
// Document-Related Type Definitions
// ============================================================================
// - Defines the shape of all data related to the Document and DocumentVersion
//   entities, based on the backend DTOs.
// ============================================================================

import type { PaginatedResponse } from './shared.types';

// --- Enums ---
export type DocumentStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

// --- Core Data Structures ---
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  storagePath: string;
  changeNote?: string;
  documentId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Document {
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploaderId: string;
  versions: DocumentVersion[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// --- API Payloads ---

// REQUESTS
export interface UploadDocumentRequest {
  file: File;
  // We can add other metadata here if needed in the future
}

export interface AddDocumentVersionRequest {
    file: File;
    changeNote?: string;
}

// RESPONSES
export type PaginatedDocumentsResponse = PaginatedResponse<Document>;