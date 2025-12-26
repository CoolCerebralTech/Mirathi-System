// src/estate-service/src/domain/entities/enums/asset-status.enum.ts

/**
 * Asset Status Enum
 *
 * Legal Context:
 * - ACTIVE: Asset is part of estate and available for distribution
 * - LIQUIDATED: Asset has been converted to cash (S.45 debt payment)
 * - ENCUMBERED: Asset has legal claims against it (mortgage, lien)
 * - DISPUTED: Asset ownership is under legal dispute
 * - TRANSFERRED: Asset has been transferred to beneficiary
 * - DELETED: Asset has been soft-deleted (legal audit trail)
 */
export enum AssetStatus {
  // Core Statuses
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',

  // Lifecycle Statuses
  LIQUIDATED = 'LIQUIDATED',
  ENCUMBERED = 'ENCUMBERED',
  DISPUTED = 'DISPUTED',
  TRANSFERRED = 'TRANSFERRED',

  // Administrative Statuses
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',

  // Legal Statuses
  UNDER_INJUNCTION = 'UNDER_INJUNCTION',
  FROZEN = 'FROZEN',

  // End of Life Statuses
  DELETED = 'DELETED',
}

/**
 * Asset Status Helper Methods
 */
export class AssetStatusHelper {
  /**
   * Check if asset can be distributed in current status
   */
  static canBeDistributed(status: AssetStatus): boolean {
    const distributableStatuses = [AssetStatus.ACTIVE, AssetStatus.VERIFIED];
    return distributableStatuses.includes(status);
  }

  /**
   * Check if asset can be liquidated in current status
   */
  static canBeLiquidated(status: AssetStatus): boolean {
    const liquidatableStatuses = [
      AssetStatus.ACTIVE,
      AssetStatus.VERIFIED,
      AssetStatus.ENCUMBERED, // May need to liquidate to pay secured debt
    ];
    return liquidatableStatuses.includes(status);
  }

  /**
   * Check if asset is in a legal dispute
   */
  static isInDispute(status: AssetStatus): boolean {
    return [AssetStatus.DISPUTED, AssetStatus.UNDER_INJUNCTION].includes(status);
  }

  /**
   * Check if asset is available for valuation
   */
  static canBeValued(status: AssetStatus): boolean {
    return ![AssetStatus.DELETED, AssetStatus.TRANSFERRED, AssetStatus.LIQUIDATED].includes(status);
  }

  /**
   * Get next valid status transitions
   */
  static getValidTransitions(currentStatus: AssetStatus): AssetStatus[] {
    const transitions: Record<AssetStatus, AssetStatus[]> = {
      [AssetStatus.ACTIVE]: [
        AssetStatus.INACTIVE,
        AssetStatus.LIQUIDATED,
        AssetStatus.ENCUMBERED,
        AssetStatus.DISPUTED,
        AssetStatus.TRANSFERRED,
        AssetStatus.DELETED,
      ],
      [AssetStatus.INACTIVE]: [AssetStatus.ACTIVE, AssetStatus.DELETED],
      [AssetStatus.LIQUIDATED]: [
        // Once liquidated, no further status changes
      ],
      [AssetStatus.ENCUMBERED]: [
        AssetStatus.ACTIVE, // After encumbrance removal
        AssetStatus.LIQUIDATED,
      ],
      [AssetStatus.DISPUTED]: [
        AssetStatus.ACTIVE, // After dispute resolution
        AssetStatus.UNDER_INJUNCTION,
      ],
      [AssetStatus.TRANSFERRED]: [
        // Once transferred, no further status changes
      ],
      [AssetStatus.PENDING_VERIFICATION]: [
        AssetStatus.VERIFIED,
        AssetStatus.REJECTED,
        AssetStatus.ACTIVE,
      ],
      [AssetStatus.VERIFIED]: [AssetStatus.ACTIVE, AssetStatus.INACTIVE],
      [AssetStatus.REJECTED]: [
        AssetStatus.PENDING_VERIFICATION, // After correction
      ],
      [AssetStatus.UNDER_INJUNCTION]: [
        AssetStatus.DISPUTED,
        AssetStatus.ACTIVE, // After injunction lifted
      ],
      [AssetStatus.FROZEN]: [
        AssetStatus.ACTIVE, // After freeze lifted
      ],
      [AssetStatus.DELETED]: [
        // Once deleted, no further status changes (soft delete)
      ],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Check if status transition is valid
   */
  static isValidTransition(from: AssetStatus, to: AssetStatus): boolean {
    return AssetStatusHelper.getValidTransitions(from).includes(to);
  }

  /**
   * Get human-readable status description
   */
  static getDescription(status: AssetStatus): string {
    const descriptions: Record<AssetStatus, string> = {
      [AssetStatus.ACTIVE]: 'Asset is active and available for distribution',
      [AssetStatus.INACTIVE]: 'Asset is temporarily inactive',
      [AssetStatus.LIQUIDATED]: 'Asset has been converted to cash',
      [AssetStatus.ENCUMBERED]: 'Asset has legal claims/mortgage against it',
      [AssetStatus.DISPUTED]: 'Asset ownership is under legal dispute',
      [AssetStatus.TRANSFERRED]: 'Asset has been transferred to beneficiary',
      [AssetStatus.PENDING_VERIFICATION]: 'Asset details pending verification',
      [AssetStatus.VERIFIED]: 'Asset details verified and confirmed',
      [AssetStatus.REJECTED]: 'Asset details rejected during verification',
      [AssetStatus.UNDER_INJUNCTION]: 'Asset under court injunction',
      [AssetStatus.FROZEN]: 'Asset frozen by court order',
      [AssetStatus.DELETED]: 'Asset has been deleted from system',
    };
    return descriptions[status] || 'Unknown status';
  }

  /**
   * Get status category
   */
  static getCategory(status: AssetStatus): string {
    if ([AssetStatus.ACTIVE, AssetStatus.VERIFIED].includes(status)) {
      return 'DISTRIBUTABLE';
    }
    if ([AssetStatus.LIQUIDATED, AssetStatus.TRANSFERRED].includes(status)) {
      return 'FINALIZED';
    }
    if ([AssetStatus.DISPUTED, AssetStatus.UNDER_INJUNCTION, AssetStatus.FROZEN].includes(status)) {
      return 'LEGAL_HOLD';
    }
    if ([AssetStatus.ENCUMBERED].includes(status)) {
      return 'ENCUMBERED';
    }
    if ([AssetStatus.DELETED].includes(status)) {
      return 'DELETED';
    }
    return 'PROCESSING';
  }
}
