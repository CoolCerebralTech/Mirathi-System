// domain/interfaces/repositories/iguardianship.repository.ts
import { GuardianshipAggregate } from '../../aggregates/guardianship.aggregate';
import { DomainEvent } from '../../base/domain-event';

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
 * Search/Filter Options for Guardianships
 */
export interface GuardianshipSearchFilters {
  // Ward filters
  wardId?: string;
  wardIsMinor?: boolean;
  wardIsIncapacitated?: boolean;

  // Guardian filters
  guardianId?: string;
  guardianType?: string; // GuardianType enum

  // Status filters
  isActive?: boolean;

  // Date filters
  appointedAfter?: Date;
  appointedBefore?: Date;
  establishedAfter?: Date;
  establishedBefore?: Date;

  // Compliance filters
  hasExpiredBonds?: boolean;
  hasOverdueReports?: boolean;
  requiresPropertyBond?: boolean;

  // Court filters
  courtStation?: string;
  courtCaseNumber?: string;

  // Customary law
  customaryLawApplies?: boolean;
  customaryEthnicGroup?: string;
}

/**
 * Sort Options
 */
export interface GuardianshipSortOptions {
  field: 'establishedDate' | 'updatedAt' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Compliance Filters for Reporting
 */
export interface ComplianceFilters {
  startDate?: Date;
  endDate?: Date;
  courtStation?: string;
  guardianType?: string;
  isCompliant?: boolean;
}

/**
 * Compliance Statistics
 */
export interface ComplianceStatistics {
  totalActive: number;
  totalDissolved: number;
  s72Compliant: number;
  s72NonCompliant: number;
  s73Compliant: number;
  s73NonCompliant: number;
  expiredBondsCount: number;
  overdueReportsCount: number;
  complianceRate: number; // Percentage
}

/**
 * Court Station Statistics
 */
export interface CourtStationStatistics {
  totalGuardianships: number;
  activeGuardianships: number;
  averageGuardianshipDuration: number; // days
  complianceRate: number; // percentage
}

/**
 * Guardianship Summary (Projection)
 */
export interface GuardianshipSummary {
  id: string;
  wardId: string;
  wardName: string;
  wardAge: number;
  guardianCount: number;
  status: string;
  establishedDate: Date;
  lastComplianceCheck: Date;
  s72Compliant: boolean;
  s73Compliant: boolean;
  nextActionDue?: Date;
  nextActionType?: string;
}

/**
 * Compliance Report Detail
 */
export interface ComplianceDetail {
  guardianshipId: string;
  wardName: string;
  wardId: string;
  guardianNames: string[];
  issues: string[];
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
  totalGuardianships: number;
  compliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  details: ComplianceDetail[];
}

/**
 * Guardianship Version for Audit
 */
export interface GuardianshipVersion {
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
  guardianshipId: string;
  wardName: string;
  guardianNames: string[];
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
 * Guardianship Repository Interface
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
 */
export interface IGuardianshipRepository {
  // ============================================================================
  // CREATE & UPDATE (Write Operations)
  // ============================================================================

  /**
   * Save guardianship aggregate (create or update)
   *
   * ATOMIC OPERATION:
   * 1. Save aggregate root
   * 2. Save all Guardian entities
   * 3. Save all domain events to event store
   * 4. Clear uncommitted events
   *
   * OPTIMISTIC LOCKING:
   * - Checks version number before update
   * - Throws ConcurrencyError if version mismatch
   *
   * @param guardianship - Aggregate to save
   * @returns Saved aggregate with updated version
   * @throws ConcurrencyError if version conflict
   * @throws RepositoryException on persistence failure
   */
  save(guardianship: GuardianshipAggregate): Promise<GuardianshipAggregate>;

  /**
   * Save multiple guardianships in single transaction
   *
   * USE CASE: Batch processing, migrations
   *
   * @param guardianships - Array of aggregates
   * @returns Saved aggregates
   * @throws ConcurrencyError if any version conflict
   * @throws RepositoryException on persistence failure
   */
  saveMany(guardianships: GuardianshipAggregate[]): Promise<GuardianshipAggregate[]>;

  // ============================================================================
  // READ (Query Operations)
  // ============================================================================

  /**
   * Find guardianship by ID
   *
   * INCLUDES:
   * - All Guardian entities
   * - All Value Objects (CourtOrder, GuardianBond, etc.)
   * - Ward info snapshot
   *
   * @param id - Guardianship aggregate ID
   * @returns Guardianship or null if not found
   */
  findById(id: string): Promise<GuardianshipAggregate | null>;

  /**
   * Find guardianship by ward ID
   *
   * USE CASE:
   * - Family service needs to check if ward has guardian
   * - Court needs to verify guardianship status
   *
   * NOTE: A ward should only have ONE active guardianship
   *
   * @param wardId - Ward (family member) ID
   * @returns Active guardianship for ward or null
   */
  findActiveByWardId(wardId: string): Promise<GuardianshipAggregate | null>;

  /**
   * Find all guardianships for a ward (including historical)
   *
   * USE CASE:
   * - Legal history lookup
   * - Audit trail
   * - Succession case research
   *
   * @param wardId - Ward ID
   * @returns All guardianships (active and dissolved)
   */
  findAllByWardId(wardId: string): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships where person is a guardian
   *
   * USE CASE:
   * - User dashboard: "Show all my ward assignments"
   * - Guardian report: "All guardianships I'm responsible for"
   *
   * @param guardianId - Guardian (user) ID
   * @param activeOnly - Only return active guardianships?
   * @returns Guardianships where person is guardian
   */
  findByGuardianId(guardianId: string, activeOnly?: boolean): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships by court case number
   *
   * USE CASE:
   * - Court system integration
   * - Legal case lookup
   *
   * @param courtCaseNumber - Court case reference
   * @returns Guardianships linked to case
   */
  findByCourtCaseNumber(courtCaseNumber: string): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships by court registry number
   *
   * USE CASE:
   * - Court registry lookup
   * - E-filing integration
   */
  findByCourtRegistryNumber(registryNumber: string): Promise<GuardianshipAggregate[]>;

  /**
   * Search guardianships with filters and pagination
   *
   * USE CASE:
   * - Admin dashboard
   * - Compliance reports
   * - Court registry queries
   *
   * @param filters - Search criteria
   * @param pagination - Page and size
   * @param sort - Sort options
   * @returns Paginated results
   */
  search(
    filters: GuardianshipSearchFilters,
    pagination: PaginationOptions,
    sort?: GuardianshipSortOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>>;

  /**
   * Count guardianships matching filters
   *
   * USE CASE:
   * - Dashboard statistics
   * - Reporting
   *
   * @param filters - Count criteria
   * @returns Total count
   */
  count(filters: GuardianshipSearchFilters): Promise<number>;

  // ============================================================================
  // COMPLIANCE QUERIES (S.72 & S.73 LSA)
  // ============================================================================

  /**
   * Find guardianships with expired bonds (S.72 violation)
   *
   * USE CASE:
   * - Daily compliance check
   * - Send bond renewal reminders
   * - Court compliance report
   *
   * KENYAN LAW:
   * - S.72 LSA requires valid bond for property management
   * - Expired bond = guardian cannot access ward's property
   *
   * @returns Guardianships with expired bonds
   */
  findWithExpiredBonds(): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships with overdue reports (S.73 violation)
   *
   * USE CASE:
   * - Daily compliance check
   * - Send report reminders
   * - Court non-compliance tracking
   *
   * KENYAN LAW:
   * - S.73 LSA requires annual reports
   * - 60-day grace period after due date
   * - Overdue = potential guardian removal
   *
   * @param gracePeriodExpired - Only return if past grace period?
   * @returns Guardianships with overdue reports
   */
  findWithOverdueReports(gracePeriodExpired?: boolean): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships requiring immediate action
   *
   * COMBINES:
   * - Expired bonds
   * - Overdue reports
   * - Ward approaching majority (18th birthday)
   * - Guardian eligibility issues
   *
   * USE CASE:
   * - Admin dashboard alerts
   * - Court officer work queue
   *
   * @returns Guardianships needing attention
   */
  findRequiringAction(): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships with bonds expiring soon
   *
   * USE CASE:
   * - Proactive bond renewal reminders
   * - Court notification system
   *
   * @param withinDays - Days before expiry to consider
   * @returns Guardianships with bonds expiring soon
   */
  findAllWithExpiringBonds(withinDays: number): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships with upcoming deadlines
   *
   * @param deadlineType - Type of deadline
   * @param withinDays - Days before deadline to consider
   * @returns Guardianships with upcoming deadlines
   */
  findGuardianshipsWithUpcomingDeadlines(
    deadlineType: 'BOND_EXPIRY' | 'REPORT_DUE',
    withinDays: number,
  ): Promise<GuardianshipAggregate[]>;

  /**
   * Find guardianships needing dissolution
   *
   * USE CASE:
   * - Automated dissolution workflow
   * - Court closure processes
   *
   * @returns Guardianships that should be dissolved
   */
  findGuardianshipsNeedingDissolution(): Promise<GuardianshipAggregate[]>;

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get compliance statistics
   *
   * USE CASE:
   * - Dashboard summary
   * - Management reports
   * - Court system integration
   *
   * @returns Compliance metrics
   */
  getComplianceStatistics(): Promise<ComplianceStatistics>;

  /**
   * Get guardianship statistics by court station
   *
   * USE CASE:
   * - Regional court performance
   * - Resource allocation
   *
   * @param courtStation - Court location
   * @returns Statistics for that court
   */
  getStatisticsByCourtStation(courtStation: string): Promise<CourtStationStatistics>;

  /**
   * Get guardianship summary (lightweight projection)
   *
   * USE CASE:
   * - Dashboard listings
   * - Quick overviews
   * - Mobile app views
   *
   * @param id - Guardianship ID
   * @returns Summary data
   */
  getGuardianshipSummary(id: string): Promise<GuardianshipSummary>;

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
  getComplianceReport(filters: ComplianceFilters): Promise<ComplianceReport>;

  /**
   * Get data for e-filing integration
   *
   * USE CASE:
   * - Court e-filing system integration
   * - Automated document submissions
   *
   * @param courtStation - Court location
   * @returns Data formatted for e-filing
   */
  getGuardianshipsForEfiling(courtStation: string): Promise<EfilingData[]>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk update guardianship status
   *
   * USE CASE:
   * - Batch status updates
   * - System migrations
   * - Data corrections
   *
   * @param ids - Guardianship IDs
   * @param status - New status
   * @param updatedBy - User performing update
   */
  bulkUpdateGuardianshipStatus(ids: string[], status: boolean, updatedBy: string): Promise<void>;

  /**
   * Bulk soft delete
   *
   * USE CASE:
   * - Batch deletions
   * - Data cleanup
   * - Legal compliance actions
   *
   * @param ids - Guardianship IDs
   * @param deletedBy - User performing deletion
   * @param reason - Reason for deletion
   */
  bulkSoftDelete(ids: string[], deletedBy: string, reason: string): Promise<void>;

  // ============================================================================
  // WARD ELIGIBILITY CHECKS
  // ============================================================================

  /**
   * Find wards approaching majority (turning 18)
   *
   * USE CASE:
   * - Automated dissolution workflow
   * - Send notifications before birthday
   *
   * KENYAN LAW:
   * - Guardianship automatically ends at 18
   * - Give 90-day notice before birthday
   *
   * @param withinDays - How many days before 18th birthday?
   * @returns Guardianships where ward approaching majority
   */
  findWardsApproachingMajority(withinDays: number): Promise<GuardianshipAggregate[]>;

  /**
   * Check if ward has active guardianship
   *
   * USE CASE:
   * - Before creating new guardianship, check for existing
   * - Family service integration
   *
   * @param wardId - Ward ID
   * @returns True if active guardianship exists
   */
  hasActiveGuardianship(wardId: string): Promise<boolean>;

  // ============================================================================
  // SOFT DELETE & ARCHIVING
  // ============================================================================

  /**
   * Soft delete guardianship (legal retention requirement)
   *
   * KENYAN LAW:
   * - Cannot hard delete court records
   * - Must maintain audit trail
   *
   * @param id - Guardianship ID
   * @param deletedBy - User performing deletion
   * @param reason - Legal reason for deletion
   */
  softDelete(id: string, deletedBy: string, reason: string): Promise<void>;

  /**
   * Restore soft-deleted guardianship
   *
   * USE CASE:
   * - Accidental deletion
   * - Court order restoration
   *
   * @param id - Guardianship ID
   * @param restoredBy - User performing restoration
   */
  restore(id: string, restoredBy: string): Promise<void>;

  /**
   * Find soft-deleted guardianships
   *
   * USE CASE:
   * - Audit/recovery
   * - Legal compliance review
   *
   * @param pagination - Page options
   * @returns Deleted guardianships
   */
  findDeleted(pagination: PaginationOptions): Promise<PaginatedResult<GuardianshipAggregate>>;

  // ============================================================================
  // VERSION CONTROL & AUDIT
  // ============================================================================

  /**
   * Get version history of guardianship
   *
   * USE CASE:
   * - Audit trail
   * - Legal compliance
   * - Change tracking
   *
   * @param id - Guardianship ID
   * @returns Version history
   */
  getVersionHistory(id: string): Promise<GuardianshipVersion[]>;

  /**
   * Compare two versions of guardianship
   *
   * USE CASE:
   * - Legal dispute resolution
   * - Change analysis
   * - Audit investigations
   *
   * @param id - Guardianship ID
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
   *
   * @param id - Guardianship ID
   * @param upToDate - Rebuild state up to this date
   * @returns Guardianship in historical state
   */
  rebuildFromEvents(id: string, upToDate?: Date): Promise<GuardianshipAggregate | null>;

  /**
   * Get all domain events for guardianship
   *
   * USE CASE:
   * - Legal audit trail
   * - Event replay
   * - Debugging
   *
   * @param id - Guardianship ID
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
export class GuardianshipNotFoundException extends RepositoryException {
  constructor(id: string) {
    super(`Guardianship with ID ${id} not found`, 'NOT_FOUND');
    this.name = 'GuardianshipNotFoundException';
    Object.setPrototypeOf(this, GuardianshipNotFoundException.prototype);
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
