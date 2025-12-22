import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export class InvalidHotchpotAdjustmentException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_HOTCHPOT_ADJUSTMENT');
  }
}

export enum HotchpotAdjustmentStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPLIED = 'APPLIED',
  DISPUTED = 'DISPUTED',
  WAIVED = 'WAIVED',
  EXEMPTED = 'EXEMPTED',
}

interface HotchpotAdjustmentProps {
  beneficiaryId: string;
  beneficiaryName: string;

  // Financial Impact
  totalAdvancementsValue: Money; // S.35(3) "gifts made by way of advancement"
  adjustmentAmount: Money; // The amount deducted from share
  impactPercentage: Percentage; // What % of their share is lost?

  // Status
  status: HotchpotAdjustmentStatus;

  // Exemptions
  isExempted: boolean;
  exemptionReason?: string;

  // Dispute
  isDisputed: boolean;
  disputeReason?: string;

  // Metadata
  calculatedAt: Date;
  notes?: string;
}

/**
 * Represents the calculated adjustment to a beneficiary's share
 * due to lifetime gifts (Hotchpot Rule - S.35(3) Law of Succession Act).
 */
export class HotchpotAdjustment extends ValueObject<HotchpotAdjustmentProps> {
  private constructor(props: HotchpotAdjustmentProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.beneficiaryId) {
      throw new InvalidHotchpotAdjustmentException('Beneficiary ID required');
    }

    if (this.props.adjustmentAmount.amount < 0) {
      throw new InvalidHotchpotAdjustmentException('Adjustment amount cannot be negative');
    }

    if (this.props.status === HotchpotAdjustmentStatus.EXEMPTED && !this.props.exemptionReason) {
      throw new InvalidHotchpotAdjustmentException('Exempted adjustments require a reason');
    }
  }

  // --- Factory Methods ---

  static create(props: {
    beneficiaryId: string;
    beneficiaryName: string;
    totalAdvancementsValue: Money;
    shareValueBeforeAdjustment: Money;
    isExempted?: boolean;
    exemptionReason?: string;
  }): HotchpotAdjustment {
    // Calculate logic belongs here only for simple derivation
    const adjustmentAmount = props.isExempted
      ? Money.zero(props.totalAdvancementsValue.currency)
      : props.totalAdvancementsValue;

    const impactVal =
      props.shareValueBeforeAdjustment.amount === 0
        ? 0
        : (adjustmentAmount.amount / props.shareValueBeforeAdjustment.amount) * 100;

    return new HotchpotAdjustment({
      beneficiaryId: props.beneficiaryId,
      beneficiaryName: props.beneficiaryName,
      totalAdvancementsValue: props.totalAdvancementsValue,
      adjustmentAmount,
      impactPercentage: new Percentage(impactVal),
      status: HotchpotAdjustmentStatus.CALCULATED,
      isExempted: props.isExempted || false,
      exemptionReason: props.exemptionReason,
      isDisputed: false,
      calculatedAt: new Date(),
    });
  }

  // --- Immutable Transitions ---

  apply(): HotchpotAdjustment {
    if (this.props.status !== HotchpotAdjustmentStatus.CALCULATED) {
      throw new InvalidHotchpotAdjustmentException(
        `Cannot apply adjustment in state ${this.props.status}`,
      );
    }
    return new HotchpotAdjustment({
      ...this.props,
      status: HotchpotAdjustmentStatus.APPLIED,
    });
  }

  dispute(reason: string): HotchpotAdjustment {
    return new HotchpotAdjustment({
      ...this.props,
      status: HotchpotAdjustmentStatus.DISPUTED,
      isDisputed: true,
      disputeReason: reason,
    });
  }

  exempt(reason: string): HotchpotAdjustment {
    return new HotchpotAdjustment({
      ...this.props,
      status: HotchpotAdjustmentStatus.EXEMPTED,
      isExempted: true,
      exemptionReason: reason,
      adjustmentAmount: Money.zero(this.props.adjustmentAmount.currency),
      impactPercentage: new Percentage(0),
    });
  }

  // --- Business Logic ---

  isSignificant(): boolean {
    // If adjustment takes > 5% of share, it's significant
    return this.props.impactPercentage.value > 5;
  }

  getNetAdjustment(): Money {
    if (this.props.isExempted) return Money.zero(this.props.adjustmentAmount.currency);
    return this.props.adjustmentAmount;
  }

  // --- Getters ---
  get amount(): Money {
    return this.props.adjustmentAmount;
  }
  get status(): HotchpotAdjustmentStatus {
    return this.props.status;
  }

  public toJSON(): Record<string, any> {
    return {
      beneficiary: {
        id: this.props.beneficiaryId,
        name: this.props.beneficiaryName,
      },
      financials: {
        totalAdvancements: this.props.totalAdvancementsValue.toJSON(),
        adjustment: this.props.adjustmentAmount.toJSON(),
        impact: this.props.impactPercentage.toJSON(),
      },
      status: {
        current: this.props.status,
        isExempted: this.props.isExempted,
        isDisputed: this.props.isDisputed,
        reason: this.props.exemptionReason || this.props.disputeReason,
      },
    };
  }
}
