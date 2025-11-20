import { VerificationAttemptId, DocumentId, UserId, DocumentStatus } from '../value-objects';

// ============================================================================
// Data Transfer Objects (DTOs) and Query Models
// ============================================================================

/**
 * A lightweight, flattened representation of a DocumentVerificationAttempt for read operations.
 */
export interface DocumentVerificationAttemptDTO {
  id: string;
  documentId: string;
  verifierId: string;
  status: string; // "VERIFIED" | "REJECTED"
  reason: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface FindVerificationAttemptsFilters {
  documentId?: DocumentId;
  verifierId?: UserId;
  status?: DocumentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  reason?: string | null;
}

export interface VerificationQueryOptions {
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Enhanced Analytics Types
// ============================================================================

/**
 * Performance metrics for a specific verifier
 */
export interface VerifierPerformance {
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
}

/**
 * Complete verification history for a document
 */
export interface DocumentVerificationHistory {
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
}

/**
 * Daily verification statistics for timeline analysis
 */
export interface VerificationTimelineEntry {
  date: string;
  verified: number;
  rejected: number;
  total: number;
}

/**
 * Compliance audit data for regulatory reporting
 */
export interface VerificationComplianceAudit {
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
}

/**
 * Comprehensive verification metrics for reporting
 */
export interface VerificationMetrics {
  totalAttempts: number;
  totalVerified: number;
  totalRejected: number;
  totalPending: number;
  averageVerificationTimeHours: number;
  byVerifier: Record<string, { verified: number; rejected: number }>;
}

/**
 * Bulk operation result for verification attempts
 */
export interface BulkVerificationOperationResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ attemptId: string; error: string }>;
}

// ============================================================================
// Enhanced Query Repository Interface
// ============================================================================

/**
 * Defines the contract for read-only query operations for the verification audit trail.
 *
 * NOTE: There is no corresponding "command" repository for DocumentVerificationAttempt.
 * As a child entity of the Document aggregate, all modifications (creation)
 * must be performed through methods on the Document aggregate root (e.g., `verify()`, `reject()`)
 * and persisted via `IDocumentRepository.save()`. This interface provides the necessary
 * read-model access to the audit trail without violating aggregate boundaries.
 */
export interface IDocumentVerificationAttemptQueryRepository {
  // ============================================================================
  // CORE QUERY OPERATIONS
  // ============================================================================

  /**
   * Finds a single verification attempt by its unique identifier.
   */
  findById(id: VerificationAttemptId): Promise<DocumentVerificationAttemptDTO | null>;

  /**
   * Finds the most recent verification attempt for a specific document.
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVerificationAttemptDTO | null>;

  /**
   * Finds all verification attempts for a specific document.
   */
  findAllForDocument(
    documentId: DocumentId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]>;

  /**
   * Finds all verification attempts that match a set of filters.
   */
  findMany(
    filters: FindVerificationAttemptsFilters,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]>;

  /**
   * Finds all verification attempts made by a specific verifier.
   */
  findByVerifier(
    verifierId: UserId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttemptDTO[]>;

  /**
   * Checks if a verifier has already attempted to verify a specific document.
   */
  hasVerifierAttempted(documentId: DocumentId, verifierId: UserId): Promise<boolean>;

  /**
   * Counts the total number of verification attempts for a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Gets attempt counts for multiple documents in a single batch.
   * @returns A Map where the key is the documentId and the value is the attempt count.
   */
  getAttemptCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>>;

  // ============================================================================
  // ENHANCED ANALYTICS OPERATIONS (Optional - for advanced reporting)
  // ============================================================================

  /**
   * Gets comprehensive verification metrics for a time range
   */
  getVerificationMetrics?(timeRange: { start: Date; end: Date }): Promise<VerificationMetrics>;

  /**
   * Gets performance metrics for a specific verifier
   */
  getVerifierPerformance?(
    verifierId: UserId,
    timeRange?: { start: Date; end: Date },
  ): Promise<VerifierPerformance>;

  /**
   * Gets complete verification history for a document
   */
  getDocumentVerificationHistory?(documentId: DocumentId): Promise<DocumentVerificationHistory>;

  /**
   * Gets daily verification statistics for timeline analysis
   */
  getVerificationTimeline?(timeRange: {
    start: Date;
    end: Date;
  }): Promise<VerificationTimelineEntry[]>;

  /**
   * Gets compliance audit data for regulatory reporting
   */
  getComplianceAudit?(timeRange: { start: Date; end: Date }): Promise<VerificationComplianceAudit>;
}
