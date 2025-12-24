// domain/entities/will-witness.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WitnessEligibility } from '../value-objects/witness-eligibility.vo';
import { WitnessSignature } from '../value-objects/witness-signature.vo';

/**
 * Will Witness Entity
 *
 * Kenyan Legal Context - Section 11 LSA:
 * "...and such witnesses shall subscribe the will in the presence of the testator"
 *
 * CRITICAL RULES:
 * 1. TWO witnesses required (minimum)
 * 2. Both must be present at SAME TIME
 * 3. Witness CANNOT be beneficiary (or loses their bequest)
 * 4. Witness must be 18+ and of sound mind
 * 5. Signature must be in testator's presence
 *
 * ENTITY RESPONSIBILITIES:
 * - Validate eligibility (not beneficiary, legal age)
 * - Capture signature with legal attestation
 * - Track identity verification
 * - Ensure simultaneity with co-witness
 *
 * Owned by: Will Aggregate
 */

export enum WitnessStatus {
  PENDING = 'PENDING', // Awaiting signature
  SIGNED = 'SIGNED', // Signature captured
  VERIFIED = 'VERIFIED', // Identity verified
  REJECTED = 'REJECTED', // Declined to witness or ineligible
}

export enum WitnessType {
  REGISTERED_USER = 'REGISTERED_USER', // User in our system
  EXTERNAL_INDIVIDUAL = 'EXTERNAL_INDIVIDUAL', // Not in system
  PROFESSIONAL_WITNESS = 'PROFESSIONAL_WITNESS', // Lawyer, notary
  COURT_OFFICER = 'COURT_OFFICER', // For court filings
  NOTARY_PUBLIC = 'NOTARY_PUBLIC', // Licensed notary
}

interface WillWitnessProps {
  willId: string;

  // Identity
  witnessType: WitnessType;
  userId?: string; // If REGISTERED_USER
  fullName: string;
  nationalId?: string;
  email?: string;
  phoneNumber?: string;

  // Eligibility check
  eligibility: WitnessEligibility;

  // Signature
  signature?: WitnessSignature;
  status: WitnessStatus;

  // Verification
  identityVerificationMethod?: string;
  identityDocumentId?: string; // Link to uploaded ID/passport
  verifiedAt?: Date;

  // Rejection
  rejectionReason?: string;
  rejectedAt?: Date;

  // Legal attestation
  hasAttested: boolean;
  attestationText?: string;
  attestedAt?: Date;

  // Address (for serving legal notice)
  physicalAddress?: string;
  county?: string;

  // Professional credentials (if applicable)
  professionalLicenseNumber?: string;
  licenseIssuingBody?: string;
}

export class WillWitness extends Entity<WillWitnessProps> {
  private constructor(id: UniqueEntityID, props: WillWitnessProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // Factory: Create pending witness
  public static create(
    willId: string,
    fullName: string,
    witnessType: WitnessType,
    eligibility: WitnessEligibility,
    userId?: string,
    nationalId?: string,
  ): WillWitness {
    const id = new UniqueEntityID();

    const props: WillWitnessProps = {
      willId,
      witnessType,
      userId,
      fullName,
      nationalId,
      eligibility,
      status: WitnessStatus.PENDING,
      hasAttested: false,
    };

    return new WillWitness(id, props);
  }

  // Factory: Create from existing (reconstitution)
  public static reconstitute(
    id: string,
    props: WillWitnessProps,
    createdAt: Date,
    updatedAt: Date,
  ): WillWitness {
    const witness = new WillWitness(new UniqueEntityID(id), props, createdAt);
    (witness as any)._updatedAt = updatedAt;
    return witness;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get witnessType(): WitnessType {
    return this.props.witnessType;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get nationalId(): string | undefined {
    return this.props.nationalId;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get eligibility(): WitnessEligibility {
    return this.props.eligibility;
  }

  get signature(): WitnessSignature | undefined {
    return this.props.signature;
  }

  get status(): WitnessStatus {
    return this.props.status;
  }

  get hasAttested(): boolean {
    return this.props.hasAttested;
  }

  get physicalAddress(): string | undefined {
    return this.props.physicalAddress;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  // =========================================================================
  // BUSINESS LOGIC - ELIGIBILITY
  // =========================================================================

  /**
   * Check if witness is eligible (Section 11 LSA compliance)
   */
  public isEligible(): boolean {
    return this.props.eligibility.isEligible();
  }

  /**
   * Check if witness has legal impediment (strict law violation)
   */
  public hasLegalImpediment(): boolean {
    return this.props.eligibility.hasLegalImpediment();
  }

  /**
   * Update eligibility after re-checking
   */
  public updateEligibility(newEligibility: WitnessEligibility): void {
    this.ensureNotDeleted();

    if (this.status !== WitnessStatus.PENDING) {
      throw new Error('Cannot update eligibility after witness has signed');
    }

    (this.props as any).eligibility = newEligibility;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - ATTESTATION
  // =========================================================================

  /**
   * Witness attests to seeing testator sign
   * Section 11 LSA: "in the presence of the testator"
   */
  public attest(attestationText?: string): void {
    this.ensureNotDeleted();

    if (!this.isEligible()) {
      throw new Error(
        `Witness is not eligible: ${this.props.eligibility.getIneligibilityReason()}`,
      );
    }

    if (this.props.hasAttested) {
      throw new Error('Witness has already attested');
    }

    const defaultAttestation =
      'I, the undersigned, hereby declare that I witnessed the testator sign this will ' +
      'in my presence and in the presence of the other witness(es), and that the testator ' +
      'appeared to be of sound mind and under no undue influence at the time of signing.';

    (this.props as any).hasAttested = true;
    (this.props as any).attestationText = attestationText ?? defaultAttestation;
    (this.props as any).attestedAt = new Date();
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - SIGNATURE
  // =========================================================================

  /**
   * Capture witness signature
   * Section 11 LSA: "such witnesses shall subscribe the will"
   */
  public sign(signature: WitnessSignature): void {
    this.ensureNotDeleted();

    if (!this.isEligible()) {
      throw new Error(`Cannot sign: ${this.props.eligibility.getIneligibilityReason()}`);
    }

    if (!this.props.hasAttested) {
      throw new Error('Witness must attest before signing');
    }

    if (this.status === WitnessStatus.SIGNED || this.status === WitnessStatus.VERIFIED) {
      throw new Error('Witness has already signed');
    }

    if (!signature.isCaptured() && !signature.isVerified()) {
      throw new Error('Signature must be captured or verified');
    }

    const legalRequirements = signature.meetsLegalRequirements();
    if (!legalRequirements.valid) {
      throw new Error(`Signature does not meet legal requirements: ${legalRequirements.reason}`);
    }

    (this.props as any).signature = signature;
    (this.props as any).status = WitnessStatus.SIGNED;
    this.incrementVersion();
  }

  /**
   * Verify signature integrity and authenticity
   */
  public verifySignature(verifiedBy: string, method: string): void {
    this.ensureNotDeleted();

    if (!this.props.signature) {
      throw new Error('No signature to verify');
    }

    if (this.status !== WitnessStatus.SIGNED) {
      throw new Error('Can only verify signed witnesses');
    }

    const verifiedSignature = this.props.signature.verify(verifiedBy, method);
    (this.props as any).signature = verifiedSignature;
    (this.props as any).status = WitnessStatus.VERIFIED;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - IDENTITY VERIFICATION
  // =========================================================================

  /**
   * Verify witness identity using official documents
   */
  public verifyIdentity(method: string, documentId?: string): void {
    this.ensureNotDeleted();

    if (!this.props.nationalId && !this.props.userId) {
      throw new Error('Cannot verify identity without National ID or User ID');
    }

    (this.props as any).identityVerificationMethod = method;
    (this.props as any).identityDocumentId = documentId;
    (this.props as any).verifiedAt = new Date();
    this.incrementVersion();
  }

  public isIdentityVerified(): boolean {
    return !!this.props.verifiedAt;
  }

  // =========================================================================
  // BUSINESS LOGIC - REJECTION
  // =========================================================================

  /**
   * Reject witness (declined or found ineligible)
   */
  public reject(reason: string): void {
    this.ensureNotDeleted();

    if (this.status === WitnessStatus.VERIFIED) {
      throw new Error('Cannot reject verified witness');
    }

    (this.props as any).status = WitnessStatus.REJECTED;
    (this.props as any).rejectionReason = reason;
    (this.props as any).rejectedAt = new Date();
    this.incrementVersion();
  }

  public isRejected(): boolean {
    return this.status === WitnessStatus.REJECTED;
  }

  // =========================================================================
  // BUSINESS LOGIC - VALIDATION
  // =========================================================================

  /**
   * Check if witness meets all Section 11 LSA requirements
   */
  public meetsLegalRequirements(): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Eligibility check
    if (!this.isEligible()) {
      violations.push(this.props.eligibility.getIneligibilityReason());
    }

    // Signature check
    if (!this.props.signature) {
      violations.push('Witness has not signed');
    } else {
      const sigRequirements = this.props.signature.meetsLegalRequirements();
      if (!sigRequirements.valid) {
        violations.push(sigRequirements.reason!);
      }
    }

    // Attestation check
    if (!this.props.hasAttested) {
      violations.push('Witness has not attested');
    }

    // Status check
    if (this.status === WitnessStatus.REJECTED) {
      violations.push('Witness was rejected');
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Check if this witness was present simultaneously with another witness
   * Section 11 LSA: "two or more witnesses present at the same time"
   */
  public wasSimultaneousWith(otherWitness: WillWitness): boolean {
    if (!this.props.signature || !otherWitness.props.signature) {
      return false;
    }

    return this.props.signature.isSimultaneousWith(otherWitness.props.signature);
  }

  // =========================================================================
  // BUSINESS LOGIC - PROFESSIONAL WITNESSES
  // =========================================================================

  /**
   * Set professional credentials (for lawyers, notaries)
   */
  public setProfessionalCredentials(licenseNumber: string, issuingBody: string): void {
    this.ensureNotDeleted();

    if (
      this.props.witnessType !== WitnessType.PROFESSIONAL_WITNESS &&
      this.props.witnessType !== WitnessType.NOTARY_PUBLIC
    ) {
      throw new Error('Only professional witnesses can have credentials');
    }

    (this.props as any).professionalLicenseNumber = licenseNumber;
    (this.props as any).licenseIssuingBody = issuingBody;
    this.incrementVersion();
  }

  public isProfessional(): boolean {
    return [
      WitnessType.PROFESSIONAL_WITNESS,
      WitnessType.NOTARY_PUBLIC,
      WitnessType.COURT_OFFICER,
    ].includes(this.props.witnessType);
  }

  // =========================================================================
  // BUSINESS LOGIC - CONTACT
  // =========================================================================

  /**
   * Update contact details (for legal notices)
   */
  public updateContactDetails(
    email?: string,
    phoneNumber?: string,
    physicalAddress?: string,
    county?: string,
  ): void {
    this.ensureNotDeleted();

    if (email) (this.props as any).email = email;
    if (phoneNumber) (this.props as any).phoneNumber = phoneNumber;
    if (physicalAddress) (this.props as any).physicalAddress = physicalAddress;
    if (county) (this.props as any).county = county;

    this.incrementVersion();
  }

  public hasContactDetails(): boolean {
    return !!(this.props.email || this.props.phoneNumber || this.props.physicalAddress);
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isPending(): boolean {
    return this.status === WitnessStatus.PENDING;
  }

  public isSigned(): boolean {
    return this.status === WitnessStatus.SIGNED;
  }

  public isVerified(): boolean {
    return this.status === WitnessStatus.VERIFIED;
  }

  public isComplete(): boolean {
    return (
      this.isVerified() &&
      this.isEligible() &&
      this.props.hasAttested &&
      this.props.signature?.isValid()
    );
  }

  public canBeUsedInCourt(): boolean {
    const legalCheck = this.meetsLegalRequirements();
    return legalCheck.valid && this.isIdentityVerified();
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.props.willId,
      witnessType: this.props.witnessType,
      userId: this.props.userId,
      fullName: this.props.fullName,
      nationalId: this.props.nationalId,
      email: this.props.email,
      phoneNumber: this.props.phoneNumber,
      eligibility: this.props.eligibility.toJSON(),
      signature: this.props.signature?.toJSON(),
      status: this.props.status,
      hasAttested: this.props.hasAttested,
      attestationText: this.props.attestationText,
      attestedAt: this.props.attestedAt?.toISOString(),
      identityVerificationMethod: this.props.identityVerificationMethod,
      verifiedAt: this.props.verifiedAt?.toISOString(),
      rejectionReason: this.props.rejectionReason,
      rejectedAt: this.props.rejectedAt?.toISOString(),
      physicalAddress: this.props.physicalAddress,
      county: this.props.county,
      professionalLicenseNumber: this.props.professionalLicenseNumber,
      licenseIssuingBody: this.props.licenseIssuingBody,
      isComplete: this.isComplete(),
      meetsLegalRequirements: this.meetsLegalRequirements(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
