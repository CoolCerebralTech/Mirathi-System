// succession-service/src/succession-process/domain/repositories/distribution.repository.interface.ts

import { Distribution } from '../entities/distribution.entity';
import { DistributionStatus } from '@prisma/client';

export interface DistributionRepositoryInterface {
  save(distribution: Distribution): Promise<void>;
  findById(id: string): Promise<Distribution | null>;

  /**
   * Get the full Distribution Plan (Schedule of Distribution).
   */
  findByEstateId(estateId: string): Promise<Distribution[]>;

  /**
   * Find what a specific beneficiary is getting.
   */
  findByBeneficiaryId(beneficiaryId: string): Promise<Distribution[]>;

  /**
   * Find distributions ready for transfer (Status: PENDING).
   */
  findPendingTransfers(estateId: string): Promise<Distribution[]>;

  /**
   * Bulk update status (e.g., marking 5 land parcels as TRANSFERRED).
   */
  bulkUpdateStatus(ids: string[], status: DistributionStatus, date: Date): Promise<void>;
}
