import { ExecutorStatus } from '@prisma/client';

import { Executor } from '../entities/executor.entity';

/**
 * Repository Interface for Executor Aggregate Root
 *
 * Defines the contract for Executor data persistence.
 * Includes specialized queries for executor management, role tracking,
 * and Kenyan probate compliance (bonds, eligibility).
 *
 * @interface ExecutorRepositoryInterface
 */
export interface ExecutorRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists an Executor entity to the data store.
   *
   * @param {Executor} executor - The Executor entity to save
   * @returns {Promise<void>}
   */
  save(executor: Executor): Promise<void>;

  /**
   * Retrieves an Executor by its unique identifier.
   *
   * @param {string} id - Unique Executor identifier
   * @returns {Promise<Executor | null>} Executor entity or null if not found
   */
  findById(id: string): Promise<Executor | null>;

  /**
   * Permanently deletes an Executor from the data store.
   *
   * @param {string} id - Unique Executor identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // SCOPE & RELATIONSHIP LOOKUPS
  // ---------------------------------------------------------

  /**
   * Finds all Executors for a specific will.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of Executor entities
   */
  findByWillId(willId: string): Promise<Executor[]>;

  /**
   * Finds all wills where a specific User is nominated as an executor.
   *
   * @param {string} userId - Unique identifier of the executor user
   * @returns {Promise<Executor[]>} Array of Executor entities
   */
  findByExecutorUserId(userId: string): Promise<Executor[]>;

  /**
   * Finds executors by email address (for external/unregistered nominations).
   * Used during the invitation process.
   *
   * @param {string} email - Email address to search
   * @returns {Promise<Executor[]>} Array of Executor entities
   */
  findByExternalEmail(email: string): Promise<Executor[]>;

  // ---------------------------------------------------------
  // ROLE & PRIORITY MANAGEMENT QUERIES
  // ---------------------------------------------------------

  /**
   * Finds the primary executor for a will.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor | null>} Primary Executor entity or null if not found
   */
  findPrimaryExecutor(willId: string): Promise<Executor | null>;

  /**
   * Returns executors sorted by priority order (1, 2, 3...).
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of Executor entities in priority order
   */
  findExecutorsByPriority(willId: string): Promise<Executor[]>;

  /**
   * Finds executors flagged as Professional (e.g., Advocates, Public Trustee).
   * Useful for validating charging clauses and bond requirements.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of Professional Executor entities
   */
  findProfessionalExecutors(willId: string): Promise<Executor[]>;

  // ---------------------------------------------------------
  // STATUS & WORKFLOW QUERIES
  // ---------------------------------------------------------

  /**
   * Finds executors by specific status for a will.
   *
   * @param {string} willId - Unique identifier of the will
   * @param {ExecutorStatus} status - Status to filter by
   * @returns {Promise<Executor[]>} Array of Executor entities with specified status
   */
  findByStatus(willId: string, status: ExecutorStatus): Promise<Executor[]>;

  /**
   * Finds active executors for a will (Accepted/Appointed).
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of active Executor entities
   */
  findActiveExecutors(willId: string): Promise<Executor[]>;

  /**
   * Finds nominated (pending acceptance) executors for a will.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of nominated Executor entities
   */
  findNominatedExecutors(willId: string): Promise<Executor[]>;

  /**
   * Finds executors requiring action (reminders for acceptance/declination).
   *
   * @param {number} daysPending - Number of days since nomination
   * @returns {Promise<Executor[]>} Array of Executor entities requiring action
   */
  findExecutorsRequiringAction(daysPending: number): Promise<Executor[]>;

  // ---------------------------------------------------------
  // LEGAL COMPLIANCE QUERIES (Kenyan Law)
  // ---------------------------------------------------------

  /**
   * Finds executors who have been marked as Ineligible.
   * Used to flag wills that need amendment before activation.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of ineligible Executor entities
   */
  findIneligibleExecutors(willId: string): Promise<Executor[]>;

  /**
   * Finds executors who require a bond but have not yet provided it.
   * Critical for Probate & Administration Rules compliance.
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Executor[]>} Array of executors pending bond provision
   */
  findPendingBondExecutors(willId: string): Promise<Executor[]>;

  /**
   * Counts active executors for a will.
   * Used to enforce Section 51 (Max 4 executors).
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<number>} Count of active executors
   */
  countActiveExecutors(willId: string): Promise<number>;
}
