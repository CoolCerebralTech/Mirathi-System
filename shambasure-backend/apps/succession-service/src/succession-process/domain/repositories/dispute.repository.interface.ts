import { Dispute } from '../entities/dispute.entity';
import { DisputeType, DisputeStatus } from '@prisma/client';

export interface DisputeRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Dispute | null>;
  findAll(): Promise<Dispute[]>;
  save(dispute: Dispute): Promise<Dispute>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByWillId(willId: string): Promise<Dispute[]>;
  findByDisputantId(disputantId: string): Promise<Dispute[]>;
  findByStatus(status: DisputeStatus): Promise<Dispute[]>;
  findByType(type: DisputeType): Promise<Dispute[]>;

  // Legal process queries
  findByCaseNumber(caseNumber: string): Promise<Dispute | null>;
  findDisputesInMediation(): Promise<Dispute[]>;
  findDisputesInCourt(): Promise<Dispute[]>;
  findResolvedDisputes(): Promise<Dispute[]>;

  // Timeline queries
  findOverdueDisputes(): Promise<Dispute[]>;
  findRecentDisputes(days: number): Promise<Dispute[]>;

  // Complex queries
  findDisputesWithLawyers(): Promise<Dispute[]>;
  findDisputesByGrounds(grounds: string[]): Promise<Dispute[]>;
  findDisputesRequiringHearing(): Promise<Dispute[]>;

  // Statistical queries
  getDisputeStats(estateId?: string): Promise<{
    total: number;
    pending: number;
    inMediation: number;
    inCourt: number;
    resolved: number;
  }>;

  // Bulk operations
  saveAll(disputes: Dispute[]): Promise<Dispute[]>;
  updateStatus(disputeIds: string[], status: DisputeStatus): Promise<void>;

  // Validation queries
  existsActiveDisputeForWill(willId: string): Promise<boolean>;
  existsDisputeByDisputant(disputantId: string, willId: string): Promise<boolean>;

  // Search queries
  searchDisputes(query: string): Promise<Dispute[]>;
}
