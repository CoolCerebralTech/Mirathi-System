// domain/interfaces/estate.repository.interface.ts
import { Estate, EstateStatus } from '../aggregates/estate.aggregate';
import { UniqueEntityID } from '../base/unique-entity-id';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Estate Repository Interface
 *
 * Repository Pattern implementation for the Estate Aggregate Root.
 *
 * KEY INNOVATIONS:
 * 1. Multi-criteria search with S.45 debt priority filtering
 * 2. Liquidity forecasting queries for cash management
 * 3. Dispute impact analysis for distribution blocking
 * 4. Batch operations for bulk administration
 * 5. Real-time solvency monitoring
 *
 * Legal Compliance:
 * - All operations within transaction boundaries
 * - Full audit trail with domain events
 * - Kenyan legal requirement compliance in queries
 *
 * NestJS Injection Token: ESTATE_REPOSITORY
 */

export const ESTATE_REPOSITORY = 'ESTATE_REPOSITORY';

export interface IEstateRepository {
  // ===========================================================================
  // CORE CRUD OPERATIONS
  // ===========================================================================

  /**
   * Save estate (create or update)
   *
   * INNOVATION: Transactional save with child entity cascade
   * Ensures all child entities (assets, debts, dependants) are saved atomically
   *
   * @throws ConcurrencyError if optimistic lock fails (version mismatch)
   * @throws PersistenceError on database failure
   */
  save(estate: Estate): Promise<void>;

  /**
   * Find estate by ID
   *
   * INNOVATION: Deep hydration with all child entities
   * Returns fully reconstituted aggregate with all business invariants
   */
  findById(id: UniqueEntityID): Promise<Estate | null>;

  /**
   * Find estate by deceased ID (One-per-deceased constraint)
   *
   * BUSINESS RULE: Only one active estate per deceased person
   */
  findByDeceasedId(deceasedId: string): Promise<Estate | null>;

  /**
   * Find estates by multiple criteria
   *
   * INNOVATION: Supports complex multi-dimensional filtering
   * Used for court reports, executor dashboards, compliance audits
   */
  find(criteria?: EstateSearchCriteria): Promise<Estate[]>;

  /**
   * Check if estate exists for deceased
   *
   * Prevents duplicate estate creation
   */
  existsForDeceased(deceasedId: string): Promise<boolean>;

  /**
   * Soft delete estate (legal retention)
   *
   * LEGAL REQUIREMENT: Never hard delete, retain for 7+ years
   */
  softDelete(id: UniqueEntityID, reason: string, deletedBy: string): Promise<void>;

  // ===========================================================================
  // SPECIALIZED BUSINESS QUERIES
  // ===========================================================================

  /**
   * Find estates requiring court attention
   *
   * CRITERIA:
   * - High-value estates (>10M KES)
   * - Active disputes
   * - Require court determination
   * - Frozen status
   */
  findEstatesRequiringCourtAttention(): Promise<Estate[]>;

  /**
   * Find estates ready for distribution (The "Green Light" Query)
   *
   * CRITERIA:
   * - Tax cleared
   * - No active disputes
   * - All S.45(a)-(c) debts paid
   * - Status = READY_FOR_DISTRIBUTION
   */
  findEstatesReadyForDistribution(): Promise<Estate[]>;

  /**
   * Find insolvent estates (Liabilities > Assets)
   *
   * INNOVATION: Real-time solvency calculation
   * Used for bankruptcy proceedings
   */
  findInsolventEstates(): Promise<Estate[]>;

  /**
   * Find estates with critical S.45 debts outstanding
   *
   * CRITERIA: Funeral, Testamentary, or Secured debts unpaid
   * Blocks distribution until cleared
   */
  findEstatesWithCriticalDebts(): Promise<Estate[]>;

  /**
   * Find estates requiring liquidation for cash
   *
   * INNOVATION: Liquidity forecasting query
   * Identifies estates that need asset sales to meet obligations
   */
  findEstatesRequiringLiquidation(): Promise<Estate[]>;

  /**
   * Find estates with high-risk dependants
   *
   * CRITERIA: Dependants with riskLevel = HIGH
   * May require court supervision
   */
  findEstatesWithHighRiskDependants(): Promise<Estate[]>;

  /**
   * Find estates with pending tax compliance
   *
   * CRITERIA: Tax status not CLEARED or EXEMPT
   * The "Gatekeeper" blocker query
   */
  findEstatesWithPendingTaxCompliance(): Promise<Estate[]>;

  // ===========================================================================
  // BATCH OPERATIONS & ANALYTICS
  // ===========================================================================

  /**
   * Count estates by various criteria
   *
   * Use Cases:
   * - Dashboard statistics
   * - Court workload planning
   * - Resource allocation
   */
  count(criteria?: EstateCountCriteria): Promise<number>;

  /**
   * Search estates with pagination and sorting
   *
   * INNOVATION: Full-text search with financial filtering
   * Used by executors, lawyers, court officers
   */
  search(criteria: EstateSearchCriteria): Promise<PaginatedResult<Estate>>;

  /**
   * Get comprehensive estate statistics
   *
   * INNOVATION: Real-time financial analytics
   * Provides insights for system monitoring and reporting
   */
  getStatistics(): Promise<EstateStatistics>;

  /**
   * Batch update estate statuses
   *
   * Use Cases:
   * - Bulk freeze/unfreeze for court orders
   * - Mass status updates for system maintenance
   */
  batchUpdateStatus(
    criteria: EstateBatchCriteria,
    newStatus: EstateStatus,
    updatedBy: string,
    reason: string,
  ): Promise<number>;

  /**
   * Find estates nearing statutory deadlines
   *
   * INNOVATION: Deadline management for legal compliance
   * Alerts for time-sensitive actions
   */
  findEstatesNearingDeadlines(daysThreshold: number): Promise<Estate[]>;

  // ===========================================================================
  // TRANSACTION MANAGEMENT
  // ===========================================================================

  /**
   * Begin transaction for complex operations
   *
   * Use Cases:
   * - Multi-aggregate operations
   * - Financial reconciliations
   * - Bulk data imports
   */
  beginTransaction(): Promise<TransactionContext>;
}

// ===========================================================================
// SUPPORTING INTERFACES
// ===========================================================================

// ===========================================================================
// SUPPORTING INTERFACES
// ===========================================================================

/**
 * Estate Search Criteria
 *
 * INNOVATION: Multi-dimensional filtering for complex queries
 */
export interface EstateSearchCriteria {
  // Basic Identity
  id?: string;
  deceasedId?: string;
  deceasedName?: string;
  executorId?: string;

  // Timeline Filters
  dateOfDeathFrom?: Date;
  dateOfDeathTo?: Date;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  updatedAtFrom?: Date;
  updatedAtTo?: Date;

  // Status Filters
  status?: EstateStatus | EstateStatus[];
  isFrozen?: boolean;
  isInsolvent?: boolean;
  hasActiveDisputes?: boolean;
  requiresCourtSupervision?: boolean;

  // Financial Filters
  minNetWorth?: MoneyVO;
  maxNetWorth?: MoneyVO;
  minCashOnHand?: MoneyVO;
  maxCashOnHand?: MoneyVO;
  minGrossValue?: MoneyVO;
  maxGrossValue?: MoneyVO;

  // Tax Compliance Filters
  taxStatus?: string | string[];
  hasTaxClearance?: boolean;

  // Asset Filters
  hasRealEstate?: boolean;
  hasBusinessAssets?: boolean;
  hasHighValueAssets?: boolean;

  // Debt Filters
  hasSecuredDebts?: boolean;
  hasCriticalDebts?: boolean;
  maxDebtToAssetRatio?: number;

  // Dependant Filters
  hasDependants?: boolean;
  hasMinorDependants?: boolean;
  hasHighRiskDependants?: boolean;

  // Administrative
  courtCaseNumber?: string;
  kraPin?: string;

  // Pagination
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;

  // Sorting
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'dateOfDeath'
    | 'deceasedName'
    | 'netWorth'
    | 'cashOnHand'
    | 'status';
  sortOrder?: 'ASC' | 'DESC';
}
/**
 * Estate Count Criteria
 */
export type EstateCountCriteria = Omit<
  EstateSearchCriteria,
  'page' | 'pageSize' | 'offset' | 'limit' | 'sortBy' | 'sortOrder'
>;

/**
 * Estate Batch Criteria
 */
export type EstateBatchCriteria = Omit<
  EstateSearchCriteria,
  'page' | 'pageSize' | 'offset' | 'limit' | 'sortBy' | 'sortOrder'
>;

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  hasMore?: boolean;
}

/**
 * Comprehensive Estate Statistics
 *
 * INNOVATION: Real-time dashboard metrics for executors and courts
 */
export interface EstateStatistics {
  // Basic Counts
  totalEstates: number;
  activeEstates: number;
  closedEstates: number;

  // Status Breakdown
  estatesByStatus: Record<EstateStatus, number>;
  frozenEstates: number;
  distributingEstates: number;
  readyForDistribution: number;

  // Financial Overview
  totalNetWorth: MoneyVO;
  totalGrossValue: MoneyVO;
  totalLiabilities: MoneyVO;
  totalCashOnHand: MoneyVO;
  totalReservedCash: MoneyVO;

  // Solvency Analysis
  solventEstates: number;
  insolventEstates: number;
  averageSolvencyRatio: number;

  // Tax Compliance
  taxClearedEstates: number;
  taxPendingEstates: number;
  taxExemptEstates: number;

  // Debt Analysis
  estatesWithCriticalDebts: number;
  totalOutstandingDebts: MoneyVO;
  averageDebtPerEstate: MoneyVO;

  // Asset Analysis
  totalAssets: number;
  estatesWithRealEstate: number;
  estatesWithBusinessAssets: number;
  averageAssetsPerEstate: number;

  // Dependant Analysis
  estatesWithDependants: number;
  totalDependants: number;
  estatesWithMinorDependants: number;
  estatesWithHighRiskDependants: number;

  // Legal & Dispute Analysis
  estatesWithActiveDisputes: number;
  estatesRequiringCourtSupervision: number;
  estatesWithCourtCases: number;

  // Timeline Analysis
  averageAdministrationDays: number;
  estatesNearingDeadlines: number;

  // Value Distribution
  top10PercentValue: MoneyVO;
  medianEstateValue: MoneyVO;
  averageEstateValue: MoneyVO;

  // Performance Metrics
  distributionSuccessRate: number;
  liquidationSuccessRate: number;
  disputeResolutionRate: number;
}

/**
 * Transaction Context for Unit of Work
 */
export interface TransactionContext {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive: boolean;
  startTime: Date;
}

// ===========================================================================
// REPOSITORY ERRORS (Domain Exceptions)
// ===========================================================================

/**
 * Estate Not Found Error
 */
export class EstateNotFoundError extends Error {
  constructor(id: string) {
    super(`Estate not found: ${id}`);
    this.name = 'EstateNotFoundError';
  }
}

/**
 * Estate Already Exists Error
 * (One estate per deceased rule violation)
 */
export class EstateAlreadyExistsError extends Error {
  constructor(deceasedId: string) {
    super(`Estate already exists for deceased: ${deceasedId}`);
    this.name = 'EstateAlreadyExistsError';
  }
}

/**
 * Concurrency Error (Optimistic Locking Failure)
 */
export class ConcurrencyError extends Error {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for estate ${aggregateId}. Expected version ${expectedVersion}, found ${actualVersion}`,
    );
    this.name = 'ConcurrencyError';
    this.aggregateId = aggregateId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }

  public readonly aggregateId: string;
  public readonly expectedVersion: number;
  public readonly actualVersion: number;
}

/**
 * Persistence Error (Database/Infrastructure Failure)
 */
export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly operation?: string,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/**
 * Invalid Search Criteria Error
 */
export class InvalidSearchCriteriaError extends Error {
  constructor(criteria: any, reason: string) {
    super(`Invalid search criteria: ${reason}. Criteria: ${JSON.stringify(criteria)}`);
    this.name = 'InvalidSearchCriteriaError';
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Create default search criteria
 */
export function createDefaultSearchCriteria(): EstateSearchCriteria {
  return {
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };
}

/**
 * Validate search criteria
 */
export function validateSearchCriteria(criteria: EstateSearchCriteria): void {
  if (criteria.page && criteria.page < 1) {
    throw new InvalidSearchCriteriaError(criteria, 'Page must be >= 1');
  }

  if (criteria.pageSize && (criteria.pageSize < 1 || criteria.pageSize > 100)) {
    throw new InvalidSearchCriteriaError(criteria, 'Page size must be between 1 and 100');
  }

  if (criteria.minNetWorth && criteria.maxNetWorth) {
    if (criteria.minNetWorth.isGreaterThan(criteria.maxNetWorth)) {
      throw new InvalidSearchCriteriaError(
        criteria,
        'Min net worth cannot be greater than max net worth',
      );
    }
  }

  if (criteria.dateOfDeathFrom && criteria.dateOfDeathTo) {
    if (criteria.dateOfDeathFrom > criteria.dateOfDeathTo) {
      throw new InvalidSearchCriteriaError(
        criteria,
        'Date of death from cannot be after date of death to',
      );
    }
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMetadata(
  total: number,
  page: number,
  pageSize: number,
): Omit<PaginatedResult<any>, 'items'> {
  const totalPages = Math.ceil(total / pageSize);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasPrevious,
    hasNext,
  };
}
