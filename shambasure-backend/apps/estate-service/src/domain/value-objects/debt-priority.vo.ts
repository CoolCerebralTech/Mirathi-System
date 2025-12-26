// src/estate-service/src/domain/value-objects/debt-priority.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface DebtPriorityProps {
  tier: number; // 1 (highest) to 5 (lowest)
  name: string;
  description: string;
  legalReference: string;
}

/**
 * Debt Priority Value Object
 * Implements Law of Succession Act S.45 strict ordering.
 */
export class DebtPriorityVO extends ValueObject<DebtPriorityProps> {
  // S.45(a) - First Priority
  static readonly FUNERAL_EXPENSES = new DebtPriorityVO({
    tier: 1,
    name: 'FUNERAL_EXPENSES',
    description: 'Reasonable funeral expenses',
    legalReference: 'S.45(a)',
  });

  // S.45(a) - Second Priority
  static readonly TESTAMENTARY_EXPENSES = new DebtPriorityVO({
    tier: 2,
    name: 'TESTAMENTARY_EXPENSES',
    description: 'Costs of obtaining grant and administration',
    legalReference: 'S.45(a)',
  });

  // S.45(b) - Third Priority (Secured)
  static readonly SECURED_DEBTS = new DebtPriorityVO({
    tier: 3,
    name: 'SECURED_DEBTS',
    description: 'Debts secured by mortgage or charge',
    legalReference: 'S.45(b)',
  });

  // S.45(c) - Fourth Priority
  static readonly TAXES_RATES_WAGES = new DebtPriorityVO({
    tier: 4,
    name: 'TAXES_RATES_WAGES',
    description: 'Taxes, rates, and wages due',
    legalReference: 'S.45(c)',
  });

  // S.45(d) - Fifth Priority
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
      throw new ValueObjectValidationError('Tier must be between 1 and 5', 'tier');
    }
  }

  hasHigherPriorityThan(other: DebtPriorityVO): boolean {
    return this.props.tier < other.props.tier;
  }

  isSecured(): boolean {
    return this.props.tier === 3;
  }

  /**
   * Sorts an array of objects containing a priority field.
   * Useful for the Estate Aggregate to order payment processing.
   */
  static sortByPriority<T extends { priority: DebtPriorityVO }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.priority.props.tier - b.priority.props.tier);
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
