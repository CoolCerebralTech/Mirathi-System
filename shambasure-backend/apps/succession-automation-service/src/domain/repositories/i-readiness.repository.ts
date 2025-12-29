// src/succession-automation/src/domain/repositories/i-readiness.repository.ts
import { ReadinessAssessment } from '../aggregates/readiness-assessment.aggregate';
import { RiskCategory, RiskSeverity } from '../entities/risk-flag.entity';
import { ReadinessStatus } from '../value-objects/readiness-score.vo';

/**
 * Readiness Assessment Repository Interface
 *
 * PURPOSE: Define the contract for persisting and retrieving ReadinessAssessment aggregates
 *
 * DESIGN PRINCIPLES:
 * - Interface (not implementation) - keeps domain layer clean
 * - Aggregate-oriented (save/load entire aggregate, not individual risks)
 * - Query methods return domain objects, not DTOs
 * - Support for optimistic locking via version
 *
 * IMPLEMENTATION NOTE:
 * Infrastructure layer (PrismaReadinessRepository) will implement this.
 */
export const READINESS_REPOSITORY = 'READINESS_REPOSITORY';

export interface IReadinessRepository {
  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Save a new assessment or update existing
   * IMPORTANT: Must persist all child entities (RiskFlags) atomically
   */
  save(assessment: ReadinessAssessment): Promise<void>;

  /**
   * Find assessment by aggregate ID
   */
  findById(id: string): Promise<ReadinessAssessment | null>;

  /**
   * Find assessment by estate ID (most common query)
   * BUSINESS RULE: One assessment per estate
   */
  findByEstateId(estateId: string): Promise<ReadinessAssessment | null>;

  /**
   * Check if assessment exists for estate
   */
  existsByEstateId(estateId: string): Promise<boolean>;

  /**
   * Delete assessment (soft delete for audit trail)
   */
  delete(id: string): Promise<void>;

  // ==================== QUERY OPERATIONS ====================

  /**
   * Find all assessments with a specific status
   * Use case: Dashboard showing all "Ready to File" cases
   */
  findByStatus(status: ReadinessStatus): Promise<ReadinessAssessment[]>;

  /**
   * Find all assessments with critical risks
   * Use case: Priority queue for support team
   */
  findWithCriticalRisks(): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments with score in range
   * Use case: Analytics - "How many cases are 50-79% ready?"
   */
  findByScoreRange(minScore: number, maxScore: number): Promise<ReadinessAssessment[]>;

  /**
   * Find stale assessments (not updated in X hours)
   * Use case: Trigger recalculation for cases with old data
   */
  findStaleAssessments(staleHours: number): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments that can be completed (ready to file)
   * Use case: Nudge users to finalize their cases
   */
  findReadyToComplete(): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments with specific risk category
   * Use case: "Show me all cases with minor guardianship issues"
   */
  findByRiskCategory(category: RiskCategory): Promise<ReadinessAssessment[]>;

  // ==================== AGGREGATE STATISTICS ====================

  /**
   * Count total assessments
   */
  count(): Promise<number>;

  /**
   * Count assessments by status
   */
  countByStatus(status: ReadinessStatus): Promise<number>;

  /**
   * Get average readiness score across all active assessments
   */
  getAverageScore(): Promise<number>;

  /**
   * Get most common risk categories
   * Use case: Identify system-wide patterns
   */
  getMostCommonRisks(limit: number): Promise<Array<{ category: RiskCategory; count: number }>>;

  // ==================== BATCH OPERATIONS ====================

  /**
   * Save multiple assessments in a single transaction
   * Use case: Bulk recalculation triggered by external event
   */
  saveAll(assessments: ReadinessAssessment[]): Promise<void>;

  /**
   * Find assessments by multiple estate IDs
   * Use case: Batch processing for related estates
   */
  findByEstateIds(estateIds: string[]): Promise<ReadinessAssessment[]>;

  // ==================== RISK FLAG QUERIES ====================

  /**
   * Find all assessments with unresolved risks of specific severity
   * Use case: Support team prioritization
   */
  findWithUnresolvedRisksBySeverity(severity: RiskSeverity): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments with specific risk source
   * Use case: When Family Service updates a guardian, find affected assessments
   */
  findByRiskSource(sourceType: string, sourceEntityId: string): Promise<ReadinessAssessment[]>;

  /**
   * Count unresolved risks across all assessments
   * Use case: System health dashboard
   */
  countUnresolvedRisks(): Promise<number>;

  // ==================== ADVANCED QUERIES ====================

  /**
   * Find assessments that improved score in last N days
   * Use case: Success metrics, user engagement tracking
   */
  findRecentImprovements(days: number): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments blocked for longest time
   * Use case: Identify cases needing manual intervention
   */
  findLongestBlocked(limit: number): Promise<ReadinessAssessment[]>;

  /**
   * Find assessments with specific succession context attributes
   * Use case: "Show me all Islamic intestate cases with minors"
   */
  findByContextAttributes(filters: {
    regime?: string;
    marriageType?: string;
    religion?: string;
    hasMinors?: boolean;
  }): Promise<ReadinessAssessment[]>;

  // ==================== AUDIT & COMPLIANCE ====================

  /**
   * Get assessment history (all versions via event sourcing)
   * Use case: Legal audit trail
   */
  getHistory(assessmentId: string): Promise<
    Array<{
      version: number;
      eventType: string;
      occurredAt: Date;
      payload: any;
    }>
  >;

  /**
   * Find assessments modified by specific user
   * Use case: Track assessor activity
   */
  findByModifiedBy(userId: string): Promise<ReadinessAssessment[]>;

  /**
   * Get assessment snapshot at specific point in time
   * Use case: "What did this assessment look like 2 weeks ago?"
   */
  getSnapshotAt(assessmentId: string, timestamp: Date): Promise<ReadinessAssessment | null>;
}

/**
 * Query Options for Pagination & Sorting
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extended Repository Interface with Pagination Support
 */
export interface IReadinessRepositoryPaginated extends IReadinessRepository {
  /**
   * Find with pagination
   */
  findAll(options: QueryOptions): Promise<{
    items: ReadinessAssessment[];
    total: number;
    page: number;
    pages: number;
  }>;

  /**
   * Find by status with pagination
   */
  findByStatusPaginated(
    status: ReadinessStatus,
    options: QueryOptions,
  ): Promise<{
    items: ReadinessAssessment[];
    total: number;
    page: number;
    pages: number;
  }>;
}

/**
 * Repository Factory (for testing/mocking)
 */
export interface IReadinessRepositoryFactory {
  create(): IReadinessRepository;
}
