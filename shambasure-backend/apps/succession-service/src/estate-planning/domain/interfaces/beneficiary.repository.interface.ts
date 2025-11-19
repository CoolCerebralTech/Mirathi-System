import { BequestType, DistributionStatus } from '@prisma/client';
import { BeneficiaryAssignment } from '../entities/beneficiary.entity';

export interface BeneficiaryRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(assignment: BeneficiaryAssignment): Promise<void>;
  findById(id: string): Promise<BeneficiaryAssignment | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Standard Lookups
  // ---------------------------------------------------------
  findByWillId(willId: string): Promise<BeneficiaryAssignment[]>;
  findByAssetId(assetId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Find all assignments given to a specific User across different Wills
   */
  findByBeneficiaryUserId(userId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Find all assignments given to a Family Member node (HeirLink)
   */
  findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // Status & Logic Queries
  // ---------------------------------------------------------
  findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]>;
  findDistributedBequests(willId: string): Promise<BeneficiaryAssignment[]>;
  findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // Analytical Summaries (Optimization for Dashboards)
  // ---------------------------------------------------------
  getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
  }>;

  getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    totalConditional: number;
  }>;

  // ---------------------------------------------------------
  // Validation Helpers (Performance optimized)
  // ---------------------------------------------------------
  /**
   * Fast SQL check to sum percentages for an asset
   */
  getTotalPercentageAllocation(assetId: string): Promise<number>;
}
