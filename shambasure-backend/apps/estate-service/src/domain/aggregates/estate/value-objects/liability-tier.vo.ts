import { ValueObject } from '../../../base/value-object';

// Kenyan LSA Section 45 Debt Priority Planning (Pre-death categorization)
export enum LiabilityTier {
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // S.45(a) - Funeral & testamentary expenses
  SECURED_DEBTS = 'SECURED_DEBTS', // S.45(b) - Mortgage, secured loans
  TAXES_RATES_WAGES = 'TAXES_RATES_WAGES', // S.45(c) - Taxes, rates, wages
  UNSECURED_GENERAL = 'UNSECURED_GENERAL', // S.45(d) - Unsecured debts
}

export class LiabilityTierVO extends ValueObject<LiabilityTier> {
  private constructor(value: LiabilityTier) {
    super({ value });
  }

  public static create(tier: LiabilityTier): Result<LiabilityTierVO> {
    if (!Object.values(LiabilityTier).includes(tier)) {
      return Result.fail(`Invalid liability tier: ${tier}`);
    }

    return Result.ok(new LiabilityTierVO(tier));
  }

  get value(): LiabilityTier {
    return this.props.value;
  }

  // Legal prioritization rules
  public hasHigherPriorityThan(other: LiabilityTierVO): boolean {
    const priorityOrder = {
      [LiabilityTier.FUNERAL_EXPENSES]: 1,
      [LiabilityTier.SECURED_DEBTS]: 2,
      [LiabilityTier.TAXES_RATES_WAGES]: 3,
      [LiabilityTier.UNSECURED_GENERAL]: 4,
    };
    return priorityOrder[this.value] < priorityOrder[other.value];
  }

  // Kenyan legal requirements for each tier
  public getLegalRequirements(): string[] {
    switch (this.value) {
      case LiabilityTier.FUNERAL_EXPENSES:
        return [
          'Must be reasonable and customary',
          'Requires receipts for verification',
          'Priority over all other debts',
        ];
      case LiabilityTier.SECURED_DEBTS:
        return [
          'Must have valid security documentation',
          'Asset-backed verification required',
          'Can be settled through asset transfer',
        ];
      case LiabilityTier.TAXES_RATES_WAGES:
        return [
          'KRA tax clearance required',
          'County government rates receipts',
          'Employee wage documentation',
        ];
      case LiabilityTier.UNSECURED_GENERAL:
        return [
          'Requires proof of debt',
          'Subject to statute of limitations',
          'May require court validation',
        ];
      default:
        return [];
    }
  }

  // Estimated timeline for settlement (in months)
  public estimatedSettlementTimeline(): number {
    switch (this.value) {
      case LiabilityTier.FUNERAL_EXPENSES:
        return 1; // 1 month
      case LiabilityTier.SECURED_DEBTS:
        return 3; // 3 months
      case LiabilityTier.TAXES_RATES_WAGES:
        return 6; // 6 months
      case LiabilityTier.UNSECURED_GENERAL:
        return 12; // 12 months
      default:
        return 12;
    }
  }
}
