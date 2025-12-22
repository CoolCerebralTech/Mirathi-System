// domain/value-objects/legal/guardian-bond.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';
import { KenyanMoney } from '../financial/kenyan-money.vo';

/**
 * Guardian Bond Value Object (S.72 LSA)
 *
 * LEGAL REQUIREMENT (S.72 Law of Succession Act):
 * "Every person appointed as guardian of the estate of a minor
 * shall give security by bond with sufficient sureties"
 *
 * PURPOSE:
 * - Protects minor's property from guardian misconduct
 * - Ensures guardian can be held financially accountable
 * - Required before guardian can manage minor's property
 *
 * KENYAN BOND PROVIDERS:
 * - Insurance companies (e.g., Jubilee, CIC, APA)
 * - Banks (guarantee bonds)
 * - Individual sureties (less common now)
 */

interface GuardianBondProps {
  provider: string; // Insurance company or bank
  policyNumber: string; // Unique policy/guarantee number
  amount: KenyanMoney; // Bond amount in KES
  issuedDate: Date; // When bond was issued
  expiryDate: Date; // When bond expires
  suretyDetails?: string; // Additional surety information
  courtApprovedAmount?: KenyanMoney; // If court specified amount
}

export class GuardianBond extends ValueObject<GuardianBondProps> {
  private constructor(props: GuardianBondProps) {
    super(props);
  }

  public static create(props: GuardianBondProps): GuardianBond {
    return new GuardianBond(props);
  }

  protected validate(): void {
    // Provider is required
    if (!this.props.provider || this.props.provider.trim().length === 0) {
      throw new ValueObjectValidationError('Bond provider is required', 'provider');
    }

    // Policy number is required
    if (!this.props.policyNumber || this.props.policyNumber.trim().length === 0) {
      throw new ValueObjectValidationError('Bond policy number is required', 'policyNumber');
    }

    // Amount must be positive
    if (this.props.amount.isZero() || this.props.amount.isNegative()) {
      throw new ValueObjectValidationError('Bond amount must be positive', 'amount');
    }

    // Expiry date must be after issue date
    if (this.props.expiryDate <= this.props.issuedDate) {
      throw new ValueObjectValidationError(
        'Bond expiry date must be after issue date',
        'expiryDate',
      );
    }

    // Issue date shouldn't be in the future
    if (this.props.issuedDate > new Date()) {
      throw new ValueObjectValidationError('Bond issue date cannot be in the future', 'issuedDate');
    }

    // Bond duration validation (warn if < 1 year or > 10 years)
    const durationYears = this.getDurationYears();
    if (durationYears < 1) {
      console.warn('Bond duration is less than 1 year - unusually short');
    }
    if (durationYears > 10) {
      console.warn('Bond duration exceeds 10 years - unusually long');
    }

    // Amount validation (warn if very low or very high)
    const amountKES = this.props.amount.getAmount();
    if (amountKES < 10000) {
      console.warn(`Bond amount ${amountKES} KES seems very low for property management`);
    }
    if (amountKES > 100000000) {
      // 100M KES
      console.warn(`Bond amount ${amountKES} KES is unusually high`);
    }
  }

  // === GETTERS ===

  get provider(): string {
    return this.props.provider;
  }

  get policyNumber(): string {
    return this.props.policyNumber;
  }

  get amount(): KenyanMoney {
    return this.props.amount;
  }

  get issuedDate(): Date {
    return this.props.issuedDate;
  }

  get expiryDate(): Date {
    return this.props.expiryDate;
  }

  get suretyDetails(): string | undefined {
    return this.props.suretyDetails;
  }

  // === BUSINESS LOGIC ===

  /**
   * Check if bond has expired
   */
  public isExpired(): boolean {
    return new Date() > this.props.expiryDate;
  }

  /**
   * Check if bond is about to expire (within specified days)
   */
  public isExpiringSoon(withinDays: number = 60): boolean {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + withinDays);
    return this.props.expiryDate <= warningDate;
  }

  /**
   * Get days until expiry (negative if expired)
   */
  public getDaysUntilExpiry(): number {
    const now = new Date();
    const diffMs = this.props.expiryDate.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get bond duration in years
   */
  public getDurationYears(): number {
    const diffMs = this.props.expiryDate.getTime() - this.props.issuedDate.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);
    return days / 365.25;
  }

  /**
   * Get bond age in months
   */
  public getAgeInMonths(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.props.issuedDate.getTime();
    const days = diffMs / (1000 * 60 * 60 * 24);
    return Math.floor(days / 30);
  }

  /**
   * Check if bond amount meets court-approved requirement
   */
  public meetsCourtRequirement(): boolean {
    if (!this.props.courtApprovedAmount) return true;
    return this.props.amount.isGreaterThanOrEqual(this.props.courtApprovedAmount);
  }

  /**
   * Renew bond with new expiry date
   * Returns new GuardianBond instance (immutable)
   */
  public renew(newExpiryDate: Date, newPolicyNumber?: string): GuardianBond {
    if (newExpiryDate <= new Date()) {
      throw new ValueObjectValidationError('New expiry date must be in the future', 'expiryDate');
    }

    return GuardianBond.create({
      provider: this.props.provider,
      policyNumber: newPolicyNumber ?? this.props.policyNumber,
      amount: this.props.amount,
      issuedDate: new Date(), // New issue date
      expiryDate: newExpiryDate,
      suretyDetails: this.props.suretyDetails,
      courtApprovedAmount: this.props.courtApprovedAmount,
    });
  }

  /**
   * Increase bond amount (returns new instance)
   */
  public increaseAmount(newAmount: KenyanMoney): GuardianBond {
    if (newAmount.isLessThanOrEqual(this.props.amount)) {
      throw new ValueObjectValidationError(
        'New amount must be greater than current amount',
        'amount',
      );
    }

    return GuardianBond.create({
      ...this.props,
      amount: newAmount,
    });
  }

  // === SERIALIZATION ===

  public toJSON(): Record<string, any> {
    return {
      provider: this.props.provider,
      policyNumber: this.props.policyNumber,
      amount: this.props.amount.toJSON(),
      issuedDate: this.props.issuedDate.toISOString(),
      expiryDate: this.props.expiryDate.toISOString(),
      suretyDetails: this.props.suretyDetails,
      courtApprovedAmount: this.props.courtApprovedAmount?.toJSON(),

      // Computed properties
      isExpired: this.isExpired(),
      isExpiringSoon: this.isExpiringSoon(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      durationYears: this.getDurationYears(),
      ageInMonths: this.getAgeInMonths(),
      meetsCourtRequirement: this.meetsCourtRequirement(),
    };
  }

  public toString(): string {
    return `${this.props.provider} Bond ${this.props.policyNumber} (${this.props.amount.toString()})`;
  }
}
