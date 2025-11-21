import { DebtType } from '@prisma/client';
import { Debt } from '../entities/debt.entity';

/**
 * Repository Interface for Debt Aggregate Root
 *
 * Defines the contract for Debt data persistence following Kenyan succession law
 * Includes specialized queries for debt management and estate liability calculation
 *
 * @interface DebtRepositoryInterface
 */
export interface DebtRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Debt entity to the data store
   *
   * @param {Debt} debt - The Debt entity to save
   * @returns {Promise<void>}
   */
  save(debt: Debt): Promise<void>;

  /**
   * Retrieves a Debt by its unique identifier
   *
   * @param {string} id - Unique Debt identifier
   * @returns {Promise<Debt | null>} Debt entity or null if not found
   */
  findById(id: string): Promise<Debt | null>;

  /**
   * Permanently deletes a Debt from the data store (only if created in error)
   *
   * @param {string} id - Unique Debt identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all Debts owed by a specific owner
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of Debt entities
   */
  findByOwnerId(ownerId: string): Promise<Debt[]>;

  /**
   * Finds debts secured by a specific asset (e.g., Mortgage)
   *
   * @param {string} assetId - Unique identifier of the securing asset
   * @returns {Promise<Debt[]>} Array of secured Debt entities
   */
  findByAssetId(assetId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // PAYMENT STATUS & COLLECTION QUERIES
  // ---------------------------------------------------------

  /**
   * Finds outstanding (unpaid) debts for an owner
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of outstanding Debt entities
   */
  findOutstandingDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Finds fully paid debts for an owner
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of paid Debt entities
   */
  findPaidDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Finds debts that are overdue based on DueDate
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of overdue Debt entities
   */
  findOverdueDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // CATEGORIZATION & PRIORITY QUERIES
  // ---------------------------------------------------------

  /**
   * Finds debts by specific type classification
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @param {DebtType} type - Type of debt to find
   * @returns {Promise<Debt[]>} Array of Debt entities of specified type
   */
  findByType(ownerId: string, type: DebtType): Promise<Debt[]>;

  /**
   * Finds priority debts for Section 83 handling (Funeral/Taxes first)
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Debt[]>} Array of priority Debt entities
   */
  findPriorityDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // FINANCIAL ANALYSIS QUERIES
  // ---------------------------------------------------------

  /**
   * Calculates total liabilities grouped by currency
   *
   * @param {string} ownerId - Unique identifier of the debt owner
   * @returns {Promise<Array<{ currency: string; amount: number }>>} Liability summary by currency
   */
  getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]>;
}
