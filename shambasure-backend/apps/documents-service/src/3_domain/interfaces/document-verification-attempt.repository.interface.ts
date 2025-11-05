import { DocumentVerificationAttempt } from '../models/document-verification-attempt.model';
import { VerificationAttemptId, DocumentId, UserId, DocumentStatus } from '../value-objects';

/**
 * Query filters for fetching document verification attempts.
 */
export interface FindVerificationAttemptsFilters {
  documentId?: DocumentId;
  verifierId?: UserId;
  status?: DocumentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  isSuccessful?: boolean;
  isRejection?: boolean;
}

/**
 * Options for sorting and pagination.
 */
export interface VerificationQueryOptions {
  sortBy?: 'createdAt' | 'verifierId';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Statistics related to a specific verifier's performance.
 */
export interface VerifierPerformanceStats {
  verifierId: string;
  totalAttempts: number;
  totalVerified: number;
  totalRejected: number;
  verificationRate: number; // Percentage
  averageTimeToVerifyHours: number;
  documentsVerifiedPerDay: number;
}

/**
 * Document verification history summary.
 */
export interface DocumentVerificationHistory {
  documentId: string;
  totalAttempts: number;
  latestAttempt: DocumentVerificationAttempt | null;
  firstAttempt: DocumentVerificationAttempt | null;
  attempts: DocumentVerificationAttempt[];
  currentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'MULTIPLE_ATTEMPTS';
  wasReverified: boolean; // If verified after rejection
}

/**
 * Verification metrics for analytics.
 */
export interface VerificationMetrics {
  totalAttempts: number;
  totalVerified: number;
  totalRejected: number;
  uniqueDocuments: number;
  uniqueVerifiers: number;
  averageAttemptsPerDocument: number;
  documentsWithMultipleAttempts: number;
  topRejectionReasons: Array<{ reason: string; count: number }>;
}

/**
 * Daily verification statistics.
 */
export interface DailyVerificationStats {
  date: string;
  totalAttempts: number;
  verified: number;
  rejected: number;
  uniqueVerifiers: number;
  uniqueDocuments: number;
}

/**
 * Repository interface for the DocumentVerificationAttempt entity.
 * Defines the contract for the verification audit trail.
 */
export interface IDocumentVerificationAttemptRepository {
  // ============================================================================
  // CORE PERSISTENCE
  // ============================================================================

  /**
   * Saves a new DocumentVerificationAttempt entity.
   * As an immutable entity, this will always be an insert operation.
   */
  save(attempt: DocumentVerificationAttempt): Promise<void>;

  /**
   * Saves multiple attempts in a transaction.
   */
  saveMany(attempts: DocumentVerificationAttempt[]): Promise<void>;

  // ============================================================================
  // CORE FINDERS
  // ============================================================================

  /**
   * Finds a single verification attempt by its unique identifier.
   */
  findById(id: VerificationAttemptId): Promise<DocumentVerificationAttempt | null>;

  /**
   * Finds the most recent verification attempt for a specific document.
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVerificationAttempt | null>;

  /**
   * Finds the first verification attempt for a specific document.
   */
  findFirstForDocument(documentId: DocumentId): Promise<DocumentVerificationAttempt | null>;

  /**
   * Finds all verification attempts for a specific document.
   */
  findAllForDocument(
    documentId: DocumentId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds all verification attempts that match a set of filters.
   */
  findMany(
    filters: FindVerificationAttemptsFilters,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds all verification attempts made by a specific verifier.
   */
  findByVerifier(
    verifierId: UserId,
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds multiple attempts by their IDs (batch fetch).
   */
  findByIds(ids: VerificationAttemptId[]): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds successful verification attempts within a time range.
   */
  findSuccessfulAttempts(
    timeRange: { start: Date; end: Date },
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds rejected attempts within a time range.
   */
  findRejectedAttempts(
    timeRange: { start: Date; end: Date },
    options?: VerificationQueryOptions,
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Finds documents with multiple verification attempts.
   */
  findDocumentsWithMultipleAttempts(): Promise<
    Array<{ documentId: DocumentId; attemptCount: number }>
  >;

  /**
   * Finds recent attempts (within specified hours).
   */
  findRecentAttempts(withinHours: number): Promise<DocumentVerificationAttempt[]>;

  // ============================================================================
  // VALIDATION & CHECKS
  // ============================================================================

  /**
   * Checks if a specific verification attempt exists.
   */
  exists(id: VerificationAttemptId): Promise<boolean>;

  /**
   * Checks if a document has been verified.
   */
  hasBeenVerified(documentId: DocumentId): Promise<boolean>;

  /**
   * Checks if a document has been rejected.
   */
  hasBeenRejected(documentId: DocumentId): Promise<boolean>;

  /**
   * Checks if a document has multiple verification attempts.
   */
  hasMultipleAttempts(documentId: DocumentId): Promise<boolean>;

  /**
   * Checks if a verifier has already attempted to verify a document.
   */
  hasVerifierAttempted(documentId: DocumentId, verifierId: UserId): Promise<boolean>;

  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================

  /**
   * Counts the total number of verification attempts for a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Counts successful verifications for a document.
   */
  countSuccessfulForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Counts rejections for a document.
   */
  countRejectionsForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Gets comprehensive verification history for a document.
   */
  getDocumentHistory(documentId: DocumentId): Promise<DocumentVerificationHistory>;

  /**
   * Provides performance statistics for a specific verifier within a given time range.
   */
  getPerformanceStatsForVerifier(
    verifierId: UserId,
    timeRange: { start: Date; end: Date },
  ): Promise<VerifierPerformanceStats>;

  /**
   * Gets verification metrics across all documents for a time range.
   */
  getVerificationMetrics(timeRange: { start: Date; end: Date }): Promise<VerificationMetrics>;

  /**
   * Gets daily verification statistics.
   */
  getDailyStats(timeRange: { start: Date; end: Date }): Promise<DailyVerificationStats[]>;

  /**
   * Gets top verifiers by activity.
   */
  getTopVerifiers(
    limit: number,
    timeRange?: { start: Date; end: Date },
  ): Promise<Array<VerifierPerformanceStats>>;

  /**
   * Gets most common rejection reasons.
   */
  getTopRejectionReasons(
    limit: number,
    timeRange?: { start: Date; end: Date },
  ): Promise<Array<{ reason: string; count: number; percentage: number }>>;

  /**
   * Gets verification turnaround time statistics.
   */
  getTurnaroundTimeStats(timeRange: { start: Date; end: Date }): Promise<{
    averageHours: number;
    medianHours: number;
    minHours: number;
    maxHours: number;
  }>;

  /**
   * Gets verifier workload distribution.
   */
  getVerifierWorkload(timeRange?: { start: Date; end: Date }): Promise<
    Array<{
      verifierId: string;
      totalAttempts: number;
      verified: number;
      rejected: number;
      workloadPercentage: number;
    }>
  >;

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Deletes all attempts for a document (when document is hard-deleted).
   * @returns Number of attempts deleted
   */
  deleteAllForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Deletes attempts older than specified date for data retention.
   * @returns Number of attempts deleted
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Archives old verification attempts.
   * @returns Number of attempts archived
   */
  archiveOldAttempts(olderThan: Date): Promise<number>;

  /**
   * Deletes multiple attempts by their IDs.
   * @returns Number of attempts deleted
   */
  deleteMany(ids: VerificationAttemptId[]): Promise<number>;

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Finds attempts for multiple documents.
   */
  findForDocuments(documentIds: DocumentId[]): Promise<Map<string, DocumentVerificationAttempt[]>>;

  /**
   * Gets attempt counts for multiple documents.
   */
  getAttemptCountsForDocuments(documentIds: DocumentId[]): Promise<Map<string, number>>;

  /**
   * Gets latest attempts for multiple documents.
   */
  getLatestAttemptsForDocuments(
    documentIds: DocumentId[],
  ): Promise<Map<string, DocumentVerificationAttempt | null>>;
}
