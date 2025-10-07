// FILE: src/types/schemas/documents.schemas.ts

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const DocumentStatusSchema = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
]);

// ============================================================================
// DOCUMENT VERSION SCHEMAS
// ============================================================================

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  storagePath: z.string(),
  changeNote: z.string().nullish(),
  documentId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const AddDocumentVersionSchema = z.object({
  changeNote: z
    .string()
    .max(500, 'Change note cannot exceed 500 characters')
    .optional(),
});

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  status: DocumentStatusSchema,
  uploaderId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  versions: z.array(DocumentVersionSchema).optional(),
});

/**
 * Schema for document upload metadata
 * Note: Actual file is sent via FormData, not validated here
 */
export const InitiateDocumentUploadSchema = z.object({
  assetId: z.string().uuid('Valid asset ID is required').optional(),
  description: z.string().max(500).optional(),
});

export const UpdateDocumentSchema = z.object({
  filename: z
    .string()
    .min(3, 'Filename must be at least 3 characters')
    .max(255, 'Filename cannot exceed 255 characters')
    .optional(),
  status: DocumentStatusSchema.optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const DocumentQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  status: DocumentStatusSchema.optional(),
  uploaderId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'filename', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

// Enum types
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

// Response types
export type Document = z.infer<typeof DocumentResponseSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

// Request types
export type InitiateDocumentUploadInput = z.infer<typeof InitiateDocumentUploadSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type AddDocumentVersionInput = z.infer<typeof AddDocumentVersionSchema>;

// Query types
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;