// FILE: src/types/documents.schemas.ts (CORRECTED TO MATCH BACKEND)

import { z } from 'zod';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
// ============================================================================

/**
 * Defines the verification status of a document.
 * CORRECTED: This now perfectly matches the backend's DocumentStatus enum.
 */
export const DocumentStatusSchema = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
]);

// ============================================================================
// API RESPONSE SCHEMAS (Data shapes received from the server)
// ============================================================================

/**
 * Represents a single version of a document.
 * CORRECTED: This now perfectly matches the backend's DocumentVersionResponseDto.
 */
export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  storagePath: z.string(), // Can be a URL or a storage key
  changeNote: z.string().nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Represents the core document entity as returned by the backend.
 * CORRECTED: This now perfectly matches the backend's DocumentResponseDto.
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  status: DocumentStatusSchema,
  uploaderId: z.string().uuid(),
  versions: z.array(DocumentVersionSchema),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Payloads sent to the server)
// ============================================================================

/**
 * Schema for initiating a new document upload.
 * The actual file is sent via multipart/form-data. This is the associated data.
 * CORRECTED: This now perfectly matches the backend's InitiateDocumentUploadRequestDto.
 */
export const InitiateUploadSchema = z.object({
  assetId: z.string().uuid().optional(),
  willId: z.string().uuid().optional(),
});

/**
 * Schema for updating a document's metadata (just the filename for now).
 * CORRECTED: This now matches the backend's UpdateDocumentRequestDto.
 */
export const UpdateDocumentSchema = z.object({
  filename: z
    .string()
    .min(3, 'Filename must be at least 3 characters')
    .max(255)
    .optional(),
  // Status updates should be handled by a separate, admin-only endpoint.
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

export type InitiateUploadInput = z.infer<typeof InitiateUploadSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
