import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/entity';
import { Result, combine } from '../../../core/result';
import { Address } from '../../../shared/address.vo';
import { Email } from '../../../shared/email.vo';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { PhoneNumber } from '../../../shared/phone-number.vo';


export interface WillWitnessProps {
  // Core Identity
  witnessType:
    | 'REGISTERED_USER'
    | 'EXTERNAL_INDIVIDUAL'
    | 'PROFESSIONAL_WITNESS'
    | 'COURT_OFFICER'
    | 'NOTARY_PUBLIC';

  // Identity Reference (polymorphic)
  userId?: string; // For registered users
  externalId?: string; // For external individuals

  // Personal Information
  fullName: string;
  nationalId?: KenyanId;
  kraPin?: string;

  // Contact Information
  email?: Email;
  phone?: PhoneNumber;
  address?: Address;

  // Professional Details
  isProfessionalWitness: boolean;
  professionalCapacity?: string;
  professionalLicenseNumber?: string;

  // Relationship Context
  relationshipToTestator: string;
  relationshipDuration?: string;
  knowsTestatorWell: boolean;

  // Kenyan Legal Requirements (Section 11 LSA)
  age: number;
  isBeneficiary: boolean;
  isExecutor: boolean;
  hasConflictOfInterest: boolean;
  conflictDetails?: string;

  // Witnessing Process
  invitationSentAt?: Date;
  invitationMethod?: 'EMAIL' | 'SMS' | 'PHONE' | 'IN_PERSON';
  responseReceivedAt?: Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'SIGNED' | 'VERIFIED' | 'REJECTED';

  // Signature Details
  signature?: WitnessSignature;
  signedAt?: Date;
  signatureLocation?: string;
  witnessingMethod?: 'IN_PERSON' | 'VIDEO_CONFERENCE';

  // Verification
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod?: WitnessVerificationMethod;
  verificationNotes?: string;

  // Eligibility
  eligibilityStatus: WitnessEligibilityStatus;
  eligibilityVerifiedAt?: Date;
  ineligibilityReason?: string;

  // Legal Compliance Flags
  understandsObligation: boolean;
  obligationAcknowledgedAt?: Date;
  hasBeenSwornIn: boolean;
  swornInAt?: Date;

  // Communication Tracking
  remindersSent: number;
  lastReminderSentAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class WillWitness extends Entity<WillWitnessProps> {
  get id(): UniqueEntityID {
    return this._id;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get age(): number {
    return this.props.age;
  }
  get isBeneficiary(): boolean {
    return this.props.isBeneficiary;
  }
  get isExecutor(): boolean {
    return this.props.isExecutor;
  }
  get status(): string {
    return this.props.status;
  }
  get eligibilityStatus(): WitnessEligibilityStatus {
    return this.props.eligibilityStatus;
  }
  get signature(): WitnessSignature | undefined {
    return this.props.signature;
  }
  get isProfessionalWitness(): boolean {
    return this.props.isProfessionalWitness;
  }

  private constructor(props: WillWitnessProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /**
   * Factory method to create a new WillWitness
   */
  public static create(props: Partial<WillWitnessProps>, id?: UniqueEntityID): Result<WillWitness> {
    const defaultProps: WillWitnessProps = {
      witnessType: 'EXTERNAL_INDIVIDUAL',
      fullName: '',
      relationshipToTestator: '',
      knowsTestatorWell: false,
      age: 0,
      isBeneficiary: false,
      isExecutor: false,
      hasConflictOfInterest: false,
      isProfessionalWitness: false,
      understandsObligation: false,
      hasBeenSwornIn: false,
      remindersSent: 0,
      status: 'PENDING',
      eligibilityStatus: WitnessEligibilityStatus.PENDING_ELIGIBILITY_CHECK,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mergedProps = { ...defaultProps, ...props };

    // Validate basic requirements
    const validationResult = this.validate(mergedProps);
    if (validationResult.isFailure) {
      return Result.fail<WillWitness>(validationResult.getErrorValue());
    }

    return Result.ok<WillWitness>(new WillWitness(mergedProps, id));
  }

  /**
   * Validate witness properties
   */
  private static validate(props: WillWitnessProps): Result<void> {
    const errors: string[] = [];

    if (!props.fullName || props.fullName.trim().length < 3) {
      errors.push('Witness full name must be at least 3 characters');
    }

    if (props.age < 18) {
      errors.push('Witness must be at least 18 years old (Section 11(3) LSA)');
    }

    if (!props.relationshipToTestator) {
      errors.push('Relationship to testator is required');
    }

    // Check for disqualifying conditions under Kenyan law
    if (props.isBeneficiary) {
      errors.push('A beneficiary cannot witness a will (Section 11(4)(a) LSA)');
    }

    if (props.isExecutor) {
      errors.push('An executor cannot witness a will (Section 11(4)(b) LSA)');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Check if witness is eligible under Kenyan law
   */
  public checkEligibility(): WitnessEligibilityStatus {
    if (this.props.age < 18) {
      this.props.eligibilityStatus = WitnessEligibilityStatus.INELIGIBLE_MINOR;
      this.props.ineligibilityReason = 'Witness is under 18 years old';
      return this.props.eligibilityStatus;
    }

    if (this.props.isBeneficiary) {
      this.props.eligibilityStatus = WitnessEligibilityStatus.INELIGIBLE_BENEFICIARY;
      this.props.ineligibilityReason = 'Witness is a beneficiary of the will';
      return this.props.eligibilityStatus;
    }

    if (this.props.isExecutor) {
      this.props.eligibilityStatus = WitnessEligibilityStatus.INELIGIBLE_EXECUTOR;
      this.props.ineligibilityReason = 'Witness is an executor of the will';
      return this.props.eligibilityStatus;
    }

    if (this.props.hasConflictOfInterest) {
      this.props.eligibilityStatus = WitnessEligibilityStatus.INELIGIBLE_RELATIONSHIP;
      this.props.ineligibilityReason = 'Witness has a conflict of interest';
      return this.props.eligibilityStatus;
    }

    this.props.eligibilityStatus = WitnessEligibilityStatus.ELIGIBLE;
    this.props.eligibilityVerifiedAt = new Date();
    this.props.updatedAt = new Date();

    return this.props.eligibilityStatus;
  }

  /**
   * Send invitation to witness
   */
  public sendInvitation(method: 'EMAIL' | 'SMS' | 'PHONE' | 'IN_PERSON'): Result<void> {
    if (this.props.status !== 'PENDING') {
      return Result.fail(`Cannot send invitation to witness with status: ${this.props.status}`);
    }

    this.props.invitationMethod = method;
    this.props.invitationSentAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Accept invitation to witness
   */
  public acceptInvitation(): Result<void> {
    if (this.props.status !== 'PENDING' || !this.props.invitationSentAt) {
      return Result.fail('Cannot accept invitation that has not been sent');
    }

    // Re-check eligibility before accepting
    if (this.checkEligibility() !== WitnessEligibilityStatus.ELIGIBLE) {
      return Result.fail('Witness is not eligible to witness will');
    }

    this.props.status = 'ACCEPTED';
    this.props.responseReceivedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Decline invitation to witness
   */
  public declineInvitation(reason?: string): Result<void> {
    if (this.props.status !== 'PENDING' || !this.props.invitationSentAt) {
      return Result.fail('Cannot decline invitation that has not been sent');
    }

    this.props.status = 'DECLINED';
    this.props.responseReceivedAt = new Date();
    if (reason) {
      this.props.ineligibilityReason = reason;
    }
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add signature to witness
   */
  public addSignature(signature: WitnessSignature): Result<void> {
    if (this.props.status !== 'ACCEPTED') {
      return Result.fail(`Cannot add signature to witness with status: ${this.props.status}`);
    }

    if (this.props.eligibilityStatus !== WitnessEligibilityStatus.ELIGIBLE) {
      return Result.fail('Witness must be eligible before signing');
    }

    if (!this.props.understandsObligation) {
      return Result.fail('Witness must understand their obligation before signing');
    }

    this.props.signature = signature;
    this.props.signedAt = new Date();
    this.props.status = 'SIGNED';
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Verify witness identity and signature
   */
  public verifyWitness(
    verifiedBy: string,
    method: WitnessVerificationMethod,
    notes?: string,
  ): Result<void> {
    if (this.props.status !== 'SIGNED') {
      return Result.fail(`Cannot verify witness with status: ${this.props.status}`);
    }

    if (!this.props.signature) {
      return Result.fail('Cannot verify witness without signature');
    }

    // Verify the signature's identity
    const signatureVerificationResult = this.props.signature.verifyIdentity(verifiedBy, method);
    if (signatureVerificationResult.isFailure) {
      return Result.fail(signatureVerificationResult.getErrorValue());
    }

    this.props.verifiedAt = new Date();
    this.props.verifiedBy = verifiedBy;
    this.props.verificationMethod = method;
    this.props.verificationNotes = notes;
    this.props.status = 'VERIFIED';
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Acknowledge legal obligation
   */
  public acknowledgeObligation(): Result<void> {
    if (this.props.understandsObligation) {
      return Result.fail('Obligation already acknowledged');
    }

    this.props.understandsObligation = true;
    this.props.obligationAcknowledgedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Swear in witness (for court proceedings)
   */
  public swearIn(): Result<void> {
    if (this.props.hasBeenSwornIn) {
      return Result.fail('Witness already sworn in');
    }

    this.props.hasBeenSwornIn = true;
    this.props.swornInAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Send reminder
   */
  public sendReminder(): void {
    this.props.remindersSent += 1;
    this.props.lastReminderSentAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if witness is legally valid for Kenyan probate
   */
  public isValidForProbate(): boolean {
    return (
      this.props.status === 'VERIFIED' &&
      this.props.eligibilityStatus === WitnessEligibilityStatus.ELIGIBLE &&
      this.props.age >= 18 &&
      !this.props.isBeneficiary &&
      !this.props.isExecutor &&
      !!this.props.signature?.isLegallyValid() &&
      this.props.understandsObligation
    );
  }

  /**
   * Get witness summary for court documents
   */
  public getWitnessSummary(): {
    name: string;
    idNumber?: string;
    relationship: string;
    signatureDate?: Date;
    status: string;
  } {
    return {
      name: this.props.fullName,
      idNumber: this.props.nationalId?.value,
      relationship: this.props.relationshipToTestator,
      signatureDate: this.props.signedAt,
      status: this.props.status,
    };
  }

  /**
   * Mark witness as professional
   */
  public markAsProfessional(capacity: string, licenseNumber: string): Result<void> {
    if (this.props.isProfessionalWitness) {
      return Result.fail('Witness is already marked as professional');
    }

    this.props.isProfessionalWitness = true;
    this.props.professionalCapacity = capacity;
    this.props.professionalLicenseNumber = licenseNumber;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Update contact information
   */
  public updateContactInfo(email?: Email, phone?: PhoneNumber, address?: Address): Result<void> {
    if (this.props.status === 'VERIFIED' || this.props.status === 'SIGNED') {
      return Result.fail('Cannot update contact information after verification');
    }

    this.props.email = email;
    this.props.phone = phone;
    this.props.address = address;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Flag conflict of interest
   */
  public flagConflictOfInterest(conflictDetails: string): void {
    this.props.hasConflictOfInterest = true;
    this.props.conflictDetails = conflictDetails;
    this.props.updatedAt = new Date();

    // Re-check eligibility
    this.checkEligibility();
  }

  /**
   * Check if witness has completed all requirements
   */
  public isComplete(): boolean {
    return this.props.status === 'VERIFIED' && this.isValidForProbate();
  }

  /**
   * Calculate days since invitation
   */
  public daysSinceInvitation(): number | null {
    if (!this.props.invitationSentAt) return null;

    const today = new Date();
    const diffTime = today.getTime() - this.props.invitationSentAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
