// src/estate-service/src/domain/value-objects/witness-eligibility.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export interface WitnessEligibilityProps {
  isEligible: boolean;
  reasons: string[];
  age: number;
  isBeneficiary: boolean;
  isExecutor: boolean;
  isTestatorSpouse: boolean;
  isMentallyCompetent: boolean;
  hasCriminalRecord: boolean;
}

/**
 * Witness Eligibility Value Object
 *
 * Determines if a person can witness a will under Kenyan Law of Succession Act S.11
 * Legal Requirements:
 * - Must be at least 18 years old
 * - Cannot be a beneficiary or spouse of beneficiary (S.11(2))
 * - Must be mentally competent
 * - Should not have criminal record (best practice)
 * - Should not be the executor (allowed but discouraged)
 */
export class WitnessEligibility extends ValueObject<WitnessEligibilityProps> {
  private static readonly MIN_AGE = 18;

  constructor(props: WitnessEligibilityProps) {
    super(props);
  }

  protected validate(): void {
    const reasons: string[] = [];

    // Age check (S.11 LSA)
    if (this.props.age < WitnessEligibility.MIN_AGE) {
      reasons.push(`Witness must be at least ${WitnessEligibility.MIN_AGE} years old`);
    }

    // Beneficiary check (S.11(2) LSA)
    if (this.props.isBeneficiary) {
      reasons.push('Witness cannot be a beneficiary');
    }

    // Mental competence check
    if (!this.props.isMentallyCompetent) {
      reasons.push('Witness must be mentally competent');
    }

    // Spouse of beneficiary check
    if (this.props.isTestatorSpouse) {
      reasons.push('Spouse of testator cannot witness will');
    }

    // Criminal record warning (not absolute disqualification)
    if (this.props.hasCriminalRecord) {
      reasons.push('Witness has criminal record - may affect credibility');
    }

    // Executor warning (allowed but not recommended)
    if (this.props.isExecutor) {
      reasons.push('Executor as witness is discouraged but legally permitted');
    }

    // Determine overall eligibility
    const isEligible =
      reasons.length === 0 || (reasons.length === 1 && reasons[0].includes('discouraged'));

    // Validate consistency
    if (this.props.isEligible !== isEligible) {
      throw new ValueObjectValidationError(
        'Eligibility calculation does not match provided value',
        'isEligible',
      );
    }

    if (this.props.reasons.length !== reasons.length) {
      throw new ValueObjectValidationError(
        'Reasons list does not match calculated reasons',
        'reasons',
      );
    }
  }

  /**
   * Calculate eligibility based on facts
   */
  public static calculate(facts: Partial<WitnessEligibilityProps>): WitnessEligibility {
    const age = facts.age || 0;
    const isBeneficiary = facts.isBeneficiary || false;
    const isExecutor = facts.isExecutor || false;
    const isTestatorSpouse = facts.isTestatorSpouse || false;
    const isMentallyCompetent = facts.isMentallyCompetent ?? true;
    const hasCriminalRecord = facts.hasCriminalRecord || false;

    const reasons: string[] = [];

    // Age check
    if (age < WitnessEligibility.MIN_AGE) {
      reasons.push(`Witness must be at least ${WitnessEligibility.MIN_AGE} years old`);
    }

    // Beneficiary check
    if (isBeneficiary) {
      reasons.push('Witness cannot be a beneficiary');
    }

    // Mental competence
    if (!isMentallyCompetent) {
      reasons.push('Witness must be mentally competent');
    }

    // Spouse check
    if (isTestatorSpouse) {
      reasons.push('Spouse of testator cannot witness will');
    }

    // Criminal record warning
    if (hasCriminalRecord) {
      reasons.push('Witness has criminal record - may affect credibility');
    }

    // Executor warning
    if (isExecutor) {
      reasons.push('Executor as witness is discouraged but legally permitted');
    }

    // Determine eligibility
    const isEligible =
      reasons.length === 0 || (reasons.length === 1 && reasons[0].includes('discouraged'));

    return new WitnessEligibility({
      isEligible,
      reasons,
      age,
      isBeneficiary,
      isExecutor,
      isTestatorSpouse,
      isMentallyCompetent,
      hasCriminalRecord,
    });
  }

  /**
   * Get primary disqualification reason if any
   */
  public getDisqualificationReason(): string | null {
    // Remove warnings to find disqualifications
    const disqualifyingReasons = this.props.reasons.filter(
      (reason) => !reason.includes('discouraged') && !reason.includes('may affect'),
    );

    return disqualifyingReasons.length > 0 ? disqualifyingReasons[0] : null;
  }

  /**
   * Get warnings (non-disqualifying issues)
   */
  public getWarnings(): string[] {
    return this.props.reasons.filter(
      (reason) => reason.includes('discouraged') || reason.includes('may affect'),
    );
  }

  public toJSON(): Record<string, any> {
    return {
      isEligible: this.props.isEligible,
      reasons: this.props.reasons,
      age: this.props.age,
      disqualificationReason: this.getDisqualificationReason(),
      warnings: this.getWarnings(),
      requirements: {
        minAge: WitnessEligibility.MIN_AGE,
        cannotBeBeneficiary: true,
        cannotBeSpouse: true,
        mustBeMentallyCompetent: true,
      },
    };
  }

  // Static factory methods for common scenarios
  public static eligibleAdult(age: number): WitnessEligibility {
    return WitnessEligibility.calculate({
      age,
      isBeneficiary: false,
      isExecutor: false,
      isTestatorSpouse: false,
      isMentallyCompetent: true,
      hasCriminalRecord: false,
    });
  }

  public static ineligibleBeneficiary(age: number): WitnessEligibility {
    return WitnessEligibility.calculate({
      age,
      isBeneficiary: true,
      isExecutor: false,
      isTestatorSpouse: false,
      isMentallyCompetent: true,
      hasCriminalRecord: false,
    });
  }

  public static ineligibleMinor(age: number): WitnessEligibility {
    return WitnessEligibility.calculate({
      age,
      isBeneficiary: false,
      isExecutor: false,
      isTestatorSpouse: false,
      isMentallyCompetent: true,
      hasCriminalRecord: false,
    });
  }
}
