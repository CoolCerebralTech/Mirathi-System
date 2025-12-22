// domain/value-objects/dependency/support-evidence.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';
import { KenyanMoney } from '../financial/kenyan-money.vo';

/**
 * Support Evidence Value Object
 *
 * Represents evidence of financial support from deceased
 */
interface SupportEvidenceProps {
  monthlySupport: KenyanMoney;
  supportStartDate: Date;
  supportEndDate?: Date;
  totalMonths?: number;
  totalSupport?: KenyanMoney;
}

export class SupportEvidence extends ValueObject<SupportEvidenceProps> {
  private constructor(props: SupportEvidenceProps) {
    super(props);
  }

  public static create(props: {
    monthlySupport: KenyanMoney;
    supportStartDate: Date;
    supportEndDate?: Date;
  }): SupportEvidence {
    // Calculate total months if end date provided
    let totalMonths: number | undefined;
    let totalSupport: KenyanMoney | undefined;

    if (props.supportEndDate) {
      const diffMs = props.supportEndDate.getTime() - props.supportStartDate.getTime();
      totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      totalSupport = props.monthlySupport.multiply(totalMonths);
    }

    return new SupportEvidence({
      monthlySupport: props.monthlySupport,
      supportStartDate: props.supportStartDate,
      supportEndDate: props.supportEndDate,
      totalMonths,
      totalSupport,
    });
  }

  protected validate(): void {
    if (this.props.monthlySupport.isNegative()) {
      throw new ValueObjectValidationError('Monthly support cannot be negative', 'monthlySupport');
    }

    if (this.props.supportEndDate && this.props.supportEndDate <= this.props.supportStartDate) {
      throw new ValueObjectValidationError(
        'Support end date must be after start date',
        'supportEndDate',
      );
    }
  }

  get monthlySupport(): KenyanMoney {
    return this.props.monthlySupport;
  }

  get supportStartDate(): Date {
    return this.props.supportStartDate;
  }

  get supportEndDate(): Date | undefined {
    return this.props.supportEndDate;
  }

  get totalMonths(): number | undefined {
    return this.props.totalMonths;
  }

  get totalSupport(): KenyanMoney | undefined {
    return this.props.totalSupport;
  }

  /**
   * Calculate support duration in years
   */
  public getDurationYears(): number {
    if (!this.props.totalMonths) return 0;
    return this.props.totalMonths / 12;
  }

  public toJSON(): Record<string, any> {
    return {
      monthlySupport: this.props.monthlySupport.toJSON(),
      supportStartDate: this.props.supportStartDate.toISOString(),
      supportEndDate: this.props.supportEndDate?.toISOString(),
      totalMonths: this.props.totalMonths,
      totalSupport: this.props.totalSupport?.toJSON(),
      durationYears: this.getDurationYears(),
    };
  }
}
