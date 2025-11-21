import { WillStatus } from '@prisma/client';
import { WillAggregate } from '../aggregates/will.aggregate';

/**
 * Repository Interface for Will Aggregate Root
 *
 * Defines the contract for Will data persistence following Kenyan succession law
 * Includes specialized queries for will lifecycle management and legal compliance
 *
 * @interface WillRepositoryInterface
 */
export interface WillRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Will Aggregate to the data store
   *
   * @param {WillAggregate} will - The Will Aggregate to save
   * @returns {Promise<void>}
   */
  save(will: WillAggregate): Promise<void>;

  /**
   * Retrieves a Will Aggregate by its unique identifier
   *
   * @param {string} id - Unique Will identifier
   * @returns {Promise<WillAggregate | null>} Will Aggregate or null if not found
   */
  findById(id: string): Promise<WillAggregate | null>;

  /**
   * Checks if a Will exists with the given identifier
   *
   * @param {string} id - Unique Will identifier to check
   * @returns {Promise<boolean>} True if Will exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Permanently deletes a Will from the data store
   *
   * @param {string} id - Unique Will identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  /**
   * Performs soft deletion of a Will (marks as inactive)
   *
   * @param {string} id - Unique Will identifier to soft delete
   * @returns {Promise<void>}
   */
  softDelete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // DOMAIN-SPECIFIC LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all Wills created by a specific testator
   *
   * @param {string} testatorId - Unique identifier of the testator
   * @returns {Promise<WillAggregate[]>} Array of Will Aggregates
   */
  findByTestatorId(testatorId: string): Promise<WillAggregate[]>;

  /**
   * Finds Wills by specific status
   *
   * @param {WillStatus} status - Status to filter by
   * @returns {Promise<WillAggregate[]>} Array of Will Aggregates with specified status
   */
  findByStatus(status: WillStatus): Promise<WillAggregate[]>;

  /**
   * Returns the single, legally valid Will for a testator (if any)
   *
   * @param {string} testatorId - Unique identifier of the testator
   * @returns {Promise<WillAggregate | null>} Active Will Aggregate or null if not found
   */
  findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null>;

  /**
   * Finds wills that supersede a specific will (newer versions)
   *
   * @param {string} originalWillId - Unique identifier of the original will
   * @returns {Promise<WillAggregate[]>} Array of superseding Will Aggregates
   */
  findSupersededWills(originalWillId: string): Promise<WillAggregate[]>;

  // ---------------------------------------------------------
  // WORKFLOW & LIFECYCLE QUERIES
  // ---------------------------------------------------------

  /**
   * Finds wills requiring witness completion
   *
   * @returns {Promise<WillAggregate[]>} Array of Will Aggregates needing witnesses
   */
  findWillsRequiringWitnesses(): Promise<WillAggregate[]>;

  /**
   * Finds wills pending activation (witnessed but not yet active)
   *
   * @returns {Promise<WillAggregate[]>} Array of Will Aggregates pending activation
   */
  findWillsPendingActivation(): Promise<WillAggregate[]>;

  // ---------------------------------------------------------
  // VERSIONING & AUDIT TRAIL OPERATIONS
  // ---------------------------------------------------------

  /**
   * Saves a version snapshot of the Will state for audit trail
   *
   * @param {string} willId - Unique identifier of the will
   * @param {number} versionNumber - Version number for this snapshot
   * @param {Record<string, any>} versionData - Serialized JSON of the aggregate state
   * @returns {Promise<void>}
   */
  saveVersion(
    willId: string,
    versionNumber: number,
    versionData: Record<string, any>,
  ): Promise<void>;

  /**
   * Retrieves version history for a will
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Array<{ version: number; data: any; createdAt: Date }>>} Array of version snapshots
   */
  findVersions(willId: string): Promise<{ version: number; data: any; createdAt: Date }[]>;

  // ---------------------------------------------------------
  // ANALYTICS & BULK OPERATION QUERIES
  // ---------------------------------------------------------

  /**
   * Counts wills created by a specific testator
   *
   * @param {string} testatorId - Unique identifier of the testator
   * @returns {Promise<number>} Count of wills
   */
  countByTestatorId(testatorId: string): Promise<number>;

  /**
   * Finds recently created or modified wills
   *
   * @param {number} days - Number of days to look back
   * @returns {Promise<WillAggregate[]>} Array of recent Will Aggregates
   */
  findRecentWills(days: number): Promise<WillAggregate[]>;
}
