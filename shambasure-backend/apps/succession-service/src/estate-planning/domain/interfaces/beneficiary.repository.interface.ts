import { BequestType, DistributionStatus } from '@prisma/client';
import { BeneficiaryAssignment } from '../entities/beneficiary.entity';

/**
 * Repository Interface for Beneficiary Assignment Aggregate Root
 *
 * Defines the contract for Beneficiary Assignment data persistence
 * Includes specialized queries for inheritance planning and distribution tracking
 *
 * @interface BeneficiaryRepositoryInterface
 */
export interface BeneficiaryRepositoryInterface {
  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  /**
   * Persists a Beneficiary Assignment entity to the data store
   *
   * @param {BeneficiaryAssignment} assignment - The Beneficiary Assignment entity to save
   * @returns {Promise<void>}
   */
  save(assignment: BeneficiaryAssignment): Promise<void>;

  /**
   * Retrieves a Beneficiary Assignment by its unique identifier
   *
   * @param {string} id - Unique Beneficiary Assignment identifier
   * @returns {Promise<BeneficiaryAssignment | null>} Beneficiary Assignment or null if not found
   */
  findById(id: string): Promise<BeneficiaryAssignment | null>;

  /**
   * Permanently deletes a Beneficiary Assignment from the data store
   *
   * @param {string} id - Unique Beneficiary Assignment identifier to delete
   * @returns {Promise<void>}
   */
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // STANDARD LOOKUP OPERATIONS
  // ---------------------------------------------------------

  /**
   * Finds all Beneficiary Assignments for a specific will
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<BeneficiaryAssignment[]>} Array of Beneficiary Assignment entities
   */
  findByWillId(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all Beneficiary Assignments for a specific asset
   *
   * @param {string} assetId - Unique identifier of the asset
   * @returns {Promise<BeneficiaryAssignment[]>} Array of Beneficiary Assignment entities
   */
  findByAssetId(assetId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all assignments given to a specific User across different Wills
   *
   * @param {string} userId - Unique identifier of the beneficiary user
   * @returns {Promise<BeneficiaryAssignment[]>} Array of Beneficiary Assignment entities
   */
  findByBeneficiaryUserId(userId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds all assignments given to a Family Member node (HeirLink integration)
   *
   * @param {string} familyMemberId - Unique identifier of the family member
   * @returns {Promise<BeneficiaryAssignment[]>} Array of Beneficiary Assignment entities
   */
  findByBeneficiaryFamilyMemberId(familyMemberId: string): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // STATUS & DISTRIBUTION LOGIC QUERIES
  // ---------------------------------------------------------

  /**
   * Finds conditional bequests requiring special handling
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<BeneficiaryAssignment[]>} Array of conditional Beneficiary Assignment entities
   */
  findConditionalBequests(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds bequests that have been fully distributed
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<BeneficiaryAssignment[]>} Array of distributed Beneficiary Assignment entities
   */
  findDistributedBequests(willId: string): Promise<BeneficiaryAssignment[]>;

  /**
   * Finds bequests by distribution status
   *
   * @param {string} willId - Unique identifier of the will
   * @param {DistributionStatus} status - Distribution status to filter by
   * @returns {Promise<BeneficiaryAssignment[]>} Array of Beneficiary Assignment entities with specified status
   */
  findByDistributionStatus(
    willId: string,
    status: DistributionStatus,
  ): Promise<BeneficiaryAssignment[]>;

  // ---------------------------------------------------------
  // ANALYTICAL SUMMARIES & DASHBOARD QUERIES
  // ---------------------------------------------------------

  /**
   * Provides comprehensive summary of asset distribution
   *
   * @param {string} assetId - Unique identifier of the asset
   * @returns {Promise<{ totalAllocatedPercent: number; beneficiaryCount: number; hasResiduary: boolean }>} Asset distribution summary
   */
  getAssetDistributionSummary(assetId: string): Promise<{
    totalAllocatedPercent: number;
    beneficiaryCount: number;
    hasResiduary: boolean;
  }>;

  /**
   * Provides comprehensive summary of will beneficiaries
   *
   * @param {string} willId - Unique identifier of the will
   * @returns {Promise<{ totalBeneficiaries: number; byBequestType: Record<BequestType, number>; totalConditional: number }>} Will beneficiary summary
   */
  getWillBeneficiarySummary(willId: string): Promise<{
    totalBeneficiaries: number;
    byBequestType: Record<BequestType, number>;
    totalConditional: number;
  }>;

  // ---------------------------------------------------------
  // VALIDATION & INTEGRITY QUERIES
  // ---------------------------------------------------------

  /**
   * Fast calculation of total percentage allocation for an asset
   * Ensures allocations don't exceed 100% during will creation
   *
   * @param {string} assetId - Unique identifier of the asset
   * @returns {Promise<number>} Total percentage allocated (0-100)
   */
  getTotalPercentageAllocation(assetId: string): Promise<number>;
}
