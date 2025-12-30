// src/estate-service/src/domain/entities/enums/debt-tier.enum.ts

/**
 * Debt Tier Enum (S.45 LSA Priority)
 *
 * Legal Context:
 * - S.45(a): Funeral and testamentary expenses
 * - S.45(b): Secured debts
 * - S.45(c): Taxes, rates, and wages
 * - S.45(d): All other unsecured debts
 */
export enum DebtTier {
  // S.45(a) - Highest Priority
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // Funeral expenses
  TESTAMENTARY_EXPENSES = 'TESTAMENTARY_EXPENSES', // Probate costs

  // S.45(b) - High Priority
  SECURED_DEBTS = 'SECURED_DEBTS', // Secured by mortgage/charge

  // S.45(c) - Medium Priority
  TAXES_RATES_WAGES = 'TAXES_RATES_WAGES', // Taxes, rates, wages

  // S.45(d) - Low Priority
  UNSECURED_GENERAL = 'UNSECURED_GENERAL', // All other unsecured debts
}

/**
 * Debt Tier Helper Methods
 */
export class DebtTierHelper {
  /**
   * Get tier number (1-5, lower = higher priority)
   */
  static getTierNumber(tier: DebtTier): number {
    const tierNumbers: Record<DebtTier, number> = {
      [DebtTier.FUNERAL_EXPENSES]: 1,
      [DebtTier.TESTAMENTARY_EXPENSES]: 2,
      [DebtTier.SECURED_DEBTS]: 3,
      [DebtTier.TAXES_RATES_WAGES]: 4,
      [DebtTier.UNSECURED_GENERAL]: 5,
    };
    return tierNumbers[tier];
  }

  /**
   * Get priority level for display
   */
  static getPriorityLevel(tier: DebtTier): string {
    const priorities: Record<DebtTier, string> = {
      [DebtTier.FUNERAL_EXPENSES]: 'HIGHEST',
      [DebtTier.TESTAMENTARY_EXPENSES]: 'HIGHEST',
      [DebtTier.SECURED_DEBTS]: 'HIGH',
      [DebtTier.TAXES_RATES_WAGES]: 'MEDIUM',
      [DebtTier.UNSECURED_GENERAL]: 'LOW',
    };
    return priorities[tier];
  }

  /**
   * Compare two tiers (returns -1, 0, 1)
   */
  static compareTiers(tier1: DebtTier, tier2: DebtTier): number {
    const tier1Number = DebtTierHelper.getTierNumber(tier1);
    const tier2Number = DebtTierHelper.getTierNumber(tier2);

    if (tier1Number < tier2Number) return -1; // tier1 has higher priority
    if (tier1Number > tier2Number) return 1; // tier2 has higher priority
    return 0; // equal priority
  }

  /**
   * Check if tier1 has higher priority than tier2
   */
  static hasHigherPriority(tier1: DebtTier, tier2: DebtTier): boolean {
    return DebtTierHelper.compareTiers(tier1, tier2) < 0;
  }

  /**
   * Check if tier has right of set-off (secured debts)
   */
  static hasRightOfSetOff(tier: DebtTier): boolean {
    return tier === DebtTier.SECURED_DEBTS;
  }

  /**
   * Get all tiers in priority order (highest to lowest)
   */
  static getAllInPriorityOrder(): DebtTier[] {
    return [
      DebtTier.FUNERAL_EXPENSES,
      DebtTier.TESTAMENTARY_EXPENSES,
      DebtTier.SECURED_DEBTS,
      DebtTier.TAXES_RATES_WAGES,
      DebtTier.UNSECURED_GENERAL,
    ];
  }

  /**
   * Get S.45 legal reference for tier
   */
  static getLegalReference(tier: DebtTier): string {
    const references: Record<DebtTier, string> = {
      [DebtTier.FUNERAL_EXPENSES]: 'S.45(a) LSA',
      [DebtTier.TESTAMENTARY_EXPENSES]: 'S.45(a) LSA',
      [DebtTier.SECURED_DEBTS]: 'S.45(b) LSA',
      [DebtTier.TAXES_RATES_WAGES]: 'S.45(c) LSA',
      [DebtTier.UNSECURED_GENERAL]: 'S.45(d) LSA',
    };
    return references[tier];
  }

  /**
   * Get tier description
   */
  static getDescription(tier: DebtTier): string {
    const descriptions: Record<DebtTier, string> = {
      [DebtTier.FUNERAL_EXPENSES]: 'Funeral and burial expenses (highest priority)',
      [DebtTier.TESTAMENTARY_EXPENSES]: 'Probate and administration expenses',
      [DebtTier.SECURED_DEBTS]: 'Debts secured by mortgage, charge, or lien',
      [DebtTier.TAXES_RATES_WAGES]: 'Taxes, rates, and unpaid wages',
      [DebtTier.UNSECURED_GENERAL]: 'All other unsecured debts (lowest priority)',
    };
    return descriptions[tier] || 'Unknown tier';
  }
}
