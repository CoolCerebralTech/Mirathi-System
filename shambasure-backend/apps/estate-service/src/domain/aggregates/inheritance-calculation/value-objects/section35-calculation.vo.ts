import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';

export class InvalidSuccessionCalculationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_SUCCESSION_CALCULATION');
  }
}

export enum S35EstateCategory {
  PERSONAL_CHATTELS = 'PERSONAL_CHATTELS',
  LIFE_INTEREST_PROPERTY = 'LIFE_INTEREST_PROPERTY',
  RESIDUARY_ESTATE = 'RESIDUARY_ESTATE',
}

export enum S35BeneficiaryType {
  SURVIVING_SPOUSE = 'SURVIVING_SPOUSE',
  CHILD = 'CHILD',
  CHILD_OF_DECEASED_CHILD = 'CHILD_OF_DECEASED_CHILD',
  OTHER_DEPENDANT = 'OTHER_DEPENDANT',
}

export interface S35BeneficiaryShare {
  beneficiaryId: string;
  beneficiaryType: S35BeneficiaryType;
  relationship: string;

  // Share Calculations
  shareOfPersonalChattels: Money;
  shareOfResiduaryEstate: Money;

  // Life Interest (if applicable)
  lifeInterestValue?: Money;
  lifeInterestEndsAt?: Date;

  // Hotchpot
  hotchpotDeduction: Money;
  netShare: Money; // (Chattels + Residue) - Hotchpot

  // Compliance
  isMinor: boolean;
  requiresGuardian: boolean;
}

interface S35CalculationProps {
  // Legal Framework
  appliedSection: 'S35(1)' | 'S35(1)(a)' | 'S35(1)(b)' | 'S35(5)';

  // Totals
  totalNetEstate: Money;
  totalDistributed: Money;
  unallocatedAmount: Money;

  // Breakdown
  spouseShare?: S35BeneficiaryShare;
  childrenShares: S35BeneficiaryShare[];
  dependantShares: S35BeneficiaryShare[];

  // Compliance
  requiresCourtApproval: boolean;
  warnings: string[];

  // Metadata
  calculatedAt: Date;
}

export class Section35Calculation extends ValueObject<S35CalculationProps> {
  private constructor(props: S35CalculationProps) {
    super(props);
  }

  protected validate(): void {
    // Validate Financial Integrity
    if (this.props.totalDistributed.amount > this.props.totalNetEstate.amount) {
      // Allow tiny floating point tolerance?
      // For strict VO, we expect the service to have handled rounding.
      // We throw if mismatch is significant.
      const diff = this.props.totalDistributed.subtract(this.props.totalNetEstate).amount;
      if (diff > 1.0) {
        throw new InvalidSuccessionCalculationException(
          `Distributed amount exceeds net estate by ${diff}`,
        );
      }
    }

    if (this.props.spouseShare && this.props.spouseShare.netShare.amount < 0) {
      throw new InvalidSuccessionCalculationException('Spouse share cannot be negative');
    }
  }

  // --- Factory Method (Reconstitute Result) ---

  static create(props: {
    appliedSection: 'S35(1)' | 'S35(1)(a)' | 'S35(1)(b)' | 'S35(5)';
    totalNetEstate: Money;
    spouseShare?: S35BeneficiaryShare;
    childrenShares: S35BeneficiaryShare[];
    dependantShares: S35BeneficiaryShare[];
    warnings?: string[];
  }): Section35Calculation {
    // Calculate totals
    let total = Money.zero(props.totalNetEstate.currency);

    if (props.spouseShare) total = total.add(props.spouseShare.netShare);

    props.childrenShares.forEach((s) => (total = total.add(s.netShare)));
    props.dependantShares.forEach((s) => (total = total.add(s.netShare)));

    // Calculate unallocated
    // Handle potential negative result gracefully (should be 0 if perfect distribution)
    let unallocated = Money.zero(props.totalNetEstate.currency);
    if (props.totalNetEstate.amount > total.amount) {
      unallocated = props.totalNetEstate.subtract(total);
    }

    // Check compliance flags
    const hasMinors = props.childrenShares.some((c) => c.isMinor);
    const hasDependants = props.dependantShares.length > 0;

    return new Section35Calculation({
      appliedSection: props.appliedSection,
      totalNetEstate: props.totalNetEstate,
      totalDistributed: total,
      unallocatedAmount: unallocated,
      spouseShare: props.spouseShare,
      childrenShares: props.childrenShares,
      dependantShares: props.dependantShares,
      requiresCourtApproval: hasMinors || hasDependants,
      warnings: props.warnings || [],
      calculatedAt: new Date(),
    });
  }

  // --- Business Logic ---

  isFullyDistributed(): boolean {
    return this.props.unallocatedAmount.amount <= 1.0; // Tolerance
  }

  hasSpouseShare(): boolean {
    return !!this.props.spouseShare;
  }

  // --- Getters ---
  get appliedSection(): string {
    return this.props.appliedSection;
  }
  get totalDistributed(): Money {
    return this.props.totalDistributed;
  }
  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval;
  }

  public toJSON(): Record<string, any> {
    return {
      section: this.props.appliedSection,
      financials: {
        estate: this.props.totalNetEstate.toJSON(),
        distributed: this.props.totalDistributed.toJSON(),
        unallocated: this.props.unallocatedAmount.toJSON(),
      },
      beneficiaries: {
        spouse: this.props.spouseShare, // S35BeneficiaryShare is a plain interface, safe to serialize
        childrenCount: this.props.childrenShares.length,
        dependantsCount: this.props.dependantShares.length,
      },
      compliance: {
        requiresCourtApproval: this.props.requiresCourtApproval,
        warnings: this.props.warnings,
      },
      date: this.props.calculatedAt,
    };
  }
}
