// domain/value-objects/witness-signature.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Witness Signature Value Object
 *
 * Kenyan Legal Context - Section 11 LSA:
 * "...such witnesses shall subscribe the will in the presence of the testator"
 *
 * Requirements:
 * - Signature must be in presence of testator
 * - Both witnesses must be present at same time
 * - Signature must be on the will document itself
 * - Digital signatures require specific technology (Kenya Evidence Act)
 *
 * Signature Types:
 * - DIGITAL_SIGNATURE: PKI-based (highest assurance)
 * - WET_SIGNATURE: Physical pen on paper (traditional)
 * - E_SIGNATURE: Electronic signature (varies by technology)
 * - BIOMETRIC_SIGNATURE: Fingerprint/facial recognition
 * - WITNESS_MARK: 'X' mark for illiterate witnesses (requires explanation)
 */
export enum SignatureType {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  WET_SIGNATURE = 'WET_SIGNATURE',
  E_SIGNATURE = 'E_SIGNATURE',
  BIOMETRIC_SIGNATURE = 'BIOMETRIC_SIGNATURE',
  WITNESS_MARK = 'WITNESS_MARK',
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

interface WitnessSignatureProps {
  type: SignatureType;
  status: SignatureStatus;

  // Signature data
  signatureData?: string; // Base64 or PKI certificate
  signatureHash?: string; // SHA-256 hash for integrity

  // Verification
  verificationMethod?: string;
  verifiedBy?: string; // User ID or system
  verifiedAt?: Date;

  // Timestamps
  signedAt?: Date;
  witnessedAt: Date; // When witness was present
  expiresAt?: Date; // For digital signatures

  // Location & Context
  ipAddress?: string;
  deviceId?: string;
  locationCounty?: string;

  // Co-witness (Section 11 requirement)
  coWitnessPresent: boolean;
  coWitnessId?: string;

  // Legal attestation
  attestation: string; // "I witnessed the testator sign..."

  // Rejection
  rejectionReason?: string;
}

export class WitnessSignature extends ValueObject<WitnessSignatureProps> {
  private constructor(props: WitnessSignatureProps) {
    super(props);
  }

  protected validate(): void {
    if (!Object.values(SignatureType).includes(this.props.type)) {
      throw new ValueObjectValidationError(`Invalid signature type: ${this.props.type}`, 'type');
    }

    if (!Object.values(SignatureStatus).includes(this.props.status)) {
      throw new ValueObjectValidationError(
        `Invalid signature status: ${this.props.status}`,
        'status',
      );
    }

    // Witnessed date cannot be future
    if (this.props.witnessedAt > new Date()) {
      throw new ValueObjectValidationError('Witnessed date cannot be in the future', 'witnessedAt');
    }

    // If status is captured/verified, must have signature data
    if ([SignatureStatus.CAPTURED, SignatureStatus.VERIFIED].includes(this.props.status)) {
      if (!this.props.signatureData && this.props.type !== SignatureType.WITNESS_MARK) {
        throw new ValueObjectValidationError(
          'Captured signature must have signature data',
          'signatureData',
        );
      }

      if (!this.props.signedAt) {
        throw new ValueObjectValidationError(
          'Captured signature must have signed date',
          'signedAt',
        );
      }
    }

    // If verified, must have verification details
    if (this.props.status === SignatureStatus.VERIFIED) {
      if (!this.props.verifiedAt || !this.props.verifiedBy) {
        throw new ValueObjectValidationError(
          'Verified signature must have verification details',
          'verifiedAt',
        );
      }
    }

    // Co-witness requirement (S.11 LSA)
    if (!this.props.coWitnessPresent && this.props.status !== SignatureStatus.PENDING) {
      throw new ValueObjectValidationError(
        'Section 11 LSA requires co-witness to be present',
        'coWitnessPresent',
      );
    }

    // Attestation required
    if (!this.props.attestation || this.props.attestation.trim().length < 20) {
      throw new ValueObjectValidationError('Legal attestation statement required', 'attestation');
    }

    // Rejection validation
    if (this.props.status === SignatureStatus.REJECTED && !this.props.rejectionReason) {
      throw new ValueObjectValidationError(
        'Rejected signature must have reason',
        'rejectionReason',
      );
    }

    // Expiry validation
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      if (this.props.status !== SignatureStatus.EXPIRED) {
        throw new ValueObjectValidationError(
          'Expired signature must have EXPIRED status',
          'status',
        );
      }
    }
  }

  // Factory: Pending signature
  static createPending(witnessedAt: Date = new Date()): WitnessSignature {
    return new WitnessSignature({
      type: SignatureType.DIGITAL_SIGNATURE,
      status: SignatureStatus.PENDING,
      witnessedAt,
      coWitnessPresent: false,
      attestation:
        'I hereby witness that the testator signed this will in my presence and in the presence of the other witness.',
    });
  }

  // Factory: Digital signature
  static digital(signatureData: string, witnessedAt: Date, coWitnessId: string): WitnessSignature {
    return new WitnessSignature({
      type: SignatureType.DIGITAL_SIGNATURE,
      status: SignatureStatus.CAPTURED,
      signatureData,
      signatureHash: this.calculateHash(signatureData),
      signedAt: new Date(),
      witnessedAt,
      coWitnessPresent: true,
      coWitnessId,
      attestation:
        'I hereby witness that the testator signed this will in my presence and in the presence of the other witness.',
    });
  }

  // Factory: Wet signature (scanned)
  static wet(
    signatureImageBase64: string,
    witnessedAt: Date,
    coWitnessId: string,
  ): WitnessSignature {
    return new WitnessSignature({
      type: SignatureType.WET_SIGNATURE,
      status: SignatureStatus.CAPTURED,
      signatureData: signatureImageBase64,
      signatureHash: this.calculateHash(signatureImageBase64),
      signedAt: new Date(),
      witnessedAt,
      coWitnessPresent: true,
      coWitnessId,
      attestation:
        'I hereby witness that the testator signed this will in my presence and in the presence of the other witness.',
    });
  }

  // Factory: Witness mark (for illiterate)
  static mark(witnessedAt: Date, coWitnessId: string, explanation: string): WitnessSignature {
    return new WitnessSignature({
      type: SignatureType.WITNESS_MARK,
      status: SignatureStatus.CAPTURED,
      signedAt: new Date(),
      witnessedAt,
      coWitnessPresent: true,
      coWitnessId,
      attestation: `The witness made their mark in my presence. ${explanation}`,
    });
  }

  // Query methods
  public getType(): SignatureType {
    return this.props.type;
  }

  public getStatus(): SignatureStatus {
    return this.props.status;
  }

  public isPending(): boolean {
    return this.props.status === SignatureStatus.PENDING;
  }

  public isCaptured(): boolean {
    return this.props.status === SignatureStatus.CAPTURED;
  }

  public isVerified(): boolean {
    return this.props.status === SignatureStatus.VERIFIED;
  }

  public isRejected(): boolean {
    return this.props.status === SignatureStatus.REJECTED;
  }

  public isExpired(): boolean {
    return this.props.status === SignatureStatus.EXPIRED;
  }

  public isValid(): boolean {
    return (
      this.isVerified() &&
      this.props.coWitnessPresent &&
      (!this.props.expiresAt || this.props.expiresAt > new Date())
    );
  }

  public getSignedAt(): Date | undefined {
    return this.props.signedAt;
  }

  public getWitnessedAt(): Date {
    return this.props.witnessedAt;
  }

  public hasCoWitness(): boolean {
    return this.props.coWitnessPresent;
  }

  public getCoWitnessId(): string | undefined {
    return this.props.coWitnessId;
  }

  public getAttestation(): string {
    return this.props.attestation;
  }

  public getRejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  // Business logic: Verify signature
  public verify(verifiedBy: string, method: string): WitnessSignature {
    if (!this.isCaptured()) {
      throw new Error('Can only verify captured signatures');
    }

    return new WitnessSignature({
      ...this.props,
      status: SignatureStatus.VERIFIED,
      verifiedBy,
      verifiedAt: new Date(),
      verificationMethod: method,
    });
  }

  // Business logic: Reject signature
  public reject(reason: string): WitnessSignature {
    return new WitnessSignature({
      ...this.props,
      status: SignatureStatus.REJECTED,
      rejectionReason: reason,
    });
  }

  // Business logic: Mark as expired
  public expire(): WitnessSignature {
    return new WitnessSignature({
      ...this.props,
      status: SignatureStatus.EXPIRED,
    });
  }

  // Business logic: Verify signature integrity
  public verifyIntegrity(): boolean {
    if (!this.props.signatureData || !this.props.signatureHash) {
      return false;
    }

    const currentHash = WitnessSignature.calculateHash(this.props.signatureData);
    return currentHash === this.props.signatureHash;
  }

  // Business logic: Check if signature meets S.11 LSA requirements
  public meetsLegalRequirements(): { valid: boolean; reason?: string } {
    if (!this.props.coWitnessPresent) {
      return {
        valid: false,
        reason: 'Section 11 LSA requires two witnesses present at same time',
      };
    }

    if (!this.props.signedAt && this.props.status !== SignatureStatus.PENDING) {
      return {
        valid: false,
        reason: 'Signature date not recorded',
      };
    }

    if (this.isExpired()) {
      return {
        valid: false,
        reason: 'Digital signature has expired',
      };
    }

    if (!this.isVerified() && this.props.status !== SignatureStatus.PENDING) {
      return {
        valid: false,
        reason: 'Signature not verified',
      };
    }

    return { valid: true };
  }

  // Business logic: Check simultaneity with other witness
  public isSimultaneousWith(otherSignature: WitnessSignature): boolean {
    const timeDiffMinutes =
      Math.abs(this.props.witnessedAt.getTime() - otherSignature.props.witnessedAt.getTime()) /
      (1000 * 60);

    // Allow 30 minutes window for simultaneity
    return timeDiffMinutes <= 30;
  }

  private static calculateHash(data: string): string {
    // In production, use proper SHA-256 hashing
    // This is placeholder logic
    return Buffer.from(data).toString('base64').substring(0, 64);
  }

  public toJSON(): Record<string, any> {
    return {
      type: this.props.type,
      status: this.props.status,
      signedAt: this.props.signedAt?.toISOString(),
      witnessedAt: this.props.witnessedAt.toISOString(),
      verifiedAt: this.props.verifiedAt?.toISOString(),
      expiresAt: this.props.expiresAt?.toISOString(),
      coWitnessPresent: this.props.coWitnessPresent,
      coWitnessId: this.props.coWitnessId,
      attestation: this.props.attestation,
      rejectionReason: this.props.rejectionReason,
      isValid: this.isValid(),
      meetsLegalRequirements: this.meetsLegalRequirements(),
    };
  }
}
