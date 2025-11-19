import { AggregateRoot } from '@nestjs/cqrs';
import { WitnessStatus } from '@prisma/client';
import { KenyanId } from '../value-objects/kenyan-id.vo';
import { WitnessAddedEvent } from '../events/witness-added.event';
import { WitnessSignedEvent } from '../events/witness-signed.event';
import { WitnessVerifiedEvent } from '../events/witness-verified.event';
import { WitnessRejectedEvent } from '../events/witness-rejected.event';

export interface WitnessAddress {
  street?: string;
  city?: string;
  county?: string;
  postalCode?: string;
}

export interface WitnessInfo {
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  relationship?: string;
  address?: WitnessAddress;
}

// Interface for WitnessAddedEvent witnessInfo parameter
export interface WitnessEventInfo {
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  relationship?: string;
}

// Interface for reconstitute method
export interface WitnessReconstituteProps {
  id: string;
  willId: string;
  witnessInfo: WitnessInfo;
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

export class Witness extends AggregateRoot {
  private id: string;
  private willId: string;
  private witnessInfo: WitnessInfo;
  private status: WitnessStatus;

  // Signing & Verification
  private signedAt: Date | null;
  private signatureData: string | null;
  private verifiedAt: Date | null;
  private verifiedBy: string | null;

  // Eligibility State
  private isEligible: boolean;
  private ineligibilityReason: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor enforces use of static factory methods
  private constructor(id: string, willId: string, witnessInfo: WitnessInfo) {
    super();
    this.validateWitnessInfo(witnessInfo);

    this.id = id;
    this.willId = willId;
    this.witnessInfo = { ...witnessInfo };

    // Default values
    this.status = WitnessStatus.PENDING;
    this.signedAt = null;
    this.signatureData = null;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.isEligible = true;
    this.ineligibilityReason = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 1. FACTORY METHODS
  // --------------------------------------------------------------------------

  static createForUser(
    id: string,
    willId: string,
    userId: string,
    fullName: string,
    relationship?: string,
  ): Witness {
    const witnessInfo: WitnessInfo = {
      userId,
      fullName,
      relationship,
    };

    const witness = new Witness(id, willId, witnessInfo);

    // Create event info with only the properties that WitnessAddedEvent expects
    const eventInfo: WitnessEventInfo = {
      userId,
      fullName,
      relationship,
    };

    witness.apply(new WitnessAddedEvent(id, willId, eventInfo, 'USER'));
    return witness;
  }

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
    // Pre-validate ID format using our Value Object logic if provided
    if (idNumber && !KenyanId.isValid(idNumber)) {
      throw new Error(`Invalid Kenyan ID number: ${idNumber}`);
    }

    const witnessInfo: WitnessInfo = {
      fullName,
      email,
      phone,
      idNumber,
      relationship,
      address,
    };

    const witness = new Witness(id, willId, witnessInfo);

    // Create event info with only the properties that WitnessAddedEvent expects
    const eventInfo: WitnessEventInfo = {
      fullName,
      email,
      phone,
      idNumber,
      relationship,
    };

    witness.apply(new WitnessAddedEvent(id, willId, eventInfo, 'EXTERNAL'));
    return witness;
  }

  /**
   * Rehydrate from Database (No Events)
   */
  static reconstitute(props: WitnessReconstituteProps): Witness {
    const witness = new Witness(props.id, props.willId, props.witnessInfo);

    // Hydrate properties safely with proper typing
    witness.status = props.status;
    witness.signatureData = props.signatureData;
    witness.verifiedBy = props.verifiedBy;
    witness.isEligible = props.isEligible;
    witness.ineligibilityReason = props.ineligibilityReason;

    // Handle date conversions safely
    witness.signedAt = props.signedAt ? new Date(props.signedAt) : null;
    witness.verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;
    witness.createdAt = new Date(props.createdAt);
    witness.updatedAt = new Date(props.updatedAt);

    return witness;
  }

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

  /**
   * Witness signs the will.
   * In digital context, this receives the signature hash/data.
   */
  sign(signatureData: string): void {
    if (this.status !== WitnessStatus.PENDING) {
      throw new Error('Only pending witnesses can sign the will.');
    }

    if (!signatureData?.trim()) {
      throw new Error('Signature data is required.');
    }

    if (!this.isEligible) {
      throw new Error('Ineligible witness cannot sign the will.');
    }

    this.status = WitnessStatus.SIGNED;
    this.signedAt = new Date();
    this.signatureData = signatureData.trim();
    this.updatedAt = new Date();

    this.apply(new WitnessSignedEvent(this.id, this.willId, this.signedAt));
  }

  /**
   * Verifier (Admin/Lawyer) confirms witness identity matches the signature.
   */
  verify(verifiedBy: string): void {
    if (this.status !== WitnessStatus.SIGNED) {
      throw new Error('Only signed witnesses can be verified.');
    }

    if (!this.witnessInfo.idNumber) {
      throw new Error('Witness must have an ID number for verification.');
    }

    // Use Value Object to ensure the ID is valid before verifying
    if (!KenyanId.isValid(this.witnessInfo.idNumber)) {
      throw new Error('Cannot verify witness: Invalid Kenyan ID number.');
    }

    this.status = WitnessStatus.VERIFIED;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.updatedAt = new Date();

    this.apply(new WitnessVerifiedEvent(this.id, this.willId, verifiedBy, this.verifiedAt));
  }

  /**
   * Reject a witness (e.g. conflict of interest found, or refused to sign).
   */
  reject(reason: string): void {
    // Rejection is final
    this.status = WitnessStatus.REJECTED;
    this.ineligibilityReason = reason;
    this.isEligible = false;
    this.updatedAt = new Date();

    this.apply(new WitnessRejectedEvent(this.id, this.willId, reason));
  }

  markAsIneligible(reason: string): void {
    // Similar to reject, but might happen before signing
    this.isEligible = false;
    this.ineligibilityReason = reason;
    this.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phone?: string, address?: WitnessAddress): void {
    if (this.status === WitnessStatus.VERIFIED) {
      // Policy: Maybe allow updates, maybe not.
      // For now, allow but log it (implicitly via updatedAt).
    }

    if (email) this.witnessInfo.email = email;
    if (phone) this.witnessInfo.phone = phone;
    if (address) this.witnessInfo.address = { ...address };
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 3. VALIDATION & RULES
  // --------------------------------------------------------------------------

  private validateWitnessInfo(info: WitnessInfo): void {
    if (!info.fullName?.trim()) {
      throw new Error('Witness full name is required.');
    }

    // For external witnesses, require contact information
    if (!info.userId && (!info.email || !info.phone)) {
      throw new Error('External witnesses must have email or phone contact information.');
    }
  }

  /**
   * Checks internal consistency for Kenyan legal requirements.
   * Note: Cross-checks (like "is this witness also a beneficiary?")
   * must be handled by the LegalFormalityChecker service, not the entity itself.
   */
  validateForKenyanLaw(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Witness must have an ID number if they are being verified
    if (this.status === WitnessStatus.VERIFIED && !this.witnessInfo.idNumber) {
      issues.push('Kenyan ID number is required for legal witness verification.');
    }

    // Internal check for obvious relationship conflicts (e.g. "Spouse")
    // Detailed conflict checking happens at the Will Aggregate level
    if (this.witnessInfo.relationship?.toLowerCase().includes('spouse')) {
      issues.push('Spouse of testator cannot serve as a witness under Kenyan law.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // 4. GETTERS & HELPER METHODS
  // --------------------------------------------------------------------------

  // Core Properties
  getId(): string {
    return this.id;
  }

  getWillId(): string {
    return this.willId;
  }

  getWitnessInfo(): WitnessInfo {
    return { ...this.witnessInfo };
  }

  getStatus(): WitnessStatus {
    return this.status;
  }

  getSignedAt(): Date | null {
    return this.signedAt ? new Date(this.signedAt) : null;
  }

  getSignatureData(): string | null {
    return this.signatureData;
  }

  getVerifiedAt(): Date | null {
    return this.verifiedAt ? new Date(this.verifiedAt) : null;
  }

  getVerifiedBy(): string | null {
    return this.verifiedBy;
  }

  getIsEligible(): boolean {
    return this.isEligible;
  }

  getIneligibilityReason(): string | null {
    return this.ineligibilityReason;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Status Checkers
  isRegisteredUser(): boolean {
    return !!this.witnessInfo.userId;
  }

  hasSigned(): boolean {
    return this.status === WitnessStatus.SIGNED || this.status === WitnessStatus.VERIFIED;
  }

  isVerified(): boolean {
    return this.status === WitnessStatus.VERIFIED;
  }

  isPending(): boolean {
    return this.status === WitnessStatus.PENDING;
  }

  isRejected(): boolean {
    return this.status === WitnessStatus.REJECTED;
  }

  // Detailed Info Getters
  getFullName(): string {
    return this.witnessInfo.fullName;
  }

  getEmail(): string | undefined {
    return this.witnessInfo.email;
  }

  getPhone(): string | undefined {
    return this.witnessInfo.phone;
  }

  getIdNumber(): string | undefined {
    return this.witnessInfo.idNumber;
  }

  getRelationship(): string | undefined {
    return this.witnessInfo.relationship;
  }

  getAddress(): WitnessAddress | undefined {
    return this.witnessInfo.address ? { ...this.witnessInfo.address } : undefined;
  }

  getUserId(): string | undefined {
    return this.witnessInfo.userId;
  }

  // Business Logic Helpers
  canSign(): boolean {
    return this.status === WitnessStatus.PENDING && this.isEligible;
  }

  canBeVerified(): boolean {
    return (
      this.status === WitnessStatus.SIGNED &&
      this.isEligible &&
      !!this.witnessInfo.idNumber &&
      KenyanId.isValid(this.witnessInfo.idNumber)
    );
  }

  // Validation Helpers
  hasRequiredContactInfo(): boolean {
    return !!(this.witnessInfo.email || this.witnessInfo.phone);
  }

  hasValidIdNumber(): boolean {
    return !!(this.witnessInfo.idNumber && KenyanId.isValid(this.witnessInfo.idNumber));
  }

  isCompliantWithKenyanLaw(): boolean {
    const validation = this.validateForKenyanLaw();
    return validation.isValid;
  }

  getComplianceIssues(): string[] {
    const validation = this.validateForKenyanLaw();
    return validation.issues;
  }

  // Utility Methods
  getContactInfo(): string {
    if (this.witnessInfo.email && this.witnessInfo.phone) {
      return `${this.witnessInfo.email} / ${this.witnessInfo.phone}`;
    }
    return this.witnessInfo.email || this.witnessInfo.phone || 'No contact info';
  }

  getFormattedAddress(): string {
    if (!this.witnessInfo.address) return 'No address provided';

    const { street, city, county, postalCode } = this.witnessInfo.address;
    const parts = [street, city, county, postalCode].filter(Boolean);
    return parts.join(', ');
  }

  // Eligibility Management
  canBeReinstated(): boolean {
    return this.status === WitnessStatus.REJECTED || !this.isEligible;
  }

  reinstate(): void {
    if (!this.canBeReinstated()) {
      throw new Error('Witness cannot be reinstated in current state');
    }

    this.isEligible = true;
    this.ineligibilityReason = null;

    if (this.status === WitnessStatus.REJECTED) {
      this.status = WitnessStatus.PENDING;
    }

    this.updatedAt = new Date();
  }
}
