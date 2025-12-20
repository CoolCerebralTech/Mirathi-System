import { UniqueEntityID } from '../../../base/entity';
import { Entity } from '../../../base/value-object';
import { Result, combine } from '../../../core/result';
import { Address } from '../../../shared/address.vo';
import { Email } from '../../../shared/email.vo';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { Money } from '../../../shared/money.vo';
import { PhoneNumber } from '../../../shared/phone-number.vo';

export enum ExecutorAppointmentType {
  TESTAMENTARY = 'TESTAMENTARY',
  COURT_APPOINTED = 'COURT_APPOINTED',
  ADMINISTRATOR = 'ADMINISTRATOR',
  SPECIAL_EXECUTOR = 'SPECIAL_EXECUTOR',
}

export enum ExecutorStatus {
  NOMINATED = 'NOMINATED',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
  RENUNCIATED = 'RENUNCIATED',
  REMOVED = 'REMOVED',
  COMPLETED = 'COMPLETED',
}

export enum ExecutorEligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE_MINOR = 'INELIGABLE_MINOR',
  INELIGIBLE_BANKRUPT = 'INELIGIBLE_BANKRUPT',
  INELIGIBLE_CRIMINAL_RECORD = 'INELIGIBLE_CRIMINAL_RECORD',
  INELIGIBLE_NON_RESIDENT = 'INELIGIBLE_NON_RESIDENT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum ExecutorCompensationType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE_OF_ESTATE = 'PERCENTAGE_OF_ESTATE',
  HOURLY_RATE = 'HOURLY_RATE',
  STATUTORY_SCALE = 'STATUTORY_SCALE',
  NONE = 'NONE',
}

interface ExecutorBond {
  required: boolean;
  amount?: Money;
  provider?: string;
  policyNumber?: string;
  provided: boolean;
  providedAt?: Date;
  expiryDate?: Date;
}

interface ExecutorCompensation {
  type: ExecutorCompensationType;
  fixedAmount?: Money;
  percentage?: number; // 0-100
  hourlyRate?: Money;
  estimatedHours?: number;
  courtApproved: boolean;
  courtApprovalDate?: Date;
}

interface TestamentaryExecutorProps {
  // Identity (Polymorphic)
  userId?: string; // For registered users
  externalExecutor?: {
    fullName: string;
    nationalId?: KenyanId;
    kraPin?: string;
    email?: Email;
    phone?: PhoneNumber;
    address?: Address;
  };

  // Appointment Details
  appointmentType: ExecutorAppointmentType;
  isPrimary: boolean;
  orderOfPriority: number; // 1 = first choice, 2 = alternate, etc.

  // Professional Details
  isProfessional: boolean;
  professionalQualification?: string;
  practicingCertificateNumber?: string;
  professionalFirm?: string;
  yearsOfExperience?: number;

  // Kenyan Legal Eligibility (Section 83 LSA requirements)
  age: number;
  isResident: boolean;
  isBankrupt: boolean;
  hasCriminalRecord: boolean;
  criminalRecordDetails?: string;
  eligibilityStatus: ExecutorEligibilityStatus;
  eligibilityVerifiedAt?: Date;
  eligibilityVerifiedBy?: string;
  ineligibilityReason?: string;

  // Status and Timeline
  status: ExecutorStatus;
  nominatedAt?: Date;
  appointedAt?: Date; // When court grants probate
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  renunciatedAt?: Date;
  renunciationReason?: string;
  removedAt?: Date;
  removalReason?: string;
  completedAt?: Date;

  // Compensation (Section 83 LSA scale)
  compensation: ExecutorCompensation;

  // Bond Requirements (Kenyan Probate Rules)
  bond: ExecutorBond;

  // Powers and Limitations
  specificDuties?: string[];
  limitations?: string[];
  specialPowers?: string[];
  cannotDealWith?: string[]; // Assets they cannot handle

  // Contact Information
  contactAddress?: Address;
  postalAddress?: string;
  preferredContactMethod?: 'EMAIL' | 'PHONE' | 'SMS' | 'MAIL';

  // Estate Management
  maximumEstateValue?: Money; // Limit for this executor
  canSellAssets: boolean;
  canBorrowMoney: boolean;
  canLitigate: boolean;
  canDistribute: boolean;

  // Relationship to Testator
  relationshipToTestator?: string;
  knowsTestatorWell: boolean;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class TestamentaryExecutor extends Entity<TestamentaryExecutorProps> {
  get id(): UniqueEntityID {
    return this._id;
  }
  get status(): ExecutorStatus {
    return this.props.status;
  }
  get eligibilityStatus(): ExecutorEligibilityStatus {
    return this.props.eligibilityStatus;
  }
  get appointmentType(): ExecutorAppointmentType {
    return this.props.appointmentType;
  }
  get isPrimary(): boolean {
    return this.props.isPrimary;
  }
  get isProfessional(): boolean {
    return this.props.isProfessional;
  }
  get age(): number {
    return this.props.age;
  }
  get isResident(): boolean {
    return this.props.isResident;
  }

  private constructor(props: TestamentaryExecutorProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /**
   * Factory method to create a TestamentaryExecutor
   */
  public static create(
    props: Partial<TestamentaryExecutorProps>,
    id?: UniqueEntityID,
  ): Result<TestamentaryExecutor> {
    const defaultProps: TestamentaryExecutorProps = {
      appointmentType: ExecutorAppointmentType.TESTAMENTARY,
      isPrimary: false,
      orderOfPriority: 1,
      isProfessional: false,
      age: 18,
      isResident: true,
      isBankrupt: false,
      hasCriminalRecord: false,
      eligibilityStatus: ExecutorEligibilityStatus.PENDING_VERIFICATION,
      status: ExecutorStatus.NOMINATED,
      compensation: {
        type: ExecutorCompensationType.STATUTORY_SCALE,
        courtApproved: false,
      },
      bond: {
        required: false,
        provided: false,
      },
      canSellAssets: false,
      canBorrowMoney: false,
      canLitigate: false,
      canDistribute: false,
      knowsTestatorWell: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mergedProps = { ...defaultProps, ...props };

    // Validate executor properties
    const validationResult = this.validate(mergedProps);
    if (validationResult.isFailure) {
      return Result.fail<TestamentaryExecutor>(validationResult.getErrorValue());
    }

    return Result.ok<TestamentaryExecutor>(new TestamentaryExecutor(mergedProps, id));
  }

  /**
   * Validate executor properties against Kenyan law
   */
  private static validate(props: TestamentaryExecutorProps): Result<void> {
    const errors: string[] = [];

    // Must have either userId or external executor details
    if (!props.userId && !props.externalExecutor) {
      errors.push('Executor must have either user ID or external executor details');
    }

    if (props.externalExecutor && !props.externalExecutor.fullName) {
      errors.push('External executor must have a full name');
    }

    // Age requirement (Section 83 LSA implied - must be of sound mind)
    if (props.age < 18) {
      errors.push('Executor must be at least 18 years old');
    }

    // Order of priority validation
    if (props.orderOfPriority < 1) {
      errors.push('Order of priority must be at least 1');
    }

    // Compensation validation
    if (props.compensation.type === ExecutorCompensationType.PERCENTAGE_OF_ESTATE) {
      if (
        !props.compensation.percentage ||
        props.compensation.percentage < 0 ||
        props.compensation.percentage > 100
      ) {
        errors.push('Percentage compensation must be between 0 and 100');
      }
    }

    if (
      props.compensation.type === ExecutorCompensationType.FIXED_AMOUNT &&
      !props.compensation.fixedAmount
    ) {
      errors.push('Fixed amount compensation requires an amount');
    }

    if (
      props.compensation.type === ExecutorCompensationType.HOURLY_RATE &&
      !props.compensation.hourlyRate
    ) {
      errors.push('Hourly rate compensation requires a rate');
    }

    // Bond validation
    if (props.bond.required && !props.bond.amount) {
      errors.push('Bond requires an amount if required');
    }

    if (props.bond.provided && !props.bond.provider) {
      errors.push('Bond provider is required if bond is provided');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Nominate the executor (initial state)
   */
  public nominate(nominatedAt: Date = new Date()): Result<void> {
    if (this.props.status !== ExecutorStatus.NOMINATED) {
      return Result.fail(`Cannot nominate executor with status: ${this.props.status}`);
    }

    this.props.nominatedAt = nominatedAt;
    this.props.status = ExecutorStatus.NOMINATED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Check eligibility under Kenyan law
   */
  public checkEligibility(verifiedBy?: string): ExecutorEligibilityStatus {
    const issues: string[] = [];

    // Age check
    if (this.props.age < 18) {
      issues.push('Executor is under 18 years old');
      this.props.eligibilityStatus = ExecutorEligibilityStatus.INELIGIBLE_MINOR;
    }

    // Residency check (non-resident executors may need special approval)
    if (!this.props.isResident) {
      issues.push('Executor is non-resident');
      this.props.eligibilityStatus = ExecutorEligibilityStatus.INELIGIBLE_NON_RESIDENT;
    }

    // Bankruptcy check
    if (this.props.isBankrupt) {
      issues.push('Executor is bankrupt');
      this.props.eligibilityStatus = ExecutorEligibilityStatus.INELIGIBLE_BANKRUPT;
    }

    // Criminal record check
    if (this.props.hasCriminalRecord && this.isDisqualifyingCriminalRecord()) {
      issues.push('Executor has disqualifying criminal record');
      this.props.eligibilityStatus = ExecutorEligibilityStatus.INELIGIBLE_CRIMINAL_RECORD;
    }

    // If no issues, mark as eligible
    if (issues.length === 0) {
      this.props.eligibilityStatus = ExecutorEligibilityStatus.ELIGIBLE;
      this.props.eligibilityVerifiedAt = new Date();
      if (verifiedBy) {
        this.props.eligibilityVerifiedBy = verifiedBy;
      }
    } else {
      this.props.ineligibilityReason = issues.join('; ');
    }

    this.props.updatedAt = new Date();

    return this.props.eligibilityStatus;
  }

  /**
   * Determine if criminal record disqualifies executor
   */
  private isDisqualifyingCriminalRecord(): boolean {
    // Crimes that disqualify from being an executor under Kenyan law:
    // Fraud, theft, forgery, crimes of dishonesty, etc.
    const disqualifyingCrimes = [
      'FRAUD',
      'THEFT',
      'FORGERY',
      'EMBEZZLEMENT',
      'PERJURY',
      'MONEY_LAUNDERING',
      'CORRUPTION',
    ];

    if (!this.props.criminalRecordDetails) {
      return false;
    }

    return disqualifyingCrimes.some((crime) =>
      this.props.criminalRecordDetails!.toUpperCase().includes(crime),
    );
  }

  /**
   * Accept appointment as executor
   */
  public acceptAppointment(): Result<void> {
    if (this.props.status !== ExecutorStatus.NOMINATED) {
      return Result.fail(`Cannot accept appointment with status: ${this.props.status}`);
    }

    if (this.props.eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE) {
      return Result.fail('Executor must be eligible before accepting appointment');
    }

    this.props.status = ExecutorStatus.ACTIVE;
    this.props.acceptedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Decline appointment as executor
   */
  public declineAppointment(reason: string): Result<void> {
    if (this.props.status !== ExecutorStatus.NOMINATED) {
      return Result.fail(`Cannot decline appointment with status: ${this.props.status}`);
    }

    this.props.status = ExecutorStatus.DECLINED;
    this.props.declinedAt = new Date();
    this.props.declineReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Renounce appointment (formal legal renunciation)
   */
  public renounceAppointment(reason: string): Result<void> {
    if (
      this.props.status !== ExecutorStatus.ACTIVE &&
      this.props.status !== ExecutorStatus.NOMINATED
    ) {
      return Result.fail(`Cannot renounce appointment with status: ${this.props.status}`);
    }

    this.props.status = ExecutorStatus.RENUNCIATED;
    this.props.renunciatedAt = new Date();
    this.props.renunciationReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Remove executor (by court or beneficiaries)
   */
  public removeExecutor(reason: string, removedBy?: string): Result<void> {
    if (this.props.status !== ExecutorStatus.ACTIVE) {
      return Result.fail(`Cannot remove executor with status: ${this.props.status}`);
    }

    this.props.status = ExecutorStatus.REMOVED;
    this.props.removedAt = new Date();
    this.props.removalReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark executor duties as completed
   */
  public completeDuties(): Result<void> {
    if (this.props.status !== ExecutorStatus.ACTIVE) {
      return Result.fail(`Cannot complete duties with status: ${this.props.status}`);
    }

    this.props.status = ExecutorStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Provide bond for executor
   */
  public provideBond(
    provider: string,
    policyNumber: string,
    amount: Money,
    expiryDate: Date,
  ): Result<void> {
    if (!this.props.bond.required) {
      return Result.fail('Bond is not required for this executor');
    }

    if (this.props.bond.provided) {
      return Result.fail('Bond already provided');
    }

    this.props.bond.provided = true;
    this.props.bond.provider = provider;
    this.props.bond.policyNumber = policyNumber;
    this.props.bond.amount = amount;
    this.props.bond.providedAt = new Date();
    this.props.bond.expiryDate = expiryDate;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Set compensation with court approval
   */
  public setCompensation(
    type: ExecutorCompensationType,
    details: {
      fixedAmount?: Money;
      percentage?: number;
      hourlyRate?: Money;
      estimatedHours?: number;
    },
    courtApproved: boolean = false,
  ): Result<void> {
    if (
      this.props.status !== ExecutorStatus.NOMINATED &&
      this.props.status !== ExecutorStatus.ACTIVE
    ) {
      return Result.fail(`Cannot set compensation for executor with status: ${this.props.status}`);
    }

    this.props.compensation.type = type;

    if (details.fixedAmount) {
      this.props.compensation.fixedAmount = details.fixedAmount;
    }

    if (details.percentage !== undefined) {
      if (details.percentage < 0 || details.percentage > 100) {
        return Result.fail('Percentage must be between 0 and 100');
      }
      this.props.compensation.percentage = details.percentage;
    }

    if (details.hourlyRate) {
      this.props.compensation.hourlyRate = details.hourlyRate;
    }

    if (details.estimatedHours !== undefined) {
      this.props.compensation.estimatedHours = details.estimatedHours;
    }

    this.props.compensation.courtApproved = courtApproved;
    if (courtApproved) {
      this.props.compensation.courtApprovalDate = new Date();
    }

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Calculate executor compensation based on estate value
   */
  public calculateCompensation(estateNetValue: Money): Money | null {
    switch (this.props.compensation.type) {
      case ExecutorCompensationType.FIXED_AMOUNT:
        return this.props.compensation.fixedAmount || null;

      case ExecutorCompensationType.PERCENTAGE_OF_ESTATE:
        if (!this.props.compensation.percentage) return null;
        return estateNetValue.multiply(this.props.compensation.percentage / 100);

      case ExecutorCompensationType.HOURLY_RATE:
        if (!this.props.compensation.hourlyRate || !this.props.compensation.estimatedHours) {
          return null;
        }
        return this.props.compensation.hourlyRate.multiply(this.props.compensation.estimatedHours);

      case ExecutorCompensationType.STATUTORY_SCALE:
        // Kenyan statutory scale calculation
        return this.calculateStatutoryScale(estateNetValue);

      case ExecutorCompensationType.NONE:
        return Money.create({ amount: 0, currency: 'KES' }).getValue();

      default:
        return null;
    }
  }

  /**
   * Calculate compensation based on Kenyan statutory scale
   * This follows the Kenyan Probate and Administration Rules
   */
  private calculateStatutoryScale(estateNetValue: Money): Money {
    const amount = estateNetValue.amount;

    if (amount <= 100000) {
      // 4% on first 100,000
      return Money.create({ amount: amount * 0.04, currency: 'KES' }).getValue();
    } else if (amount <= 500000) {
      // 4% on first 100,000 + 3% on next 400,000
      const firstTier = 100000 * 0.04;
      const secondTier = (amount - 100000) * 0.03;
      return Money.create({ amount: firstTier + secondTier, currency: 'KES' }).getValue();
    } else if (amount <= 1000000) {
      // 4% on first 100,000 + 3% on next 400,000 + 2% on next 500,000
      const firstTier = 100000 * 0.04;
      const secondTier = 400000 * 0.03;
      const thirdTier = (amount - 500000) * 0.02;
      return Money.create({
        amount: firstTier + secondTier + thirdTier,
        currency: 'KES',
      }).getValue();
    } else {
      // 4% on first 100,000 + 3% on next 400,000 + 2% on next 500,000 + 1% on remainder
      const firstTier = 100000 * 0.04;
      const secondTier = 400000 * 0.03;
      const thirdTier = 500000 * 0.02;
      const fourthTier = (amount - 1000000) * 0.01;
      return Money.create({
        amount: firstTier + secondTier + thirdTier + fourthTier,
        currency: 'KES',
      }).getValue();
    }
  }

  /**
   * Add specific duty for executor
   */
  public addDuty(duty: string): void {
    if (!this.props.specificDuties) {
      this.props.specificDuties = [];
    }

    if (!this.props.specificDuties.includes(duty)) {
      this.props.specificDuties.push(duty);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Add limitation for executor
   */
  public addLimitation(limitation: string): void {
    if (!this.props.limitations) {
      this.props.limitations = [];
    }

    if (!this.props.limitations.includes(limitation)) {
      this.props.limitations.push(limitation);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Check if executor is currently active and eligible
   */
  public isActiveAndEligible(): boolean {
    return (
      this.props.status === ExecutorStatus.ACTIVE &&
      this.props.eligibilityStatus === ExecutorEligibilityStatus.ELIGIBLE &&
      (!this.props.bond.required || this.props.bond.provided)
    );
  }

  /**
   * Check if bond is expired
   */
  public isBondExpired(): boolean {
    if (!this.props.bond.expiryDate || !this.props.bond.provided) {
      return false;
    }

    return new Date() > this.props.bond.expiryDate;
  }

  /**
   * Get executor summary for court filings
   */
  public getExecutorSummary(): {
    name: string;
    idNumber?: string;
    status: string;
    isProfessional: boolean;
    bondProvided: boolean;
  } {
    const name = this.props.userId
      ? 'Registered User'
      : this.props.externalExecutor?.fullName || 'Unknown';

    const idNumber = this.props.externalExecutor?.nationalId?.value;

    return {
      name,
      idNumber,
      status: this.props.status,
      isProfessional: this.props.isProfessional,
      bondProvided: this.props.bond.provided,
    };
  }

  /**
   * Check if executor can perform specific action
   */
  public canPerformAction(action: string): boolean {
    // Check limitations first
    if (this.props.limitations?.includes(`CANNOT_${action.toUpperCase()}`)) {
      return false;
    }

    // Check specific powers
    switch (action.toUpperCase()) {
      case 'SELL_ASSETS':
        return this.props.canSellAssets;
      case 'BORROW_MONEY':
        return this.props.canBorrowMoney;
      case 'LITIGATE':
        return this.props.canLitigate;
      case 'DISTRIBUTE':
        return this.props.canDistribute;
      default:
        return true;
    }
  }

  /**
   * Update contact information
   */
  public updateContactInfo(
    email?: Email,
    phone?: PhoneNumber,
    address?: Address,
    postalAddress?: string,
  ): Result<void> {
    if (
      this.props.status === ExecutorStatus.COMPLETED ||
      this.props.status === ExecutorStatus.REMOVED
    ) {
      return Result.fail('Cannot update contact information for completed or removed executor');
    }

    if (this.props.externalExecutor) {
      this.props.externalExecutor.email = email;
      this.props.externalExecutor.phone = phone;
      this.props.externalExecutor.address = address;
    }

    this.props.contactAddress = address;
    this.props.postalAddress = postalAddress;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Mark as professional executor
   */
  public markAsProfessional(
    qualification: string,
    certificateNumber: string,
    firm?: string,
    yearsOfExperience?: number,
  ): Result<void> {
    if (this.props.isProfessional) {
      return Result.fail('Executor is already marked as professional');
    }

    this.props.isProfessional = true;
    this.props.professionalQualification = qualification;
    this.props.practicingCertificateNumber = certificateNumber;
    this.props.professionalFirm = firm;
    this.props.yearsOfExperience = yearsOfExperience;
    this.props.updatedAt = new Date();

    // Professional executors typically require bonds
    this.props.bond.required = true;

    return Result.ok();
  }
}
