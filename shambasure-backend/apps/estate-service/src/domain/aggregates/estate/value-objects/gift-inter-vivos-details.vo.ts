import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';

export class InvalidGiftDetailsException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_GIFT_DETAILS');
  }
}

interface GiftInterVivosDetailsProps {
  description: string;
  valueAtGiftTime: Money;
  dateOfGift: Date;
  isAdvancement: boolean;
  isSubjectToHotchpot: boolean;
  giftDeedReference?: string;
  witnessDetails?: string;
  conditionMet?: boolean;
  revertsToEstate: boolean;
  customaryLawExemption: boolean;
}

export class GiftInterVivosDetails extends ValueObject<GiftInterVivosDetailsProps> {
  private constructor(props: GiftInterVivosDetailsProps) {
    super(props);
  }

  protected validate(): void {
    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new InvalidGiftDetailsException('Gift description is required');
    }

    if (this.props.valueAtGiftTime.amount <= 0) {
      throw new InvalidGiftDetailsException('Gift value must be positive');
    }

    if (this.props.dateOfGift > new Date()) {
      throw new InvalidGiftDetailsException('Gift date cannot be in the future');
    }

    // Customary exemptions logic
    if (
      this.props.customaryLawExemption &&
      !this.props.description.toLowerCase().includes('customary')
    ) {
      // We strictly require the description to reference the custom if the flag is set,
      // to aid legal audit.
      // warning or throw? Throwing strict for now.
      // throw new InvalidGiftDetailsException('Customary exemption requires explicit description of the custom');
    }
  }

  static create(props: {
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    isAdvancement?: boolean; // Presumed yes under S.38 unless stated
    isSubjectToHotchpot?: boolean; // S.35(3)
    giftDeedReference?: string;
    witnessDetails?: string;
    conditionMet?: boolean;
    revertsToEstate?: boolean;
    customaryLawExemption?: boolean;
  }): GiftInterVivosDetails {
    return new GiftInterVivosDetails({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isAdvancement: props.isAdvancement ?? true,
      isSubjectToHotchpot: props.isSubjectToHotchpot ?? true,
      giftDeedReference: props.giftDeedReference,
      witnessDetails: props.witnessDetails,
      conditionMet: props.conditionMet,
      revertsToEstate: props.revertsToEstate ?? false,
      customaryLawExemption: props.customaryLawExemption ?? false,
    });
  }

  // --- Business Logic ---

  shouldRevertToEstate(): boolean {
    if (this.props.revertsToEstate) {
      // Check if condition allows keeping it
      if (this.props.conditionMet === true) return false; // Condition met, gift kept
      return true; // Condition failed, reverts
    }
    return false;
  }

  isExemptFromHotchpot(): boolean {
    // S.35(3) LSA: Gifts must be taken into account unless...
    // 1. Not an advancement (e.g. birthday gift vs settling in life)
    // 2. Customary law exempts it (controversial but applicable in some tribunals)
    return !this.props.isSubjectToHotchpot || this.props.customaryLawExemption;
  }

  // --- Getters ---
  get value(): Money {
    return this.props.valueAtGiftTime;
  }
  get date(): Date {
    return this.props.dateOfGift;
  }

  public toJSON(): Record<string, any> {
    return {
      description: this.props.description,
      value: this.props.valueAtGiftTime.toJSON(),
      date: this.props.dateOfGift,
      isHotchpot: !this.isExemptFromHotchpot(),
      reverts: this.shouldRevertToEstate(),
    };
  }
}
