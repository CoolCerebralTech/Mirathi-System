import { Prisma, DocumentStatus } from '@prisma/client';

/**
 * DocumentVerificationAttempt Entity - Persistence Layer
 *
 * Represents the document_verification_attempts table structure.
 * Immutable audit trail of verification decisions.
 */
export interface DocumentVerificationAttemptEntity {
  id: string;
  documentId: string;
  verifierId: string;
  status: DocumentStatus;
  reason: string | null;
  metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  createdAt: Date;
}

/**
 * Create input for new verification attempts
 */
export type CreateDocumentVerificationAttemptEntity = Omit<
  DocumentVerificationAttemptEntity,
  'createdAt'
>;
/**
 * Input for verification attempt creation (aligns with Prisma create input)
 */
export type VerificationAttemptCreateInput = {
  documentId: string;
  verifierId: string;
  status: DocumentStatus;
  reason?: string | null;
  metadata?: Prisma.JsonValue | null;
};

/**
 * Query filters for verification attempt search
 */
export type VerificationAttemptWhereInput = {
  id?: string | { in: string[] };
  documentId?: string | { in: string[] };
  verifierId?: string | { in: string[] };
  status?: string | { in: string[] };
  createdAt?: { gte?: Date; lte?: Date };
  reason?: string | null | { not: null };
  AND?: VerificationAttemptWhereInput[];
  OR?: VerificationAttemptWhereInput[];
};

/**
 * Sorting options for verification attempt queries
 */
export type VerificationAttemptOrderByInput = {
  createdAt?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
};

/**
 * NEW: Specialized types for verification analytics and reporting
 */

/**
 * Verification metrics for reporting
 */
export type VerificationMetrics = {
  totalAttempts: number;
  verifiedCount: number;
  rejectedCount: number;
  averageProcessingTimeHours: number;
  byVerifier: Array<{
    verifierId: string;
    verified: number;
    rejected: number;
    total: number;
    rejectionRate: number;
  }>;
  byCategory?: Array<{
    category: string;
    verified: number;
    rejected: number;
    pending: number;
  }>;
};

/**
 * Type for verification timeline analysis
 */
export type VerificationTimelineEntry = {
  date: string;
  verified: number;
  rejected: number;
  total: number;
};

/**
 * Type for verifier performance metrics
 */
export type VerifierPerformance = {
  verifierId: string;
  totalAttempts: number;
  verified: number;
  rejected: number;
  averageProcessingTimeHours: number;
  commonRejectionReasons: Array<{
    reason: string;
    count: number;
  }>;
  lastActive: Date;
};

/**
 * Type for document verification history
 */
export type DocumentVerificationHistory = {
  documentId: string;
  documentName: string;
  totalAttempts: number;
  currentStatus: string;
  verificationTimeline: Array<{
    attemptId: string;
    verifierId: string;
    status: string;
    reason: string | null;
    createdAt: Date;
  }>;
  firstVerifiedAt: Date | null;
  lastVerifiedAt: Date | null;
};

/**
 * Type for bulk verification operations
 */
export type BulkVerificationOperationResult = {
  successCount: number;
  failedCount: number;
  errors: Array<{ attemptId: string; error: string }>;
};

/**
 * Type for compliance audit data
 */
export type VerificationComplianceAudit = {
  timeRange: { start: Date; end: Date };
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  averageVerificationTime: number;
  complianceRate: number;
  verifierActivity: Array<{
    verifierId: string;
    activityCount: number;
    lastActivity: Date;
  }>;
};
