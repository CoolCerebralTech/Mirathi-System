// src/estate-service/src/domain/entities/enums/liquidation-status.enum.ts

/**
 * Liquidation Status Enum
 *
 * Legal Context:
 * - Court approval required for certain liquidations (S.83 LSA)
 * - Auction process follows Auctioneers Act
 * - Private sale requires family consent
 */
export enum LiquidationStatus {
  // Planning Stage
  DRAFT = 'DRAFT', // Initial planning
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Awaiting court/executor approval

  // Active Process
  APPROVED = 'APPROVED', // All approvals received
  LISTED_FOR_SALE = 'LISTED_FOR_SALE', // Asset listed with agent
  AUCTION_SCHEDULED = 'AUCTION_SCHEDULED', // Auction date set
  AUCTION_IN_PROGRESS = 'AUCTION_IN_PROGRESS', // Live auction

  // Sale Stage
  SALE_PENDING = 'SALE_PENDING', // Sale agreed, pending completion
  SALE_COMPLETED = 'SALE_COMPLETED', // Sale finalized
  PROCEEDS_RECEIVED = 'PROCEEDS_RECEIVED', // Money received

  // Completion
  DISTRIBUTED = 'DISTRIBUTED', // Proceeds added to estate
  CLOSED = 'CLOSED', // Process fully complete

  // Cancellation/Failure
  CANCELLED = 'CANCELLED', // Process cancelled
  FAILED = 'FAILED', // Failed to sell
  EXPIRED = 'EXPIRED', // Listing expired
}

/**
 * Liquidation Status Helper Methods
 */
export class LiquidationStatusHelper {
  /**
   * Check if liquidation can proceed to next status
   */
  static canProceed(currentStatus: LiquidationStatus): boolean {
    const allowedToProceed = [
      LiquidationStatus.APPROVED,
      LiquidationStatus.LISTED_FOR_SALE,
      LiquidationStatus.AUCTION_SCHEDULED,
      LiquidationStatus.SALE_PENDING,
      LiquidationStatus.PROCEEDS_RECEIVED,
    ];
    return allowedToProceed.includes(currentStatus);
  }

  /**
   * Check if liquidation requires court approval
   */
  static requiresCourtApproval(status: LiquidationStatus): boolean {
    return status === LiquidationStatus.PENDING_APPROVAL;
  }

  /**
   * Check if liquidation is active (in process)
   */
  static isActive(status: LiquidationStatus): boolean {
    const activeStatuses = [
      LiquidationStatus.PENDING_APPROVAL,
      LiquidationStatus.APPROVED,
      LiquidationStatus.LISTED_FOR_SALE,
      LiquidationStatus.AUCTION_SCHEDULED,
      LiquidationStatus.AUCTION_IN_PROGRESS,
      LiquidationStatus.SALE_PENDING,
    ];
    return activeStatuses.includes(status);
  }

  /**
   * Check if liquidation is completed
   */
  static isCompleted(status: LiquidationStatus): boolean {
    return [LiquidationStatus.DISTRIBUTED, LiquidationStatus.CLOSED].includes(status);
  }

  /**
   * Check if liquidation is cancelled or failed
   */
  static isTerminal(status: LiquidationStatus): boolean {
    return [
      LiquidationStatus.CANCELLED,
      LiquidationStatus.FAILED,
      LiquidationStatus.EXPIRED,
      LiquidationStatus.CLOSED,
    ].includes(status);
  }

  /**
   * Get valid status transitions
   */
  static getValidTransitions(currentStatus: LiquidationStatus): LiquidationStatus[] {
    const transitions: Record<LiquidationStatus, LiquidationStatus[]> = {
      [LiquidationStatus.DRAFT]: [LiquidationStatus.PENDING_APPROVAL, LiquidationStatus.CANCELLED],
      [LiquidationStatus.PENDING_APPROVAL]: [
        LiquidationStatus.APPROVED,
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.APPROVED]: [
        LiquidationStatus.LISTED_FOR_SALE,
        LiquidationStatus.AUCTION_SCHEDULED,
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.LISTED_FOR_SALE]: [
        LiquidationStatus.SALE_PENDING,
        LiquidationStatus.EXPIRED,
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.AUCTION_SCHEDULED]: [
        LiquidationStatus.AUCTION_IN_PROGRESS,
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.AUCTION_IN_PROGRESS]: [
        LiquidationStatus.SALE_PENDING,
        LiquidationStatus.FAILED,
      ],
      [LiquidationStatus.SALE_PENDING]: [
        LiquidationStatus.SALE_COMPLETED,
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.SALE_COMPLETED]: [LiquidationStatus.PROCEEDS_RECEIVED],
      [LiquidationStatus.PROCEEDS_RECEIVED]: [LiquidationStatus.DISTRIBUTED],
      [LiquidationStatus.DISTRIBUTED]: [LiquidationStatus.CLOSED],
      [LiquidationStatus.CLOSED]: [], // Terminal
      [LiquidationStatus.CANCELLED]: [], // Terminal
      [LiquidationStatus.FAILED]: [
        LiquidationStatus.LISTED_FOR_SALE, // Retry
        LiquidationStatus.AUCTION_SCHEDULED, // Retry
        LiquidationStatus.CANCELLED,
      ],
      [LiquidationStatus.EXPIRED]: [
        LiquidationStatus.LISTED_FOR_SALE, // Re-list
        LiquidationStatus.CANCELLED,
      ],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Check if status transition is valid
   */
  static isValidTransition(from: LiquidationStatus, to: LiquidationStatus): boolean {
    return LiquidationStatusHelper.getValidTransitions(from).includes(to);
  }

  /**
   * Get status description
   */
  static getDescription(status: LiquidationStatus): string {
    const descriptions: Record<LiquidationStatus, string> = {
      [LiquidationStatus.DRAFT]: 'Liquidation in planning stage',
      [LiquidationStatus.PENDING_APPROVAL]: 'Awaiting court or executor approval',
      [LiquidationStatus.APPROVED]: 'Approved for sale/auction',
      [LiquidationStatus.LISTED_FOR_SALE]: 'Listed with real estate agent',
      [LiquidationStatus.AUCTION_SCHEDULED]: 'Auction date scheduled',
      [LiquidationStatus.AUCTION_IN_PROGRESS]: 'Live auction in progress',
      [LiquidationStatus.SALE_PENDING]: 'Sale agreed, pending completion',
      [LiquidationStatus.SALE_COMPLETED]: 'Sale finalized, transfer in progress',
      [LiquidationStatus.PROCEEDS_RECEIVED]: 'Sale proceeds received',
      [LiquidationStatus.DISTRIBUTED]: 'Proceeds added to estate cash',
      [LiquidationStatus.CLOSED]: 'Liquidation process fully complete',
      [LiquidationStatus.CANCELLED]: 'Liquidation cancelled',
      [LiquidationStatus.FAILED]: 'Failed to sell asset',
      [LiquidationStatus.EXPIRED]: 'Sale listing expired',
    };
    return descriptions[status] || 'Unknown status';
  }
}
