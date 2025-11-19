import { AggregateRoot } from '@nestjs/cqrs';
import { WitnessStatus } from '@prisma/client';
import { KenyanId } from '../value-objects/kenyan-id.vo';
// We assume these events exist or will be created based on this entity's actions
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
  idNumber?: string; // We keep as string here, but validate via VO
  relationship?: string;
  address?: WitnessAddress;
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
  private verifiedBy: string | null; // User ID of the admin/verifier

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
  // FACTORY METHODS
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

    // Fixed: Pass witnessInfo object instead of individual strings
    witness.apply(
      new WitnessAddedEvent(
        id,
        willId,
        { userId, fullName }, // witnessInfo object
        'USER',
      ),
    );
    return witness;
  }

  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    idNumber: string,
    email: string,
    phone: string,
    relationship?: string,
    address?: WitnessAddress,
  ): Witness {
    // Pre-validate ID format using our Value Object logic
    if (!KenyanId.isValid(idNumber)) {
      throw new Error(`Invalid Kenyan ID number: ${idNumber}`);
    }

    const witnessInfo: WitnessInfo = {
      fullName,
      idNumber,
      email,
      phone,
      relationship,
      address,
    };

    const witness = new Witness(id, willId, witnessInfo);

    // Fixed: Pass witnessInfo object instead of individual strings
    witness.apply(
      new WitnessAddedEvent(
        id,
        willId,
        { fullName, email, phone }, // witnessInfo object
        'EXTERNAL',
      ),
    );
    return witness;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

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

    this.apply(new WitnessVerifiedEvent(this.id, this.willId, verifiedBy));
  }

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
    if (email) this.witnessInfo.email = email;
    if (phone) this.witnessInfo.phone = phone;
    if (address) this.witnessInfo.address = { ...address };
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & RULES
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
  // GETTERS
  // --------------------------------------------------------------------------

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
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isRegisteredUser(): boolean {
    return !!this.witnessInfo.userId;
  }

  hasSigned(): boolean {
    return this.status === WitnessStatus.SIGNED || this.status === WitnessStatus.VERIFIED;
  }

  isVerified(): boolean {
    return this.status === WitnessStatus.VERIFIED;
  }

  // Additional computed getters for business logic
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

  isPending(): boolean {
    return this.status === WitnessStatus.PENDING;
  }

  isRejected(): boolean {
    return this.status === WitnessStatus.REJECTED;
  }

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
}
