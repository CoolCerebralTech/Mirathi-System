import { WillStatus } from '@prisma/client';
import { WillAggregate } from '../aggregates/will.aggregate';

export interface WillRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(will: WillAggregate): Promise<void>;
  findById(id: string): Promise<WillAggregate | null>;
  exists(id: string): Promise<boolean>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Domain Lookups
  // ---------------------------------------------------------
  findByTestatorId(testatorId: string): Promise<WillAggregate[]>;
  findByStatus(status: WillStatus): Promise<WillAggregate[]>;

  /**
   * Returns the single, legally valid Will for a testator (if any).
   */
  findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null>;

  /**
   * Used to check for newer wills that might supersede a specific one
   */
  findSupersededWills(originalWillId: string): Promise<WillAggregate[]>;

  // ---------------------------------------------------------
  // Workflow Queries
  // ---------------------------------------------------------
  findWillsRequiringWitnesses(): Promise<WillAggregate[]>;
  findWillsPendingActivation(): Promise<WillAggregate[]>;

  // ---------------------------------------------------------
  // Versioning (Audit Trail)
  // ---------------------------------------------------------
  /**
   * Saves a snapshot of the Will state.
   * 'versionData' should be the serialized JSON of the aggregate at that point.
   */
  saveVersion(
    willId: string,
    versionNumber: number,
    versionData: Record<string, any>,
  ): Promise<void>;
  findVersions(willId: string): Promise<{ version: number; data: any; createdAt: Date }[]>;

  // ---------------------------------------------------------
  // Analytics / Bulk
  // ---------------------------------------------------------
  countByTestatorId(testatorId: string): Promise<number>;
  findRecentWills(days: number): Promise<WillAggregate[]>;
}
