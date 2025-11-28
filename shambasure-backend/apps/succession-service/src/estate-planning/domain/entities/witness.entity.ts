import { AggregateRoot } from '@nestjs/cqrs';
import { WitnessStatus } from '@prisma/client';
import { KenyanId } from '../value-objects/kenyan-id.vo';
import { WitnessAddedEvent } from '../events/witness-added.event';
import { WitnessSignedEvent } from '../events/witness-signed.event';
import { WitnessVerifiedEvent } from '../events/witness-verified.event';
import { WitnessRejectedEvent } from '../events/witness-rejected.event';

/**
 * Physical address information for witness under Kenyan law
 * @interface WitnessAddress
 */
export interface WitnessAddress {
  street?: string;
  city?: string;
  county?: string;
  postalCode?: string;
}

/**
 * Identity information for witness (user or external)
 * @interface WitnessInfo
 */
export interface WitnessInfo {
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  relationship?: string;
  address?: WitnessAddress;
}

/**
 * Event-specific witness information for domain events
 * @interface WitnessEventInfo
 */
export interface WitnessEventInfo {
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  relationship?: string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface WitnessReconstituteProps
 */
export interface WitnessReconstituteProps {
  id: string;
  willId: string;

  // Flattened Identity Fields
  userId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  relationship: string | null;
  address: WitnessAddress | null;

  status: WitnessStatus;
  signedAt: Date | string | null;
  signatureData: string | null;
  verifiedAt: Date | string | null;
  verifiedBy: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Witness Entity representing will witness under Kenyan succession law
 *
 * Core Domain Entity for managing:
 * - User witnesses (registered platform users)
 * - External witnesses (non-registered individuals)
 * - Witness signing and verification process
 * - Kenyan legal compliance for witness eligibility
 * - Digital signature capture and validation
 *
 * @class Witness
 * @extends {AggregateRoot}
 */
export class Witness extends AggregateRoot {
  // Core Witness Properties
  private readonly _id: string;
  private readonly _willId: string;
  private _witnessInfo: WitnessInfo;
  private _status: WitnessStatus;

  // Signing & Verification
  private _signedAt: Date | null;
  private _signatureData: string | null;
  private _verifiedAt: Date | null;
  private _verifiedBy: string | null;

  // Legal Eligibility
  private _isEligible: boolean;
  private _ineligibilityReason: string | null;

  // Audit Trail
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(id: string, willId: string, witnessInfo: WitnessInfo) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Witness ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');

    Witness.validateWitnessInfo(witnessInfo);

    this._id = id;
    this._willId = willId;
    this._witnessInfo = { ...witnessInfo };

    // Initialize default values
    this._status = WitnessStatus.PENDING;
    this._signedAt = null;
    this._signatureData = null;
    this._verifiedAt = null;
    this._verifiedBy = null;
    this._isEligible = true;
    this._ineligibilityReason = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a witness assignment for a registered platform user
   *
   * @static
   * @param {string} id - Unique witness identifier
   * @param {string} willId - Will being witnessed
   * @param {string} userId - Registered user ID of witness
   * @param {string} fullName - Full name of witness
   * @param {string} [relationship] - Relationship to testator
   * @returns {Witness} New witness entity
   */
  static createForUser(
    id: string,
    willId: string,
    userId: string,
    fullName: string,
    relationship?: string,
  ): Witness {
    const witnessInfo: WitnessInfo = {
      userId: userId.trim(),
      fullName: fullName.trim(),
      relationship: relationship?.trim(),
    };

    const witness = new Witness(id, willId, witnessInfo);

    // Create event-specific information
    const eventInfo: WitnessEventInfo = {
      userId: witnessInfo.userId,
      fullName: witnessInfo.fullName,
      relationship: witnessInfo.relationship,
    };

    witness.apply(new WitnessAddedEvent(witness._id, witness._willId, eventInfo, 'USER'));

    return witness;
  }

  /**
   * Creates a witness assignment for external individuals
   *
   * @static
   * @param {string} id - Unique witness identifier
   * @param {string} willId - Will being witnessed
   * @param {string} fullName - Full name of witness
   * @param {string} email - Contact email address
   * @param {string} phone - Contact phone number
   * @param {string} [idNumber] - Kenyan national ID number
   * @param {string} [relationship] - Relationship to testator
   * @param {WitnessAddress} [address] - Physical address information
   * @returns {Witness} New witness entity
   */
  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    idNumber?: string,
    relationship?: string,
    address?: WitnessAddress,
  ): Witness {
    // Pre-validate Kenyan ID format if provided
    if (idNumber && !KenyanId.isValid(idNumber)) {
      throw new Error(`Invalid Kenyan ID number: ${idNumber}`);
    }

    const witnessInfo: WitnessInfo = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      idNumber: idNumber?.trim(),
      relationship: relationship?.trim(),
      address: address ? { ...address } : undefined,
    };

    const witness = new Witness(id, willId, witnessInfo);

    // Create event-specific information
    const eventInfo: WitnessEventInfo = {
      fullName: witnessInfo.fullName,
      email: witnessInfo.email,
      phone: witnessInfo.phone,
      idNumber: witnessInfo.idNumber,
      relationship: witnessInfo.relationship,
    };

    witness.apply(new WitnessAddedEvent(witness._id, witness._willId, eventInfo, 'EXTERNAL'));

    return witness;
  }

  /**
   * Reconstructs Witness entity from persistence layer data
   *
   * @static
   * @param {WitnessReconstituteProps} props - Data from database
   * @returns {Witness} Rehydrated witness entity
   * @throws {Error} When data validation fails during reconstruction
   */
  static reconstitute(props: WitnessReconstituteProps): Witness {
    if (!props.id || !props.willId) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

    // Construct WitnessInfo from flat props
    const witnessInfo: WitnessInfo = {
      userId: props.userId || undefined,
      fullName: props.fullName,
      email: props.email || undefined,
      phone: props.phone || undefined,
      idNumber: props.idNumber || undefined,
      relationship: props.relationship || undefined,
      address: props.address || undefined,
    };

    Witness.validateWitnessInfo(witnessInfo);

    const witness = new Witness(props.id, props.willId, witnessInfo);

    witness._status = props.status;
    witness._signatureData = props.signatureData || null;
    witness._verifiedBy = props.verifiedBy || null;
    witness._isEligible = Boolean(props.isEligible);
    witness._ineligibilityReason = props.ineligibilityReason || null;

    witness._signedAt = props.signedAt
      ? Witness.safeDateConversion(props.signedAt, 'signedAt')
      : null;
    witness._verifiedAt = props.verifiedAt
      ? Witness.safeDateConversion(props.verifiedAt, 'verifiedAt')
      : null;
    witness._createdAt = Witness.safeDateConversion(props.createdAt, 'createdAt');
    witness._updatedAt = Witness.safeDateConversion(props.updatedAt, 'updatedAt');

    return witness;
  }

  /**
   * Safely converts date strings to Date objects with validation
   *
   * @private
   * @static
   * @param {Date | string} dateInput - Date to convert
   * @param {string} fieldName - Field name for error reporting
   * @returns {Date} Valid Date object
   * @throws {Error} When date conversion fails
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validates witness identity structure
   *
   * @private
   * @static
   * @param {WitnessInfo} info - Witness information to validate
   * @throws {Error} When identity structure is invalid
   */
  private static validateWitnessInfo(info: WitnessInfo): void {
    if (!info.fullName?.trim()) {
      throw new Error('Witness full name is required');
    }

    // External witnesses require contact information
    if (!info.userId && (!info.email?.trim() || !info.phone?.trim())) {
      throw new Error('External witnesses must have both email and phone contact information');
    }

    // Validate Kenyan ID format if provided
    if (info.idNumber && !KenyanId.isValid(info.idNumber)) {
      throw new Error(`Invalid Kenyan ID number format: ${info.idNumber}`);
    }
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Records witness signature with digital signature data
   *
   * @param {string} signatureData - Digital signature hash or data
   * @throws {Error} When witness cannot sign or signature data is invalid
   */
  sign(signatureData: string): void {
    if (this._status !== WitnessStatus.PENDING) {
      throw new Error('Only pending witnesses can sign the will');
    }

    if (!signatureData?.trim()) {
      throw new Error('Signature data is required');
    }

    if (!this._isEligible) {
      throw new Error('Ineligible witness cannot sign the will');
    }

    this._status = WitnessStatus.SIGNED;
    this._signedAt = new Date();
    this._signatureData = signatureData.trim();
    this._updatedAt = new Date();

    this.apply(new WitnessSignedEvent(this._id, this._willId, this._signedAt));
  }

  /**
   * Verifies witness identity and signature authenticity
   *
   * @param {string} verifiedBy - ID of user performing verification
   * @throws {Error} When witness cannot be verified or ID number invalid
   */
  verify(verifiedBy: string): void {
    if (this._status !== WitnessStatus.SIGNED) {
      throw new Error('Only signed witnesses can be verified');
    }

    if (!verifiedBy?.trim()) {
      throw new Error('Verifier ID is required');
    }

    if (!this._witnessInfo.idNumber) {
      throw new Error('Witness must have an ID number for verification');
    }

    if (!KenyanId.isValid(this._witnessInfo.idNumber)) {
      throw new Error('Cannot verify witness: Invalid Kenyan ID number');
    }

    this._status = WitnessStatus.VERIFIED;
    this._verifiedAt = new Date();
    this._verifiedBy = verifiedBy.trim();
    this._updatedAt = new Date();

    this.apply(
      new WitnessVerifiedEvent(this._id, this._willId, this._verifiedBy, this._verifiedAt),
    );
  }

  /**
   * Rejects witness due to ineligibility or refusal to sign
   *
   * @param {string} reason - Reason for rejection
   * @throws {Error} When rejection reason is not provided
   */
  reject(reason: string): void {
    if (!reason?.trim()) {
      throw new Error('Rejection reason is required');
    }

    this._status = WitnessStatus.REJECTED;
    this._ineligibilityReason = reason.trim();
    this._isEligible = false;
    this._updatedAt = new Date();

    this.apply(new WitnessRejectedEvent(this._id, this._willId, this._ineligibilityReason));
  }

  /**
   * Marks witness as ineligible (without full rejection)
   *
   * @param {string} reason - Reason for ineligibility
   * @throws {Error} When ineligibility reason is not provided
   */
  markAsIneligible(reason: string): void {
    if (!reason?.trim()) {
      throw new Error('Ineligibility reason is required');
    }

    this._isEligible = false;
    this._ineligibilityReason = reason.trim();
    this._updatedAt = new Date();
  }

  /**
   * Updates witness contact information with validation
   *
   * @param {string} [email] - Updated email address
   * @param {string} [phone] - Updated phone number
   * @param {WitnessAddress} [address] - Updated address information
   * @throws {Error} When witness is external and contact info becomes invalid
   */
  updateContactInfo(email?: string, phone?: string, address?: WitnessAddress): void {
    // For external witnesses, ensure we maintain at least one contact method
    if (!this._witnessInfo.userId) {
      const hasEmail = email?.trim() || this._witnessInfo.email;
      const hasPhone = phone?.trim() || this._witnessInfo.phone;

      if (!hasEmail || !hasPhone) {
        throw new Error(
          'External witnesses must maintain both email and phone contact information',
        );
      }
    }

    if (email !== undefined) {
      this._witnessInfo.email = email?.trim() || undefined;
    }

    if (phone !== undefined) {
      this._witnessInfo.phone = phone?.trim() || undefined;
    }

    if (address !== undefined) {
      this._witnessInfo.address = address ? { ...address } : undefined;
    }

    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // LEGAL COMPLIANCE & VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates witness compliance with Kenyan legal requirements
   *
   * @returns {{ isValid: boolean; issues: string[] }} Validation result with issues
   */
  validateForKenyanLaw(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Witness must have ID number for verification
    if (this._status === WitnessStatus.VERIFIED && !this._witnessInfo.idNumber) {
      issues.push('Kenyan ID number is required for legal witness verification');
    }

    // Basic relationship conflict checks (detailed checking happens at Will aggregate level)
    const relationship = this._witnessInfo.relationship?.toLowerCase();
    if (relationship?.includes('spouse')) {
      issues.push('Spouse of testator cannot serve as a witness under Kenyan law');
    }

    if (relationship?.includes('beneficiary')) {
      issues.push('Beneficiaries should not serve as witnesses to avoid conflict of interest');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Determines if witness is a registered platform user
   *
   * @returns {boolean} True if witness is registered user
   */
  isRegisteredUser(): boolean {
    return Boolean(this._witnessInfo.userId);
  }

  /**
   * Determines if witness has signed the will
   *
   * @returns {boolean} True if witness has signed
   */
  hasSigned(): boolean {
    return this._status === WitnessStatus.SIGNED || this._status === WitnessStatus.VERIFIED;
  }

  /**
   * Determines if witness has been verified
   *
   * @returns {boolean} True if witness is verified
   */
  isVerified(): boolean {
    return this._status === WitnessStatus.VERIFIED;
  }

  /**
   * Determines if witness is pending action
   *
   * @returns {boolean} True if witness is pending
   */
  isPending(): boolean {
    return this._status === WitnessStatus.PENDING;
  }

  /**
   * Determines if witness has been rejected
   *
   * @returns {boolean} True if witness is rejected
   */
  isRejected(): boolean {
    return this._status === WitnessStatus.REJECTED;
  }

  /**
   * Determines if witness can sign the will
   *
   * @returns {boolean} True if witness can sign
   */
  canSign(): boolean {
    return this._status === WitnessStatus.PENDING && this._isEligible;
  }

  /**
   * Determines if witness can be verified
   *
   * @returns {boolean} True if witness can be verified
   */
  canBeVerified(): boolean {
    const idNumber = this._witnessInfo.idNumber;
    return (
      this._status === WitnessStatus.SIGNED &&
      this._isEligible &&
      typeof idNumber === 'string' &&
      KenyanId.isValid(idNumber)
    );
  }

  /**
   * Validates witness has required contact information
   *
   * @returns {boolean} True if contact information is complete
   */
  hasRequiredContactInfo(): boolean {
    if (this._witnessInfo.userId) {
      return true; // Registered users have contact info in their profile
    }

    return Boolean(this._witnessInfo.email && this._witnessInfo.phone);
  }

  /**
   * Validates Kenyan ID number format if present
   *
   * @returns {boolean} True if ID number is valid
   */
  hasValidIdNumber(): boolean {
    return Boolean(this._witnessInfo.idNumber && KenyanId.isValid(this._witnessInfo.idNumber));
  }

  /**
   * Determines if witness is compliant with Kenyan legal requirements
   *
   * @returns {boolean} True if witness is legally compliant
   */
  isCompliantWithKenyanLaw(): boolean {
    const validation = this.validateForKenyanLaw();
    return validation.isValid;
  }

  /**
   * Gets legal compliance issues for witness
   *
   * @returns {string[]} Array of compliance issues
   */
  getComplianceIssues(): string[] {
    const validation = this.validateForKenyanLaw();
    return validation.issues;
  }

  /**
   * Gets formatted contact information for display
   *
   * @returns {string} Formatted contact information
   */
  getContactInfo(): string {
    if (this._witnessInfo.email && this._witnessInfo.phone) {
      return `${this._witnessInfo.email} / ${this._witnessInfo.phone}`;
    }

    return this._witnessInfo.email || this._witnessInfo.phone || 'No contact information';
  }

  /**
   * Gets formatted address for display
   *
   * @returns {string} Formatted address string
   */
  getFormattedAddress(): string {
    if (!this._witnessInfo.address) return 'No address provided';

    const { street, city, county, postalCode } = this._witnessInfo.address;
    const parts = [street, city, county, postalCode].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Determines if witness can be reinstated after rejection/ineligibility
   *
   * @returns {boolean} True if witness can be reinstated
   */
  canBeReinstated(): boolean {
    return this._status === WitnessStatus.REJECTED || !this._isEligible;
  }

  /**
   * Reinstates previously rejected or ineligible witness
   *
   * @throws {Error} When witness cannot be reinstated
   */
  reinstate(): void {
    if (!this.canBeReinstated()) {
      throw new Error('Witness cannot be reinstated in current state');
    }

    this._isEligible = true;
    this._ineligibilityReason = null;

    if (this._status === WitnessStatus.REJECTED) {
      this._status = WitnessStatus.PENDING;
    }

    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get willId(): string {
    return this._willId;
  }
  get witnessInfo(): WitnessInfo {
    return { ...this._witnessInfo };
  }
  get status(): WitnessStatus {
    return this._status;
  }
  get signedAt(): Date | null {
    return this._signedAt ? new Date(this._signedAt) : null;
  }
  get signatureData(): string | null {
    return this._signatureData;
  }
  get verifiedAt(): Date | null {
    return this._verifiedAt ? new Date(this._verifiedAt) : null;
  }
  get verifiedBy(): string | null {
    return this._verifiedBy;
  }
  get isEligible(): boolean {
    return this._isEligible;
  }
  get ineligibilityReason(): string | null {
    return this._ineligibilityReason;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  get fullName(): string {
    return this._witnessInfo.fullName;
  }
  get email(): string | undefined {
    return this._witnessInfo.email;
  }
  get phone(): string | undefined {
    return this._witnessInfo.phone;
  }
  get idNumber(): string | undefined {
    return this._witnessInfo.idNumber;
  }
  get relationship(): string | undefined {
    return this._witnessInfo.relationship;
  }
  get address(): WitnessAddress | undefined {
    return this._witnessInfo.address ? { ...this._witnessInfo.address } : undefined;
  }
  get userId(): string | undefined {
    return this._witnessInfo.userId;
  }
}
