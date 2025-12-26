// src/estate-service/src/domain/entities/will-witness.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WillWitnessException } from '../exceptions/will-witness.exception';
import { ExecutionDate } from '../value-objects/execution-date.vo';
import { WitnessEligibility } from '../value-objects/witness-eligibility.vo';

/**
 * Witness Type Enum
 */
export type WitnessType =
  | 'REGISTERED_USER' // System user
  | 'EXTERNAL_INDIVIDUAL' // Non-user
  | 'PROFESSIONAL_WITNESS' // Lawyer, notary
  | 'COURT_OFFICER' // Court registrar, etc.
  | 'NOTARY_PUBLIC'; // Certified notary

/**
 * Signature Type Enum
 */
export type SignatureType =
  | 'DIGITAL_SIGNATURE'
  | 'WET_SIGNATURE'
  | 'E_SIGNATURE'
  | 'BIOMETRIC_SIGNATURE'
  | 'WITNESS_MARK'; // For illiterate witnesses

/**
 * Verification Method Enum
 */
export type VerificationMethod =
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'BIRTH_CERTIFICATE'
  | 'ALIEN_CARD'
  | 'MILITARY_ID'
  | 'OTHER';

/**
 * WillWitness Properties Interface
 */
export interface WillWitnessProps {
  willId: string; // Reference to parent Will aggregate

  // Witness Identity
  witnessIdentity: {
    type: WitnessType;
    userId?: string; // For REGISTERED_USER
    externalDetails?: {
      fullName: string;
      nationalId?: string;
      kraPin?: string;
      passportNumber?: string;
      dateOfBirth?: Date;
      occupation?: string;
      relationshipToTestator?: string;
    };
  };

  // Witness Status
  status: 'PENDING' | 'SIGNED' | 'VERIFIED' | 'REJECTED';

  // Eligibility & Validation
  eligibility: WitnessEligibility;
  verificationMethod?: VerificationMethod;
  verificationDocumentId?: string;

  // Signature Details
  signatureType?: SignatureType;
  signedAt?: Date;
  signatureLocation?: string;

  // Execution Context
  executionDate?: ExecutionDate;
  presenceType: 'PHYSICAL' | 'REMOTE' | 'MARKED' | 'ACKNOWLEDGED';

  // Contact Information
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Legal Declarations
  declarations: {
    isNotBeneficiary: boolean;
    isNotSpouseOfBeneficiary: boolean;
    isOfSoundMind: boolean;
    understandsDocument: boolean;
    isActingVoluntarily: boolean;
    dateAcknowledged?: Date;
  };

  // Notes & Evidence
  notes?: string;
  evidenceIds: string[]; // Document IDs for verification evidence

  // Audit Trail
  invitedAt?: Date;
  remindedAt?: Date[];
  lastContactAttempt?: Date;
}

/**
 * WillWitness Entity
 *
 * Represents a witness to the execution of a will in Kenya
 *
 * Legal Context (S.11 LSA):
 * - Must be at least 2 witnesses
 * - Witness cannot be beneficiary or spouse of beneficiary (S.11(2))
 * - Witness must be competent adult of sound mind
 * - Witness must understand they're witnessing a will
 * - Witness must sign in presence of testator and each other
 *
 * IMPORTANT: Witness validity is critical for will enforceability.
 */
export class WillWitness extends Entity<WillWitnessProps> {
  private constructor(props: WillWitnessProps, id?: UniqueEntityID) {
    super(id, props);
  }

  /**
   * Factory method to create a new WillWitness
   */
  public static create(props: WillWitnessProps, id?: UniqueEntityID): WillWitness {
    const witness = new WillWitness(props, id);
    witness.validate();

    // Apply domain event for witness creation
    witness.addDomainEvent({
      eventType: 'WitnessAdded',
      aggregateId: props.willId,
      eventData: {
        witnessId: id?.toString(),
        witnessName: witness.getDisplayName(),
        witnessType: props.witnessIdentity.type,
        status: props.status,
      },
    });

    return witness;
  }

  /**
   * Validate WillWitness invariants
   *
   * Ensures:
   * - Valid witness identity
   * - Proper eligibility checks
   * - Legal compliance with S.11 LSA
   * - Valid status transitions
   */
  public validate(): void {
    // Witness identity validation
    this.validateIdentity();

    // Eligibility validation
    this.props.eligibility.validate();

    // Status validation
    this.validateStatus();

    // Declarations validation
    this.validateDeclarations();

    // Signature validation (if signed)
    if (this.props.signedAt) {
      this.validateSignature();
    }

    // Execution date validation (if present)
    if (this.props.executionDate) {
      this.props.executionDate.validate();
    }

    // Check for legal disqualifications
    this.checkLegalDisqualifications();
  }

  /**
   * Validate witness identity based on type
   */
  private validateIdentity(): void {
    const { type, userId, externalDetails } = this.props.witnessIdentity;

    switch (type) {
      case 'REGISTERED_USER':
        if (!userId) {
          throw new WillWitnessException(
            'Registered user witness must have userId',
            'witnessIdentity.userId',
          );
        }
        break;

      case 'EXTERNAL_INDIVIDUAL':
      case 'PROFESSIONAL_WITNESS':
      case 'COURT_OFFICER':
      case 'NOTARY_PUBLIC':
        if (!externalDetails?.fullName) {
          throw new WillWitnessException(
            'External witness must have full name',
            'witnessIdentity.externalDetails.fullName',
          );
        }

        // Validate national ID if provided
        if (externalDetails.nationalId) {
          this.validateKenyanNationalId(externalDetails.nationalId);
        }

        // Validate KRA PIN if provided
        if (externalDetails.kraPin) {
          this.validateKraPin(externalDetails.kraPin);
        }

        // Validate date of birth if provided
        if (externalDetails.dateOfBirth && externalDetails.dateOfBirth > new Date()) {
          throw new WillWitnessException(
            'Date of birth cannot be in the future',
            'witnessIdentity.externalDetails.dateOfBirth',
          );
        }
        break;

      default:
        throw new WillWitnessException(`Invalid witness type: ${type}`, 'witnessIdentity.type');
    }
  }

  private validateKenyanNationalId(id: string): void {
    const idPattern = /^[1-3]\d{7}$/;
    if (!idPattern.test(id)) {
      throw new WillWitnessException(
        'Invalid Kenyan National ID format',
        'witnessIdentity.externalDetails.nationalId',
      );
    }
  }

  private validateKraPin(pin: string): void {
    const pinPattern = /^[A-Z]\d{10}$/;
    if (!pinPattern.test(pin)) {
      throw new WillWitnessException(
        'Invalid KRA PIN format',
        'witnessIdentity.externalDetails.kraPin',
      );
    }
  }

  private validateStatus(): void {
    const validStatuses = ['PENDING', 'SIGNED', 'VERIFIED', 'REJECTED'];

    if (!validStatuses.includes(this.props.status)) {
      throw new WillWitnessException(`Invalid status: ${this.props.status}`, 'status');
    }

    // Check signature consistency
    if (this.props.status === 'SIGNED' && !this.props.signedAt) {
      throw new WillWitnessException('Signed witness must have signature date', 'signedAt');
    }

    if (this.props.status === 'VERIFIED' && !this.props.verificationMethod) {
      throw new WillWitnessException(
        'Verified witness must have verification method',
        'verificationMethod',
      );
    }
  }

  private validateDeclarations(): void {
    const { declarations } = this.props;

    // All declarations must be true for valid witness
    if (!declarations.isNotBeneficiary) {
      throw new WillWitnessException(
        'Witness cannot be a beneficiary (S.11(2) LSA)',
        'declarations.isNotBeneficiary',
      );
    }

    if (!declarations.isNotSpouseOfBeneficiary) {
      throw new WillWitnessException(
        'Witness cannot be spouse of beneficiary (S.11(2) LSA)',
        'declarations.isNotSpouseOfBeneficiary',
      );
    }

    if (!declarations.isOfSoundMind) {
      throw new WillWitnessException('Witness must be of sound mind', 'declarations.isOfSoundMind');
    }

    if (!declarations.understandsDocument) {
      throw new WillWitnessException(
        'Witness must understand they are witnessing a will',
        'declarations.understandsDocument',
      );
    }

    if (!declarations.isActingVoluntarily) {
      throw new WillWitnessException(
        'Witness must act voluntarily',
        'declarations.isActingVoluntarily',
      );
    }

    // Declaration date should be before or equal to signing date
    if (declarations.dateAcknowledged && this.props.signedAt) {
      if (declarations.dateAcknowledged > this.props.signedAt) {
        throw new WillWitnessException(
          'Declaration date cannot be after signing date',
          'declarations.dateAcknowledged',
        );
      }
    }
  }

  private validateSignature(): void {
    if (!this.props.signedAt) {
      throw new WillWitnessException('Signature requires date', 'signedAt');
    }

    if (this.props.signedAt > new Date()) {
      throw new WillWitnessException('Signature date cannot be in the future', 'signedAt');
    }

    if (!this.props.signatureType) {
      throw new WillWitnessException('Signature requires type', 'signatureType');
    }

    const validSignatureTypes: SignatureType[] = [
      'DIGITAL_SIGNATURE',
      'WET_SIGNATURE',
      'E_SIGNATURE',
      'BIOMETRIC_SIGNATURE',
      'WITNESS_MARK',
    ];

    if (!validSignatureTypes.includes(this.props.signatureType)) {
      throw new WillWitnessException(
        `Invalid signature type: ${this.props.signatureType}`,
        'signatureType',
      );
    }

    // Special validation for WITNESS_MARK type
    if (this.props.signatureType === 'WITNESS_MARK') {
      if (!this.props.notes || !this.props.notes.includes('illiterate')) {
        throw new WillWitnessException('Witness mark requires notes about illiteracy', 'notes');
      }
    }
  }

  private checkLegalDisqualifications(): void {
    const disqualificationReason = this.props.eligibility.getDisqualificationReason();

    if (disqualificationReason) {
      throw new WillWitnessException(
        `Witness legally disqualified: ${disqualificationReason}`,
        'eligibility',
      );
    }
  }

  /**
   * Record witness signature
   */
  public recordSignature(
    signatureType: SignatureType,
    signatureLocation?: string,
    notes?: string,
  ): void {
    if (this.props.status === 'REJECTED') {
      throw new WillWitnessException('Cannot sign rejected witness', 'status');
    }

    if (this.props.status === 'SIGNED' || this.props.status === 'VERIFIED') {
      throw new WillWitnessException('Witness already signed', 'status');
    }

    if (!this.props.eligibility.props.isEligible) {
      throw new WillWitnessException('Ineligible witness cannot sign', 'eligibility');
    }

    const signedAt = new Date();

    this.updateState({
      status: 'SIGNED',
      signatureType,
      signedAt,
      signatureLocation,
      notes: notes || this.props.notes,
    });

    // Add domain event for signature
    this.addDomainEvent({
      eventType: 'WitnessSigned',
      aggregateId: this.props.willId,
      eventData: {
        witnessId: this.id.toString(),
        witnessName: this.getDisplayName(),
        signatureType,
        signedAt: signedAt.toISOString(),
        signatureLocation,
      },
    });
  }

  /**
   * Verify witness identity
   */
  public verifyIdentity(method: VerificationMethod, documentId: string, notes?: string): void {
    if (this.props.status !== 'SIGNED') {
      throw new WillWitnessException('Only signed witnesses can be verified', 'status');
    }

    if (this.props.status === 'VERIFIED') {
      throw new WillWitnessException('Witness already verified', 'status');
    }

    this.updateState({
      status: 'VERIFIED',
      verificationMethod: method,
      verificationDocumentId: documentId,
      notes: notes || this.props.notes,
    });

    // Add domain event for verification
    this.addDomainEvent({
      eventType: 'WitnessVerified',
      aggregateId: this.props.willId,
      eventData: {
        witnessId: this.id.toString(),
        witnessName: this.getDisplayName(),
        verificationMethod: method,
        documentId,
      },
    });
  }

  /**
   * Reject witness (e.g., if ineligible discovered later)
   */
  public rejectWitness(reason: string): void {
    if (this.props.status === 'SIGNED' || this.props.status === 'VERIFIED') {
      throw new WillWitnessException('Cannot reject signed or verified witness', 'status');
    }

    this.updateState({
      status: 'REJECTED',
      notes: `${this.props.notes || ''}\nRejection: ${reason}`,
    });

    // Add domain event for rejection
    this.addDomainEvent({
      eventType: 'WitnessRejected',
      aggregateId: this.props.willId,
      eventData: {
        witnessId: this.id.toString(),
        witnessName: this.getDisplayName(),
        reason,
      },
    });
  }

  /**
   * Update contact information
   */
  public updateContactInfo(contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  }): void {
    // Validate email if provided
    if (contactInfo.email) {
      this.validateEmail(contactInfo.email);
    }

    // Validate phone if provided
    if (contactInfo.phone) {
      this.validatePhone(contactInfo.phone);
    }

    this.updateState({
      contactInfo: {
        ...this.props.contactInfo,
        ...contactInfo,
      },
    });
  }

  private validateEmail(email: string): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new WillWitnessException('Invalid email format', 'contactInfo.email');
    }
  }

  private validatePhone(phone: string): void {
    const phonePattern = /^(?:\+254|0)[17]\d{8}$/;
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      throw new WillWitnessException('Invalid Kenyan phone number format', 'contactInfo.phone');
    }
  }

  /**
   * Record witness invitation
   */
  public recordInvitation(): void {
    if (this.props.invitedAt) {
      throw new WillWitnessException('Witness already invited', 'invitedAt');
    }

    this.updateState({
      invitedAt: new Date(),
    });
  }

  /**
   * Record reminder sent to witness
   */
  public recordReminder(): void {
    const remindedAt = this.props.remindedAt || [];

    this.updateState({
      remindedAt: [...remindedAt, new Date()],
      lastContactAttempt: new Date(),
    });
  }

  /**
   * Get display name based on witness type
   */
  public getDisplayName(): string {
    const { type, externalDetails } = this.props.witnessIdentity;

    switch (type) {
      case 'REGISTERED_USER':
        return `User ${this.props.witnessIdentity.userId?.substring(0, 8)}...`;
      case 'EXTERNAL_INDIVIDUAL':
      case 'PROFESSIONAL_WITNESS':
      case 'COURT_OFFICER':
      case 'NOTARY_PUBLIC':
        return externalDetails?.fullName || 'Unknown Witness';
      default:
        return 'Unknown Witness';
    }
  }

  /**
   * Get witness eligibility status
   */
  public getEligibilityStatus(): {
    isEligible: boolean;
    reasons: string[];
    warnings: string[];
  } {
    const eligibility = this.props.eligibility.toJSON();

    return {
      isEligible: eligibility.isEligible,
      reasons: eligibility.reasons.filter(
        (r) => !r.includes('discouraged') && !r.includes('may affect'),
      ),
      warnings: eligibility.reasons.filter(
        (r) => r.includes('discouraged') || r.includes('may affect'),
      ),
    };
  }

  /**
   * Check if witness meets S.11 requirements
   */
  public meetsS11Requirements(): {
    meetsRequirements: boolean;
    missingRequirements: string[];
    notes: string[];
  } {
    const missingRequirements: string[] = [];
    const notes: string[] = [];

    // Age requirement
    if (this.props.eligibility.props.age < 18) {
      missingRequirements.push('Witness must be at least 18 years old');
    }

    // Competence requirement
    if (!this.props.declarations.isOfSoundMind) {
      missingRequirements.push('Witness must be of sound mind');
    }

    // Understanding requirement
    if (!this.props.declarations.understandsDocument) {
      missingRequirements.push('Witness must understand they are witnessing a will');
    }

    // Non-beneficiary requirement
    if (!this.props.declarations.isNotBeneficiary) {
      missingRequirements.push('Witness cannot be a beneficiary (S.11(2))');
    }

    // Spouse of beneficiary requirement
    if (!this.props.declarations.isNotSpouseOfBeneficiary) {
      missingRequirements.push('Witness cannot be spouse of beneficiary (S.11(2))');
    }

    // Voluntariness requirement
    if (!this.props.declarations.isActingVoluntarily) {
      missingRequirements.push('Witness must act voluntarily');
    }

    // Signature requirement (for signed witnesses)
    if (this.props.status === 'SIGNED' && !this.props.signatureType) {
      missingRequirements.push('Signed witness must have signature type');
    }

    // Verification requirement (optional but recommended)
    if (this.props.status === 'SIGNED' && !this.props.verificationMethod) {
      notes.push('Consider verifying witness identity for stronger evidence');
    }

    const meetsRequirements = missingRequirements.length === 0;

    return { meetsRequirements, missingRequirements, notes };
  }

  /**
   * Get witness type description
   */
  public getWitnessTypeDescription(): string {
    const typeMap: Record<WitnessType, string> = {
      REGISTERED_USER: 'Registered System User',
      EXTERNAL_INDIVIDUAL: 'External Individual',
      PROFESSIONAL_WITNESS: 'Professional Witness (Lawyer/Notary)',
      COURT_OFFICER: 'Court Officer',
      NOTARY_PUBLIC: 'Notary Public',
    };

    return typeMap[this.props.witnessIdentity.type] || 'Unknown Type';
  }

  /**
   * Check if witness can be used for will validation
   * (At least 2 verified witnesses are typically needed)
   */
  public isValidForWillExecution(): boolean {
    // Must be at least signed
    if (this.props.status !== 'SIGNED' && this.props.status !== 'VERIFIED') {
      return false;
    }

    // Must meet S.11 requirements
    const s11Check = this.meetsS11Requirements();
    if (!s11Check.meetsRequirements) {
      return false;
    }

    // Must be eligible
    if (!this.props.eligibility.props.isEligible) {
      return false;
    }

    // Must have signed (if status is SIGNED or VERIFIED)
    if (!this.props.signedAt) {
      return false;
    }

    return true;
  }

  // Getters
  get willId(): string {
    return this.props.willId;
  }

  get witnessIdentity(): WillWitnessProps['witnessIdentity'] {
    return { ...this.props.witnessIdentity };
  }

  get status(): string {
    return this.props.status;
  }

  get eligibility(): WitnessEligibility {
    return this.props.eligibility;
  }

  get verificationMethod(): VerificationMethod | undefined {
    return this.props.verificationMethod;
  }

  get verificationDocumentId(): string | undefined {
    return this.props.verificationDocumentId;
  }

  get signatureType(): SignatureType | undefined {
    return this.props.signatureType;
  }

  get signedAt(): Date | undefined {
    return this.props.signedAt;
  }

  get signatureLocation(): string | undefined {
    return this.props.signatureLocation;
  }

  get executionDate(): ExecutionDate | undefined {
    return this.props.executionDate;
  }

  get presenceType(): string {
    return this.props.presenceType;
  }

  get contactInfo(): WillWitnessProps['contactInfo'] | undefined {
    return this.props.contactInfo ? { ...this.props.contactInfo } : undefined;
  }

  get declarations(): WillWitnessProps['declarations'] {
    return { ...this.props.declarations };
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get evidenceIds(): string[] {
    return [...this.props.evidenceIds];
  }

  get invitedAt(): Date | undefined {
    return this.props.invitedAt;
  }

  get remindedAt(): Date[] | undefined {
    return this.props.remindedAt ? [...this.props.remindedAt] : undefined;
  }

  get lastContactAttempt(): Date | undefined {
    return this.props.lastContactAttempt;
  }
}
