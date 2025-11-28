import { WitnessStatus } from '@prisma/client';
import { Witness } from '../entities/witness.entity';

/**
 * Repository Interface for Witness Aggregate Root
 *
 * Defines the contract for Witness data persistence
 * Includes specialized queries for witness management and legal compliance
 *
 * @interface WitnessRepositoryInterface
 */
export interface WitnessRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Witness entity to the data store
   *
   * @param {Witness} witness - The Witness entity to save
   * @returns {Promise<void>}
   */
  save(witness: Witness): Promise<void>;

  /**
   * Retrieves a Witness by its unique identifier
   *
   * @param {string} id - Unique Witness identifier
   * @returns {Promise<Witness | null>} Witness entity or null if not found
   */
  findById(id: string): Promise<Witness | null>;

  /**
   * Permanently deletes a Witness from the data store
   *
   * @param {string} id - Unique Witness identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // SCOPE & RELATIONSHIP LOOKUPS
  // ---------------------------------------------------------

  /**
   * Finds all Witnesses for a specific will
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<Witness[]>} Array of Witness entities
   */
  findByWillId(willId: string): Promise<Witness[]>;

  /**
   * Finds all instances where a specific User has served as a witness
   *
   * @param {string} userId - Unique identifier of the witness user
   * @returns {Promise<Witness[]>} Array of Witness entities
   */
  findByWitnessUserId(userId: string): Promise<Witness[]>;

  /**
   * Finds witnesses by Kenyan National ID for conflict checks
   *
   * @param {string} idNumber - Kenyan National ID number
   * @returns {Promise<Witness[]>} Array of Witness entities with specified ID
   */
  findByIdNumber(idNumber: string): Promise<Witness[]>;

  // ---------------------------------------------------------
  // STATUS & VERIFICATION QUERIES
  // ---------------------------------------------------------

  /**
   * Finds witnesses by specific status for a will
   *
   * @param {string} willId - Unique identifier of the will
   * @param {WitnessStatus} status - Status to filter by
   * @returns {Promise<Witness[]>} Array of Witness entities with specified status
   */
  findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]>;

  /**
   * Finds witnesses who have signed but are awaiting Admin verification
   *
   * @returns {Promise<Witness[]>} Array of Witness entities pending verification
   */
  findPendingVerification(): Promise<Witness[]>;

  /**
   * Counts valid witnesses (Verified/Signed) for a will
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<number>} Count of valid witnesses
   */
  countValidWitnesses(willId: string): Promise<number>;

  // ---------------------------------------------------------
  // BULK OPERATIONS & ADMINISTRATIVE QUERIES
  // ---------------------------------------------------------

  /**
   * Bulk updates witness status (e.g., when a Will is revoked)
   *
   * @param {string[]} witnessIds - Array of witness identifiers to update
   * @param {WitnessStatus} status - New status to set
   * @param {string} [reason] - Reason for status change
   * @returns {Promise<void>}
   */
  bulkUpdateStatus(witnessIds: string[], status: WitnessStatus, reason?: string): Promise<void>;
}
