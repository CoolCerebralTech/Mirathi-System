// src/estate-service/src/domain/enums/co-ownership-type.enum.ts

/**
 * Co-Ownership Type Enum
 *
 * Legal Context (Kenyan Law of Property Act):
 * - SOLE: Single owner (100% ownership)
 * - JOINT_TENANCY: Joint owners with right of survivorship (automatically passes to survivors)
 * - TENANCY_IN_COMMON: Shared ownership with separate, transferable shares
 * - COMMUNITY_PROPERTY: Marital property regime (50/50 split in divorce)
 * - CUSTOMARY: Traditional/customary ownership arrangements
 */
export enum CoOwnershipType {
  // Individual Ownership
  SOLE = 'SOLE',

  // Joint Ownership Types
  JOINT_TENANCY = 'JOINT_TENANCY', // Right of survivorship (common for spouses)
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON', // Separate shares, no survivorship

  // Marital Property
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY', // Marital property regime

  // Special Types
  CUSTOMARY = 'CUSTOMARY', // Traditional/customary arrangements
  TRUST = 'TRUST', // Held in trust
  PARTNERSHIP = 'PARTNERSHIP', // Business partnership ownership
}

/**
 * Co-Ownership Type Helper Methods
 */
export class CoOwnershipTypeHelper {
  /**
   * Check if ownership type allows right of survivorship
   */
  static hasRightOfSurvivorship(ownershipType: CoOwnershipType): boolean {
    return ownershipType === CoOwnershipType.JOINT_TENANCY;
  }

  /**
   * Check if ownership type requires equal shares
   */
  static requiresEqualShares(ownershipType: CoOwnershipType): boolean {
    return [CoOwnershipType.JOINT_TENANCY, CoOwnershipType.COMMUNITY_PROPERTY].includes(
      ownershipType,
    );
  }

  /**
   * Check if ownership type allows independent transfer
   */
  static allowsIndependentTransfer(ownershipType: CoOwnershipType): boolean {
    return ownershipType === CoOwnershipType.TENANCY_IN_COMMON;
  }

  /**
   * Get inheritance implications
   */
  static getInheritanceImplications(ownershipType: CoOwnershipType): string[] {
    const implications: Record<CoOwnershipType, string[]> = {
      [CoOwnershipType.SOLE]: ['Full ownership passes to estate', 'Subject to inheritance tax'],
      [CoOwnershipType.JOINT_TENANCY]: [
        'Surviving co-owner automatically inherits share',
        'Not part of deceased estate',
        'No probate required for this share',
      ],
      [CoOwnershipType.TENANCY_IN_COMMON]: [
        'Deceased share becomes part of estate',
        'Subject to probate',
        'Survivors do not automatically inherit',
      ],
      [CoOwnershipType.COMMUNITY_PROPERTY]: [
        'Spouse retains 50% share',
        'Deceased 50% share becomes part of estate',
        'Subject to matrimonial property laws',
      ],
      [CoOwnershipType.CUSTOMARY]: [
        'Subject to customary inheritance rules',
        'Clan elders may determine distribution',
        'May bypass statutory succession',
      ],
      [CoOwnershipType.TRUST]: [
        'Subject to trust deed terms',
        'May bypass probate',
        'Trustees manage distribution',
      ],
      [CoOwnershipType.PARTNERSHIP]: [
        'Subject to partnership agreement',
        'May have buy-sell provisions',
        'Business valuation required',
      ],
    };

    return implications[ownershipType] || [];
  }

  /**
   * Check if this ownership type affects distributable share calculation
   */
  static affectsDistributableShare(ownershipType: CoOwnershipType): boolean {
    // Joint tenancy shares don't go through estate
    return ownershipType !== CoOwnershipType.JOINT_TENANCY;
  }

  /**
   * Get default share percentages based on ownership type
   */
  static getDefaultShares(ownershipType: CoOwnershipType, numberOfOwners: number): number[] {
    if (ownershipType === CoOwnershipType.SOLE) {
      return [100];
    }

    if (ownershipType === CoOwnershipType.JOINT_TENANCY) {
      // Equal shares for joint tenants
      const equalShare = 100 / numberOfOwners;
      return Array(numberOfOwners).fill(equalShare);
    }

    if (ownershipType === CoOwnershipType.COMMUNITY_PROPERTY) {
      // Always 50/50 for marital property
      return [50, 50];
    }

    // For other types, no default - must be specified
    return [];
  }

  /**
   * Validate share percentages for ownership type
   */
  static validateShares(ownershipType: CoOwnershipType, shares: number[]): boolean {
    const total = shares.reduce((sum, share) => sum + share, 0);

    // Must total 100%
    if (Math.abs(total - 100) > 0.01) {
      return false;
    }

    // Joint tenancy and community property require equal shares
    if (ownershipType === CoOwnershipType.JOINT_TENANCY) {
      const firstShare = shares[0];
      return shares.every((share) => Math.abs(share - firstShare) < 0.01);
    }

    if (ownershipType === CoOwnershipType.COMMUNITY_PROPERTY) {
      return shares.length === 2 && Math.abs(shares[0] - 50) < 0.01;
    }

    return true;
  }

  /**
   * Get ownership type description
   */
  static getDescription(ownershipType: CoOwnershipType): string {
    const descriptions: Record<CoOwnershipType, string> = {
      [CoOwnershipType.SOLE]: 'Single individual owns 100% of the asset',
      [CoOwnershipType.JOINT_TENANCY]: 'Co-owners with right of survivorship',
      [CoOwnershipType.TENANCY_IN_COMMON]: 'Co-owners with separate, transferable shares',
      [CoOwnershipType.COMMUNITY_PROPERTY]: 'Marital property with equal shares',
      [CoOwnershipType.CUSTOMARY]: 'Traditional/customary ownership arrangements',
      [CoOwnershipType.TRUST]: 'Asset held in trust for beneficiaries',
      [CoOwnershipType.PARTNERSHIP]: 'Business partnership ownership',
    };
    return descriptions[ownershipType] || 'Unknown ownership type';
  }
}
