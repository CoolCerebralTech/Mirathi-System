// domain/value-objects/beneficiary-share.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Beneficiary Share Value Object
 *
 * Represents what a beneficiary receives from the estate.
 * Can be:
 * - Specific asset ("My house at plot 123")
 * - Percentage of estate ("20% of everything")
 * - Fixed amount ("KES 500,000")
 * - Residuary ("Everything else not specifically mentioned")
 *
 * Kenyan Legal Context:
 * - Specific bequests are distributed first
 * - Then fixed amounts (if estate is solvent)
 * - Then residuary estate is divided
 * - If insolvent, specific bequests may abate proportionally
 *
 * Business Rules:
 * - Total percentage shares cannot exceed 100%
 * - Specific assets must exist in estate
 * - Residuary clause is catch-all (only one per will)
 */
export enum BequestType {
  SPECIFIC = 'SPECIFIC', // Specific asset to specific person
  RESIDUARY = 'RESIDUARY', // Remainder after specific bequests
  PERCENTAGE = 'PERCENTAGE', // Percentage of total estate
  FIXED_AMOUNT = 'FIXED_AMOUNT', // Specific monetary amount
  CONDITIONAL = 'CONDITIONAL', // Only if condition met
  TRUST = 'TRUST', // Held in trust until condition
}

interface BeneficiaryShareProps {
  type: BequestType;

  // Specific asset bequest
  assetId?: string;
  assetDescription?: string;

  // Percentage bequest
  percentage?: number;

  // Fixed amount bequest
  amountKES?: number;

  // Residuary
  isResiduary: boolean;
  residuaryPercentage?: number; // If multiple residuary beneficiaries

  // Trust arrangement
  trustUntilAge?: number;
  trusteeId?: string;

  // Priority (for abatement if estate is insolvent)
  priority: number; // 1 = highest priority

  // Descriptive
  description?: string;
}

export class BeneficiaryShare extends ValueObject<BeneficiaryShareProps> {
  private constructor(props: BeneficiaryShareProps) {
    super(props);
  }

  protected validate(): void {
    if (!Object.values(BequestType).includes(this.props.type)) {
      throw new ValueObjectValidationError(`Invalid bequest type: ${this.props.type}`, 'type');
    }

    // Specific bequest validation
    if (this.props.type === BequestType.SPECIFIC) {
      if (!this.props.assetId && !this.props.assetDescription) {
        throw new ValueObjectValidationError('Specific bequest must identify asset', 'assetId');
      }
    }

    // Percentage validation
    if (this.props.type === BequestType.PERCENTAGE || this.props.percentage !== undefined) {
      if (
        this.props.percentage === undefined ||
        this.props.percentage <= 0 ||
        this.props.percentage > 100
      ) {
        throw new ValueObjectValidationError('Percentage must be between 0 and 100', 'percentage');
      }
    }

    // Fixed amount validation
    if (this.props.type === BequestType.FIXED_AMOUNT) {
      if (this.props.amountKES === undefined || this.props.amountKES <= 0) {
        throw new ValueObjectValidationError('Fixed amount must be positive', 'amountKES');
      }
    }

    // Residuary validation
    if (this.props.isResiduary) {
      if (this.props.type !== BequestType.RESIDUARY) {
        throw new ValueObjectValidationError(
          'Residuary flag conflicts with bequest type',
          'isResiduary',
        );
      }

      if (
        this.props.residuaryPercentage !== undefined &&
        (this.props.residuaryPercentage <= 0 || this.props.residuaryPercentage > 100)
      ) {
        throw new ValueObjectValidationError(
          'Residuary percentage must be between 0 and 100',
          'residuaryPercentage',
        );
      }
    }

    // Priority validation
    if (this.props.priority < 1 || this.props.priority > 10) {
      throw new ValueObjectValidationError('Priority must be between 1 and 10', 'priority');
    }

    // Trust validation
    if (this.props.trustUntilAge !== undefined) {
      if (this.props.trustUntilAge < 18 || this.props.trustUntilAge > 35) {
        throw new ValueObjectValidationError(
          'Trust age must be between 18 and 35',
          'trustUntilAge',
        );
      }
    }
  }

  // Factory: Specific asset bequest
  static specificAsset(
    assetId: string,
    description?: string,
    priority: number = 1,
  ): BeneficiaryShare {
    return new BeneficiaryShare({
      type: BequestType.SPECIFIC,
      assetId,
      assetDescription: description,
      isResiduary: false,
      priority,
    });
  }

  // Factory: Percentage of estate
  static percentage(percentage: number, priority: number = 2): BeneficiaryShare {
    return new BeneficiaryShare({
      type: BequestType.PERCENTAGE,
      percentage,
      isResiduary: false,
      priority,
      description: `${percentage}% of the estate`,
    });
  }

  // Factory: Fixed monetary amount
  static fixedAmount(amountKES: number, priority: number = 2): BeneficiaryShare {
    return new BeneficiaryShare({
      type: BequestType.FIXED_AMOUNT,
      amountKES,
      isResiduary: false,
      priority,
      description: `KES ${amountKES.toLocaleString()}`,
    });
  }

  // Factory: Residuary estate
  static residuary(percentage: number = 100, priority: number = 3): BeneficiaryShare {
    return new BeneficiaryShare({
      type: BequestType.RESIDUARY,
      isResiduary: true,
      residuaryPercentage: percentage,
      priority,
      description: `${percentage}% of residuary estate`,
    });
  }

  // Factory: Trust arrangement
  static trust(
    sharePercentage: number,
    trustUntilAge: number,
    trusteeId: string,
  ): BeneficiaryShare {
    return new BeneficiaryShare({
      type: BequestType.TRUST,
      percentage: sharePercentage,
      trustUntilAge,
      trusteeId,
      isResiduary: false,
      priority: 2,
      description: `${sharePercentage}% held in trust until age ${trustUntilAge}`,
    });
  }

  // Query methods
  public getType(): BequestType {
    return this.props.type;
  }

  public isSpecific(): boolean {
    return this.props.type === BequestType.SPECIFIC;
  }

  public isPercentage(): boolean {
    return this.props.type === BequestType.PERCENTAGE;
  }

  public isFixedAmount(): boolean {
    return this.props.type === BequestType.FIXED_AMOUNT;
  }

  public isResiduary(): boolean {
    return this.props.isResiduary;
  }

  public isInTrust(): boolean {
    return this.props.type === BequestType.TRUST || !!this.props.trustUntilAge;
  }

  public getAssetId(): string | undefined {
    return this.props.assetId;
  }

  public getPercentage(): number | undefined {
    return this.props.percentage ?? this.props.residuaryPercentage;
  }

  public getFixedAmount(): number | undefined {
    return this.props.amountKES;
  }

  public getPriority(): number {
    return this.props.priority;
  }

  public getTrustAge(): number | undefined {
    return this.props.trustUntilAge;
  }

  public getDescription(): string {
    return this.props.description ?? this.generateDescription();
  }

  private generateDescription(): string {
    switch (this.props.type) {
      case BequestType.SPECIFIC:
        return `Specific asset: ${this.props.assetDescription ?? 'Asset ' + this.props.assetId}`;
      case BequestType.PERCENTAGE:
        return `${this.props.percentage}% of estate`;
      case BequestType.FIXED_AMOUNT:
        return `KES ${this.props.amountKES?.toLocaleString()}`;
      case BequestType.RESIDUARY:
        return `Residuary estate (${this.props.residuaryPercentage ?? 100}%)`;
      case BequestType.TRUST:
        return `${this.props.percentage}% in trust until age ${this.props.trustUntilAge}`;
      default:
        return 'Bequest';
    }
  }

  // Business logic: Calculate value
  public calculateValue(totalEstateValue: number, assetValue?: number): number {
    switch (this.props.type) {
      case BequestType.SPECIFIC:
        return assetValue ?? 0;

      case BequestType.PERCENTAGE:
        if (!this.props.percentage) return 0;
        return (totalEstateValue * this.props.percentage) / 100;

      case BequestType.FIXED_AMOUNT:
        return this.props.amountKES ?? 0;

      case BequestType.RESIDUARY:
        // This needs residuary estate value, not total
        if (!this.props.residuaryPercentage) return 0;
        return (totalEstateValue * this.props.residuaryPercentage) / 100;

      case BequestType.TRUST:
        if (!this.props.percentage) return 0;
        return (totalEstateValue * this.props.percentage) / 100;

      default:
        return 0;
    }
  }

  // Business logic: Check if abatement applies
  public isSubjectToAbatement(): boolean {
    // Specific bequests abate last
    // Fixed amounts and percentages abate proportionally
    return this.props.type !== BequestType.SPECIFIC;
  }

  // Business logic: Apply abatement (reduce due to insolvency)
  public applyAbatement(abatementFactor: number): BeneficiaryShare {
    if (abatementFactor < 0 || abatementFactor > 1) {
      throw new Error('Abatement factor must be between 0 and 1');
    }

    if (this.props.type === BequestType.FIXED_AMOUNT && this.props.amountKES) {
      return new BeneficiaryShare({
        ...this.props,
        amountKES: this.props.amountKES * abatementFactor,
        description: `${this.props.description} (abated ${(1 - abatementFactor) * 100}%)`,
      });
    }

    if (this.props.type === BequestType.PERCENTAGE && this.props.percentage) {
      return new BeneficiaryShare({
        ...this.props,
        percentage: this.props.percentage * abatementFactor,
        description: `${this.props.description} (abated ${(1 - abatementFactor) * 100}%)`,
      });
    }

    return this;
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      assetId: this.props.assetId,
      assetDescription: this.props.assetDescription,
      percentage: this.props.percentage,
      amountKES: this.props.amountKES,
      isResiduary: this.props.isResiduary,
      residuaryPercentage: this.props.residuaryPercentage,
      trustUntilAge: this.props.trustUntilAge,
      trusteeId: this.props.trusteeId,
      priority: this.props.priority,
      description: this.getDescription(),
    };
  }
}
