import { BequestType, DistributionStatus } from '@prisma/client';
import { Beneficiary } from '../entities/beneficiary.entity';

export interface BeneficiaryRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<Beneficiary | null>;
  findByWillId(willId: string): Promise<Beneficiary[]>;
  findByAssetId(assetId: string): Promise<Beneficiary[]>;
  save(beneficiary: Beneficiary): Promise<void>;
  delete(id: string): Promise<void>;

  // Complex queries
  findByBeneficiaryUserId(userId: string): Promise<Beneficiary[]>;
  findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<Beneficiary[]>;
  findConditionalBequests(willId: string): Promise<Beneficiary[]>;
  findDistributedBequests(willId: string): Promise<Beneficiary[]>;

  // Status-based queries
  findByDistributionStatus(willId: string, status: DistributionStatus): Promise<Beneficiary[]>;
  findPendingDistributions(willId: string): Promise<Beneficiary[]>;

  // Analysis queries
  getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocated: number;
    beneficiaryCount: number;
    conditionalCount: number;
  }>;

  getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    byRelationship: Record<string, number>;
  }>;

  // Bulk operations
  bulkUpdateDistributionStatus(
    beneficiaryIds: string[],
    status: DistributionStatus,
    notes?: string,
  ): Promise<void>;

  // Validation queries
  validateNoDuplicateAssignments(
    willId: string,
    assetId: string,
    beneficiaryId: string,
  ): Promise<boolean>;
  getTotalPercentageAllocation(assetId: string): Promise<number>;
}
