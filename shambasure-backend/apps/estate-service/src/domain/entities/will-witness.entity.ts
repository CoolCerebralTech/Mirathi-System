// domain/entities/will-witness.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Will Witness Entity
 *
 * Kenyan Legal Context (Law of Succession Act, Cap 160):
 * - S.11 LSA: Formal validity of wills (two witnesses required)
 * - S.13 LSA: Competent witnesses
 * - S.14 LSA: Attestation clause
 *
 * Critical Legal Requirements:
 * 1. At least TWO competent witnesses
 * 2. Witnesses must sign in presence of testator AND each other
 * 3. Witnesses cannot be beneficiaries or spouses of beneficiaries
 * 4. Witnesses must be of sound mind and not minors
 * 5. Attestation clause must be properly worded
 *
 * Entity Scope:
 * 1. Represents a single witness to a will
 * 2. Tracks witness signature and attestation
 * 3. Validates witness eligibility
 * 4. Manages witness confirmation process
 */

// =========================================================================
// VALUE OBJECTS
// =========================================================================

/**
 * Witness Identity Value Object
 */
export class WitnessIdentity {
  constructor(
    readonly fullName: string,
    readonly nationalId: string,
    readonly dateOfBirth?: Date,
  ) {
    if (!fullName || fullName.trim().length < 2) {
      throw new Error('Witness full name is required');
    }

    if (!nationalId || !this.isValidKenyanId(nationalId)) {
      throw new Error('Valid Kenyan National ID is required');
    }

    // Date of birth validation if provided
    if (dateOfBirth && dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }
  }

  private isValidKenyanId(id: string): boolean {
    const cleaned = id.trim().toUpperCase();
    const oldFormat = /^\d{8}$/;
    const newFormat = /^\d{8}[A-Z]\d{3}$/;
    return oldFormat.test(cleaned) || newFormat.test(cleaned);
  }

  equals(other: WitnessIdentity): boolean {
    return this.nationalId === other.nationalId;
  }

  get age(): number | undefined {
    if (!this.dateOfBirth) return undefined;
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  isAdult(): boolean | undefined {
    const age = this.age;
    return age ? age >= 18 : undefined;
  }

  toString(): string {
    return `${this.fullName} (ID: ${this.nationalId})`;
  }
}

/**
 * Witness Signature Details Value Object
 */
export class WitnessSignature {
  constructor(
    readonly signedAt: Date,
    readonly location?: string,
    readonly method?: 'PHYSICAL' | 'DIGITAL' | 'VIDEO',
    readonly deviceId?: string,
    readonly ipAddress?: string,
  ) {
    if (!signedAt || !(signedAt instanceof Date)) {
      throw new Error('Valid signature timestamp is required');
    }

    // Cannot sign in the future
    if (signedAt > new Date()) {
      throw new Error('Signature timestamp cannot be in the future');
    }
  }

  equals(other: WitnessSignature): boolean {
    return (
      this.signedAt.getTime() === other.signedAt.getTime() &&
      this.location === other.location &&
      this.method === other.method
    );
  }

  isDigital(): boolean {
    return this.method === 'DIGITAL';
  }

  isPhysical(): boolean {
    return this.method === 'PHYSICAL';
  }

  toJSON() {
    return {
      signedAt: this.signedAt.toISOString(),
      location: this.location,
      method: this.method,
      isDigital: this.isDigital(),
      isPhysical: this.isPhysical(),
    };
  }
}

/**
 * Witness Attestation Value Object
 * S.14 LSA: Attestation clause wording
 */
export class AttestationClause {
  constructor(
    readonly text: string,
    readonly version: string = 'STANDARD_KENYAN',
  ) {
    if (!text || text.trim().length < 50) {
      throw new Error('Attestation clause must be meaningful text');
    }

    // Must contain key legal phrases
    const requiredPhrases = [
      'signed by the testator',
      'in our presence',
      'at the same time',
      'witnesses',
    ];

    const textLower = text.toLowerCase();
    for (const phrase of requiredPhrases) {
      if (!textLower.includes(phrase)) {
        throw new Error(`Attestation clause must include: "${phrase}"`);
      }
    }
  }

  equals(other: AttestationClause): boolean {
    return this.text === other.text && this.version === other.version;
  }

  static createStandard(): AttestationClause {
    const text = `SIGNED by the Testator as his/her last Will and Testament in our presence, and at the same time, and we in his/her presence and in the presence of each other have hereunto subscribed our names as witnesses.`;
    return new AttestationClause(text, 'STANDARD_KENYAN');
  }

  static createDigital(): AttestationClause {
    const text = `SIGNED electronically by the Testator as his/her last Will and Testament in our presence via secure video link, and at the same time, and we in his/her presence and in the presence of each other have hereunto subscribed our names as witnesses.`;
    return new AttestationClause(text, 'DIGITAL_WITNESSING');
  }

  toString(): string {
    return this.text;
  }
}

// =========================================================================
// ENUMS
// =========================================================================

/**
 * Witness Status
 */
export enum WitnessStatus {
  INVITED = 'INVITED', // Invited to witness will
  CONFIRMED = 'CONFIRMED', // Confirmed willingness to witness
  PRESENT = 'PRESENT', // Present during will signing
  SIGNED = 'SIGNED', // Has signed as witness
  REJECTED = 'REJECTED', // Declined to witness
  DISQUALIFIED = 'DISQUALIFIED', // Found ineligible (S.13 LSA)
  WITHDRAWN = 'WITHDRAWN', // Withdrew after confirmation
}

/**
 * Witness Eligibility Status
 * S.13 LSA: Competent witnesses
 */
export enum WitnessEligibility {
  ELIGIBLE = 'ELIGIBLE', // Meets all requirements
  INELIGIBLE_MINOR = 'INELIGIBLE_MINOR', // Below 18 years
  INELIGIBLE_BENEFICIARY = 'INELIGIBLE_BENEFICIARY', // Is a beneficiary
  INELIGIBLE_SPOUSE = 'INELIGIBLE_SPOUSE', // Spouse of beneficiary
  INELIGIBLE_MENTAL = 'INELIGIBLE_MENTAL', // Not of sound mind
  INELIGIBLE_BLIND = 'INELIGIBLE_BLIND', // Blind (cannot see signing)
  INELIGIBLE_ILLITERATE = 'INELIGIBLE_ILLITERATE', // Cannot read/write
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // Needs verification
  UNKNOWN = 'UNKNOWN', // Not yet assessed
}

/**
 * Witness Relationship to Testator
 */
export enum WitnessRelationship {
  FRIEND = 'FRIEND',
  FAMILY_MEMBER = 'FAMILY_MEMBER',
  PROFESSIONAL = 'PROFESSIONAL', // Lawyer, doctor, etc.
  NEIGHBOR = 'NEIGHBOR',
  COLLEAGUE = 'COLLEAGUE',
  OTHER = 'OTHER',
}

// =========================================================================
// WILL WITNESS ENTITY
// =========================================================================

interface WillWitnessProps {
  willId: string; // Reference to parent Will aggregate
  testatorId: string; // Reference to testator

  // Identity
  identity: WitnessIdentity;
  relationship: WitnessRelationship;
  relationshipDetails?: string; // e.g., "Family friend for 10 years"

  // Status
  status: WitnessStatus;
  eligibility: WitnessEligibility;

  // Signature & Attestation
  signature?: WitnessSignature; // When witness signed
  attestationClause: AttestationClause; // S.14 LSA requirement

  // Contact & Location
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };

  // Legal Capacity
  isOfSoundMind: boolean;
  canReadWrite: boolean; // Must be able to read attestation
  canSee: boolean; // Must be able to see signing (S.11)

  // Timeline
  invitedAt: Date; // When invited to witness
  confirmedAt?: Date; // When confirmed willingness
  presentAt?: Date; // When present during signing
  signedAt?: Date; // When signed (from signature.signedAt)
  disqualifiedAt?: Date; // When found ineligible

  // Evidence
  idDocumentUrl?: string; // National ID scan
  confirmationEvidence?: string; // Email/SMS confirmation

  // Metadata
  notes?: string;
  disqualificationReason?: string;
}

export class WillWitness extends Entity<WillWitnessProps> {
  // =========================================================================
  // CONSTRUCTOR & FACTORY
  // =========================================================================

  private constructor(props: WillWitnessProps, id?: UniqueEntityID) {
    // Domain Rule: Witness must be able to see signing (S.11 LSA)
    if (!props.canSee) {
      throw new Error('Witness must be able to see the signing (S.11 LSA)');
    }

    // Domain Rule: Witness must be able to read/write attestation
    if (!props.canReadWrite) {
      throw new Error('Witness must be able to read and write');
    }

    // Domain Rule: Must be of sound mind
    if (!props.isOfSoundMind) {
      throw new Error('Witness must be of sound mind (S.13 LSA)');
    }

    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory: Create witness invitation
   */
  public static create(
    willId: string,
    testatorId: string,
    identity: WitnessIdentity,
    relationship: WitnessRelationship,
    contactInfo: WillWitnessProps['contactInfo'],
    relationshipDetails?: string,
  ): WillWitness {
    const props: WillWitnessProps = {
      willId,
      testatorId,
      identity,
      relationship,
      relationshipDetails,
      status: WitnessStatus.INVITED,
      eligibility: WitnessEligibility.PENDING_VERIFICATION,
      attestationClause: AttestationClause.createStandard(),
      contactInfo,
      isOfSoundMind: true, // Assumed until proven otherwise
      canReadWrite: true, // Assumed until proven otherwise
      canSee: true, // Assumed until proven otherwise
      invitedAt: new Date(),
    };

    return new WillWitness(props);
  }

  /**
   * Factory: Create professional witness (lawyer, notary)
   */
  public static createProfessional(
    willId: string,
    testatorId: string,
    identity: WitnessIdentity,
    profession: string,
    contactInfo: WillWitnessProps['contactInfo'],
  ): WillWitness {
    const witness = WillWitness.create(
      willId,
      testatorId,
      identity,
      WitnessRelationship.PROFESSIONAL,
      contactInfo,
      `Professional ${profession}`,
    );

    // Professional witnesses get digital attestation clause
    witness.updateAttestationClause(AttestationClause.createDigital());

    return witness;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: WillWitnessProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): WillWitness {
    const witness = new WillWitness(props, new UniqueEntityID(id));
    (witness as any)._createdAt = createdAt;
    (witness as any)._updatedAt = updatedAt;
    (witness as any)._version = version;
    return witness;
  }

  // =========================================================================
  // BUSINESS LOGIC (MUTATIONS)
  // =========================================================================

  /**
   * Confirm willingness to witness
   */
  public confirm(at: Date = new Date()): void {
    if (this.status !== WitnessStatus.INVITED) {
      throw new Error('Can only confirm from INVITED status');
    }

    // Must verify eligibility first
    if (this.eligibility === WitnessEligibility.PENDING_VERIFICATION) {
      throw new Error('Must verify eligibility before confirmation');
    }

    if (this.eligibility !== WitnessEligibility.ELIGIBLE) {
      throw new Error('Only eligible witnesses can confirm');
    }

    this.updateState({
      status: WitnessStatus.CONFIRMED,
      confirmedAt: at,
    });
  }

  /**
   * Mark as present during will signing (S.11: simultaneous presence)
   */
  public markPresent(at: Date = new Date()): void {
    if (this.status !== WitnessStatus.CONFIRMED) {
      throw new Error('Witness must be confirmed before being marked present');
    }

    this.updateState({
      status: WitnessStatus.PRESENT,
      presentAt: at,
    });
  }

  /**
   * Sign as witness (S.11 LSA: signature in presence of testator)
   */
  public sign(signature: WitnessSignature, attestationClause?: AttestationClause): void {
    // Domain Rule: Must be present to sign (S.11 LSA)
    if (this.status !== WitnessStatus.PRESENT) {
      throw new Error('Witness must be present to sign (S.11 LSA)');
    }

    // Domain Rule: Must be eligible
    if (this.eligibility !== WitnessEligibility.ELIGIBLE) {
      throw new Error('Ineligible witness cannot sign');
    }

    const updates: Partial<WillWitnessProps> = {
      status: WitnessStatus.SIGNED,
      signature,
      signedAt: signature.signedAt,
    };

    if (attestationClause) {
      updates.attestationClause = attestationClause;
    }

    this.updateState(updates);
  }

  /**
   * Update eligibility status (S.13 LSA)
   */
  public updateEligibility(eligibility: WitnessEligibility, reason?: string): void {
    // Domain Rule: Cannot sign if not eligible
    if (this.status === WitnessStatus.SIGNED && eligibility !== WitnessEligibility.ELIGIBLE) {
      throw new Error('Cannot change eligibility of already signed witness');
    }

    const updates: Partial<WillWitnessProps> = {
      eligibility,
    };

    // Handle disqualification
    if (eligibility !== WitnessEligibility.ELIGIBLE) {
      updates.status = WitnessStatus.DISQUALIFIED;
      updates.disqualifiedAt = new Date();
      updates.disqualificationReason = reason;
    }

    // If re-qualifying from disqualified state
    if (eligibility === WitnessEligibility.ELIGIBLE && this.status === WitnessStatus.DISQUALIFIED) {
      updates.status = WitnessStatus.INVITED;
      updates.disqualificationReason = undefined;
    }

    this.updateState(updates);
  }

  /**
   * Reject invitation to witness
   */
  public reject(reason?: string): void {
    const allowedStatuses = [WitnessStatus.INVITED, WitnessStatus.CONFIRMED];

    if (!allowedStatuses.includes(this.status)) {
      throw new Error('Cannot reject from current status');
    }

    this.updateState({
      status: WitnessStatus.REJECTED,
      disqualificationReason: reason,
    });
  }

  /**
   * Withdraw as witness (after confirmation)
   */
  public withdraw(reason?: string): void {
    if (this.status !== WitnessStatus.CONFIRMED) {
      throw new Error('Can only withdraw from CONFIRMED status');
    }

    this.updateState({
      status: WitnessStatus.WITHDRAWN,
      disqualificationReason: reason,
    });
  }

  /**
   * Update attestation clause (S.14 LSA)
   */
  public updateAttestationClause(clause: AttestationClause): void {
    if (this.status === WitnessStatus.SIGNED) {
      throw new Error('Cannot change attestation clause after signing');
    }

    this.updateState({
      attestationClause: clause,
    });
  }

  /**
   * Update contact information
   */
  public updateContactInfo(contactInfo: WillWitnessProps['contactInfo']): void {
    if (this.status === WitnessStatus.SIGNED) {
      throw new Error('Cannot change contact information after signing');
    }

    this.updateState({
      contactInfo,
    });
  }

  /**
   * Update witness capacity flags
   */
  public updateCapacity(isOfSoundMind: boolean, canReadWrite: boolean, canSee: boolean): void {
    // Domain Rule: Cannot be signed if capacity changes
    if (this.status === WitnessStatus.SIGNED) {
      throw new Error('Cannot change capacity after signing');
    }

    // Domain Rule: Must be able to see (S.11 LSA)
    if (!canSee) {
      throw new Error('Witness must be able to see the signing');
    }

    // Update eligibility based on capacity
    let newEligibility = this.eligibility;
    if (!isOfSoundMind) {
      newEligibility = WitnessEligibility.INELIGIBLE_MENTAL;
    } else if (!canReadWrite) {
      newEligibility = WitnessEligibility.INELIGIBLE_ILLITERATE;
    } else if (!canSee) {
      newEligibility = WitnessEligibility.INELIGIBLE_BLIND;
    }

    this.updateState({
      isOfSoundMind,
      canReadWrite,
      canSee,
      eligibility: newEligibility,
    });
  }

  // =========================================================================
  // QUERY METHODS (PURE)
  // =========================================================================

  /**
   * Check if witness is eligible (S.13 LSA)
   */
  public isEligible(): boolean {
    return this.eligibility === WitnessEligibility.ELIGIBLE;
  }

  /**
   * Check if witness has signed
   */
  public hasSigned(): boolean {
    return this.status === WitnessStatus.SIGNED;
  }

  /**
   * Check if witness is confirmed and ready
   */
  public isReady(): boolean {
    return this.status === WitnessStatus.CONFIRMED && this.isEligible();
  }

  /**
   * Check if witness is present (for simultaneous signing)
   */
  public isPresent(): boolean {
    return this.status === WitnessStatus.PRESENT || this.status === WitnessStatus.SIGNED;
  }

  /**
   * Get witness age (if known)
   */
  public getAge(): number | undefined {
    return this.identity.age;
  }

  /**
   * Check if witness is adult (S.13 LSA: not a minor)
   */
  public isAdult(): boolean {
    const age = this.getAge();
    if (age === undefined) {
      // If age unknown, assume adult until proven otherwise
      return this.eligibility !== WitnessEligibility.INELIGIBLE_MINOR;
    }
    return age >= 18;
  }

  /**
   * Check if witness meets S.11 LSA requirements
   */
  public meetsS11Requirements(): boolean {
    return (
      this.isEligible() &&
      this.isAdult() &&
      this.isOfSoundMind &&
      this.canSee &&
      this.canReadWrite &&
      this.hasValidIdentity()
    );
  }

  /**
   * Check if witness identity is valid
   */
  public hasValidIdentity(): boolean {
    return !!(this.identity.fullName && this.identity.nationalId);
  }

  /**
   * Check if witness signed digitally
   */
  public signedDigitally(): boolean {
    return this.signature?.isDigital() || false;
  }

  /**
   * Get time since invitation
   */
  public timeSinceInvitation(): number {
    const now = new Date();
    return now.getTime() - this.invitedAt.getTime();
  }

  // =========================================================================
  // PROPERTY GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get testatorId(): string {
    return this.props.testatorId;
  }

  get identity(): WitnessIdentity {
    return this.props.identity;
  }

  get relationship(): WitnessRelationship {
    return this.props.relationship;
  }

  get relationshipDetails(): string | undefined {
    return this.props.relationshipDetails;
  }

  get status(): WitnessStatus {
    return this.props.status;
  }

  get eligibility(): WitnessEligibility {
    return this.props.eligibility;
  }

  get signature(): WitnessSignature | undefined {
    return this.props.signature;
  }

  get attestationClause(): AttestationClause {
    return this.props.attestationClause;
  }

  get contactInfo(): WillWitnessProps['contactInfo'] {
    return { ...this.props.contactInfo };
  }

  get isOfSoundMind(): boolean {
    return this.props.isOfSoundMind;
  }

  get canReadWrite(): boolean {
    return this.props.canReadWrite;
  }

  get canSee(): boolean {
    return this.props.canSee;
  }

  get invitedAt(): Date {
    return this.props.invitedAt;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get presentAt(): Date | undefined {
    return this.props.presentAt;
  }

  get signedAt(): Date | undefined {
    return this.props.signedAt;
  }

  get disqualifiedAt(): Date | undefined {
    return this.props.disqualifiedAt;
  }

  get idDocumentUrl(): string | undefined {
    return this.props.idDocumentUrl;
  }

  get confirmationEvidence(): string | undefined {
    return this.props.confirmationEvidence;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get disqualificationReason(): string | undefined {
    return this.props.disqualificationReason;
  }

  // Status checkers
  public isInvited(): boolean {
    return this.status === WitnessStatus.INVITED;
  }

  public isConfirmed(): boolean {
    return this.status === WitnessStatus.CONFIRMED;
  }

  public isRejected(): boolean {
    return this.status === WitnessStatus.REJECTED;
  }

  public isDisqualified(): boolean {
    return this.status === WitnessStatus.DISQUALIFIED;
  }

  public isWithdrawn(): boolean {
    return this.status === WitnessStatus.WITHDRAWN;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  /**
   * Validate witness against Kenyan legal requirements
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // S.11 LSA: Basic requirements
    if (!this.hasValidIdentity()) {
      errors.push('Witness must have valid name and National ID');
    }

    if (!this.isAdult()) {
      errors.push('Witness must be at least 18 years old (S.13 LSA)');
    }

    if (!this.isOfSoundMind) {
      errors.push('Witness must be of sound mind (S.13 LSA)');
    }

    if (!this.canSee) {
      errors.push('Witness must be able to see the signing (S.11 LSA)');
    }

    if (!this.canReadWrite) {
      warnings.push('Witness should be able to read and write for proper attestation');
    }

    // S.13 LSA: Ineligibility conditions
    if (!this.isEligible()) {
      const reason = this.getEligibilityReason();
      errors.push(`Witness is ineligible: ${reason}`);
    }

    // Contact information for notification
    if (!this.contactInfo.phone && !this.contactInfo.email) {
      warnings.push('Witness should have at least one contact method');
    }

    // Professional witnesses preferred
    if (this.relationship === WitnessRelationship.FAMILY_MEMBER) {
      warnings.push('Family members as witnesses may raise conflict of interest concerns');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private getEligibilityReason(): string {
    switch (this.eligibility) {
      case WitnessEligibility.INELIGIBLE_MINOR:
        return 'Witness is a minor';
      case WitnessEligibility.INELIGIBLE_BENEFICIARY:
        return 'Witness is a beneficiary of the will';
      case WitnessEligibility.INELIGIBLE_SPOUSE:
        return 'Witness is spouse of a beneficiary';
      case WitnessEligibility.INELIGIBLE_MENTAL:
        return 'Witness is not of sound mind';
      case WitnessEligibility.INELIGIBLE_BLIND:
        return 'Witness cannot see the signing';
      case WitnessEligibility.INELIGIBLE_ILLITERATE:
        return 'Witness cannot read/write';
      default:
        return 'Unknown eligibility issue';
    }
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    const validation = this.validate();

    return {
      id: this.id.toString(),
      willId: this.willId,
      testatorId: this.testatorId,

      // Identity
      identity: {
        fullName: this.identity.fullName,
        nationalId: this.identity.nationalId,
        maskedNationalId: this.maskNationalId(this.identity.nationalId),
        age: this.identity.age,
        isAdult: this.identity.isAdult(),
      },

      // Relationship
      relationship: this.relationship,
      relationshipDetails: this.relationshipDetails,

      // Status
      status: this.status,
      eligibility: this.eligibility,
      isEligible: this.isEligible(),
      meetsS11Requirements: this.meetsS11Requirements(),

      // Signature
      signature: this.signature?.toJSON(),
      hasSigned: this.hasSigned(),
      signedDigitally: this.signedDigitally(),
      signedAt: this.signedAt?.toISOString(),

      // Attestation
      attestationClause: {
        text: this.attestationClause.text,
        version: this.attestationClause.version,
      },

      // Capacity
      isOfSoundMind: this.isOfSoundMind,
      canReadWrite: this.canReadWrite,
      canSee: this.canSee,

      // Contact
      contactInfo: this.contactInfo,

      // Timeline
      invitedAt: this.invitedAt.toISOString(),
      confirmedAt: this.confirmedAt?.toISOString(),
      presentAt: this.presentAt?.toISOString(),
      disqualifiedAt: this.disqualifiedAt?.toISOString(),
      timeSinceInvitationMs: this.timeSinceInvitation(),

      // Evidence
      idDocumentUrl: this.idDocumentUrl,
      confirmationEvidence: this.confirmationEvidence,

      // Metadata
      notes: this.notes,
      disqualificationReason: this.disqualificationReason,

      // Validation
      validation,

      // Status flags
      isInvited: this.isInvited(),
      isConfirmed: this.isConfirmed(),
      isPresent: this.isPresent(),
      isRejected: this.isRejected(),
      isDisqualified: this.isDisqualified(),
      isWithdrawn: this.isWithdrawn(),
      isReady: this.isReady(),

      // System
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }

  private maskNationalId(nationalId: string): string {
    if (nationalId.length === 8) {
      return `***${nationalId.slice(-3)}`;
    } else if (nationalId.length === 12) {
      return `***${nationalId.slice(-6)}`;
    }
    return '********';
  }
}
