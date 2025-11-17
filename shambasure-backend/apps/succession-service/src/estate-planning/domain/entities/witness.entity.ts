import { WitnessStatus } from '@prisma/client';
import { KenyanId } from '../value-objects/kenyan-id.vo';

export interface WitnessInfo {
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  relationship?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
  };
}

export class Witness {
  private id: string;
  private willId: string;
  private witnessInfo: WitnessInfo;
  private status: WitnessStatus;
  private signedAt: Date | null;
  private signatureData: string | null;
  private verifiedAt: Date | null;
  private verifiedBy: string | null;
  private isEligible: boolean;
  private ineligibilityReason: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(id: string, willId: string, witnessInfo: WitnessInfo) {
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

  // Getters
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

  // Business methods
  sign(signatureData: string): void {
    if (this.status !== WitnessStatus.PENDING) {
      throw new Error('Only pending witnesses can sign');
    }

    if (!signatureData?.trim()) {
      throw new Error('Signature data is required');
    }

    if (!this.isEligible) {
      throw new Error('Ineligible witness cannot sign the will');
    }

    this.status = WitnessStatus.SIGNED;
    this.signedAt = new Date();
    this.signatureData = signatureData.trim();
    this.updatedAt = new Date();
  }

  verify(verifiedBy: string): void {
    if (this.status !== WitnessStatus.SIGNED) {
      throw new Error('Only signed witnesses can be verified');
    }

    if (!this.witnessInfo.idNumber) {
      throw new Error('Witness must have ID number for verification');
    }

    // Validate Kenyan ID if provided
    if (this.witnessInfo.idNumber && !KenyanId.isValid(this.witnessInfo.idNumber)) {
      throw new Error('Invalid Kenyan ID number for witness verification');
    }

    this.status = WitnessStatus.VERIFIED;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.updatedAt = new Date();
  }

  reject(reason: string): void {
    this.status = WitnessStatus.REJECTED;
    this.ineligibilityReason = reason;
    this.isEligible = false;
    this.updatedAt = new Date();
  }

  markAsIneligible(reason: string): void {
    this.isEligible = false;
    this.ineligibilityReason = reason;
    this.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phone?: string, address?: WitnessInfo['address']): void {
    if (email) this.witnessInfo.email = email;
    if (phone) this.witnessInfo.phone = phone;
    if (address) this.witnessInfo.address = { ...address };
    this.updatedAt = new Date();
  }

  // Validation methods
  private validateWitnessInfo(info: WitnessInfo): void {
    if (!info.fullName?.trim()) {
      throw new Error('Witness full name is required');
    }

    // For external witnesses, require contact information
    if (!info.userId && (!info.email || !info.phone)) {
      throw new Error('External witnesses must have email and phone contact information');
    }

    // Validate Kenyan ID format if provided
    if (info.idNumber && !KenyanId.isValid(info.idNumber)) {
      throw new Error('Invalid Kenyan ID number format');
    }
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

  canSign(): boolean {
    return this.status === WitnessStatus.PENDING && this.isEligible;
  }

  getWitnessName(): string {
    return this.witnessInfo.fullName;
  }

  // Kenyan law specific validations
  validateForKenyanLaw(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Witness must not be a beneficiary
    if (this.witnessInfo.relationship?.toLowerCase().includes('beneficiary')) {
      issues.push('Witness appears to be a beneficiary, which is not allowed under Kenyan law');
    }

    // Witness must be of sound mind and legal age (18+)
    if (!this.witnessInfo.idNumber) {
      issues.push('Kenyan ID number is required for legal witness verification');
    }

    // Witness should not be the spouse of the testator
    if (this.witnessInfo.relationship?.toLowerCase().includes('spouse')) {
      issues.push('Spouse of testator cannot serve as witness under Kenyan law');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Static factory methods
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

    return new Witness(id, willId, witnessInfo);
  }

  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    idNumber: string,
    email: string,
    phone: string,
    relationship?: string,
    address?: WitnessInfo['address'],
  ): Witness {
    const witnessInfo: WitnessInfo = {
      fullName,
      idNumber,
      email,
      phone,
      relationship,
      address,
    };

    return new Witness(id, willId, witnessInfo);
  }
}
