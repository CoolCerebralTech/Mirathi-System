// src/estate-service/src/domain/value-objects/debt-priority.vo.ts
import { ValueObject } from '../base/value-object';

/**
 * Debt Priority Value Object based on Law of Succession Act S.45
 *
 * S.45 specifies the order:
 * 1. Funeral expenses
 * 2. Testamentary expenses
 * 3. Secured debts
 * 4. Unsecured debts
 * 5. General unsecured debts
 */
export interface DebtPriorityProps {
  tier: number; // 1 (highest) to 5 (lowest)
  name: string;
  description: string;
  legalReference: string; // e.g., "S.45(a)"
}

export class DebtPriorityVO extends ValueObject<DebtPriorityProps> {
  // S.45 Priority Tiers
  static readonly FUNERAL_EXPENSES = new DebtPriorityVO({
    tier: 1,
    name: 'FUNERAL_EXPENSES',
    description: 'Reasonable funeral expenses of the deceased',
    legalReference: 'S.45(a)',
  });

  static readonly TESTAMENTARY_EXPENSES = new DebtPriorityVO({
    tier: 2,
    name: 'TESTAMENTARY_EXPENSES',
    description: 'Costs of obtaining grant, administration, and testamentary expenses',
    legalReference: 'S.45(a)',
  });

  static readonly SECURED_DEBTS = new DebtPriorityVO({
    tier: 3,
    name: 'SECURED_DEBTS',
    description: 'Debts secured by mortgage, charge, or lien on property',
    legalReference: 'S.45(b)',
  });

  static readonly TAXES_RATES_WAGES = new DebtPriorityVO({
    tier: 4,
    name: 'TAXES_RATES_WAGES',
    description: 'All taxes, rates, and wages due from deceased',
    legalReference: 'S.45(c)',
  });

  static readonly UNSECURED_DEBTS = new DebtPriorityVO({
    tier: 5,
    name: 'UNSECURED_DEBTS',
    description: 'All other unsecured debts',
    legalReference: 'S.45(d)',
  });

  constructor(props: DebtPriorityProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.tier < 1 || this.props.tier > 5) {
      throw new ValueObjectValidationError('Debt priority tier must be between 1 and 5', 'tier');
    }

    const validNames = [
      'FUNERAL_EXPENSES',
      'TESTAMENTARY_EXPENSES',
      'SECURED_DEBTS',
      'TAXES_RATES_WAGES',
      'UNSECURED_DEBTS',
    ];

    if (!validNames.includes(this.props.name)) {
      throw new ValueObjectValidationError(
        `Invalid debt priority name: ${this.props.name}`,
        'name',
      );
    }
  }

  /**
   * Compare priorities (higher tier = higher priority)
   */
  hasHigherPriorityThan(other: DebtPriorityVO): boolean {
    return this.props.tier < other.props.tier;
  }

  hasLowerPriorityThan(other: DebtPriorityVO): boolean {
    return this.props.tier > other.props.tier;
  }

  equalsPriority(other: DebtPriorityVO): boolean {
    return this.props.tier === other.props.tier;
  }

  /**
   * Check if this is a secured debt
   */
  isSecured(): boolean {
    return this.props.name === 'SECURED_DEBTS';
  }

  /**
   * Check if this is a funeral expense (highest priority)
   */
  isFuneralExpense(): boolean {
    return this.props.name === 'FUNERAL_EXPENSES';
  }

  /**
   * Get all priorities in order (highest to lowest)
   */
  static getAllInOrder(): DebtPriorityVO[] {
    return [
      DebtPriorityVO.FUNERAL_EXPENSES,
      DebtPriorityVO.TESTAMENTARY_EXPENSES,
      DebtPriorityVO.SECURED_DEBTS,
      DebtPriorityVO.TAXES_RATES_WAGES,
      DebtPriorityVO.UNSECURED_DEBTS,
    ];
  }

  /**
   * Get priority by tier number
   */
  static fromTier(tier: number): DebtPriorityVO {
    const priority = DebtPriorityVO.getAllInOrder().find((p) => p.props.tier === tier);

    if (!priority) {
      throw new ValueObjectValidationError(`No debt priority found for tier: ${tier}`, 'tier');
    }

    return priority;
  }

  /**
   * Sort debts by priority (highest first)
   */
  static sortByPriority<T extends { priority: DebtPriorityVO }>(debts: T[]): T[] {
    return [...debts].sort((a, b) => a.priority.props.tier - b.priority.props.tier);
  }

  toJSON(): Record<string, any> {
    return {
      tier: this.props.tier,
      name: this.props.name,
      description: this.props.description,
      legalReference: this.props.legalReference,
      isHighestPriority: this.props.tier === 1,
      isLowestPriority: this.props.tier === 5,
    };
  }
}
