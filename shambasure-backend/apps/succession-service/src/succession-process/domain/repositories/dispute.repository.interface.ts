// succession-service/src/succession-process/domain/repositories/dispute.repository.interface.ts

import { Dispute } from '../entities/dispute.entity';
import { DisputeStatus } from '@prisma/client';

export interface DisputeRepositoryInterface {
  save(dispute: Dispute): Promise<void>;
  findById(id: string): Promise<Dispute | null>;

  /**
   * Find disputes blocking a specific Will.
   */
  findByWillId(willId: string): Promise<Dispute[]>;

  /**
   * Find disputes by the person objecting (Caveator).
   */
  findByDisputantId(disputantId: string): Promise<Dispute[]>;

  /**
   * Find only Active disputes (FILED, MEDIATION, COURT).
   * Used by `DisputeResolutionService` to block Probate.
   */
  findActiveDisputes(willId: string): Promise<Dispute[]>;

  /**
   * Find disputes by Status.
   */
  findByStatus(status: DisputeStatus): Promise<Dispute[]>;
}
