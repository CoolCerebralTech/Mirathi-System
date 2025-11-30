import { DebtPriority, DebtType } from '@prisma/client';

import { Debt } from '../entities/debt.entity';

/**
 * Repository Interface for Debt Aggregate Root
 *
 * Defines the contract for Debt data persistence following Kenyan succession law.
 * Includes specialized queries for liability management, priority ordering (Sixth Schedule),
 * and identifying unenforceable debts (Limitation of Actions Act).
 *
 * @interface DebtRepositoryInterface
 */
export interface DebtRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Debt entity to the data store.
   *
   * @param {Debt} debt - The Debt entity to save
   * @returns {Promise<void>}
   */
  save(debt: Debt): Promise<void>;

  /**
   * Retrieves a Debt by its unique identifier.
   *
   * @param {string} id - Unique Debt identifier
   * @returns {Promise<Debt | null>} Debt entity or null if not found
   */
  findById(id: string): Promise<Debt | null>;

  /**
   * Permanently deletes a Debt from the data store.
   * Generally discouraged in favor of status updates, but allowed for draft errors.
   *
   * @param {string} id - Unique Debt identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all Debts owed by a specific owner (Testator/Estate).
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of Debt entities
   */
  findByOwnerId(ownerId: string): Promise<Debt[]>;

  /**
   * Finds debts secured by a specific asset (e.g., Mortgage, Charge).
   *
   * @param {string} assetId - Unique identifier of the securing asset
   * @returns {Promise<Debt[]>} Array of secured Debt entities
   */
  findByAssetId(assetId: string): Promise<Debt[]>;

  /**
   * Finds all secured debts for an owner (Mortgages, Liens).
   * Useful for calculating Net Free Estate.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of secured Debt entities
   */
  findSecuredDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // PAYMENT STATUS & LEGAL ENFORCEABILITY
  // ---------------------------------------------------------

  /**
   * Finds outstanding (unpaid) debts for an owner.
   * Excludes statute-barred or fully paid debts.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of outstanding Debt entities
   */
  findOutstandingDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Finds fully paid debts for an owner.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of paid Debt entities
   */
  findPaidDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Finds debts that are statute-barred under the Limitation of Actions Act (Cap 22).
   * These debts are technically unenforceable and should not be paid by the estate.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of statute-barred Debt entities
   */
  findStatuteBarredDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Finds debts currently under dispute.
   * These represent contingent liabilities.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of disputed Debt entities
   */
  findDisputedDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // CATEGORIZATION & PRIORITY (SIXTH SCHEDULE)
  // ---------------------------------------------------------

  /**
   * Finds debts by specific type classification.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @param {DebtType} type - Type of debt to find
   * @returns {Promise<Debt[]>} Array of Debt entities of specified type
   */
  findByType(ownerId: string, type: DebtType): Promise<Debt[]>;

  /**
   * Finds priority debts according to Section 83 and the Sixth Schedule.
   * Typically Funeral Expenses and Taxes (HIGHEST priority).
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @param {DebtPriority} [minPriority] - Optional filter for minimum priority level
   * @returns {Promise<Debt[]>} Array of priority Debt entities
   */
  findPriorityDebts(ownerId: string, minPriority?: DebtPriority): Promise<Debt[]>;

  // ---------------------------------------------------------
  // FINANCIAL ANALYSIS QUERIES
  // ---------------------------------------------------------

  /**
   * Calculates total liabilities grouped by currency.
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Array<{ currency: string; amount: number }>>} Liability summary by currency
   */
  getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]>;
}
