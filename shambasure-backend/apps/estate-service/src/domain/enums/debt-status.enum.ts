// src/estate-service/src/domain/entities/enums/debt-status.enum.ts

/**
 * Debt Status Enum
 *
 * Legal Context:
 * - S.45 LSA: Order of payment of debts
 * - Limitation Act: Time-barred debts after 6 years (12 for secured)
 * - Kenyan law recognizes disputed debts separately
 */
export enum DebtStatus {
  // Active Statuses
  OUTSTANDING = 'OUTSTANDING', // Debt exists, not yet paid
  PARTIALLY_PAID = 'PARTIALLY_PAID', // Some payments made
  IN_COLLECTION = 'IN_COLLECTION', // Sent to collection agency

  // Dispute Statuses
  DISPUTED = 'DISPUTED', // Debt validity challenged
  UNDER_REVIEW = 'UNDER_REVIEW', // Being reviewed by court/executor

  // Resolution Statuses
  SETTLED = 'SETTLED', // Fully paid
  WRITTEN_OFF = 'WRITTEN_OFF', // Written off as uncollectible
  FORGIVEN = 'FORGIVEN', // Creditor forgave the debt

  // Legal Statuses
  STATUTE_BARRED = 'STATUTE_BARRED', // Time-barred under Limitation Act
  DISCHARGED = 'DISCHARGED', // Legally discharged (bankruptcy)
  CONVERTED = 'CONVERTED', // Converted to equity or other form

  // Administrative
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Awaiting creditor confirmation
  VERIFIED = 'VERIFIED', // Confirmed by creditor
}

/**
 * Debt Status Helper Methods
 */
export class DebtStatusHelper {
  /**
   * Check if debt is active (needs to be paid)
   */
  static isActive(status: DebtStatus): boolean {
    const activeStatuses = [
      DebtStatus.OUTSTANDING,
      DebtStatus.PARTIALLY_PAID,
      DebtStatus.IN_COLLECTION,
      DebtStatus.DISPUTED,
      DebtStatus.UNDER_REVIEW,
      DebtStatus.PENDING_VERIFICATION,
    ];
    return activeStatuses.includes(status);
  }

  /**
   * Check if debt is resolved (no longer needs payment)
   */
  static isResolved(status: DebtStatus): boolean {
    const resolvedStatuses = [
      DebtStatus.SETTLED,
      DebtStatus.WRITTEN_OFF,
      DebtStatus.FORGIVEN,
      DebtStatus.STATUTE_BARRED,
      DebtStatus.DISCHARGED,
      DebtStatus.CONVERTED,
    ];
    return resolvedStatuses.includes(status);
  }

  /**
   * Check if debt is collectible
   */
  static isCollectible(status: DebtStatus): boolean {
    return ![
      DebtStatus.STATUTE_BARRED,
      DebtStatus.WRITTEN_OFF,
      DebtStatus.FORGIVEN,
      DebtStatus.DISCHARGED,
    ].includes(status);
  }

  /**
   * Check if debt is statute barred
   */
  static isStatuteBarred(status: DebtStatus): boolean {
    return status === DebtStatus.STATUTE_BARRED;
  }

  /**
   * Check if debt can be included in S.45 calculations
   */
  static isIncludedInS45(status: DebtStatus): boolean {
    const excludedStatuses = [
      DebtStatus.STATUTE_BARRED,
      DebtStatus.WRITTEN_OFF,
      DebtStatus.FORGIVEN,
      DebtStatus.DISCHARGED,
      DebtStatus.CONVERTED,
    ];
    return !excludedStatuses.includes(status);
  }

  /**
   * Get valid status transitions
   */
  static getValidTransitions(currentStatus: DebtStatus): DebtStatus[] {
    const transitions: Record<DebtStatus, DebtStatus[]> = {
      [DebtStatus.OUTSTANDING]: [
        DebtStatus.PARTIALLY_PAID,
        DebtStatus.DISPUTED,
        DebtStatus.PENDING_VERIFICATION,
        DebtStatus.IN_COLLECTION,
        DebtStatus.SETTLED,
        DebtStatus.WRITTEN_OFF,
        DebtStatus.STATUTE_BARRED,
      ],
      [DebtStatus.PARTIALLY_PAID]: [
        DebtStatus.SETTLED,
        DebtStatus.DISPUTED,
        DebtStatus.IN_COLLECTION,
        DebtStatus.WRITTEN_OFF,
      ],
      [DebtStatus.IN_COLLECTION]: [
        DebtStatus.PARTIALLY_PAID,
        DebtStatus.SETTLED,
        DebtStatus.WRITTEN_OFF,
        DebtStatus.DISPUTED,
      ],
      [DebtStatus.DISPUTED]: [
        DebtStatus.OUTSTANDING,
        DebtStatus.UNDER_REVIEW,
        DebtStatus.WRITTEN_OFF,
      ],
      [DebtStatus.UNDER_REVIEW]: [
        DebtStatus.OUTSTANDING,
        DebtStatus.DISPUTED,
        DebtStatus.WRITTEN_OFF,
      ],
      [DebtStatus.SETTLED]: [
        // Terminal status - once settled, no further changes
      ],
      [DebtStatus.WRITTEN_OFF]: [
        // Terminal status
      ],
      [DebtStatus.FORGIVEN]: [
        // Terminal status
      ],
      [DebtStatus.STATUTE_BARRED]: [
        // Terminal status
      ],
      [DebtStatus.DISCHARGED]: [
        // Terminal status
      ],
      [DebtStatus.CONVERTED]: [
        // Terminal status
      ],
      [DebtStatus.PENDING_VERIFICATION]: [
        DebtStatus.VERIFIED,
        DebtStatus.OUTSTANDING,
        DebtStatus.DISPUTED,
      ],
      [DebtStatus.VERIFIED]: [DebtStatus.OUTSTANDING, DebtStatus.DISPUTED],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Check if status transition is valid
   */
  static isValidTransition(from: DebtStatus, to: DebtStatus): boolean {
    return DebtStatusHelper.getValidTransitions(from).includes(to);
  }

  /**
   * Get status description
   */
  static getDescription(status: DebtStatus): string {
    const descriptions: Record<DebtStatus, string> = {
      [DebtStatus.OUTSTANDING]: 'Debt is outstanding and needs to be paid',
      [DebtStatus.PARTIALLY_PAID]: 'Partial payments made, balance outstanding',
      [DebtStatus.IN_COLLECTION]: 'Debt has been sent to collection agency',
      [DebtStatus.DISPUTED]: 'Debt validity is being challenged',
      [DebtStatus.UNDER_REVIEW]: 'Debt is under legal review',
      [DebtStatus.SETTLED]: 'Debt has been fully paid',
      [DebtStatus.WRITTEN_OFF]: 'Debt written off as uncollectible',
      [DebtStatus.FORGIVEN]: 'Creditor has forgiven the debt',
      [DebtStatus.STATUTE_BARRED]: 'Debt is time-barred under Limitation Act',
      [DebtStatus.DISCHARGED]: 'Debt legally discharged (e.g., bankruptcy)',
      [DebtStatus.CONVERTED]: 'Debt converted to equity or other form',
      [DebtStatus.PENDING_VERIFICATION]: 'Awaiting creditor confirmation',
      [DebtStatus.VERIFIED]: 'Debt confirmed by creditor',
    };
    return descriptions[status] || 'Unknown status';
  }
}
