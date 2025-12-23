// domain/interfaces/repositories/idependency-assessment.repository.ts
import { DependencyLevel } from '@prisma/client';

import { DependencyAssessmentAggregate } from '../../aggregates/dependency-assessment.aggregate';
import { DomainEvent } from '../../base/domain-event';
import {
  DependencyRelationship,
  LegalDependant,
  S26ClaimStatus,
} from '../../entities/legal-dependant.entity';

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number; // 1-indexed
  pageSize: number; // Items per page
}

/**
 * Pagination Result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Search/Filter Options for Dependency Assessments
 */
export interface DependencySearchFilters {
  // Deceased filters
  deceasedId?: string;
  deceasedName?: string;
  dateOfDeathAfter?: Date;
  dateOfDeathBefore?: Date;

  // Dependant filters
  dependantId?: string;
  relationship?: DependencyRelationship[];
  isMinor?: boolean;
  isStudent?: boolean;
  hasDisability?: boolean;
  isS26Claimant?: boolean;

  // Status filters
  isFinalized?: boolean;
  hasCourtOrder?: boolean;
  hasPendingS26Claims?: boolean;

  // Dependency level filters
  dependencyLevel?: DependencyLevel[];
  minDependencyPercentage?: number;
  maxDependencyPercentage?: number;

  // Evidence filters
  hasEvidence?: boolean;
  isVerified?: boolean;

  // Court filters
  courtStation?: string;
  courtOrderNumber?: string;

  // Hotchpot filters
  hasGiftsInterVivos?: boolean;
}

/**
 * Sort Options
 */
export interface DependencySortOptions {
  field: 'createdAt' | 'updatedAt' | 'dateOfDeath' | 'lastCalculatedAt';
  direction: 'asc' | 'desc';
}

/**
 * Distribution Calculation Filters
 */
export interface DistributionFilters {
  minNetEntitlement?: number;
  maxNetEntitlement?: number;
  entitlementBasis?: string[];
  relationship?: DependencyRelationship[];
}

/**
 * Statistics Filters
 */
export interface StatisticsFilters {
  startDate?: Date;
  endDate?: Date;
  courtStation?: string;
  relationship?: DependencyRelationship[];
  isFinalized?: boolean;
}

/**
 * Dependency Statistics
 */
export interface DependencyStatistics {
  totalAssessments: number;
  finalizedAssessments: number;
  pendingAssessments: number;
  totalDependants: number;
  priorityDependants: number;
  conditionalDependants: number;
  s26Claimants: number;
  pendingS26Claims: number;
  approvedS26Claims: number;
  totalGiftsValue: number;
  averageDependantsPerAssessment: number;
  averageDependencyPercentage: number;
}

/**
 * Court Station Statistics
 */
export interface CourtStationStatistics {
  courtStation: string;
  totalAssessments: number;
  finalizedAssessments: number;
  totalDependants: number;
  s26ClaimsFiled: number;
  s26ClaimsApproved: number;
  averageProcessingDays: number;
  hotchpotApplications: number;
  totalHotchpotValue: number;
}

/**
 * Relationship Distribution Statistics
 */
export interface RelationshipStatistics {
  relationship: DependencyRelationship;
  count: number;
  averageDependencyPercentage: number;
  averageEntitlement: number;
  percentageOfTotal: number; // Percentage of all dependants
}

/**
 * S.26 Claim Statistics
 */
export interface S26ClaimStatistics {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  partiallyApprovedClaims: number;
  deniedClaims: number;
  withdrawnClaims: number;
  totalClaimedAmount: number;
  totalApprovedAmount: number;
  approvalRate: number; // Percentage
  averageClaimAmount: number;
  averageApprovedAmount: number;
}

/**
 * Hotchpot Statistics
 */
export interface HotchpotStatistics {
  totalGifts: number;
  totalValue: number;
  averageGiftValue: number;
  giftsPerDependant: number;
  mostCommonRecipient: DependencyRelationship;
}

/**
 * Assessment Summary (Projection)
 */
export interface AssessmentSummary {
  id: string;
  deceasedId: string;
  deceasedName: string;
  dateOfDeath: Date;
  totalDependants: number;
  priorityDependants: number;
  s26Claimants: number;
  isFinalized: boolean;
  finalizedAt?: Date;
  lastCalculatedAt?: Date;
  totalEstateValue?: number;
  totalHotchpotValue?: number;
  nextActionDue?: Date;
  nextActionType?: string;
}

/**
 * Dependant Summary (Projection)
 */
export interface DependantSummary {
  id: string;
  dependantId: string;
  dependantName: string;
  relationship: DependencyRelationship;
  dependencyPercentage: number;
  isMinor: boolean;
  isStudent: boolean;
  hasDisability: boolean;
  isPriorityDependant: boolean;
  isS26Claimant: boolean;
  s26ClaimStatus: S26ClaimStatus;
  grossEntitlement?: number;
  netEntitlement?: number;
  evidenceVerified: boolean;
}

/**
 * Distribution Report
 */
export interface DistributionReport {
  generatedAt: Date;
  assessmentId: string;
  deceasedName: string;
  totalEstateValue: number;
  hotchpotTotal: number;
  totalGiftsValue: number;
  distributionCalculations: Array<{
    dependantId: string;
    dependantName: string;
    relationship: string;
    dependencyPercentage: number;
    grossEntitlement: number;
    hotchpotDeduction: number;
    netEntitlement: number;
    entitlementBasis: string;
  }>;
  summary: {
    totalDependants: number;
    totalDistribution: number;
    remainingEstate: number;
    averageEntitlement: number;
    highestEntitlement: number;
    lowestEntitlement: number;
  };
}

/**
 * Compliance Report Detail
 */
export interface ComplianceDetail {
  assessmentId: string;
  deceasedName: string;
  issues: string[];
  missingEvidence: number;
  pendingActions: number;
  lastActionDate: Date;
  nextDeadline?: Date;
  complianceScore: number; // 0-100
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  totalAssessments: number;
  compliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  details: ComplianceDetail[];
}

/**
 * Assessment Version for Audit
 */
export interface AssessmentVersion {
  version: number;
  updatedAt: Date;
  updatedBy?: string;
  changes: Record<string, any>;
}

/**
 * Version Comparison
 */
export interface VersionComparison {
  version1: number;
  version2: number;
  differences: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * E-Filing Data for Court Integration
 */
export interface EfilingData {
  caseNumber: string;
  courtStation: string;
  filingDate: Date;
  assessmentId: string;
  deceasedName: string;
  dependantCount: number;
  s26ClaimCount: number;
  documents: EfilingDocument[];
}

/**
 * E-Filing Document
 */
export interface EfilingDocument {
  documentType: string;
  documentId: string;
  required: boolean;
  uploaded: boolean;
  uploadDate?: Date;
}

/**
 * DEPENDENCY ASSESSMENT REPOSITORY INTERFACE
 *
 * Manages persistence of DependencyAssessmentAggregate
 *
 * TRANSACTION MANAGEMENT:
 * - Each save() is atomic (aggregate + entities + events)
 * - findById() is read-only (no transaction needed)
 * - Batch operations use single transaction
 *
 * EVENT SOURCING:
 * - save() persists uncommitted events to event store
 * - Events are cleared after successful save
 * - Optimistic locking prevents concurrent updates
 *
 * KENYAN LAW CONSIDERATIONS:
 * - Must maintain complete audit trail for court review
 * - Cannot modify finalized assessments (S.29 LSA)
 * - Must track all S.26 court provision orders
 * - Must maintain gift records for S.35(3) hotchpot
 */
export interface IDependencyAssessmentRepository {
  // ============================================================================
  // CREATE & UPDATE (Write Operations)
  // ============================================================================

  /**
   * Save dependency assessment aggregate (create or update)
   *
   * ATOMIC OPERATION:
   * 1. Save aggregate root
   * 2. Save all LegalDependant entities
   * 3. Save all GiftInterVivos records
   * 4. Save all domain events to event store
   * 5. Clear uncommitted events
   *
   * OPTIMISTIC LOCKING:
   * - Checks version number before update
   * - Throws ConcurrencyError if version mismatch
   *
   * @param assessment - Aggregate to save
   * @returns Saved aggregate with updated version
   * @throws ConcurrencyError if version conflict
   * @throws RepositoryException on persistence failure
   */
  save(assessment: DependencyAssessmentAggregate): Promise<DependencyAssessmentAggregate>;

  /**
   * Save multiple assessments in single transaction
   *
   * USE CASE: Batch processing, migrations, court batch orders
   *
   * @param assessments - Array of aggregates
   * @returns Saved aggregates
   * @throws ConcurrencyError if any version conflict
   * @throws RepositoryException on persistence failure
   */
  saveMany(assessments: DependencyAssessmentAggregate[]): Promise<DependencyAssessmentAggregate[]>;

  // ============================================================================
  // READ (Query Operations)
  // ============================================================================

  /**
   * Find assessment by ID
   *
   * INCLUDES:
   * - All LegalDependant entities
   * - All GiftInterVivos records
   * - Deceased info snapshot
   * - Distribution calculations
   *
   * @param id - Assessment aggregate ID
   * @returns Assessment or null if not found
   */
  findById(id: string): Promise<DependencyAssessmentAggregate | null>;

  /**
   * Find assessment by deceased ID
   *
   * USE CASE:
   * - When person dies, check if assessment exists
   * - Estate processing needs assessment
   * - Court case lookup
   *
   * NOTE: Each deceased should have only ONE dependency assessment
   *
   * @param deceasedId - Deceased (family member) ID
   * @returns Assessment for deceased or null
   */
  findByDeceasedId(deceasedId: string): Promise<DependencyAssessmentAggregate | null>;

  /**
   * Find assessments by dependant ID (person appears as dependant)
   *
   * USE CASE:
   * - Person appears in multiple estates as dependant
   * - Legal history lookup
   * - Audit trail for repeated claimants
   *
   * @param dependantId - Dependant (family member) ID
   * @returns Assessments where person is a dependant
   */
  findByDependantId(dependantId: string): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments by court case number (S.26 claims)
   *
   * USE CASE:
   * - Court system integration
   * - Legal case lookup
   * - S.26 provision tracking
   *
   * @param courtCaseNumber - Court case reference
   * @returns Assessments linked to case
   */
  findByCourtCaseNumber(courtCaseNumber: string): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments by court order number
   *
   * USE CASE:
   * - Court registry lookup
   * - E-filing integration
   * - S.26 provision verification
   */
  findByCourtOrderNumber(courtOrderNumber: string): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Search assessments with filters and pagination
   *
   * USE CASE:
   * - Admin dashboard
   * - Compliance reports
   * - Court registry queries
   * - Estate processing queue
   *
   * @param filters - Search criteria
   * @param pagination - Page and size
   * @param sort - Sort options
   * @returns Paginated results
   */
  search(
    filters: DependencySearchFilters,
    pagination: PaginationOptions,
    sort?: DependencySortOptions,
  ): Promise<PaginatedResult<DependencyAssessmentAggregate>>;

  /**
   * Count assessments matching filters
   *
   * USE CASE:
   * - Dashboard statistics
   * - Reporting
   * - Resource planning
   *
   * @param filters - Count criteria
   * @returns Total count
   */
  count(filters: DependencySearchFilters): Promise<number>;

  // ============================================================================
  // S.26 COURT PROVISION QUERIES
  // ============================================================================

  /**
   * Find assessments with pending S.26 claims
   *
   * USE CASE:
   * - Court work queue
   * - Claim processing
   * - Notification system
   *
   * KENYAN LAW:
   * - S.26 LSA allows court-ordered provision
   * - Claims must be resolved before distribution
   *
   * @returns Assessments with pending S.26 claims
   */
  findWithPendingS26Claims(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments with approved S.26 claims
   *
   * USE CASE:
   * - Distribution processing
   * - Payment scheduling
   * - Court compliance tracking
   *
   * @returns Assessments with approved S.26 claims
   */
  findWithApprovedS26Claims(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments requiring court review
   *
   * COMBINES:
   * - Pending S.26 claims
   * - Disputed dependency assessments
   * - Complex family situations
   * - Large estate values
   *
   * USE CASE:
   * - Court officer work queue
   * - Priority processing
   *
   * @returns Assessments needing court attention
   */
  findRequiringCourtReview(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find S.26 claims by amount range
   *
   * USE CASE:
   * - Large claim monitoring
   * - Statistical analysis
   * - Risk assessment
   *
   * @param minAmount - Minimum claim amount
   * @param maxAmount - Maximum claim amount
   * @returns Assessments with claims in range
   */
  findS26ClaimsByAmountRange(
    minAmount: number,
    maxAmount?: number,
  ): Promise<DependencyAssessmentAggregate[]>;

  // ============================================================================
  // HOTCHPOT QUERIES (S.35(3) LSA)
  // ============================================================================

  /**
   * Find assessments with gifts inter vivos
   *
   * USE CASE:
   * - Hotchpot calculation
   * - Fair distribution enforcement
   * - Gift tax implications
   *
   * KENYAN LAW:
   * - S.35(3) LSA requires gifts brought into estate
   * - Ensures equal treatment of children
   *
   * @returns Assessments with recorded gifts
   */
  findWithGiftsInterVivos(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments with significant gifts
   *
   * @param minValue - Minimum gift value
   * @returns Assessments with gifts above threshold
   */
  findWithSignificantGifts(minValue: number): Promise<DependencyAssessmentAggregate[]>;

  // ============================================================================
  // FINALIZATION & DISTRIBUTION QUERIES
  // ============================================================================

  /**
   * Find assessments ready for finalization
   *
   * USE CASE:
   * - Estate distribution workflow
   * - Automated processing
   * - Notification system
   *
   * CRITERIA:
   * - All dependants identified
   * - All evidence verified
   * - All S.26 claims resolved
   * - Estate value known
   *
   * @returns Assessments ready to finalize
   */
  findReadyToFinalize(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments pending distribution
   *
   * USE CASE:
   * - Payment processing queue
   * - Estate executor dashboard
   * - Compliance monitoring
   *
   * @returns Finalized assessments not yet distributed
   */
  findPendingDistribution(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments with distribution calculations
   *
   * @param filters - Distribution calculation filters
   * @returns Assessments with matching distributions
   */
  findWithDistributionCalculations(
    filters?: DistributionFilters,
  ): Promise<DependencyAssessmentAggregate[]>;

  // ============================================================================
  // COMPLIANCE & EVIDENCE QUERIES
  // ============================================================================

  /**
   * Find assessments with missing evidence
   *
   * USE CASE:
   * - Compliance monitoring
   * - Document collection workflow
   * - Court reminders
   *
   * @returns Assessments missing required evidence
   */
  findWithMissingEvidence(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments with unverified dependants
   *
   * USE CASE:
   * - Verification workflow
   * - Court officer assignments
   * - Quality control
   *
   * @returns Assessments with unverified dependants
   */
  findWithUnverifiedDependants(): Promise<DependencyAssessmentAggregate[]>;

  /**
   * Find assessments exceeding time limits
   *
   * USE CASE:
   * - Stuck case monitoring
   * - Performance tracking
   * - Escalation procedures
   *
   * @param maxDays - Maximum days allowed
   * @returns Assessments exceeding time limit
   */
  findExceedingTimeLimits(maxDays: number): Promise<DependencyAssessmentAggregate[]>;

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get dependency assessment statistics
   *
   * USE CASE:
   * - Dashboard summary
   * - Management reports
   * - Court system integration
   *
   * @param filters - Statistics criteria
   * @returns Comprehensive statistics
   */
  getStatistics(filters?: StatisticsFilters): Promise<DependencyStatistics>;

  /**
   * Get statistics by court station
   *
   * USE CASE:
   * - Regional court performance
   * - Resource allocation
   * - Workload distribution
   *
   * @returns Statistics grouped by court station
   */
  getStatisticsByCourtStation(): Promise<CourtStationStatistics[]>;

  /**
   * Get relationship distribution statistics
   *
   * USE CASE:
   * - Demographic analysis
   * - Policy planning
   * - Legal trend analysis
   *
   * @returns Statistics by relationship type
   */
  getRelationshipStatistics(): Promise<RelationshipStatistics[]>;

  /**
   * Get S.26 claim statistics
   *
   * USE CASE:
   * - Court claim processing metrics
   * - Success rate analysis
   * - Claim pattern analysis
   *
   * @returns S.26 claim statistics
   */
  getS26ClaimStatistics(): Promise<S26ClaimStatistics>;

  /**
   * Get hotchpot statistics
   *
   * USE CASE:
   * - Gift pattern analysis
   * - Estate planning insights
   * - Tax compliance monitoring
   *
   * @returns Hotchpot statistics
   */
  getHotchpotStatistics(): Promise<HotchpotStatistics>;

  /**
   * Get assessment summary (lightweight projection)
   *
   * USE CASE:
   * - Dashboard listings
   * - Quick overviews
   * - Mobile app views
   *
   * @param id - Assessment ID
   * @returns Summary data
   */
  getAssessmentSummary(id: string): Promise<AssessmentSummary>;

  /**
   * Get dependant summary for assessment
   *
   * USE CASE:
   * - Assessment detail view
   * - Court hearing preparation
   * - Family consultation
   *
   * @param assessmentId - Assessment ID
   * @returns Dependant summaries
   */
  getDependantSummaries(assessmentId: string): Promise<DependantSummary[]>;

  /**
   * Generate distribution report
   *
   * USE CASE:
   * - Estate distribution documentation
   * - Court approval submission
   * - Family notification
   *
   * @param assessmentId - Assessment ID
   * @returns Detailed distribution report
   */
  generateDistributionReport(assessmentId: string): Promise<DistributionReport>;

  /**
   * Generate compliance report
   *
   * USE CASE:
   * - Monthly court reports
   * - Regulatory compliance
   * - Audit preparation
   *
   * @param filters - Report criteria
   * @returns Detailed compliance report
   */
  generateComplianceReport(filters: StatisticsFilters): Promise<ComplianceReport>;

  /**
   * Get data for e-filing integration
   *
   * USE CASE:
   * - Court e-filing system integration
   * - Automated document submissions
   * - Digital court processes
   *
   * @param courtStation - Court location
   * @returns Data formatted for e-filing
   */
  getAssessmentsForEfiling(courtStation: string): Promise<EfilingData[]>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk update assessment status
   *
   * USE CASE:
   * - Batch status updates
   * - System migrations
   * - Data corrections
   * - Court batch orders
   *
   * @param ids - Assessment IDs
   * @param status - New status (e.g., FINALIZED, PENDING_REVIEW)
   * @param updatedBy - User performing update
   */
  bulkUpdateAssessmentStatus(ids: string[], status: string, updatedBy: string): Promise<void>;

  /**
   * Bulk finalize assessments
   *
   * USE CASE:
   * - End-of-month processing
   * - Court batch finalization
   * - System automation
   *
   * @param ids - Assessment IDs
   * @param finalizedBy - User performing finalization
   */
  bulkFinalizeAssessments(ids: string[], finalizedBy: string): Promise<void>;

  /**
   * Bulk soft delete
   *
   * USE CASE:
   * - Batch deletions
   * - Data cleanup
   * - Legal compliance actions
   *
   * @param ids - Assessment IDs
   * @param deletedBy - User performing deletion
   * @param reason - Reason for deletion
   */
  bulkSoftDelete(ids: string[], deletedBy: string, reason: string): Promise<void>;

  // ============================================================================
  // DEPENDANT-SPECIFIC QUERIES (Within Aggregate)
  // ============================================================================

  /**
   * Find dependant within assessment
   *
   * USE CASE:
   * - Individual dependant lookup
   * - Evidence verification
   * - Status updates
   *
   * @param assessmentId - Assessment ID
   * @param dependantId - Dependant ID
   * @returns Dependant entity if found
   */
  findDependantInAssessment(
    assessmentId: string,
    dependantId: string,
  ): Promise<LegalDependant | null>;

  /**
   * Check if person is already a dependant in assessment
   *
   * USE CASE:
   * - Prevent duplicate dependants
   * - Family relationship validation
   * - Data integrity checks
   *
   * @param assessmentId - Assessment ID
   * @param dependantId - Dependant ID
   * @returns True if person is already a dependant
   */
  isPersonAlreadyDependant(assessmentId: string, dependantId: string): Promise<boolean>;

  /**
   * Get all dependants by relationship type
   *
   * USE CASE:
   * - Family structure analysis
   * - Statistical reporting
   * - Custom distribution rules
   *
   * @param assessmentId - Assessment ID
   * @param relationship - Relationship type
   * @returns Dependants with specified relationship
   */
  getDependantsByRelationship(
    assessmentId: string,
    relationship: DependencyRelationship,
  ): Promise<LegalDependant[]>;

  /**
   * Get dependants requiring verification
   *
   * USE CASE:
   * - Verification workflow
   * - Court officer assignment
   * - Compliance tracking
   *
   * @param assessmentId - Assessment ID
   * @returns Dependants needing verification
   */
  getDependantsRequiringVerification(assessmentId: string): Promise<LegalDependant[]>;

  // ============================================================================
  // SOFT DELETE & ARCHIVING
  // ============================================================================

  /**
   * Soft delete assessment (legal retention requirement)
   *
   * KENYAN LAW:
   * - Cannot hard delete court records
   * - Must maintain audit trail for appeals
   * - Estate records have long retention period
   *
   * @param id - Assessment ID
   * @param deletedBy - User performing deletion
   * @param reason - Legal reason for deletion
   */
  softDelete(id: string, deletedBy: string, reason: string): Promise<void>;

  /**
   * Restore soft-deleted assessment
   *
   * USE CASE:
   * - Accidental deletion
   * - Court order restoration
   * - Appeal reopening
   *
   * @param id - Assessment ID
   * @param restoredBy - User performing restoration
   */
  restore(id: string, restoredBy: string): Promise<void>;

  /**
   * Find soft-deleted assessments
   *
   * USE CASE:
   * - Audit/recovery
   * - Legal compliance review
   * - Data cleanup procedures
   *
   * @param pagination - Page options
   * @returns Deleted assessments
   */
  findDeleted(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<DependencyAssessmentAggregate>>;

  // ============================================================================
  // VERSION CONTROL & AUDIT
  // ============================================================================

  /**
   * Get version history of assessment
   *
   * USE CASE:
   * - Audit trail
   * - Legal compliance
   * - Change tracking
   * - Court dispute resolution
   *
   * @param id - Assessment ID
   * @returns Version history
   */
  getVersionHistory(id: string): Promise<AssessmentVersion[]>;

  /**
   * Compare two versions of assessment
   *
   * USE CASE:
   * - Legal dispute resolution
   * - Change analysis
   * - Audit investigations
   * - Error correction tracking
   *
   * @param id - Assessment ID
   * @param version1 - First version
   * @param version2 - Second version
   * @returns Differences between versions
   */
  compareVersions(id: string, version1: number, version2: number): Promise<VersionComparison>;

  // ============================================================================
  // EVENT SOURCING SUPPORT
  // ============================================================================

  /**
   * Rebuild aggregate from event stream
   *
   * USE CASE:
   * - Event sourcing recovery
   * - Temporal queries ("What was state on date X?")
   * - Audit trail reconstruction
   * - Legal state verification
   *
   * @param id - Assessment ID
   * @param upToDate - Rebuild state up to this date
   * @returns Assessment in historical state
   */
  rebuildFromEvents(id: string, upToDate?: Date): Promise<DependencyAssessmentAggregate | null>;

  /**
   * Get all domain events for assessment
   *
   * USE CASE:
   * - Legal audit trail
   * - Event replay
   * - Debugging
   * - Court evidence
   *
   * @param id - Assessment ID
   * @returns All events in chronological order
   */
  getEventHistory(id: string): Promise<DomainEvent[]>;
}

/**
 * Repository Exception
 *
 * Base exception for all repository errors
 */
export class RepositoryException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryException';
    Object.setPrototypeOf(this, RepositoryException.prototype);
  }
}

/**
 * Concurrency Exception
 *
 * Thrown when optimistic locking fails
 */
export class ConcurrencyError extends RepositoryException {
  constructor(
    message: string,
    public readonly aggregateId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(message, 'CONCURRENCY_ERROR');
    this.name = 'ConcurrencyError';
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

/**
 * Not Found Exception
 */
export class DependencyAssessmentNotFoundException extends RepositoryException {
  constructor(id: string) {
    super(`Dependency Assessment with ID ${id} not found`, 'NOT_FOUND');
    this.name = 'DependencyAssessmentNotFoundException';
    Object.setPrototypeOf(this, DependencyAssessmentNotFoundException.prototype);
  }
}

/**
 * Duplicate Dependant Exception
 */
export class DuplicateDependantException extends RepositoryException {
  constructor(assessmentId: string, dependantId: string) {
    super(
      `Dependant ${dependantId} already exists in assessment ${assessmentId}`,
      'DUPLICATE_DEPENDANT',
    );
    this.name = 'DuplicateDependantException';
    Object.setPrototypeOf(this, DuplicateDependantException.prototype);
  }
}

/**
 * Assessment Finalized Exception
 */
export class AssessmentFinalizedException extends RepositoryException {
  constructor(id: string) {
    super(`Assessment ${id} is finalized and cannot be modified`, 'FINALIZED');
    this.name = 'AssessmentFinalizedException';
    Object.setPrototypeOf(this, AssessmentFinalizedException.prototype);
  }
}

/**
 * Transaction Exception
 *
 * Thrown when database transaction fails
 */
export class TransactionException extends RepositoryException {
  constructor(message: string, cause?: Error) {
    super(message, 'TRANSACTION_ERROR', cause);
    this.name = 'TransactionException';
    Object.setPrototypeOf(this, TransactionException.prototype);
  }
}

/**
 * Cache Interface (Optional)
 */
export interface ICacheableRepository {
  clearCache(id: string): Promise<void>;
  clearAllCache(): Promise<void>;
}

/**
 * Event Store Interface (Optional - for event sourcing)
 */
export interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsSince(aggregateId: string, sinceVersion: number): Promise<DomainEvent[]>;
}

// ✅ export a value token to use with @Inject()
export const DEPENDENCY_ASSESSMENT_REPOSITORY = 'IDependencyAssessmentRepository';
