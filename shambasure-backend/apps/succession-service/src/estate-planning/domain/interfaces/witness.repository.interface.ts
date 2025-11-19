import { WitnessStatus } from '@prisma/client';
import { Witness } from '../entities/witness.entity';

export interface WitnessRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(witness: Witness): Promise<void>;
  findById(id: string): Promise<Witness | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Scope Lookups
  // ---------------------------------------------------------
  findByWillId(willId: string): Promise<Witness[]>;

  /**
   * Find all instances where a specific User has served as a witness.
   */
  findByWitnessUserId(userId: string): Promise<Witness[]>;

  /**
   * Find witnesses by Kenyan National ID (for conflict checks across the system).
   */
  findByIdNumber(idNumber: string): Promise<Witness[]>;

  // ---------------------------------------------------------
  // Status Queries
  // ---------------------------------------------------------
  findByStatus(willId: string, status: WitnessStatus): Promise<Witness[]>;

  /**
   * Find witnesses who have signed but are awaiting Admin verification.
   */
  findPendingVerification(): Promise<Witness[]>;

  /**
   * Get valid witnesses count (Verified/Signed)
   */
  countValidWitnesses(willId: string): Promise<number>;

  // ---------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------
  /**
   * Used when a Will is revoked, possibly invalidating witness requests
   */
  bulkUpdateStatus(witnessIds: string[], status: WitnessStatus, reason?: string): Promise<void>;
}
