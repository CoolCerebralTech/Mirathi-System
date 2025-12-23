// domain/value-objects/bequest-condition.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Bequest Condition Value Object
 *
 * Kenyan Legal Context:
 * - Testator can impose reasonable conditions on bequests
 * - Conditions must not be illegal, immoral, or against public policy
 * - Common conditions: Age attainment, education, marriage, survival
 *
 * Condition Types:
 * - AGE_REQUIREMENT: "When beneficiary turns 25"
 * - SURVIVAL: "If they survive me by 30 days" (prevents simultaneous death issues)
 * - EDUCATION: "Upon graduation from university"
 * - MARRIAGE: "Upon marriage" or "While remaining unmarried"
 * - ALTERNATE: "If primary dies, give to alternate"
 * - NONE: Unconditional bequest
 *
 * Business Rules:
 * - Conditions must be clear and measurable
 * - Conditions cannot violate constitutional rights
 * - Age conditions are most common and safest
 * - Marriage conditions must be carefully worded (constitutional concerns)
 */
export enum BequestConditionType {
  NONE = 'NONE',
  AGE_REQUIREMENT = 'AGE_REQUIREMENT',
  SURVIVAL = 'SURVIVAL',
  EDUCATION = 'EDUCATION',
  MARRIAGE = 'MARRIAGE',
  ALTERNATE = 'ALTERNATE',
  CUSTOM = 'CUSTOM',
}

interface BequestConditionProps {
  type: BequestConditionType;
  description?: string;

  // Age condition
  requiredAge?: number;

  // Survival condition
  survivalDays?: number;

  // Education condition
  educationLevel?: string;
  institutionName?: string;

  // Marriage condition
  marriageStatus?: 'MARRIED' | 'UNMARRIED';

  // Custom condition
  customCondition?: string;

  // Validation
  isFulfilled?: boolean;
  fulfilledAt?: Date;
}

export class BequestCondition extends ValueObject<BequestConditionProps> {
  private constructor(props: BequestConditionProps) {
    super(props);
  }

  protected validate(): void {
    if (!Object.values(BequestConditionType).includes(this.props.type)) {
      throw new ValueObjectValidationError(
        `Invalid bequest condition type: ${this.props.type}`,
        'type',
      );
    }

    // Age validation
    if (
      this.props.type === BequestConditionType.AGE_REQUIREMENT &&
      this.props.requiredAge !== undefined
    ) {
      if (this.props.requiredAge < 18 || this.props.requiredAge > 100) {
        throw new ValueObjectValidationError(
          'Age requirement must be between 18 and 100',
          'requiredAge',
        );
      }
    }

    // Survival days validation
    if (
      this.props.type === BequestConditionType.SURVIVAL &&
      this.props.survivalDays !== undefined
    ) {
      if (this.props.survivalDays < 1 || this.props.survivalDays > 180) {
        throw new ValueObjectValidationError(
          'Survival period must be between 1 and 180 days',
          'survivalDays',
        );
      }
    }

    // Education validation
    if (this.props.type === BequestConditionType.EDUCATION) {
      if (!this.props.educationLevel) {
        throw new ValueObjectValidationError('Education level must be specified', 'educationLevel');
      }
    }

    // Custom condition validation
    if (this.props.type === BequestConditionType.CUSTOM) {
      if (!this.props.customCondition || this.props.customCondition.trim().length < 10) {
        throw new ValueObjectValidationError(
          'Custom condition must be at least 10 characters',
          'customCondition',
        );
      }
    }

    // Fulfillment validation
    if (this.props.isFulfilled && !this.props.fulfilledAt) {
      throw new ValueObjectValidationError(
        'Fulfilled condition must have fulfillment date',
        'fulfilledAt',
      );
    }
  }

  // Factory: No condition (immediate distribution)
  static none(): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.NONE,
      description: 'No conditions - immediate distribution',
    });
  }

  // Factory: Age requirement
  static ageRequirement(age: number, description?: string): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.AGE_REQUIREMENT,
      requiredAge: age,
      description: description ?? `Beneficiary must reach age ${age}`,
    });
  }

  // Factory: Survival clause
  static survival(days: number = 30): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.SURVIVAL,
      survivalDays: days,
      description: `Beneficiary must survive testator by ${days} days`,
    });
  }

  // Factory: Education requirement
  static education(level: string, institution?: string, description?: string): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.EDUCATION,
      educationLevel: level,
      institutionName: institution,
      description:
        description ?? `Upon completion of ${level}${institution ? ` at ${institution}` : ''}`,
    });
  }

  // Factory: Marriage condition
  static marriage(mustBeMarried: boolean, description?: string): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.MARRIAGE,
      marriageStatus: mustBeMarried ? 'MARRIED' : 'UNMARRIED',
      description: description ?? (mustBeMarried ? 'Upon marriage' : 'While remaining unmarried'),
    });
  }

  // Factory: Custom condition
  static custom(condition: string): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.CUSTOM,
      customCondition: condition,
      description: condition,
    });
  }

  // Factory: Alternate beneficiary trigger
  static alternate(description?: string): BequestCondition {
    return new BequestCondition({
      type: BequestConditionType.ALTERNATE,
      description: description ?? 'If primary beneficiary predeceases testator or disclaims',
    });
  }

  // Query methods
  public getType(): BequestConditionType {
    return this.props.type;
  }

  public isUnconditional(): boolean {
    return this.props.type === BequestConditionType.NONE;
  }

  public isAgeCondition(): boolean {
    return this.props.type === BequestConditionType.AGE_REQUIREMENT;
  }

  public isSurvivalCondition(): boolean {
    return this.props.type === BequestConditionType.SURVIVAL;
  }

  public isEducationCondition(): boolean {
    return this.props.type === BequestConditionType.EDUCATION;
  }

  public isMarriageCondition(): boolean {
    return this.props.type === BequestConditionType.MARRIAGE;
  }

  public getDescription(): string {
    return this.props.description ?? 'No description';
  }

  public getRequiredAge(): number | undefined {
    return this.props.requiredAge;
  }

  public getSurvivalDays(): number | undefined {
    return this.props.survivalDays;
  }

  public isFulfilled(): boolean {
    return this.props.isFulfilled ?? false;
  }

  // Business logic: Check if condition can be fulfilled
  public canBeFulfilled(): boolean {
    // NONE is always fulfilled
    if (this.isUnconditional()) {
      return true;
    }

    // ALTERNATE only triggers when primary fails
    if (this.props.type === BequestConditionType.ALTERNATE) {
      return true;
    }

    // Other conditions need verification
    return !this.isFulfilled();
  }

  // Business logic: Mark as fulfilled
  public markAsFulfilled(date?: Date): BequestCondition {
    if (this.isFulfilled()) {
      throw new Error('Condition already fulfilled');
    }

    return new BequestCondition({
      ...this.props,
      isFulfilled: true,
      fulfilledAt: date ?? new Date(),
    });
  }

  // Business logic: Check age fulfillment
  public checkAgeFulfillment(beneficiaryDateOfBirth: Date): boolean {
    if (!this.isAgeCondition() || !this.props.requiredAge) {
      return false;
    }

    const age = this.calculateAge(beneficiaryDateOfBirth);
    return age >= this.props.requiredAge;
  }

  // Business logic: Check survival fulfillment
  public checkSurvivalFulfillment(testatorDeathDate: Date, beneficiaryAliveAt: Date): boolean {
    if (!this.isSurvivalCondition() || !this.props.survivalDays) {
      return false;
    }

    const survivalDeadline = new Date(testatorDeathDate);
    survivalDeadline.setDate(survivalDeadline.getDate() + this.props.survivalDays);

    return beneficiaryAliveAt >= survivalDeadline;
  }

  // Validation: Check for illegal conditions
  public isLegallyValid(): { valid: boolean; reason?: string } {
    // Marriage conditions must not discriminate
    if (
      this.props.type === BequestConditionType.MARRIAGE &&
      this.props.marriageStatus === 'UNMARRIED'
    ) {
      return {
        valid: false,
        reason: 'Conditions restricting marriage may violate constitutional rights',
      };
    }

    // Age conditions must be reasonable
    if (this.isAgeCondition() && this.props.requiredAge && this.props.requiredAge > 65) {
      return {
        valid: true,
        reason: 'Warning: Very high age requirement may cause bequest to lapse',
      };
    }

    return { valid: true };
  }

  private calculateAge(dateOfBirth: Date): number {
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
      type: this.props.type,
      description: this.getDescription(),
      requiredAge: this.props.requiredAge,
      survivalDays: this.props.survivalDays,
      educationLevel: this.props.educationLevel,
      marriageStatus: this.props.marriageStatus,
      customCondition: this.props.customCondition,
      isFulfilled: this.isFulfilled(),
      fulfilledAt: this.props.fulfilledAt?.toISOString(),
    };
  }
}
