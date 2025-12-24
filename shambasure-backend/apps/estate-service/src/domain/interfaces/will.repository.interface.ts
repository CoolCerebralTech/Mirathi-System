// domain/repositories/will.repository.interface.ts
import { Will } from '../aggregates/will.aggregate';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WillStatusEnum } from '../value-objects/will-status.vo';

/**
 * IWillRepository Interface
 *
 * Purpose:
 * - Define persistence contract for Will aggregate
 * - Support CQRS pattern (commands vs queries)
 * - Enable event sourcing
 * - Provide optimistic locking
 * - Support complex queries for UI/reporting
 *
 * Design Pattern: Repository Pattern
 * - Abstracts data access
 * - Domain-centric interface (not database-centric)
 * - Infrastructure implements this interface
 * - Testable with in-memory implementations
 *
 * NestJS Integration:
 * - Uses injection token for DI
 * - Allows multiple implementations (Prisma, InMemory, EventStore)
 *
 * Kenyan Legal Context:
 * - Must support audit trail (event sourcing)
 * - Must support optimistic locking (court filing race conditions)
 * - Must support temporal queries (will state at specific date)
 */

// ============================================================================
// NESTJS INJECTION TOKEN
// ============================================================================

/**
 * Injection token for Will Repository
 *
 * Usage in NestJS:
 *
 * @Injectable()
 * export class CreateWillUseCase {
 *   constructor(
 *     @Inject(WILL_REPOSITORY_TOKEN)
 *     private readonly willRepo: IWillRepository
 *   ) {}
 * }
 *
 * Provider configuration:
 * {
 *   provide: WILL_REPOSITORY_TOKEN,
 *   useClass: PrismaWillRepository
 * }
 */
export const WILL_REPOSITORY_TOKEN = Symbol('IWillRepository');

// ============================================================================
// QUERY FILTERS & PAGINATION
// ============================================================================

/**
 * Query filter for finding wills
 */
export interface WillQueryFilter {
  // Identity filters
  testatorId?: string;
  testatorIds?: string[];

  // Status filters
  status?: WillStatusEnum;
  statuses?: WillStatusEnum[];

  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  executedAfter?: Date;
  executedBefore?: Date;

  // Boolean filters
  isRevoked?: boolean;
  hasTestamentaryCapacity?: boolean;

  // Text search
  searchTerm?: string; // Search in title, testator name

  // Complex filters
  hasExecutor?: boolean;
  hasBeneficiaries?: boolean;
  hasWitnesses?: boolean;
  witnessCount?: number;
  beneficiaryCount?: number;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: WillSortField;
  sortOrder?: 'ASC' | 'DESC';
}

export enum WillSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TESTATOR_NAME = 'testatorFullName',
  STATUS = 'status',
  EXECUTED_AT = 'executedAt',
  VERSION = 'version',
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Query options
 */
export interface QueryOptions {
  includeDeleted?: boolean;
  asOfDate?: Date; // Temporal query: state as of specific date
  lockForUpdate?: boolean; // Pessimistic locking for critical operations
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

/**
 * IWillRepository
 *
 * Primary repository interface for Will aggregate
 * Supports both command operations (CUD) and query operations (R)
 */
export interface IWillRepository {
  // =========================================================================
  // COMMAND OPERATIONS (Write)
  // =========================================================================

  /**
   * Save new will aggregate
   *
   * @throws WillConcurrencyException if version mismatch
   * @throws WillAlreadyExistsException if duplicate
   */
  save(will: Will): Promise<void>;

  /**
   * Update existing will aggregate
   *
   * Performs optimistic locking check:
   * - Compares aggregate version with DB version
   * - Throws WillConcurrencyException if mismatch
   *
   * @throws WillConcurrencyException if version mismatch
   * @throws WillNotFoundException if not found
   */
  update(will: Will): Promise<void>;

  /**
   * Save or update (upsert) will aggregate
   *
   * Automatically determines if save or update needed
   */
  saveOrUpdate(will: Will): Promise<void>;

  /**
   * Soft delete will
   *
   * Sets deletedAt timestamp (legal requirement - can't hard delete)
   */
  delete(id: UniqueEntityID): Promise<void>;

  /**
   * Hard delete will (use with extreme caution)
   *
   * Only for test cleanup or GDPR compliance after retention period
   */
  hardDelete(id: UniqueEntityID): Promise<void>;

  /**
   * Bulk save multiple wills (transaction)
   *
   * All-or-nothing: Either all succeed or all rollback
   */
  saveBatch(wills: Will[]): Promise<void>;

  // =========================================================================
  // QUERY OPERATIONS (Read)
  // =========================================================================

  /**
   * Find will by ID
   *
   * @returns Will aggregate or null if not found
   */
  findById(id: UniqueEntityID, options?: QueryOptions): Promise<Will | null>;

  /**
   * Find will by ID or throw
   *
   * @throws WillNotFoundException if not found
   */
  findByIdOrFail(id: UniqueEntityID, options?: QueryOptions): Promise<Will>;

  /**
   * Find multiple wills by IDs
   */
  findByIds(ids: UniqueEntityID[], options?: QueryOptions): Promise<Will[]>;

  /**
   * Find active will for testator
   *
   * CRITICAL: Only ONE active will per testator allowed
   *
   * @returns Active will or null
   */
  findActiveByTestatorId(testatorId: string): Promise<Will | null>;

  /**
   * Find all wills for testator (all statuses)
   */
  findAllByTestatorId(testatorId: string, options?: QueryOptions): Promise<Will[]>;

  /**
   * Find wills by status
   */
  findByStatus(status: WillStatusEnum, options?: QueryOptions): Promise<Will[]>;

  /**
   * Find wills by filter (complex queries)
   */
  findByFilter(filter: WillQueryFilter, options?: QueryOptions): Promise<PaginatedResult<Will>>;

  /**
   * Check if testator has active will
   *
   * Efficient existence check (doesn't load full aggregate)
   */
  hasActiveWill(testatorId: string): Promise<boolean>;

  /**
   * Count wills matching filter
   */
  count(filter?: WillQueryFilter): Promise<number>;

  /**
   * Check if will exists
   */
  exists(id: UniqueEntityID): Promise<boolean>;

  // =========================================================================
  // SPECIALIZED QUERIES (For UI/Reporting)
  // =========================================================================

  /**
   * Find wills ready for witnessing
   *
   * Wills in PENDING_WITNESS status with all requirements met
   */
  findReadyForWitnessing(): Promise<Will[]>;

  /**
   * Find wills awaiting activation
   *
   * Wills in WITNESSED status ready to become active
   */
  findAwaitingActivation(): Promise<Will[]>;

  /**
   * Find wills in probate
   *
   * Useful for court tracking dashboard
   */
  findInProbate(): Promise<Will[]>;

  /**
   * Find contested wills
   *
   * For legal team dashboard
   */
  findContested(): Promise<Will[]>;

  /**
   * Find wills by executor
   *
   * All wills where person is nominated executor
   */
  findByExecutorId(executorId: string): Promise<Will[]>;

  /**
   * Find wills by beneficiary
   *
   * All wills where person is beneficiary
   */
  findByBeneficiaryId(beneficiaryId: string): Promise<Will[]>;

  /**
   * Find wills expiring soon (for reminder notifications)
   *
   * Wills where witnesses' signatures expire soon
   */
  findExpiringSignatures(daysUntilExpiry: number): Promise<Will[]>;

  // =========================================================================
  // EVENT SOURCING SUPPORT
  // =========================================================================

  /**
   * Get domain events for will
   *
   * Returns all events in chronological order
   * Used for:
   * - Event replay
   * - Audit trail
   * - Temporal queries
   */
  getEvents(willId: UniqueEntityID): Promise<DomainEvent[]>;

  /**
   * Get events since version
   *
   * For incremental event processing
   */
  getEventsSinceVersion(willId: UniqueEntityID, sinceVersion: number): Promise<DomainEvent[]>;

  /**
   * Rebuild will from events (event sourcing)
   *
   * Reconstructs aggregate state by replaying events
   */
  rebuildFromEvents(willId: UniqueEntityID): Promise<Will>;

  /**
   * Get will state at specific date (temporal query)
   *
   * Replays events up to specified date
   *
   * Use cases:
   * - "What was the will content on date of death?"
   * - "Who were beneficiaries on filing date?"
   */
  getStateAsOfDate(willId: UniqueEntityID, date: Date): Promise<Will | null>;

  // =========================================================================
  // TRANSACTION SUPPORT
  // =========================================================================

  /**
   * Execute operation within transaction
   *
   * Ensures atomicity for multi-aggregate operations
   *
   * Example:
   * ```typescript
   * await willRepo.transaction(async (txRepo) => {
   *   const will = await txRepo.findByIdOrFail(id);
   *   will.activate();
   *   await txRepo.update(will);
   *
   *   // Supersede old will
   *   if (oldWillId) {
   *     const oldWill = await txRepo.findByIdOrFail(oldWillId);
   *     oldWill.supersede(id);
   *     await txRepo.update(oldWill);
   *   }
   * });
   * ```
   */
  transaction<T>(operation: (repository: IWillRepository) => Promise<T>): Promise<T>;

  // =========================================================================
  // OPTIMISTIC LOCKING
  // =========================================================================

  /**
   * Get current version of will
   *
   * For optimistic locking checks
   */
  getVersion(id: UniqueEntityID): Promise<number>;

  /**
   * Check if version matches expected
   *
   * @throws WillConcurrencyException if mismatch
   */
  checkVersion(id: UniqueEntityID, expectedVersion: number): Promise<void>;

  // =========================================================================
  // STATISTICS & ANALYTICS (Read Models)
  // =========================================================================

  /**
   * Get statistics for dashboard
   */
  getStatistics(): Promise<WillStatistics>;

  /**
   * Get testator's will history
   *
   * All wills with timeline of changes
   */
  getTestatorWillHistory(testatorId: string): Promise<WillHistoryEntry[]>;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Will statistics for dashboard
 */
export interface WillStatistics {
  total: number;
  byStatus: Record<WillStatusEnum, number>;
  drafts: number;
  active: number;
  executed: number;
  contested: number;

  // Validation metrics
  readyForWitnessing: number;
  awaitingActivation: number;
  incomplete: number;

  // Time-based metrics
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;

  // Quality metrics
  averageWitnessCount: number;
  averageBeneficiaryCount: number;
  withExecutors: number;
  withResiduary: number;
}

/**
 * Will history entry for timeline
 */
export interface WillHistoryEntry {
  willId: string;
  version: number;
  status: WillStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  events: DomainEvent[];
  isCurrent: boolean;
}

// ============================================================================
// REPOSITORY FACTORY (For Testing)
// ============================================================================

/**
 * Repository factory interface
 *
 * Useful for testing and dependency injection
 */
export interface IWillRepositoryFactory {
  create(): IWillRepository;
  createInMemory(): IWillRepository; // For testing
  createEventSourced(): IWillRepository; // For event store
}

// ============================================================================
// UNIT OF WORK (Optional - For Complex Transactions)
// ============================================================================

/**
 * Unit of Work pattern
 *
 * Tracks changes across multiple aggregates
 * Commits all changes atomically
 *
 * Usage:
 * ```typescript
 * const uow = unitOfWorkFactory.create();
 *
 * const will = await uow.willRepository.findByIdOrFail(id);
 * will.activate();
 *
 * const oldWill = await uow.willRepository.findByIdOrFail(oldId);
 * oldWill.supersede(id);
 *
 * await uow.commit(); // Atomic commit
 * ```
 */
export interface IUnitOfWork {
  willRepository: IWillRepository;

  /**
   * Commit all changes atomically
   */
  commit(): Promise<void>;

  /**
   * Rollback all changes
   */
  rollback(): Promise<void>;

  /**
   * Check if unit of work has uncommitted changes
   */
  hasPendingChanges(): boolean;
}

/**
 * Unit of Work factory injection token
 */
export const UNIT_OF_WORK_FACTORY_TOKEN = Symbol('IUnitOfWorkFactory');

export interface IUnitOfWorkFactory {
  create(): Promise<IUnitOfWork>;
}

// ============================================================================
// REPOSITORY EXCEPTIONS
// ============================================================================

/**
 * Base repository exception
 */
export class RepositoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryException';
  }
}

/**
 * Will not found exception
 */
export class WillNotFoundException extends RepositoryException {
  constructor(willId: string) {
    super(`Will with ID ${willId} not found`);
    this.name = 'WillNotFoundException';
  }
}

/**
 * Will already exists exception
 */
export class WillAlreadyExistsException extends RepositoryException {
  constructor(willId: string) {
    super(`Will with ID ${willId} already exists`);
    this.name = 'WillAlreadyExistsException';
  }
}

/**
 * Concurrency exception (optimistic locking failure)
 */
export class WillConcurrencyException extends RepositoryException {
  constructor(willId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for will ${willId}. Expected version ${expectedVersion}, actual ${actualVersion}`,
    );
    this.name = 'WillConcurrencyException';
  }
}
