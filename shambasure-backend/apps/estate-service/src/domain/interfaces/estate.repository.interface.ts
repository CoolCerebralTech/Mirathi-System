// domain/repositories/estate.repository.interface.ts
import { Estate } from '../aggregates/estate.aggregate';
import { UniqueEntityID } from '../base/unique-entity-id';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Estate Repository Interface
 *
 * Defines the contract for persisting and retrieving Estate aggregates
 *
 * Design Patterns:
 * - Repository Pattern (DDD)
 * - Unit of Work (transaction management)
 * - Optimistic Locking (version-based concurrency)
 *
 * Legal Compliance:
 * - All operations atomic (transaction boundary = aggregate)
 * - Events persisted with aggregate (audit trail)
 * - Soft delete support (legal retention)
 *
 * NestJS Injection Token: ESTATE_REPOSITORY
 */

export const ESTATE_REPOSITORY = 'ESTATE_REPOSITORY';

export interface IEstateRepository {
  /**
   * Save estate (create or update)
   *
   * Includes:
   * - Persist aggregate state
   * - Save all child entities (assets, debts, dependants, gifts)
   * - Append domain events to event store
   * - Publish integration events
   *
   * Transaction:
   * - All operations in single database transaction
   * - Rollback on any failure
   *
   * Concurrency:
   * - Uses optimistic locking (WHERE version = expectedVersion)
   * - Throws ConcurrencyError if version mismatch
   *
   * @throws ConcurrencyError if version conflict
   * @throws PersistenceError if database error
   */
  save(estate: Estate): Promise<void>;

  /**
   * Find estate by ID
   *
   * Returns:
   * - Fully hydrated aggregate with all entities
   * - Null if not found or soft deleted
   *
   * Performance:
   * - Uses eager loading for child entities
   * - Single query with JOINs
   */
  findById(id: UniqueEntityID): Promise<Estate | null>;

  /**
   * Find estate by deceased ID
   *
   * Business Rule:
   * - One estate per deceased person
   * - Most common lookup pattern
   */
  findByDeceasedId(deceasedId: UniqueEntityID): Promise<Estate | null>;

  /**
   * Find estates by status
   *
   * Use Cases:
   * - Find all testate estates
   * - Find all intestate estates
   * - Find all frozen estates
   * - Find estates ready for distribution
   */
  findByStatus(criteria: {
    isTestate?: boolean;
    isIntestate?: boolean;
    isFrozen?: boolean;
    isReadyForDistribution?: boolean;
  }): Promise<Estate[]>;

  /**
   * Find estates by value range
   *
   * Use Cases:
   * - High-value estates requiring court supervision
   * - Small estates eligible for summary administration
   */
  findByValueRange(minValue: MoneyVO, maxValue: MoneyVO): Promise<Estate[]>;

  /**
   * Find insolvent estates
   *
   * Business Rule:
   * - Insolvent estates require special handling
   * - May need bankruptcy proceedings
   */
  findInsolventEstates(): Promise<Estate[]>;

  /**
   * Find estates with outstanding critical debts
   *
   * Business Rule:
   * - S.45(a)-(c) debts must be paid before distribution
   * - These estates are blocked from distribution
   */
  findEstatesWithCriticalDebts(): Promise<Estate[]>;

  /**
   * Check if estate exists for deceased
   *
   * Performance:
   * - Lightweight check (doesn't load full aggregate)
   * - Used before estate creation
   */
  existsForDeceased(deceasedId: UniqueEntityID): Promise<boolean>;

  /**
   * Delete estate (soft delete)
   *
   * Legal Requirement:
   * - Soft delete only (set deletedAt timestamp)
   * - Never hard delete (audit trail)
   * - Retained for legal minimum period
   *
   * @param reason - Why estate is being deleted
   */
  delete(id: UniqueEntityID, reason: string): Promise<void>;

  /**
   * Count estates by criteria
   *
   * Use Cases:
   * - Dashboard statistics
   * - Reporting
   */
  count(criteria?: {
    isTestate?: boolean;
    isIntestate?: boolean;
    isFrozen?: boolean;
  }): Promise<number>;

  /**
   * Search estates
   *
   * Search by:
   * - Deceased name
   * - Estate ID
   * - Date of death range
   * - Net value range
   *
   * Returns paginated results
   */
  search(criteria: EstateSearchCriteria): Promise<PaginatedResult<Estate>>;

  /**
   * Get estate statistics
   *
   * Returns:
   * - Total estates
   * - Total value under management
   * - Solvency statistics
   * - Distribution readiness stats
   */
  getStatistics(): Promise<EstateStatistics>;

  /**
   * Begin transaction
   *
   * For operations spanning multiple aggregates:
   * - Create estate + create will
   * - Transfer assets between estates
   *
   * Returns transaction context for commit/rollback
   */
  beginTransaction(): Promise<TransactionContext>;
}

/**
 * Estate Search Criteria
 */
export interface EstateSearchCriteria {
  // Deceased info
  deceasedName?: string;
  deceasedId?: string;

  // Date filters
  dateOfDeathFrom?: Date;
  dateOfDeathTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;

  // Status filters
  isTestate?: boolean;
  isIntestate?: boolean;
  isFrozen?: boolean;
  isReadyForDistribution?: boolean;

  // Value filters
  minGrossValue?: MoneyVO;
  maxGrossValue?: MoneyVO;
  minNetValue?: MoneyVO;
  maxNetValue?: MoneyVO;

  // Solvency
  isSolvent?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?: 'createdAt' | 'deceasedName' | 'netValue' | 'dateOfDeath';
  sortOrder?: 'ASC' | 'DESC';
}

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
}

/**
 * Estate Statistics
 */
export interface EstateStatistics {
  totalEstates: number;
  testateEstates: number;
  intestateEstates: number;
  frozenEstates: number;

  totalGrossValue: MoneyVO;
  totalNetValue: MoneyVO;
  totalLiabilities: MoneyVO;

  solventEstates: number;
  insolventEstates: number;

  estatesReadyForDistribution: number;
  estatesBlockedByDebts: number;

  averageEstateValue: MoneyVO;
  medianEstateValue: MoneyVO;
}

/**
 * Transaction Context
 */
export interface TransactionContext {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Repository Errors
 */
export class EstateNotFoundError extends Error {
  constructor(id: string) {
    super(`Estate not found: ${id}`);
    this.name = 'EstateNotFoundError';
  }
}

export class EstateAlreadyExistsError extends Error {
  constructor(deceasedId: string) {
    super(`Estate already exists for deceased: ${deceasedId}`);
    this.name = 'EstateAlreadyExistsError';
  }
}

export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}
