// src/estate-service/src/domain/value-objects/bequest-condition.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

export type BequestConditionType =
  | 'AGE_REQUIREMENT'
  | 'SURVIVAL'
  | 'EDUCATION'
  | 'MARRIAGE'
  | 'ALTERNATE'
  | 'NONE';

export interface BequestConditionProps {
  type: BequestConditionType;
  details?: string;
  parameters?: Record<string, any>;
  isMet?: boolean;
}

/**
 * Bequest Condition Value Object
 *
 * Represents conditions attached to inheritance in Kenya
 * Legal Requirements:
 * - Conditions must not be illegal, impossible, or against public policy
 * - Conditions must be clear and ascertainable
 * - Age conditions must consider Kenyan age of majority (18 years)
 * - Alternate beneficiaries must be specified
 */
export class BequestCondition extends ValueObject<BequestConditionProps> {
  constructor(props: BequestConditionProps) {
    super(props);
  }

  protected validate(): void {
    // Validate parameters based on type
    switch (this.props.type) {
      case 'AGE_REQUIREMENT':
        this.validateAgeRequirement();
        break;

      case 'SURVIVAL':
        this.validateSurvivalCondition();
        break;

      case 'EDUCATION':
        this.validateEducationCondition();
        break;

      case 'MARRIAGE':
        this.validateMarriageCondition();
        break;

      case 'ALTERNATE':
        this.validateAlternateCondition();
        break;

      case 'NONE':
        // No validation needed
        break;

      default:
        throw new ValueObjectValidationError(
          `Invalid bequest condition type: ${this.props.type}`,
          'type',
        );
    }
  }

  private validateAgeRequirement(): void {
    const age = this.props.parameters?.age;
    if (!age || typeof age !== 'number') {
      throw new ValueObjectValidationError('Age requirement must specify an age', 'parameters.age');
    }

    if (age < 18) {
      throw new ValueObjectValidationError(
        'Age requirement cannot be below Kenyan age of majority (18)',
        'parameters.age',
      );
    }

    if (age > 100) {
      throw new ValueObjectValidationError(
        'Age requirement seems unrealistic (over 100)',
        'parameters.age',
      );
    }
  }

  private validateSurvivalCondition(): void {
    const days = this.props.parameters?.survivalDays;
    if (!days || typeof days !== 'number') {
      throw new ValueObjectValidationError(
        'Survival condition must specify number of days',
        'parameters.survivalDays',
      );
    }

    if (days <= 0) {
      throw new ValueObjectValidationError(
        'Survival days must be positive',
        'parameters.survivalDays',
      );
    }

    // Common law survival period is 30 days
    if (days > 365) {
      throw new ValueObjectValidationError(
        'Survival condition beyond 1 year may be unreasonable',
        'parameters.survivalDays',
      );
    }
  }

  private validateEducationCondition(): void {
    const level = this.props.parameters?.educationLevel;
    if (!level || typeof level !== 'string') {
      throw new ValueObjectValidationError(
        'Education condition must specify education level',
        'parameters.educationLevel',
      );
    }

    // Check if it's a valid education level
    const validLevels = ['PRIMARY', 'SECONDARY', 'DIPLOMA', 'DEGREE', 'MASTERS', 'PHD'];
    if (!validLevels.includes(level.toUpperCase())) {
      throw new ValueObjectValidationError(
        `Invalid education level. Valid levels: ${validLevels.join(', ')}`,
        'parameters.educationLevel',
      );
    }
  }

  private validateMarriageCondition(): void {
    const allowed = this.props.parameters?.marriageAllowed;
    if (allowed === undefined) {
      throw new ValueObjectValidationError(
        'Marriage condition must specify if marriage is allowed or not',
        'parameters.marriageAllowed',
      );
    }

    // Note: Conditions against marriage are generally void as against public policy
    if (allowed === false) {
      // This is a warning condition - might be unenforceable
      console.warn('WARNING: Conditions against marriage may be unenforceable in Kenyan courts');
    }
  }

  private validateAlternateCondition(): void {
    const alternateBeneficiaryId = this.props.parameters?.alternateBeneficiaryId;
    if (!alternateBeneficiaryId || typeof alternateBeneficiaryId !== 'string') {
      throw new ValueObjectValidationError(
        'Alternate condition must specify alternate beneficiary ID',
        'parameters.alternateBeneficiaryId',
      );
    }
  }

  /**
   * Evaluate if condition is met based on current facts
   */
  public evaluate(currentFacts: Record<string, any>): boolean {
    switch (this.props.type) {
      case 'AGE_REQUIREMENT':
        const beneficiaryAge = currentFacts.beneficiaryAge;
        const requiredAge = this.props.parameters?.age;
        return beneficiaryAge >= requiredAge;

      case 'SURVIVAL':
        const beneficiaryAlive = currentFacts.beneficiaryAlive;
        const survivalDays = this.props.parameters?.survivalDays;
        const daysSurvived = currentFacts.daysSurvived;
        return beneficiaryAlive && daysSurvived >= survivalDays;

      case 'EDUCATION':
        const beneficiaryEducation = currentFacts.beneficiaryEducation;
        const requiredLevel = this.props.parameters?.educationLevel;
        return beneficiaryEducation === requiredLevel;

      case 'MARRIAGE':
        const beneficiaryMarried = currentFacts.beneficiaryMarried;
        const marriageAllowed = this.props.parameters?.marriageAllowed;
        return marriageAllowed ? beneficiaryMarried : !beneficiaryMarried;

      case 'ALTERNATE':
        const primaryAlive = currentFacts.primaryBeneficiaryAlive;
        return !primaryAlive; // Condition met if primary is dead

      case 'NONE':
        return true; // No conditions, always met

      default:
        return false;
    }
  }

  /**
   * Get human-readable description
   */
  public getDescription(): string {
    switch (this.props.type) {
      case 'AGE_REQUIREMENT':
        return `Upon reaching age ${this.props.parameters?.age}`;
      case 'SURVIVAL':
        return `If beneficiary survives by ${this.props.parameters?.survivalDays} days`;
      case 'EDUCATION':
        return `Upon completion of ${this.props.parameters?.educationLevel} education`;
      case 'MARRIAGE':
        const allowed = this.props.parameters?.marriageAllowed;
        return allowed ? 'Upon marriage' : 'Only if not married';
      case 'ALTERNATE':
        return `Alternate beneficiary if primary deceased`;
      case 'NONE':
        return 'No conditions';
      default:
        return 'Unknown condition';
    }
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      details: this.props.details,
      parameters: this.props.parameters,
      description: this.getDescription(),
      isConditional: this.props.type !== 'NONE',
    };
  }

  // Static factory methods
  public static ageRequirement(age: number): BequestCondition {
    return new BequestCondition({
      type: 'AGE_REQUIREMENT',
      parameters: { age },
    });
  }

  public static survivalCondition(days: number = 30): BequestCondition {
    return new BequestCondition({
      type: 'SURVIVAL',
      parameters: { survivalDays: days },
    });
  }

  public static educationCondition(level: string): BequestCondition {
    return new BequestCondition({
      type: 'EDUCATION',
      parameters: { educationLevel: level },
    });
  }

  public static marriageCondition(allowed: boolean): BequestCondition {
    return new BequestCondition({
      type: 'MARRIAGE',
      parameters: { marriageAllowed: allowed },
    });
  }

  public static alternateCondition(alternateBeneficiaryId: string): BequestCondition {
    return new BequestCondition({
      type: 'ALTERNATE',
      parameters: { alternateBeneficiaryId },
    });
  }

  public static none(): BequestCondition {
    return new BequestCondition({
      type: 'NONE',
    });
  }
}
