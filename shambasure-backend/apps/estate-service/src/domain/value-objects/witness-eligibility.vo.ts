// domain/value-objects/witness-eligibility.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Witness Eligibility Value Object
 *
 * Kenyan Legal Context - Section 11 LSA:
 * "Every will shall be in writing and shall be signed by the testator
 * or by some other person in his presence and by his direction, and
 * such signature shall be made or acknowledged by the testator in the
 * presence of two or more witnesses present at the same time, and
 * such witnesses shall subscribe the will in the presence of the testator."
 *
 * CRITICAL RULES:
 * 1. Witness CANNOT be a beneficiary (will is void as to that beneficiary)
 * 2. Witness must be of sound mind and legal age (18+)
 * 3. Witness cannot be spouse of testator
 * 4. Witness cannot be executor (best practice, not strict law)
 * 5. Both witnesses must be present at same time
 *
 * Eligibility Reasons:
 * - ELIGIBLE: Can witness
 * - INELIGIBLE_MINOR: Under 18 years
 * - INELIGIBLE_BENEFICIARY: Named in will
 * - INELIGIBLE_SPOUSE: Married to testator
 * - INELIGIBLE_EXECUTOR: Named as executor (discouraged)
 * - INELIGIBLE_RELATIONSHIP: Close family (best practice)
 * - INELIGIBLE_MENTAL_CAPACITY: Lacks capacity
 * - INELIGIBLE_CRIMINAL_RECORD: Convicted of fraud/forgery
 */
export enum WitnessEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE_MINOR = 'INELIGIBLE_MINOR',
  INELIGIBLE_BENEFICIARY = 'INELIGIBLE_BENEFICIARY',
  INELIGIBLE_SPOUSE = 'INELIGIBLE_SPOUSE',
  INELIGIBLE_EXECUTOR = 'INELIGIBLE_EXECUTOR',
  INELIGIBLE_RELATIONSHIP = 'INELIGIBLE_RELATIONSHIP',
  INELIGIBLE_MENTAL_CAPACITY = 'INELIGIBLE_MENTAL_CAPACITY',
  INELIGIBLE_CRIMINAL_RECORD = 'INELIGIBLE_CRIMINAL_RECORD',
  PENDING_ELIGIBILITY_CHECK = 'PENDING_ELIGIBILITY_CHECK',
}

interface WitnessEligibilityProps {
  status: WitnessEligibilityStatus;
  reason?: string;
  checkedAt: Date;
  legalAge: boolean;
  isBeneficiary: boolean;
  isSpouseOfTestator: boolean;
  isExecutor: boolean;
  hasConflictOfInterest: boolean;
}

export class WitnessEligibility extends ValueObject<WitnessEligibilityProps> {
  private constructor(props: WitnessEligibilityProps) {
    super(props);
  }

  protected validate(): void {
    if (!Object.values(WitnessEligibilityStatus).includes(this.props.status)) {
      throw new ValueObjectValidationError(
        `Invalid witness eligibility status: ${this.props.status}`,
        'status',
      );
    }

    // If status is eligible, flags must be correct
    if (this.props.status === WitnessEligibilityStatus.ELIGIBLE) {
      if (!this.props.legalAge) {
        throw new ValueObjectValidationError('Eligible witness must be of legal age', 'legalAge');
      }

      if (this.props.isBeneficiary) {
        throw new ValueObjectValidationError(
          'Beneficiary cannot be eligible witness',
          'isBeneficiary',
        );
      }

      if (this.props.isSpouseOfTestator) {
        throw new ValueObjectValidationError(
          'Spouse of testator cannot be eligible witness',
          'isSpouseOfTestator',
        );
      }
    }

    if (!this.props.checkedAt || this.props.checkedAt > new Date()) {
      throw new ValueObjectValidationError('Invalid eligibility check date', 'checkedAt');
    }
  }

  // Factory method: Create from eligibility check
  static create(params: {
    dateOfBirth?: Date;
    isBeneficiary: boolean;
    isSpouseOfTestator: boolean;
    isExecutor: boolean;
    hasMentalCapacity: boolean;
    hasCriminalRecord: boolean;
    hasConflictOfInterest: boolean;
    reason?: string;
  }): WitnessEligibility {
    const now = new Date();
    const legalAge = params.dateOfBirth ? this.calculateAge(params.dateOfBirth) >= 18 : false;

    let status: WitnessEligibilityStatus;

    // Determine eligibility (in priority order)
    if (!legalAge && params.dateOfBirth) {
      status = WitnessEligibilityStatus.INELIGIBLE_MINOR;
    } else if (params.isBeneficiary) {
      status = WitnessEligibilityStatus.INELIGIBLE_BENEFICIARY;
    } else if (params.isSpouseOfTestator) {
      status = WitnessEligibilityStatus.INELIGIBLE_SPOUSE;
    } else if (!params.hasMentalCapacity) {
      status = WitnessEligibilityStatus.INELIGIBLE_MENTAL_CAPACITY;
    } else if (params.hasCriminalRecord) {
      status = WitnessEligibilityStatus.INELIGIBLE_CRIMINAL_RECORD;
    } else if (params.isExecutor) {
      // Soft warning - not strictly illegal but discouraged
      status = WitnessEligibilityStatus.INELIGIBLE_EXECUTOR;
    } else if (params.hasConflictOfInterest) {
      status = WitnessEligibilityStatus.INELIGIBLE_RELATIONSHIP;
    } else if (!params.dateOfBirth) {
      status = WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK;
    } else {
      status = WitnessEligibilityStatus.ELIGIBLE;
    }

    return new WitnessEligibility({
      status,
      reason: params.reason,
      checkedAt: now,
      legalAge,
      isBeneficiary: params.isBeneficiary,
      isSpouseOfTestator: params.isSpouseOfTestator,
      isExecutor: params.isExecutor,
      hasConflictOfInterest: params.hasConflictOfInterest,
    });
  }

  // Factory: Eligible witness
  static eligible(): WitnessEligibility {
    return new WitnessEligibility({
      status: WitnessEligibilityStatus.ELIGIBLE,
      checkedAt: new Date(),
      legalAge: true,
      isBeneficiary: false,
      isSpouseOfTestator: false,
      isExecutor: false,
      hasConflictOfInterest: false,
    });
  }

  // Factory: Pending check
  static pending(reason?: string): WitnessEligibility {
    return new WitnessEligibility({
      status: WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK,
      reason,
      checkedAt: new Date(),
      legalAge: false,
      isBeneficiary: false,
      isSpouseOfTestator: false,
      isExecutor: false,
      hasConflictOfInterest: false,
    });
  }

  // Query methods
  public isEligible(): boolean {
    return this.props.status === WitnessEligibilityStatus.ELIGIBLE;
  }

  public isIneligible(): boolean {
    return (
      this.props.status !== WitnessEligibilityStatus.ELIGIBLE &&
      this.props.status !== WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK
    );
  }

  public isPending(): boolean {
    return this.props.status === WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK;
  }

  public getStatus(): WitnessEligibilityStatus {
    return this.props.status;
  }

  public getReason(): string | undefined {
    return this.props.reason;
  }

  public getIneligibilityReason(): string {
    const reasons: Record<WitnessEligibilityStatus, string> = {
      [WitnessEligibilityStatus.ELIGIBLE]: 'Eligible to witness',
      [WitnessEligibilityStatus.INELIGIBLE_MINOR]: 'Witness must be 18 years or older',
      [WitnessEligibilityStatus.INELIGIBLE_BENEFICIARY]:
        'Beneficiary cannot witness will (Section 11 LSA)',
      [WitnessEligibilityStatus.INELIGIBLE_SPOUSE]: 'Spouse of testator cannot witness will',
      [WitnessEligibilityStatus.INELIGIBLE_EXECUTOR]:
        'Executor should not witness will (best practice)',
      [WitnessEligibilityStatus.INELIGIBLE_RELATIONSHIP]:
        'Close family member should not witness (best practice)',
      [WitnessEligibilityStatus.INELIGIBLE_MENTAL_CAPACITY]: 'Witness must have mental capacity',
      [WitnessEligibilityStatus.INELIGIBLE_CRIMINAL_RECORD]:
        'Person with fraud/forgery conviction cannot witness',
      [WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK]: 'Eligibility check pending',
    };

    return this.props.reason ?? reasons[this.props.status];
  }

  // Business logic
  public hasLegalImpediment(): boolean {
    // These are strict legal impediments (not just best practices)
    return [
      WitnessEligibilityStatus.INELIGIBLE_MINOR,
      WitnessEligibilityStatus.INELIGIBLE_BENEFICIARY,
      WitnessEligibilityStatus.INELIGIBLE_SPOUSE,
      WitnessEligibilityStatus.INELIGIBLE_MENTAL_CAPACITY,
    ].includes(this.props.status);
  }

  public isOnlyBestPracticeViolation(): boolean {
    // These are discouraged but not strictly illegal
    return [
      WitnessEligibilityStatus.INELIGIBLE_EXECUTOR,
      WitnessEligibilityStatus.INELIGIBLE_RELATIONSHIP,
    ].includes(this.props.status);
  }

  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  public toJSON(): Record<string, any> {
    return {
      status: this.props.status,
      reason: this.getIneligibilityReason(),
      checkedAt: this.props.checkedAt.toISOString(),
      isEligible: this.isEligible(),
      hasLegalImpediment: this.hasLegalImpediment(),
    };
  }
}
