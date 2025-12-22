import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export class InvalidDependantProvisionException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_DEPENDANT_PROVISION');
  }
}

export enum DependantCategory {
  MINOR_CHILD = 'MINOR_CHILD',
  ADULT_CHILD = 'ADULT_CHILD',
  SPOUSE = 'SPOUSE',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  COMMON_LAW_SPOUSE = 'COMMON_LAW_SPOUSE', // S.29(5)
  CUSTOMARY_SPOUSE = 'CUSTOMARY_SPOUSE',
}

export enum DependantStatus {
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  PROVISION_GRANTED = 'PROVISION_GRANTED',
  PROVISION_DENIED = 'PROVISION_DENIED',
  APPEAL_PENDING = 'APPEAL_PENDING',
}

export enum SupportType {
  LUMP_SUM = 'LUMP_SUM',
  MONTHLY_ALLOWANCE = 'MONTHLY_ALLOWANCE',
  TRUST_FUND = 'TRUST_FUND', // For minors
}

interface DependencyEntitlementProps {
  dependantId: string;
  dependantName: string;
  category: DependantCategory;

  // Financials
  assessedNeed: Money;
  recommendedProvision: Money;
  provisionType: SupportType;

  // Percentages
  coveragePercentage: Percentage; // Provision / Need
  estateSharePercentage: Percentage; // Provision / Estate Net

  // Status
  status: DependantStatus;
  requiresCourtApproval: boolean;
  courtOrderReference?: string;

  // Metadata
  calculatedAt: Date;
  notes?: string;
}

export class DependencyEntitlement extends ValueObject<DependencyEntitlementProps> {
  private constructor(props: DependencyEntitlementProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.dependantId) {
      throw new InvalidDependantProvisionException('Dependant ID is required');
    }

    if (this.props.recommendedProvision.amount < 0) {
      throw new InvalidDependantProvisionException('Provision amount cannot be negative');
    }

    // Logical Consistency Check
    if (this.props.recommendedProvision.amount > this.props.assessedNeed.amount) {
      // Warning: Provision > Need is rare but possible (generous estate)
    }

    if (
      this.props.requiresCourtApproval &&
      this.props.status === DependantStatus.PROVISION_GRANTED &&
      !this.props.courtOrderReference
    ) {
      throw new InvalidDependantProvisionException(
        'Granted provision requiring court approval must have court order reference',
      );
    }
  }

  // --- Factory Methods ---

  static create(props: {
    dependantId: string;
    dependantName: string;
    category: DependantCategory;
    assessedNeed: Money;
    recommendedProvision: Money;
    provisionType: SupportType;
    estateNetValue: Money;
    requiresCourtApproval: boolean;
    notes?: string;
  }): DependencyEntitlement {
    // FIX: Access properties via 'props.'
    const coverageVal =
      props.assessedNeed.amount === 0
        ? 0
        : (props.recommendedProvision.amount / props.assessedNeed.amount) * 100;

    const shareVal =
      props.estateNetValue.amount === 0
        ? 0
        : (props.recommendedProvision.amount / props.estateNetValue.amount) * 100;

    return new DependencyEntitlement({
      dependantId: props.dependantId,
      dependantName: props.dependantName,
      category: props.category,
      assessedNeed: props.assessedNeed,
      recommendedProvision: props.recommendedProvision,
      provisionType: props.provisionType,
      coveragePercentage: new Percentage(coverageVal),
      estateSharePercentage: new Percentage(shareVal),
      status: DependantStatus.PENDING_ASSESSMENT,
      requiresCourtApproval: props.requiresCourtApproval,
      calculatedAt: new Date(),
      notes: props.notes,
    });
  }

  // --- Immutable State Transitions ---

  approve(courtOrderReference?: string): DependencyEntitlement {
    if (this.props.requiresCourtApproval && !courtOrderReference) {
      throw new InvalidDependantProvisionException('Court order reference required for approval');
    }

    return new DependencyEntitlement({
      ...this.props,
      status: DependantStatus.PROVISION_GRANTED,
      courtOrderReference,
    });
  }

  deny(reason: string): DependencyEntitlement {
    return new DependencyEntitlement({
      ...this.props,
      status: DependantStatus.PROVISION_DENIED,
      notes: this.props.notes ? `${this.props.notes}; DENIED: ${reason}` : `DENIED: ${reason}`,
    });
  }

  // --- Business Logic ---

  isAdequate(): boolean {
    // General rule: > 70% of assessed need is considered "adequate" provision
    return this.props.coveragePercentage.value >= 70;
  }

  isHighImpact(): boolean {
    // If single provision takes > 10% of estate, it's high impact
    return this.props.estateSharePercentage.value > 10;
  }

  // --- Getters ---
  get recommendedAmount(): Money {
    return this.props.recommendedProvision;
  }
  get status(): DependantStatus {
    return this.props.status;
  }

  public toJSON(): Record<string, any> {
    return {
      dependant: {
        id: this.props.dependantId,
        name: this.props.dependantName,
        category: this.props.category,
      },
      financials: {
        need: this.props.assessedNeed.toJSON(),
        provision: this.props.recommendedProvision.toJSON(),
        coverage: this.props.coveragePercentage.toJSON(),
        estateShare: this.props.estateSharePercentage.toJSON(),
      },
      status: this.props.status,
      compliance: {
        requiresCourtApproval: this.props.requiresCourtApproval,
        courtOrder: this.props.courtOrderReference,
        isAdequate: this.isAdequate(),
      },
    };
  }
}
