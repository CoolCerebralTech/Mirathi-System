import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';

export class InvalidLiabilityTierException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_LIABILITY_TIER');
  }
}

// Kenyan LSA Section 45 Priorities
export enum LiabilityTier {
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // S.45(a) - Highest Priority
  SECURED_DEBTS = 'SECURED_DEBTS', // S.45(b)
  TAXES_RATES_WAGES = 'TAXES_RATES_WAGES', // S.45(c)
  UNSECURED_GENERAL = 'UNSECURED_GENERAL', // S.45(d)
}

interface LiabilityTierProps {
  value: LiabilityTier;
}

export class LiabilityTierVO extends ValueObject<LiabilityTierProps> {
  private static readonly PRIORITY_MAP: Record<LiabilityTier, number> = {
    [LiabilityTier.FUNERAL_EXPENSES]: 1,
    [LiabilityTier.SECURED_DEBTS]: 2,
    [LiabilityTier.TAXES_RATES_WAGES]: 3,
    [LiabilityTier.UNSECURED_GENERAL]: 4,
  };

  private constructor(value: LiabilityTier) {
    super({ value });
  }

  protected validate(): void {
    if (!Object.values(LiabilityTier).includes(this.props.value)) {
      throw new InvalidLiabilityTierException(`Invalid tier value: ${this.props.value}`);
    }
  }

  static create(tier: LiabilityTier): LiabilityTierVO {
    return new LiabilityTierVO(tier);
  }

  // --- Business Logic ---

  hasHigherPriorityThan(other: LiabilityTierVO): boolean {
    return (
      LiabilityTierVO.PRIORITY_MAP[this.props.value] <
      LiabilityTierVO.PRIORITY_MAP[other.props.value]
    );
  }

  isPriorityDebt(): boolean {
    // Anything above Unsecured General is considered "Priority"
    return this.props.value !== LiabilityTier.UNSECURED_GENERAL;
  }

  getLegalSection(): string {
    switch (this.props.value) {
      case LiabilityTier.FUNERAL_EXPENSES:
        return 'LSA S.45(a)';
      case LiabilityTier.SECURED_DEBTS:
        return 'LSA S.45(b)';
      case LiabilityTier.TAXES_RATES_WAGES:
        return 'LSA S.45(c)';
      default:
        return 'LSA S.45(d)';
    }
  }

  get value(): LiabilityTier {
    return this.props.value;
  }

  public toJSON(): Record<string, any> {
    return {
      tier: this.props.value,
      priorityLevel: LiabilityTierVO.PRIORITY_MAP[this.props.value],
      legalBasis: this.getLegalSection(),
    };
  }
}
