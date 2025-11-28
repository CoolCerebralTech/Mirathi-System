import { Distribution, BeneficiaryType } from '../entities/distribution.entity';
import { DistributionStatus } from '@prisma/client';

export interface DistributionRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Distribution | null>;
  findAll(): Promise<Distribution[]>;
  save(distribution: Distribution): Promise<Distribution>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findByEstateId(estateId: string): Promise<Distribution[]>;
  findByBeneficiaryId(beneficiaryId: string): Promise<Distribution[]>;
  findByStatus(status: DistributionStatus): Promise<Distribution[]>;
  findByAssetId(assetId: string): Promise<Distribution[]>;

  // Beneficiary type queries
  findByBeneficiaryType(beneficiaryType: BeneficiaryType): Promise<Distribution[]>;
  findExternalBeneficiaryDistributions(): Promise<Distribution[]>;

  // Status management queries
  findPendingDistributions(estateId: string): Promise<Distribution[]>;
  findCompletedDistributions(estateId: string): Promise<Distribution[]>;
  findDisputedDistributions(estateId: string): Promise<Distribution[]>;
  findDeferredDistributions(estateId: string): Promise<Distribution[]>;

  // Financial queries
  getTotalDistributionValue(estateId: string): Promise<number>;
  getCompletedDistributionValue(estateId: string): Promise<number>;
  getPendingDistributionValue(estateId: string): Promise<number>;

  // Complex queries
  findDistributionsRequiringTransfer(): Promise<Distribution[]>;
  findDistributionsWithConditions(): Promise<Distribution[]>;
  findLifeInterestDistributions(): Promise<Distribution[]>;
  findMinorBeneficiaryDistributions(): Promise<Distribution[]>;

  // Timeline queries
  findOverdueDistributions(): Promise<Distribution[]>;
  findDistributionsDueSoon(days: number): Promise<Distribution[]>;

  // Bulk operations
  saveAll(distributions: Distribution[]): Promise<Distribution[]>;
  updateStatus(distributionIds: string[], status: DistributionStatus): Promise<void>;

  // Validation queries
  existsDistributionForAsset(estateId: string, assetId: string): Promise<boolean>;
  existsDistributionForBeneficiary(estateId: string, beneficiaryId: string): Promise<boolean>;

  // Statistical queries
  getDistributionSummary(estateId: string): Promise<{
    totalDistributions: number;
    completed: number;
    pending: number;
    disputed: number;
    deferred: number;
    totalValue: number;
  }>;
}
