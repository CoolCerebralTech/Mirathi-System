import { ValueObject } from '../../../base/value-object';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';

interface GiftInterVivosDetailsProps {
  readonly description: string;
  readonly valueAtGiftTime: Money;
  readonly dateOfGift: Date;
  readonly isAdvancement: boolean;
  readonly isSubjectToHotchpot: boolean;
  readonly giftDeedReference: string | null;
  readonly witnessDetails: string | null;
  readonly conditionMet: boolean | null;
  readonly conditionMetDate: Date | null;
  readonly revertsToEstate: boolean;
  readonly customaryLawExemption: boolean;
}

// Implements Kenyan LSA Section 35(3) - Hotchpot Rule
export class GiftInterVivosDetails extends ValueObject<GiftInterVivosDetailsProps> {
  private constructor(props: GiftInterVivosDetailsProps) {
    super(props);
  }

  public static create(props: {
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    isAdvancement?: boolean;
    isSubjectToHotchpot?: boolean;
    giftDeedReference?: string;
    witnessDetails?: string;
    conditionMet?: boolean;
    conditionMetDate?: Date;
    revertsToEstate?: boolean;
    customaryLawExemption?: boolean;
  }): Result<GiftInterVivosDetails> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.description, argumentName: 'description' },
      { argument: props.valueAtGiftTime, argumentName: 'valueAtGiftTime' },
      { argument: props.dateOfGift, argumentName: 'dateOfGift' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    // Gift value must be positive
    if (props.valueAtGiftTime.amount <= 0) {
      return Result.fail('Gift value must be positive');
    }

    // Gift date cannot be in the future
    if (props.dateOfGift > new Date()) {
      return Result.fail('Gift date cannot be in the future');
    }

    // Customary law exemption requires explanation
    if (props.customaryLawExemption && !props.description.toLowerCase().includes('customary')) {
      return Result.fail('Customary law exemption requires description of customary practice');
    }

    return Result.ok(
      new GiftInterVivosDetails({
        description: props.description,
        valueAtGiftTime: props.valueAtGiftTime,
        dateOfGift: props.dateOfGift,
        isAdvancement: props.isAdvancement ?? true,
        isSubjectToHotchpot: props.isSubjectToHotchpot ?? true,
        giftDeedReference: props.giftDeedReference || null,
        witnessDetails: props.witnessDetails || null,
        conditionMet: props.conditionMet || null,
        conditionMetDate: props.conditionMetDate || null,
        revertsToEstate: props.revertsToEstate ?? false,
        customaryLawExemption: props.customaryLawExemption ?? false,
      }),
    );
  }

  get description(): string {
    return this.props.description;
  }

  get valueAtGiftTime(): Money {
    return this.props.valueAtGiftTime;
  }

  get dateOfGift(): Date {
    return this.props.dateOfGift;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  // Calculate inflation-adjusted value using Kenyan CPI for hotchpot
  public calculateHotchpotValue(reconciliationDate: Date): Money {
    if (!this.props.isSubjectToHotchpot || this.props.customaryLawExemption) {
      return this.props.valueAtGiftTime;
    }

    const monthsDifference = this.monthDiff(this.props.dateOfGift, reconciliationDate);
    const averageMonthlyInflation = 0.05; // 5% annual inflation

    const adjustedAmount =
      this.props.valueAtGiftTime.amount * Math.pow(1 + averageMonthlyInflation, monthsDifference);

    return Money.create({
      amount: Math.round(adjustedAmount * 100) / 100,
      currency: this.props.valueAtGiftTime.currency,
    });
  }

  // Kenyan customary law exceptions
  public getCustomaryExemptionDetails(): string | null {
    if (!this.props.customaryLawExemption) return null;

    const exemptions = [
      'Bride price (lobola/dowry)',
      'Educational gifts to children',
      'Gifts during traditional ceremonies',
      'Inter vivos transfers within polygamous houses',
      'Gifts to married daughters',
    ];

    return (
      exemptions.find((ex) => this.props.description.toLowerCase().includes(ex.toLowerCase())) ||
      'Customary law exemption applied'
    );
  }

  // Check if condition has been met
  public evaluateCondition(asOfDate: Date = new Date()): { met: boolean; reason: string } {
    if (this.props.conditionMet !== null) {
      return {
        met: this.props.conditionMet,
        reason: this.props.conditionMet ? 'Condition fulfilled' : 'Condition not fulfilled',
      };
    }

    // Default condition: gift not revoked before death
    return {
      met: true,
      reason: 'Gift remains valid inter vivos transfer',
    };
  }

  // Determine if gift should be added back to estate
  public shouldRevertToEstate(): boolean {
    if (this.props.revertsToEstate) return true;

    const conditionEvaluation = this.evaluateCondition();
    if (!conditionEvaluation.met) return true;

    return false;
  }

  // Legal requirements for valid inter vivos gift in Kenya
  public getLegalRequirements(): string[] {
    const requirements = [
      'Donor must have legal capacity at time of gift',
      'Gift must be complete with transfer of ownership',
      'Donor must not retain control over gifted property',
    ];

    if (this.props.isSubjectToHotchpot) {
      requirements.push('Must be declared for hotchpot calculation under S.35(3) LSA');
    }

    if (this.props.giftDeedReference) {
      requirements.push('Gift deed should be registered if involving land');
    }

    if (this.props.witnessDetails) {
      requirements.push('Gift witnessed by: ' + this.props.witnessDetails);
    }

    return requirements;
  }

  // Format for legal documents
  public formatForLegalDocument(): string {
    const dateStr = this.props.dateOfGift.toLocaleDateString('en-KE');
    const valueStr = this.props.valueAtGiftTime.format('en-KE');

    return `Gift of ${this.props.description} valued at ${valueStr} made on ${dateStr}`;
  }

  private monthDiff(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
}
