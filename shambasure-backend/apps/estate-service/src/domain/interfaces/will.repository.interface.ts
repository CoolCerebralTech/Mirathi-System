// domain/repositories/will.repository.interface.ts
import { Will } from '../aggregates/will.aggregate';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WillStatus } from '../enums/will-status.enum';
import { WillType } from '../enums/will-type.enum';

/**
 * Will Repository Interface
 *
 * Repository Pattern implementation for the Will Aggregate Root.
 *
 * KEY INNOVATIONS:
 * 1. Version Control: Tracks draft versions vs executed copies
 * 2. Compliance Radar: Queries for S.11 (Witnessing) and S.26 (Dependants) risks
 * 3. Temporal State: "As-of" queries for probate disputes
 * 4. Conflict Detection: Identifies beneficiary-witness conflicts
 *
 * Legal Compliance:
 * - S.11 LSA: Strict witnessing requirement queries
 * - S.26 LSA: Dependant provision analysis
 * - Full audit trail for court admissibility
 *
 * NestJS Injection Token: WILL_REPOSITORY
 */
export const WILL_REPOSITORY = 'WILL_REPOSITORY';

export interface IWillRepository {
  // ===========================================================================
  // CORE CRUD OPERATIONS
  // ===========================================================================

  /**
   * Save will (create or update)
   *
   * INNOVATION: Optimistic locking via version number.
   * Ensures no two lawyers/testators edit the draft simultaneously.
   *
   * @throws WillConcurrencyError if version mismatch
   * @throws PersistenceError on database failure
   */
  save(will: Will): Promise<void>;

  /**
   * Find will by ID
   *
   * INNOVATION: Deep hydration
   * Returns aggregate with all Codicils, Executors, and Witnesses attached.
   */
  findById(id: UniqueEntityID): Promise<Will | null>;

  /**
   * Find the currently ACTIVE will for a testator
   *
   * LEGAL RULE: Only one active will represents the testator's current intent.
   * Used during Probate setup.
   */
  findActiveByTestatorId(testatorId: string): Promise<Will | null>;

  /**
   * Find the latest DRAFT for a testator
   *
   * Used for the lawyer/user editing dashboard.
   */
  findLatestDraftByTestatorId(testatorId: string): Promise<Will | null>;

  /**
   * Check if an active will exists
   *
   * Optimization for "Create New Will" workflows to prevent duplicates.
   */
  hasActiveWill(testatorId: string): Promise<boolean>;

  // ===========================================================================
  // SPECIALIZED BUSINESS QUERIES
  // ===========================================================================

  /**
   * Find drafts ready for execution
   *
   * CRITERIA:
   * - Status = DRAFT
   * - Has Capacity Declaration
   * - Has >0 Executors
   * - Validated internally
   */
  findDraftsReadyForExecution(): Promise<Will[]>;

  /**
   * Find wills with Section 11 Compliance Risks
   *
   * CRITERIA:
   * - Status = WITNESSED/ACTIVE
   * - < 2 Witnesses
   * - OR Witness is also a Beneficiary (S.11(2) conflict)
   */
  findWillsWithWitnessConflicts(): Promise<Will[]>;

  /**
   * Find wills with potential Section 26 Claims
   *
   * CRITERIA:
   * - Has Disinheritance Records
   * - Disinherited person matches "Child" or "Spouse" criteria
   * - Used for Legal Risk Assessment
   */
  findWillsWithHighRiskDisinheritance(): Promise<Will[]>;

  /**
   * Find wills requiring Capacity Review
   *
   * CRITERIA:
   * - CapacityDeclaration risk level = 'HIGH' or 'MEDIUM'
   * - Used to flag wills needing medical affidavit support
   */
  findWillsWithCapacityFlags(): Promise<Will[]>;

  /**
   * Find wills by Executor
   *
   * Use Case: "Show me all estates where I am nominated as Executor"
   */
  findByNominatedExecutor(executorEmailOrId: string): Promise<Will[]>;

  /**
   * Find wills containing specific assets
   *
   * Use Case: Finding all wills referencing a specific Land Reference Number
   * (Useful during asset transfer blocking)
   */
  findByAssetReference(assetIdentifier: string): Promise<Will[]>;

  // ===========================================================================
  // SEARCH & ANALYTICS
  // ===========================================================================

  /**
   * Advanced Multi-criteria Search
   *
   * Used by Court Registry and Legal Firms
   */
  search(criteria: WillSearchCriteria): Promise<PaginatedResult<Will>>;

  /**
   * Count wills by criteria
   */
  count(criteria?: WillCountCriteria): Promise<number>;

  /**
   * Get Repository Statistics
   *
   * Dashboard metrics for the platform admin
   */
  getStatistics(): Promise<WillStatistics>;

  /**
   * Find history of wills for a testator
   *
   * Returns all versions (Drafts, Revoked, Active) in chronological order.
   * Critical for "Will Contests" to prove chain of intent.
   */
  getTestatorHistory(testatorId: string): Promise<Will[]>;

  // ===========================================================================
  // TRANSACTION MANAGEMENT
  // ===========================================================================

  /**
   * Begin transaction
   *
   * Essential when revoking an old will and activating a new one atomically.
   */
  beginTransaction(): Promise<TransactionContext>;
}

// ===========================================================================
// SUPPORTING TYPES & INTERFACES
// ===========================================================================

/**
 * Will Search Criteria
 */
export interface WillSearchCriteria {
  // Identity
  id?: string;
  testatorId?: string;
  testatorName?: string;
  probateCaseNumber?: string;

  // Status & Type
  status?: WillStatus | WillStatus[];
  type?: WillType | WillType[];
  isRevoked?: boolean;
  isValid?: boolean;

  // Dates
  createdFrom?: Date;
  createdTo?: Date;
  executedFrom?: Date;
  executedTo?: Date;
  revokedFrom?: Date;
  revokedTo?: Date;

  // Structural Filters
  hasCodicils?: boolean;
  hasDisinheritanceRecords?: boolean;
  minWitnessCount?: number;
  hasCapacityDeclaration?: boolean;

  // Risk Filters
  hasValidationErrors?: boolean;
  capacityRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  // Role Filters
  executorId?: string;
  witnessId?: string;

  // Pagination
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;

  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'executionDate' | 'testatorName' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Will Count Criteria (Type Alias)
 */
export type WillCountCriteria = Omit<
  WillSearchCriteria,
  'page' | 'pageSize' | 'offset' | 'limit' | 'sortBy' | 'sortOrder'
>;

/**
 * Paginated Result Wrapper
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
 * Will System Statistics
 */
export interface WillStatistics {
  // Volume
  totalWills: number;
  activeWills: number;
  draftWills: number;
  revokedWills: number;

  // Execution Metrics
  totalExecuted: number;
  averageExecutionTimeDays: number; // Time from draft to witness

  // Risk Analysis
  willsWithCodicils: number;
  willsWithDisinheritance: number;
  willsWithCapacityRisks: number;
  willsWithWitnessWarnings: number;

  // Type Breakdown
  standardWills: number;
  islamicWills: number; // If applicable via WillType
  customWills: number;

  // Conversion
  completionRate: number; // Drafts turned into Active
}

/**
 * Transaction Context
 */
export interface TransactionContext {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive: boolean;
}

// ===========================================================================
// REPOSITORY ERRORS
// ===========================================================================

export class WillNotFoundError extends Error {
  constructor(id: string) {
    super(`Will not found: ${id}`);
    this.name = 'WillNotFoundError';
  }
}

export class DuplicateActiveWillError extends Error {
  constructor(testatorId: string) {
    super(`Testator ${testatorId} already has an active will. Revoke it first.`);
    this.name = 'DuplicateActiveWillError';
  }
}

export class WillConcurrencyError extends Error {
  constructor(willId: string, expected: number, actual: number) {
    super(`Concurrency conflict for Will ${willId}. Expected v${expected}, found v${actual}`);
    this.name = 'WillConcurrencyError';
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

export function createDefaultWillSearchCriteria(): WillSearchCriteria {
  return {
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };
}
