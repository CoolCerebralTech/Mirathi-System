import { WillStatus } from '@prisma/client';
import { WillAggregate } from '../aggregates/will.aggregate';

export interface WillRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<WillAggregate | null>;
  findByTestatorId(testatorId: string): Promise<WillAggregate[]>;
  findByStatus(status: WillStatus): Promise<WillAggregate[]>;
  save(will: WillAggregate): Promise<void>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Complex queries
  findActiveWillByTestatorId(testatorId: string): Promise<WillAggregate | null>;
  findWillsRequiringWitnesses(): Promise<WillAggregate[]>;
  findWillsPendingActivation(): Promise<WillAggregate[]>;
  findSupersededWills(originalWillId: string): Promise<WillAggregate[]>;

  // Will versions
  saveVersion(willId: string, versionData: any): Promise<void>;
  findVersions(willId: string): Promise<any[]>;

  // Bulk operations
  countByTestatorId(testatorId: string): Promise<number>;
  findRecentWills(days: number): Promise<WillAggregate[]>;

  // Transaction support
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
