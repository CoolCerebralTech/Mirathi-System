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
}

/**
 * Statistics related to a specific verifier's performance.
 */
export interface VerifierPerformanceStats {
  totalAttempts: number;
  totalVerified: number;
  totalRejected: number;
  // Note: Avg processing time is a complex calculation better suited for
  // a dedicated analytics service, so it's excluded from the repo interface.
}

/**
 * Repository interface for the DocumentVerificationAttempt entity.
 * Defines the contract for the verification audit trail.
 */
export interface IDocumentVerificationAttemptRepository {
  /**
   * Saves a new DocumentVerificationAttempt entity.
   * As an immutable entity, this will always be an insert operation.
   */
  save(attempt: DocumentVerificationAttempt): Promise<void>;

  /**
   * Finds a single verification attempt by its unique identifier.
   */
  findById(id: VerificationAttemptId): Promise<DocumentVerificationAttempt | null>;

  /**
   * Finds the most recent verification attempt for a specific document.
   */
  findLatestForDocument(documentId: DocumentId): Promise<DocumentVerificationAttempt | null>;

  /**
   * Finds all verification attempts that match a set of filters.
   * Useful for retrieving the complete history for a document or all work by a verifier.
   *
   * @param filters The criteria to filter attempts by.
   * @param options Options for sorting, e.g., { sortBy: 'createdAt', sortOrder: 'desc' }.
   */
  findMany(
    filters: FindVerificationAttemptsFilters,
    options?: { sortBy?: 'createdAt'; sortOrder?: 'asc' | 'desc' },
  ): Promise<DocumentVerificationAttempt[]>;

  /**
   * Counts the total number of verification attempts for a document.
   */
  countForDocument(documentId: DocumentId): Promise<number>;

  /**
   * Provides performance statistics for a specific verifier within a given time range.
   */
  getPerformanceStatsForVerifier(
    verifierId: UserId,
    timeRange: { start: Date; end: Date },
  ): Promise<VerifierPerformanceStats>;

  /**
   * Checks if a specific verification attempt exists.
   */
  exists(id: VerificationAttemptId): Promise<boolean>;
}
