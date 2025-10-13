// FILE: src/types/documents.schemas.ts

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
// API RESPONSE SCHEMAS
// ============================================================================

export const DocumentVersionResponseSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  storagePath: z.string(),
  changeNote: z.string().nullable(),
  documentId: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  status: DocumentStatusSchema,
  uploaderId: z.string().uuid(),
  versions: z.array(DocumentVersionResponseSchema).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// FORM/REQUEST SCHEMAS
// ============================================================================

export const UpdateDocumentRequestSchema = z.object({
  filename: z.string().min(3, 'Filename must be at least 3 characters').max(255),
});

export const AddDocumentVersionRequestSchema = z.object({
  changeNote: z.string().max(500, 'Change note cannot exceed 500 characters').optional(),
});

// ============================================================================
// QUERY SCHEMA (for filtering)
// ============================================================================

export const DocumentQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  status: DocumentStatusSchema.optional(),
  uploaderId: z.string().uuid().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type Document = z.infer<typeof DocumentResponseSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionResponseSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentRequestSchema>;
export type AddDocumentVersionInput = z.infer<typeof AddDocumentVersionRequestSchema>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;
