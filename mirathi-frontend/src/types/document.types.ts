import { z } from 'zod';

// ============================================================================
// UTILS
// ============================================================================

// Safe date transformer that handles nulls and ISO strings
const dateSchema = z.string().datetime().nullable().optional().transform((val) => {
  if (!val) return null;
  return new Date(val);
});

// ============================================================================
// ENUMS
// ============================================================================

export const DocumentStatusEnum = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
]);

export const DocumentCategoryEnum = z.enum([
  'LAND_OWNERSHIP',
  'IDENTITY_PROOF',
  'SUCCESSION_DOCUMENT',
  'FINANCIAL_PROOF',
  'OTHER',
]);

export const RetentionPolicyType = z.enum([
  'SHORT_TERM',
  'MEDIUM_TERM',
  'LONG_TERM',
  'COMPLIANCE',
]);

export const BulkActionType = z.enum([
  'DELETE',
  'RESTORE',
  'SHARE',
  'REVOKE_ACCESS',
  'CHANGE_STATUS',
]);

// ============================================================================
// CORE SCHEMAS
// ============================================================================

export const DocumentPermissionsSchema = z.object({
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canVerify: z.boolean(),
  canShare: z.boolean(),
});

export const DocumentVersionResponseSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number().int(),
  documentId: z.string().uuid(),
  storagePath: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  checksum: z.string(),
  changeNote: z.string().optional().nullable(),
  uploadedBy: z.string().uuid(),
  uploadedByName: z.string().optional().nullable(),
  createdAt: dateSchema,
  downloadUrl: z.string().url().optional().nullable(),
  fileSizeHumanReadable: z.string(),
});

export const DocumentResponseSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  category: DocumentCategoryEnum,
  status: DocumentStatusEnum,
  uploaderId: z.string().uuid(),
  uploaderName: z.string().optional().nullable(),
  verifiedBy: z.string().uuid().optional().nullable(),
  verifiedByName: z.string().optional().nullable(),
  verifiedAt: dateSchema,
  rejectionReason: z.string().optional().nullable(),
  assetId: z.string().uuid().optional().nullable(),
  willId: z.string().uuid().optional().nullable(),
  identityForUserId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  issueDate: dateSchema,
  expiryDate: dateSchema,
  issuingAuthority: z.string().optional().nullable(),
  isPublic: z.boolean(),
  encrypted: z.boolean(),
  allowedViewers: z.array(z.string().uuid()),
  storageProvider: z.string(),
  checksum: z.string().optional().nullable(),
  version: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
  downloadUrl: z.string().url().optional().nullable(),
  previewUrl: z.string().url().optional().nullable(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canVerify: z.boolean().optional(),
  canShare: z.boolean().optional(),
  isExpired: z.boolean().optional(),
  currentVersion: z.number().optional(),
  totalVersions: z.number().optional(),
  isIndexed: z.boolean(),
  indexedAt: dateSchema,
  expiresAt: dateSchema,
  retentionPolicy: RetentionPolicyType.optional().nullable(),
  latestVersion: DocumentVersionResponseSchema.optional().nullable(),
  permissions: DocumentPermissionsSchema.optional(),
});

// ============================================================================
// UPLOAD
// ============================================================================

export const UploadDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  category: DocumentCategoryEnum,
  assetId: z.string().uuid().optional(),
  willId: z.string().uuid().optional(),
  identityForUserId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  documentNumber: z.string().max(50).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuingAuthority: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  allowedViewers: z.array(z.string().uuid()).optional(),
  retentionPolicy: RetentionPolicyType.optional(),
}).refine(
  data => !(data.category === 'IDENTITY_PROOF' && !data.identityForUserId),
  {
    message: 'identityForUserId required for IDENTITY_PROOF category',
    path: ['identityForUserId'],
  }
);

export const UploadDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  storagePath: z.string(),
  category: DocumentCategoryEnum,
  status: z.string(),
  sizeBytes: z.number(),
  mimeType: z.string(),
  checksum: z.string(),
  uploaderId: z.string().uuid(),
  createdAt: dateSchema,
  version: z.number(),
  documentUrl: z.string().url().optional().nullable(),
  downloadUrl: z.string().url().optional().nullable(),
});

// ============================================================================
// UPDATE & ACCESS CONTROL
// ============================================================================

export const UpdateDocumentSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  documentNumber: z.string().min(1).max(50).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuingAuthority: z.string().min(1).max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isPublic: z.boolean().optional(),
  allowedViewers: z.array(z.string().uuid()).optional(),
});

export const UpdateDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  updatedAt: dateSchema,
  version: z.number(),
});

export const UpdateAccessSchema = z.object({
  shareWith: z.array(z.string().uuid()).optional(),
  revokeFrom: z.array(z.string().uuid()).optional(),
  isPublic: z.boolean().optional(),
});

export const AccessControlResponseSchema = z.object({
  documentId: z.string().uuid(),
  isPublic: z.boolean(),
  allowedViewers: z.array(z.string().uuid()),
  updatedAt: dateSchema,
});

// ============================================================================
// VERIFICATION
// ============================================================================

export const VerifyDocumentSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().max(1000).optional(),
  documentNumber: z.string().max(50).optional(),
  extractedData: z.record(z.string(), z.any()).optional(),
  verificationMetadata: z.record(z.string(), z.any()).optional(),
}).refine(
  data => !(data.status === 'REJECTED' && !data.reason?.trim()),
  {
    message: 'Rejection reason required when status is REJECTED',
    path: ['reason'],
  }
);

export const VerifyDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  status: DocumentStatusEnum,
  verifiedBy: z.string().uuid(),
  verifiedAt: dateSchema,
  documentNumber: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  verificationAttemptId: z.string().uuid().optional().nullable(),
});

export const VerificationAttemptSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  verifierId: z.string().uuid(),
  verifierName: z.string().optional().nullable(),
  status: DocumentStatusEnum,
  reason: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  createdAt: dateSchema,
  isSuccessful: z.boolean(),
  isRejection: z.boolean(),
});

export const DocumentVerificationHistoryResponseSchema = z.object({
  documentId: z.string().uuid(),
  totalAttempts: z.number(),
  latestAttempt: VerificationAttemptSchema.optional().nullable(),
  firstAttempt: VerificationAttemptSchema.optional().nullable(),
  attempts: z.array(VerificationAttemptSchema),
  currentStatus: z.enum(['VERIFIED', 'REJECTED', 'PENDING', 'MULTIPLE_ATTEMPTS']),
  wasReverified: z.boolean(),
});

export const VerifierPerformanceResponseSchema = z.object({
  verifierId: z.string().uuid(),
  verifierName: z.string().optional().nullable(),
  totalAttempts: z.number(),
  totalVerified: z.number(),
  totalRejected: z.number(),
  verificationRate: z.number(),
  averageTimeToVerifyHours: z.number(),
  documentsVerifiedPerDay: z.number(),
});

// ============================================================================
// QUERY & SEARCH
// ============================================================================

export const QueryDocumentsSchema = z.object({
  uploaderIds: z.array(z.string().uuid()).optional(),
  statuses: z.array(DocumentStatusEnum).optional(),
  categories: z.array(DocumentCategoryEnum).optional(),
  assetId: z.string().uuid().optional(),
  willId: z.string().uuid().optional(),
  identityForUserId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  storageProvider: z.string().optional(),
  documentNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  updatedAfter: z.string().datetime().optional(),
  updatedBefore: z.string().datetime().optional(),
  includeDeleted: z.boolean().default(false),
  hasExpired: z.boolean().optional(),
  retentionPolicy: z.string().optional(),
  verifiedBy: z.string().uuid().optional(),
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'filename', 'sizeBytes', 'expiryDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchDocumentsSchema = z.object({
  query: z.string().optional(),
  category: DocumentCategoryEnum.optional(),
  status: DocumentStatusEnum.optional(),
  uploaderId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const PaginatedDocumentsResponseSchema = z.object({
  data: z.array(DocumentResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// ============================================================================
// VERSIONING
// ============================================================================

export const CreateDocumentVersionSchema = z.object({
  changeNote: z.string().max(500).optional(),
});

export const CreateDocumentVersionResponseSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number(),
  documentId: z.string().uuid(),
  filename: z.string(),
  storagePath: z.string(),
  sizeBytes: z.number(),
  mimeType: z.string(),
  checksum: z.string(),
  changeNote: z.string().optional().nullable(),
  uploadedBy: z.string().uuid(),
  createdAt: dateSchema,
  downloadUrl: z.string().url().optional().nullable(),
});

export const DocumentVersionQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  sortBy: z.enum(['versionNumber', 'createdAt', 'fileSize']).default('versionNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export const BulkOperationSchema = z.object({
  action: BulkActionType,
  documentIds: z.array(z.string().uuid()).min(1),
  userIds: z.array(z.string().uuid()).optional(),
  status: DocumentStatusEnum.optional(),
  reason: z.string().optional(),
}).refine(
  data => {
    if (data.action === 'SHARE' || data.action === 'REVOKE_ACCESS') {
      return data.userIds && data.userIds.length > 0;
    }
    return true;
  },
  {
    message: 'userIds required for SHARE or REVOKE_ACCESS actions',
    path: ['userIds'],
  }
).refine(
  data => {
    if (data.action === 'CHANGE_STATUS') {
      return !!data.status;
    }
    return true;
  },
  {
    message: 'status required for CHANGE_STATUS action',
    path: ['status'],
  }
).refine(
  data => {
    if (data.action === 'CHANGE_STATUS' && data.status === 'REJECTED') {
      return !!data.reason;
    }
    return true;
  },
  {
    message: 'reason required when changing status to REJECTED',
    path: ['reason'],
  }
);

export const BulkOperationResponseSchema = z.object({
  successCount: z.number(),
  failedCount: z.number(),
  errors: z.array(z.object({
    documentId: z.string(),
    error: z.string(),
  })).optional(),
});

// ============================================================================
// ANALYTICS
// ============================================================================

export const DocumentAnalyticsResponseSchema = z.object({
  total: z.number(),
  byStatus: z.record(DocumentStatusEnum, z.number()),
  byCategory: z.record(DocumentCategoryEnum, z.number()),
  totalSizeBytes: z.number(),
  averageSizeBytes: z.number(),
  encrypted: z.number(),
  public: z.number(),
  expired: z.number(),
});

export const StorageAnalyticsResponseSchema = z.object({
  totalSizeBytes: z.number(),
  byCategory: z.record(DocumentCategoryEnum, z.number()),
  byStorageProvider: z.record(z.string(), z.number()),
  byUser: z.array(z.object({
    userId: z.string(),
    totalBytes: z.number(),
    documentCount: z.number(),
  })),
});

export const VerificationMetricsResponseSchema = z.object({
  totalVerified: z.number(),
  totalRejected: z.number(),
  totalPending: z.number(),
  totalProcessed: z.number(),
  successRate: z.number(),
  averageVerificationTimeHours: z.number(),
  byVerifier: z.record(z.string(), z.object({
    verified: z.number(),
    rejected: z.number(),
  })),
});

export const UploadAnalyticsResponseSchema = z.object({
  totalUploads: z.number(),
  byCategory: z.record(DocumentCategoryEnum, z.number()),
  byDay: z.array(z.object({
    date: z.string(),
    count: z.number(),
    totalBytes: z.number(),
  })),
  averageDailyUploads: z.number().optional(),
  peakUploadDay: z.object({
    date: z.string(),
    count: z.number(),
    totalBytes: z.number(),
  }).optional().nullable(),
});

export const DashboardAnalyticsResponseSchema = z.object({
  documents: DocumentAnalyticsResponseSchema,
  storage: StorageAnalyticsResponseSchema,
  verification: VerificationMetricsResponseSchema,
  uploads: UploadAnalyticsResponseSchema,
  timeRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;
export type DocumentCategory = z.infer<typeof DocumentCategoryEnum>;
export type RetentionPolicy = z.infer<typeof RetentionPolicyType>;
export type BulkAction = z.infer<typeof BulkActionType>;

export type DocumentPermissions = z.infer<typeof DocumentPermissionsSchema>;
export type Document = z.infer<typeof DocumentResponseSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionResponseSchema>;

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type UploadDocumentResponse = z.infer<typeof UploadDocumentResponseSchema>;

export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type UpdateDocumentResponse = z.infer<typeof UpdateDocumentResponseSchema>;
export type UpdateAccessInput = z.infer<typeof UpdateAccessSchema>;
export type AccessControlResponse = z.infer<typeof AccessControlResponseSchema>;

export type VerifyDocumentInput = z.infer<typeof VerifyDocumentSchema>;
export type VerifyDocumentResponse = z.infer<typeof VerifyDocumentResponseSchema>;
export type VerificationAttempt = z.infer<typeof VerificationAttemptSchema>;
export type DocumentVerificationHistory = z.infer<typeof DocumentVerificationHistoryResponseSchema>;
export type VerifierPerformance = z.infer<typeof VerifierPerformanceResponseSchema>;

export type QueryDocumentsInput = z.infer<typeof QueryDocumentsSchema>;
export type SearchDocumentsInput = z.infer<typeof SearchDocumentsSchema>;
export type PaginatedDocumentsResponse = z.infer<typeof PaginatedDocumentsResponseSchema>;

export type CreateDocumentVersionInput = z.infer<typeof CreateDocumentVersionSchema>;
export type CreateDocumentVersionResponse = z.infer<typeof CreateDocumentVersionResponseSchema>;
export type DocumentVersionQuery = z.infer<typeof DocumentVersionQuerySchema>;

export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
export type BulkOperationResponse = z.infer<typeof BulkOperationResponseSchema>;

export type DocumentAnalytics = z.infer<typeof DocumentAnalyticsResponseSchema>;
export type StorageAnalytics = z.infer<typeof StorageAnalyticsResponseSchema>;
export type VerificationMetrics = z.infer<typeof VerificationMetricsResponseSchema>;
export type UploadAnalytics = z.infer<typeof UploadAnalyticsResponseSchema>;
export type DashboardAnalytics = z.infer<typeof DashboardAnalyticsResponseSchema>;
