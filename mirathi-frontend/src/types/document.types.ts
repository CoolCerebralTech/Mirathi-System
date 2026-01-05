// frontend/src/types/document.types.ts

import { z } from 'zod';

// ============================================================================
// ENUMS - Match Backend Prisma Enums
// ============================================================================

export const DocumentStatusEnum = z.enum([
  'PENDING_UPLOAD',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'EXPIRED',
]);

export const ReferenceTypeEnum = z.enum([
  'TITLE_DEED',
  'NATIONAL_ID',
  'DEATH_CERTIFICATE',
  'BIRTH_CERTIFICATE',
  'MARRIAGE_CERTIFICATE',
  'KRA_PIN',
  'OTHER',
]);

export const VerificationActionEnum = z.enum([
  'APPROVED',
  'REJECTED',
]);

// ============================================================================
// CORE SCHEMAS
// ============================================================================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  documentName: z.string(),
  referenceNumber: z.string().nullable().optional(),
  referenceType: ReferenceTypeEnum.nullable().optional(),
  status: DocumentStatusEnum,
  uploaderId: z.string().uuid(),
  uploaderName: z.string().optional(),
  verifiedBy: z.string().uuid().nullable().optional(),
  verifiedByName: z.string().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  ocrConfidence: z.number().nullable().optional(),
  ocrExtractedText: z.string().nullable().optional(),
  storageKey: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSizeBytes: z.number().nullable().optional(),
  encryptedReference: z.string().nullable().optional(),
  uploadedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const VerificationAttemptSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  verifierId: z.string().uuid(),
  verifierName: z.string().optional(),
  action: z.string(), // 'APPROVED' or 'REJECTED'
  notes: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

// ============================================================================
// UPLOAD & INITIATE
// ============================================================================

export const InitiateUploadRequestSchema = z.object({
  documentName: z.string().min(1).max(200),
});

export const InitiateUploadResponseSchema = z.object({
  documentId: z.string().uuid(),
  storageKey: z.string(),
  expiresAt: z.string().datetime(),
});

export const ProcessUploadResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: DocumentStatusEnum,
  referenceNumber: z.string().nullable().optional(),
  referenceType: ReferenceTypeEnum.nullable().optional(),
  ocrConfidence: z.number().nullable().optional(),
});

// ============================================================================
// VERIFICATION
// ============================================================================

export const VerifyDocumentRequestSchema = z.object({
  documentId: z.string().uuid(),
  action: VerificationActionEnum,
  notes: z.string().optional(),
}).refine(
  (data) => !(data.action === 'REJECTED' && !data.notes?.trim()),
  {
    message: 'Rejection reason is required',
    path: ['notes'],
  }
);

export const VerifyDocumentResponseSchema = z.object({
  documentId: z.string().uuid(),
  status: DocumentStatusEnum,
  encryptedReference: z.string().optional(),
  rejectionReason: z.string().optional(),
  message: z.string(),
});

export const DocumentForVerificationSchema = z.object({
  document: DocumentSchema,
  viewUrl: z.string().url(),
});

// ============================================================================
// LISTS & PAGINATION
// ============================================================================

export const DocumentListSchema = z.object({
  documents: z.array(DocumentSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// ============================================================================
// DOWNLOAD URLs
// ============================================================================

export const DownloadUrlResponseSchema = z.object({
  url: z.string().url(),
  expiresIn: z.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;
export type ReferenceType = z.infer<typeof ReferenceTypeEnum>;
export type VerificationAction = z.infer<typeof VerificationActionEnum>;

export type Document = z.infer<typeof DocumentSchema>;
export type VerificationAttempt = z.infer<typeof VerificationAttemptSchema>;

export type InitiateUploadRequest = z.infer<typeof InitiateUploadRequestSchema>;
export type InitiateUploadResponse = z.infer<typeof InitiateUploadResponseSchema>;
export type ProcessUploadResponse = z.infer<typeof ProcessUploadResponseSchema>;

export type VerifyDocumentRequest = z.infer<typeof VerifyDocumentRequestSchema>;
export type VerifyDocumentResponse = z.infer<typeof VerifyDocumentResponseSchema>;
export type DocumentForVerification = z.infer<typeof DocumentForVerificationSchema>;

export type DocumentList = z.infer<typeof DocumentListSchema>;
export type DownloadUrlResponse = z.infer<typeof DownloadUrlResponseSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getStatusBadgeColor(status: DocumentStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'PENDING_VERIFICATION':
      return 'yellow';
    case 'PENDING_UPLOAD':
      return 'blue';
    case 'EXPIRED':
      return 'gray';
    default:
      return 'gray';
  }
}

export function getReferenceTypeLabel(type: ReferenceType | null | undefined): string {
  if (!type) return 'Unknown';
  
  const labels: Record<ReferenceType, string> = {
    TITLE_DEED: 'Title Deed',
    NATIONAL_ID: 'National ID',
    DEATH_CERTIFICATE: 'Death Certificate',
    BIRTH_CERTIFICATE: 'Birth Certificate',
    MARRIAGE_CERTIFICATE: 'Marriage Certificate',
    KRA_PIN: 'KRA PIN',
    OTHER: 'Other',
  };
  
  return labels[type];
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function getOcrConfidenceLabel(confidence: number | null | undefined): string {
  if (!confidence) return 'Unknown';
  
  if (confidence >= 90) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
}