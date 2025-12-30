// src/estate-service/src/domain/enums/liquidation-type.enum.ts

/**
 * Liquidation Type Enum
 *
 * Legal Context:
 * - Private sale: Requires family consent for certain assets
 * - Auction: Follows Auctioneers Act regulations
 * - Court-ordered: Requires specific court approval
 */
export enum LiquidationType {
  // Sale Types
  PRIVATE_SALE = 'PRIVATE_SALE', // Direct sale to buyer
  AUCTION = 'AUCTION', // Public auction
  TENDER = 'TENDER', // Competitive bidding
  NEGOTIATED_SALE = 'NEGOTIATED_SALE', // Negotiated with buyer

  // Special Types
  COURT_ORDERED_SALE = 'COURT_ORDERED_SALE', // Ordered by court
  FORCED_SALE = 'FORCED_SALE', // To pay debts (S.45)
  FAMILY_SALE = 'FAMILY_SALE', // Sale to family member

  // Transfer Types
  TRANSFER_IN_LIEU = 'TRANSFER_IN_LIEU', // Transfer instead of cash
  REDEMPTION = 'REDEMPTION', // Debt redemption

  // Administrative
  DONATION = 'DONATION', // Charitable donation
  DESTRUCTION = 'DESTRUCTION', // Asset destroyed (e.g., perishable)
}

/**
 * Liquidation Type Helper Methods
 */
export class LiquidationTypeHelper {
  /**
   * Check if this type requires court approval
   */
  static requiresCourtApproval(type: LiquidationType): boolean {
    return [LiquidationType.COURT_ORDERED_SALE, LiquidationType.FORCED_SALE].includes(type);
  }

  /**
   * Check if this type requires family consent
   */
  static requiresFamilyConsent(type: LiquidationType): boolean {
    return [
      LiquidationType.PRIVATE_SALE,
      LiquidationType.FAMILY_SALE,
      LiquidationType.DONATION,
    ].includes(type);
  }

  /**
   * Check if this type is a sale (generates cash)
   */
  static isSale(type: LiquidationType): boolean {
    const saleTypes = [
      LiquidationType.PRIVATE_SALE,
      LiquidationType.AUCTION,
      LiquidationType.TENDER,
      LiquidationType.NEGOTIATED_SALE,
      LiquidationType.COURT_ORDERED_SALE,
      LiquidationType.FORCED_SALE,
      LiquidationType.FAMILY_SALE,
    ];
    return saleTypes.includes(type);
  }

  /**
   * Check if this type generates cash for estate
   */
  static generatesCash(type: LiquidationType): boolean {
    return this.isSale(type);
  }

  /**
   * Get typical commission rate for this type
   */
  static getCommissionRate(type: LiquidationType): number {
    const commissions: Record<LiquidationType, number> = {
      [LiquidationType.PRIVATE_SALE]: 0.05, // 5%
      [LiquidationType.AUCTION]: 0.1, // 10%
      [LiquidationType.TENDER]: 0.03, // 3%
      [LiquidationType.NEGOTIATED_SALE]: 0.05, // 5%
      [LiquidationType.COURT_ORDERED_SALE]: 0.08, // 8%
      [LiquidationType.FORCED_SALE]: 0.1, // 10%
      [LiquidationType.FAMILY_SALE]: 0.02, // 2%
      [LiquidationType.TRANSFER_IN_LIEU]: 0, // 0%
      [LiquidationType.REDEMPTION]: 0, // 0%
      [LiquidationType.DONATION]: 0, // 0%
      [LiquidationType.DESTRUCTION]: 0, // 0%
    };
    return commissions[type] || 0.05; // Default 5%
  }

  /**
   * Get typical timeframe for this type (in days)
   */
  static getTimeframe(type: LiquidationType): number {
    const timeframes: Record<LiquidationType, number> = {
      [LiquidationType.PRIVATE_SALE]: 60, // 2 months
      [LiquidationType.AUCTION]: 30, // 1 month
      [LiquidationType.TENDER]: 45, // 1.5 months
      [LiquidationType.NEGOTIATED_SALE]: 90, // 3 months
      [LiquidationType.COURT_ORDERED_SALE]: 120, // 4 months
      [LiquidationType.FORCED_SALE]: 30, // 1 month
      [LiquidationType.FAMILY_SALE]: 30, // 1 month
      [LiquidationType.TRANSFER_IN_LIEU]: 14, // 2 weeks
      [LiquidationType.REDEMPTION]: 7, // 1 week
      [LiquidationType.DONATION]: 14, // 2 weeks
      [LiquidationType.DESTRUCTION]: 7, // 1 week
    };
    return timeframes[type] || 30; // Default 30 days
  }

  /**
   * Check if this type requires licensed professional
   */
  static requiresProfessional(type: LiquidationType): boolean {
    return [
      LiquidationType.AUCTION, // Requires licensed auctioneer
      LiquidationType.COURT_ORDERED_SALE, // Usually requires lawyer
      LiquidationType.FORCED_SALE, // May require court officer
    ].includes(type);
  }

  /**
   * Get type description
   */
  static getDescription(type: LiquidationType): string {
    const descriptions: Record<LiquidationType, string> = {
      [LiquidationType.PRIVATE_SALE]: 'Direct sale to private buyer',
      [LiquidationType.AUCTION]: 'Public auction through licensed auctioneer',
      [LiquidationType.TENDER]: 'Competitive bidding process',
      [LiquidationType.NEGOTIATED_SALE]: 'Negotiated sale with specific buyer',
      [LiquidationType.COURT_ORDERED_SALE]: 'Sale ordered by court',
      [LiquidationType.FORCED_SALE]: 'Sale to pay outstanding debts',
      [LiquidationType.FAMILY_SALE]: 'Sale to family member',
      [LiquidationType.TRANSFER_IN_LIEU]: 'Transfer of asset instead of cash payment',
      [LiquidationType.REDEMPTION]: 'Redemption by debtor or mortgagee',
      [LiquidationType.DONATION]: 'Charitable donation of asset',
      [LiquidationType.DESTRUCTION]: 'Destruction of worthless or perishable asset',
    };
    return descriptions[type] || 'Unknown liquidation type';
  }
}
