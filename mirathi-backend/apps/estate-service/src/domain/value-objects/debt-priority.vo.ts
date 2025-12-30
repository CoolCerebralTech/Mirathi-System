// src/estate-service/src/domain/value-objects/debt-priority.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';
import { DebtTier } from '../enums/debt-tier.enum';
import { DebtType, DebtTypeHelper } from '../enums/debt-type.enum';

export interface DebtPriorityProps {
  tier: DebtTier;
  type: DebtType;
  customPriority?: number; // For overriding standard priority (1-100)
}

/**
 * Debt Priority Value Object
 *
 * Encapsulates S.45 LSA priority logic for debts.
 *
 * BUSINESS RULES:
 * 1. Funeral expenses have highest priority (S.45(a))
 * 2. Secured debts come next (S.45(b))
 * 3. Taxes and wages follow (S.45(c))
 * 4. Unsecured general debts are last (S.45(d))
 * 5. Executor can override priority for special circumstances
 */
export class DebtPriorityVO extends ValueObject<DebtPriorityProps> {
  constructor(props: DebtPriorityProps) {
    super(props);
  }
  public static create(tier: string, customPriority?: number): DebtPriorityVO {
    // Note: We don't have the DebtType here usually when just mapping the tier column.
    // If we need strict validation, we need the type.
    // Assuming we map from DB where we have both.
    // BUT the previous mapper called create(priorityTier).

    // Simplification: We map the string tier to Enum.
    // The type is technically required by the VO structure I defined previously.
    // Let's adjust the mapper or this factory to be flexible.

    // Hack: Use a dummy type if just restoring tier priority logic,
    // or change Mapper to pass type. I will change Mapper to pass Type.

    // This factory is just for the Tier mapping specifically
    return new DebtPriorityVO({
      tier: tier as DebtTier,
      type: DebtType.OTHER, // Placeholder if not provided, Entity validation might catch this
      customPriority,
    });
  }
  // Specific Factory for Mapper that has Type
  public static restore(tier: DebtTier, type: DebtType, priority?: number): DebtPriorityVO {
    return new DebtPriorityVO({ tier, type, customPriority: priority });
  }
  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get tier(): DebtTier {
    return this.props.tier;
  }

  get type(): DebtType {
    return this.props.type;
  }

  get customPriority(): number | undefined {
    return this.props.customPriority;
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  protected validate(): void {
    // Validate tier matches type
    const expectedTier = DebtTypeHelper.getTier(this.props.type) as DebtTier;
    if (this.props.tier !== expectedTier) {
      throw new ValueObjectValidationError(
        `Debt type ${this.props.type} should have tier ${expectedTier}, not ${this.props.tier}`,
        'tier',
      );
    }

    // Validate custom priority if provided
    if (this.props.customPriority !== undefined) {
      if (this.props.customPriority < 1 || this.props.customPriority > 100) {
        throw new ValueObjectValidationError(
          'Custom priority must be between 1 and 100',
          'customPriority',
        );
      }
    }
  }

  /**
   * Get numerical priority for sorting (lower number = higher priority)
   */
  getNumericalPriority(): number {
    if (this.props.customPriority !== undefined) {
      return this.props.customPriority;
    }

    // Standard S.45 priorities
    const tierPriority: Record<DebtTier, number> = {
      [DebtTier.FUNERAL_EXPENSES]: 1,
      [DebtTier.TESTAMENTARY_EXPENSES]: 2,
      [DebtTier.SECURED_DEBTS]: 3,
      [DebtTier.TAXES_RATES_WAGES]: 4,
      [DebtTier.UNSECURED_GENERAL]: 5,
    };

    return tierPriority[this.props.tier];
  }

  /**
   * Check if this debt has right of set-off (secured debts)
   */
  hasRightOfSetOff(): boolean {
    return this.props.tier === DebtTier.SECURED_DEBTS;
  }

  /**
   * Check if this debt blocks estate distribution
   */
  blocksDistribution(): boolean {
    // Secured debts block distribution of their collateral assets
    return this.props.tier === DebtTier.SECURED_DEBTS;
  }

  /**
   * Factory method for funeral expenses (highest priority)
   */
  static createFuneralExpense(type: DebtType): DebtPriorityVO {
    return new DebtPriorityVO({
      type,
      tier: DebtTier.FUNERAL_EXPENSES,
    });
  }

  /**
   * Factory method for secured debts
   */
  static createSecuredDebt(type: DebtType): DebtPriorityVO {
    return new DebtPriorityVO({
      type,
      tier: DebtTier.SECURED_DEBTS,
    });
  }

  /**
   * Factory method for unsecured debts
   */
  static createUnsecuredDebt(type: DebtType): DebtPriorityVO {
    return new DebtPriorityVO({
      type,
      tier: DebtTier.UNSECURED_GENERAL,
    });
  }
  static createTaxDebt(type: DebtType): DebtPriorityVO {
    return new DebtPriorityVO({
      type,
      tier: DebtTier.TAXES_RATES_WAGES,
    });
  }

  /**
   * Get S.45 legal reference for this priority
   */
  getLegalReference(): string {
    const references: Record<DebtTier, string> = {
      [DebtTier.FUNERAL_EXPENSES]: 'S.45(a) LSA - Funeral and testamentary expenses',
      [DebtTier.TESTAMENTARY_EXPENSES]: 'S.45(a) LSA - Testamentary expenses',
      [DebtTier.SECURED_DEBTS]: 'S.45(b) LSA - Secured debts',
      [DebtTier.TAXES_RATES_WAGES]: 'S.45(c) LSA - Taxes, rates, and wages',
      [DebtTier.UNSECURED_GENERAL]: 'S.45(d) LSA - All other unsecured debts',
    };

    return references[this.props.tier] || 'Unknown legal reference';
  }

  toJSON(): Record<string, any> {
    return {
      tier: this.props.tier,
      type: this.props.type,
      customPriority: this.props.customPriority,
      numericalPriority: this.getNumericalPriority(),
      legalReference: this.getLegalReference(),
      blocksDistribution: this.blocksDistribution(),
      hasRightOfSetOff: this.hasRightOfSetOff(),
    };
  }
}
