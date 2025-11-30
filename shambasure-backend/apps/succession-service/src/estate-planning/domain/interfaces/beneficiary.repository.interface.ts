import { BequestType, DistributionStatus } from '@prisma/client';

import { BeneficiaryAssignment } from '../entities/beneficiary.entity';

/**
 * Repository Interface for Beneficiary Assignment Aggregate Root
 *
 * Defines the contract for Beneficiary Assignment data persistence.
 * Includes specialized queries for inheritance planning, distribution tracking,
 * and Kenyan legal compliance (dependants, life interests).
 *
 * @interface BeneficiaryRepositoryInterface
 */
export interface BeneficiaryRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Beneficiary Assignment entity to the data store.
   *
   * @param {BeneficiaryAssignment} assignment - The entity to save
   * @returns {Promise<void>}
   */
  save(assignment: BeneficiaryAssignment): Promise<void>;

  /**
   * Retrieves a Beneficiary Assignment by its unique identifier.
   *
   * @param {string} id - Unique identifier
   * @returns {Promise<BeneficiaryAssignment | null>} Entity or null
   */
  findById(id: string): Promise<BeneficiaryAssignment | null>;

  /**
   * Permanently deletes a Beneficiary Assignment.
   *
   * @param {string} id - Unique identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all assignments for a specific Will.
   *
   * @param {string} willId - Will ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByWillId(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all assignments for a specific Asset.
   * Useful for validating 100% distribution.
   *
   * @param {string} assetId - Asset ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByAssetId(assetId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all assignments given to a specific User.
   *
   * @param {string} userId - User ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByBeneficiaryUserId(userId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all assignments linked to a Family Member profile.
   *
   * @param {string} familyMemberId - Family Member ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds assignments for external beneficiaries by name (case-insensitive search).
   * Critical for checking Witness-Beneficiary conflicts (Section 13).
   *
   * @param {string} willId - Context Will ID
   * @param {string} name - External name to search
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByExternalIdentity(willId: string, name: string): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // LEGAL COMPLIANCE QUERIES (Kenyan Law)
  // ---------------------------------------------------------

  /**
   * Finds assignments explicitly marked as Dependant Provisions.
   * Used for Section 26 (Adequate Provision) validation.
   *
   * @param {string} willId - Will ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findDependantAssignments(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds assignments subject to a Life Interest.
   * Used for Section 37 (Spousal Life Interest) compliance.
   *
   * @param {string} willId - Will ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findLifeInterestAssignments(willId: string): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // STATUS & DISTRIBUTION LOGIC QUERIES
  // ---------------------------------------------------------

  /**
   * Finds conditional bequests requiring special handling.
   *
   * @param {string} willId - Will ID
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds bequests by distribution status.
   *
   * @param {string} willId - Will ID
   * @param {DistributionStatus} status - Status enum
   * @returns {Promise<BeneficiaryAssignment[]>}
   */
  findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // ANALYTICAL SUMMARIES & VALIDATION
  // ---------------------------------------------------------

  /**
   * Provides summary of asset distribution to ensure full allocation.
   *
   * @param {string} assetId - Asset ID
   * @returns {Promise<{ totalAllocatedPercent: number; beneficiaryCount: number; hasResiduary: boolean }>}
   */
  getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
  }>;

  /**
   * Provides summary of will beneficiaries for dashboards.
   *
   * @param {string} willId - Will ID
   * @returns {Promise<{ totalBeneficiaries: number; byBequestType: Record<BequestType, number> }>}
   */
  getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    totalConditional: number;
  }>;

  /**
   * Calculates total percentage allocation for an asset.
   * Used by WillStructurePolicy.
   *
   * @param {string} assetId - Asset ID
   * @returns {Promise<number>} Total percentage (0-100)
   */
  getTotalPercentageAllocation(assetId: string): Promise<number>;
}
