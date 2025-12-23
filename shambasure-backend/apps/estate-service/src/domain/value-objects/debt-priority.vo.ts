// domain/value-objects/debt-priority.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Debt Priority Value Object
 *
 * CRITICAL LEGAL REFERENCE: Section 45, Law of Succession Act (Cap 160)
 *
 * S.45 Order of Priority for Debt Payment:
 * (a) Funeral, testamentary and administration expenses
 * (b) Debts secured by a mortgage, charge or lien on property
 * (c) Taxes due to Kenya Revenue Authority, rates, wages, salaries
 * (d) All other debts (unsecured general debts)
 *
 * Business Rules:
 * - Debts MUST be paid in this order before distribution
 * - Higher priority debts block lower priority payments
 * - Secured debts can force asset liquidation
 * - Distribution cannot proceed if S.45(a)-(c) debts unpaid
 *
 * Design: Combines Tier (legal category) + Order (numeric priority)
 */

export enum DebtTier {
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // S.45(a) - Highest priority
  TESTAMENTARY_EXPENSES = 'TESTAMENTARY_EXPENSES', // S.45(a) - Court fees, executor fees
  SECURED_DEBTS = 'SECURED_DEBTS', // S.45(b) - Mortgages, charges
  TAXES_RATES_WAGES = 'TAXES_RATES_WAGES', // S.45(c) - KRA, County, Employees
  UNSECURED_GENERAL = 'UNSECURED_GENERAL', // S.45(d) - Everything else
}

interface DebtPriorityProps {
  tier: DebtTier;
  order: number; // 1 = highest priority
  legalReference: string;
}

export class DebtPriority extends ValueObject<DebtPriorityProps> {
  // Priority order mapping (lower number = higher priority)
  private static readonly TIER_ORDER: Record<DebtTier, number> = {
    [DebtTier.FUNERAL_EXPENSES]: 1,
    [DebtTier.TESTAMENTARY_EXPENSES]: 2,
    [DebtTier.SECURED_DEBTS]: 3,
    [DebtTier.TAXES_RATES_WAGES]: 4,
    [DebtTier.UNSECURED_GENERAL]: 5,
  };

  private constructor(props: DebtPriorityProps) {
    super(props);
  }

  /**
   * Create from Debt Tier (most common use case)
   */
  public static fromTier(tier: DebtTier): DebtPriority {
    const order = this.TIER_ORDER[tier];
    const legalReference = this.getLegalReference(tier);

    return new DebtPriority({
      tier,
      order,
      legalReference,
    });
  }

  /**
   * Factory methods for type safety
   */
  public static funeralExpenses(): DebtPriority {
    return this.fromTier(DebtTier.FUNERAL_EXPENSES);
  }

  public static testamentaryExpenses(): DebtPriority {
    return this.fromTier(DebtTier.TESTAMENTARY_EXPENSES);
  }

  public static securedDebts(): DebtPriority {
    return this.fromTier(DebtTier.SECURED_DEBTS);
  }

  public static taxesRatesWages(): DebtPriority {
    return this.fromTier(DebtTier.TAXES_RATES_WAGES);
  }

  public static unsecuredGeneral(): DebtPriority {
    return this.fromTier(DebtTier.UNSECURED_GENERAL);
  }

  protected validate(): void {
    if (!this.props.tier) {
      throw new ValueObjectValidationError('Debt tier is required');
    }

    if (!Object.values(DebtTier).includes(this.props.tier)) {
      throw new ValueObjectValidationError(`Invalid debt tier: ${this.props.tier}`);
    }

    if (this.props.order < 1 || this.props.order > 5) {
      throw new ValueObjectValidationError('Priority order must be between 1 and 5');
    }

    if (!this.props.legalReference) {
      throw new ValueObjectValidationError('Legal reference is required');
    }
  }

  /**
   * Get tier
   */
  public getTier(): DebtTier {
    return this.props.tier;
  }

  /**
   * Get numeric priority order (1 = highest)
   */
  public getOrder(): number {
    return this.props.order;
  }

  /**
   * Get legal reference (e.g., "S.45(a) LSA")
   */
  public getLegalReference(): string {
    return this.props.legalReference;
  }

  /**
   * Check if this priority is higher than another
   */
  public isHigherThan(other: DebtPriority): boolean {
    return this.props.order < other.props.order;
  }

  /**
   * Check if this priority is lower than another
   */
  public isLowerThan(other: DebtPriority): boolean {
    return this.props.order > other.props.order;
  }

  /**
   * Check if this is the highest priority tier
   */
  public isHighestPriority(): boolean {
    return this.props.order === 1;
  }

  /**
   * Check if this is critical (blocks distribution)
   * S.45(a), (b), (c) must be paid before distribution
   */
  public isCritical(): boolean {
    return this.props.order <= 4; // Funeral, Testamentary, Secured, Taxes
  }

  /**
   * Check if debt can force asset liquidation
   */
  public canForceLiquidation(): boolean {
    return this.props.tier === DebtTier.SECURED_DEBTS;
  }

  /**
   * Check if this is a secured debt
   */
  public isSecured(): boolean {
    return this.props.tier === DebtTier.SECURED_DEBTS;
  }

  /**
   * Check if this is unsecured
   */
  public isUnsecured(): boolean {
    return this.props.tier === DebtTier.UNSECURED_GENERAL;
  }

  /**
   * Get payment deadline type
   */
  public getPaymentDeadline(): 'IMMEDIATE' | 'BEFORE_DISTRIBUTION' | 'NEGOTIABLE' {
    switch (this.props.tier) {
      case DebtTier.FUNERAL_EXPENSES:
        return 'IMMEDIATE';
      case DebtTier.TESTAMENTARY_EXPENSES:
      case DebtTier.SECURED_DEBTS:
      case DebtTier.TAXES_RATES_WAGES:
        return 'BEFORE_DISTRIBUTION';
      case DebtTier.UNSECURED_GENERAL:
        return 'NEGOTIABLE';
    }
  }

  /**
   * Get description for UI/legal documents
   */
  public getDescription(): string {
    switch (this.props.tier) {
      case DebtTier.FUNERAL_EXPENSES:
        return 'Funeral and burial expenses (S.45(a) LSA) - Highest Priority';
      case DebtTier.TESTAMENTARY_EXPENSES:
        return 'Testamentary and administration expenses (S.45(a) LSA) - Court fees, executor fees';
      case DebtTier.SECURED_DEBTS:
        return 'Secured debts (S.45(b) LSA) - Mortgages, charges, liens on property';
      case DebtTier.TAXES_RATES_WAGES:
        return 'Taxes, rates, wages, salaries (S.45(c) LSA) - KRA, County Government, Employee dues';
      case DebtTier.UNSECURED_GENERAL:
        return 'Unsecured general debts (S.45(d) LSA) - All other debts';
    }
  }

  /**
   * Compare priorities for sorting
   */
  public compare(other: DebtPriority): number {
    return this.props.order - other.props.order;
  }

  /**
   * Sort array of debts by priority
   */
  public static sortByPriority(debts: Array<{ priority: DebtPriority }>): typeof debts {
    return debts.sort((a, b) => a.priority.compare(b.priority));
  }

  private static getLegalReference(tier: DebtTier): string {
    switch (tier) {
      case DebtTier.FUNERAL_EXPENSES:
        return 'S.45(a) Law of Succession Act, Cap 160';
      case DebtTier.TESTAMENTARY_EXPENSES:
        return 'S.45(a) Law of Succession Act, Cap 160';
      case DebtTier.SECURED_DEBTS:
        return 'S.45(b) Law of Succession Act, Cap 160';
      case DebtTier.TAXES_RATES_WAGES:
        return 'S.45(c) Law of Succession Act, Cap 160';
      case DebtTier.UNSECURED_GENERAL:
        return 'S.45(d) Law of Succession Act, Cap 160';
    }
  }

  public toJSON(): Record<string, any> {
    return {
      tier: this.props.tier,
      order: this.props.order,
      legalReference: this.props.legalReference,
      description: this.getDescription(),
    };
  }

  public toString(): string {
    return `${this.props.tier} (Priority ${this.props.order})`;
  }
}
