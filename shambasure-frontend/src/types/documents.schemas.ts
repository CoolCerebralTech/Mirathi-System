// FILE: src/types/documents.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.schemas';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
// ============================================================================

/**
 * Defines the verification status of a document.
 */
export const DocumentStatusSchema = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'ARCHIVED',
]);

/**
 * Categorizes the type of document for better organization and specific workflows.
 */
export const DocumentTypeSchema = z.enum([
  'TITLE_DEED',
  'NATIONAL_ID',
  'PASSPORT',
  'WILL',
  'BANK_STATEMENT',
  'VEHICLE_LOGBOOK',
  'BUSINESS_PERMIT',
  'SURVEY_MAP',
  'OTHER',
]);

/**
 * Schema for structured metadata associated with a document.
 * This is crucial for legal and official documents.
 */
export const DocumentMetadataSchema = z.object({
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  issuingAuthority: z.string().trim().optional(),
  documentNumber: z.string().trim().optional(), // e.g., Title number, ID number
});

// ============================================================================
// API RESPONSE SCHEMAS (Data shapes received from the server)
// ============================================================================

/**
 * Represents a single version of an uploaded file for a document.
 */
export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  filename: z.string(),
  storagePath: z.string().url(), // Represents the URL to access the file
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  changeNote: z.string().nullable(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * Represents the core document entity, which acts as a container for its versions and metadata.
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  documentType: DocumentTypeSchema,
  status: DocumentStatusSchema,
  uploaderId: z.string().uuid(),
  uploader: UserSchema.optional(),
  // A document can be directly linked to a specific asset
  assetId: z.string().uuid().nullable(),
  metadata: DocumentMetadataSchema.nullable(),
  verificationNotes: z.string().nullable(), // Reason for rejection, etc.
  // The array of all historical versions, typically ordered newest first.
  versions: z.array(DocumentVersionSchema).min(1),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

// ============================================================================
// FORM/REQUEST SCHEMAS (Payloads sent to the server)
// ============================================================================

/**
 * Schema for uploading a brand new document.
 * The actual file is sent via multipart/form-data, and this schema represents the associated metadata.
 */
export const UploadDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  assetId: z.string().uuid().optional(),
  metadata: DocumentMetadataSchema.optional(),
});

/**
 * Schema for adding a new version to an *existing* document.
 */
export const CreateDocumentVersionSchema = z.object({
  documentId: z.string().uuid(),
  changeNote: z
    .string()
    .max(500, 'Change note cannot exceed 500 characters')
    .optional(),
});

/**
 * Schema for updating the metadata of an existing document container.
 */
export const UpdateDocumentMetadataSchema = z.object({
  documentType: DocumentTypeSchema.optional(),
  assetId: z.string().uuid().nullable().optional(),
  metadata: DocumentMetadataSchema.partial().optional(),
});

/**
 * Schema for an admin or verifier to update the status of a document.
 */
export const UpdateDocumentStatusSchema = z.object({
  status: DocumentStatusSchema,
  verificationNotes: z.string().optional(),
});

// ============================================================================
// API QUERY SCHEMA
// ============================================================================

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: DocumentStatusSchema.optional(),
  documentType: DocumentTypeSchema.optional(),
  uploaderId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  search: z.string().optional(), // Search by filename or metadata.documentNumber
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type CreateDocumentVersionInput = z.infer<
  typeof CreateDocumentVersionSchema
>;
export type UpdateDocumentMetadataInput = z.infer<
  typeof UpdateDocumentMetadataSchema
>;
export type UpdateDocumentStatusInput = z.infer<
  typeof UpdateDocumentStatusSchema
>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;