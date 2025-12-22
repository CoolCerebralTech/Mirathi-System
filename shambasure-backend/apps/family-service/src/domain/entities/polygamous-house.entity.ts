// domain/entities/polygamous-house.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidPolygamousStructureException } from '../exceptions/family.exception';

/**
 * PolygamousHouse Entity Props (Immutable)
 *
 * Design Decision: PolygamousHouse is an ENTITY within Family aggregate
 * - Represents one "house" in a polygamous family structure
 * - Critical for S. 40 LSA succession calculations
 * - Each house gets equal share of estate (unless testator specifies otherwise)
 *
 * Kenyan Law Context (S. 40 LSA):
 * - Polygamous marriages recognized under Customary/Islamic law
 * - Each wife and her children form a "house"
 * - Estate divided equally among houses (S. 40(2))
 * - Court certification required for legal recognition
 * - Wives' consent critical for validity
 *
 * Key Requirements:
 * 1. Court recognition (S. 40 certificate)
 * 2. Wives' consent (all co-wives must agree)
 * 3. Equal distribution (unless testator specifies otherwise)
 * 4. Separate property tracking (each house can own assets)
 */
export interface PolygamousHouseProps {
  // References
  familyId: UniqueEntityID;

  // House Identity
  houseName: string; // e.g., "First House", "Senior Wife's House"
  houseOrder: number; // 1 = first house, 2 = second house, etc.
  establishedDate: Date; // When house was established (marriage date)

  // House Head (Wife)
  houseHeadId?: UniqueEntityID; // The wife who heads this house

  // S. 40 LSA Court Certification
  courtRecognized: boolean;
  courtOrderNumber?: string;
  s40CertificateNumber?: string;
  certificateIssuedDate?: Date;
  certificateIssuingCourt?: string;

  // Estate Distribution
  houseSharePercentage?: number; // Manual override (default = equal share)

  // Business & Property Tracking
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
  separateProperty: boolean; // Does house own separate property?

  // Wives' Consent (Critical for S. 40 Validity)
  wivesConsentObtained: boolean;
  wivesConsentDocumentId?: UniqueEntityID; // Reference to document-service
  wivesAgreementDetails?: WivesConsentDetails;

  // Succession Planning
  successionInstructions?: string; // Testator's specific instructions

  // House Dissolution (on death of husband)
  houseDissolvedAt?: Date;
  houseAssetsFrozen: boolean; // Prevents inter-house transfers during succession
}

/**
 * Wives Consent Details
 * Tracks which wives agreed to the polygamous structure
 */
export interface WivesConsentDetails {
  consentDate: Date;
  consentingWives: Array<{
    wifeId: string;
    wifeName: string;
    consentedAt: Date;
    signatureWitness?: string;
  }>;
  notarized: boolean;
  notaryName?: string;
  notaryLicenseNumber?: string;
}

/**
 * Factory Props for Creating New House
 */
export interface CreatePolygamousHouseProps {
  familyId: string;
  houseName: string;
  houseOrder: number;
  establishedDate: Date;

  // House Head (Wife)
  houseHeadId?: string;

  // S. 40 Certification
  courtRecognized?: boolean;
  s40CertificateNumber?: string;
  certificateIssuedDate?: Date;
  certificateIssuingCourt?: string;
  courtOrderNumber?: string;

  // Wives Consent
  wivesConsentObtained?: boolean;
  wivesConsentDocumentId?: string;
  wivesConsentDetails?: {
    consentDate: Date;
    consentingWives: Array<{
      wifeId: string;
      wifeName: string;
      consentedAt: Date;
      signatureWitness?: string;
    }>;
    notarized?: boolean;
    notaryName?: string;
    notaryLicenseNumber?: string;
  };

  // Distribution
  houseSharePercentage?: number;

  // Business
  houseBusinessName?: string;
  houseBusinessKraPin?: string;
  separateProperty?: boolean;

  // Instructions
  successionInstructions?: string;
}

/**
 * PolygamousHouse Entity
 *
 * Represents one "house" in a polygamous family under S. 40 LSA.
 * Critical for proper succession distribution.
 *
 * S. 40 LSA Key Provisions:
 * 1. Estate divided equally among houses (S. 40(2))
 * 2. Each house = wife + her children
 * 3. Children inherit within their house
 * 4. Wives' consent required for subsequent marriages
 * 5. Court certification validates structure
 *
 * Business Rules:
 * - First house (houseOrder = 1) doesn't need S. 40 certification
 * - Subsequent houses require court recognition
 * - All wives must consent to new marriages
 * - House assets frozen on death of husband
 * - Equal distribution unless testator specifies otherwise
 */
export class PolygamousHouse extends Entity<PolygamousHouseProps> {
  private constructor(id: UniqueEntityID, props: PolygamousHouseProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  /**
   * Create new polygamous house
   *
   * Kenyan Law Context:
   * - First house = original marriage (no certification needed)
   * - Subsequent houses = additional marriages (need S. 40 certification)
   * - Wives' consent required for houses 2+
   */
  public static create(props: CreatePolygamousHouseProps): PolygamousHouse {
    const id = new UniqueEntityID();
    const now = new Date();

    const houseProps: PolygamousHouseProps = {
      familyId: new UniqueEntityID(props.familyId),
      houseName: props.houseName,
      houseOrder: props.houseOrder,
      establishedDate: props.establishedDate,
      houseHeadId: props.houseHeadId ? new UniqueEntityID(props.houseHeadId) : undefined,

      // S. 40 Certification
      courtRecognized: props.courtRecognized || false,
      courtOrderNumber: props.courtOrderNumber,
      s40CertificateNumber: props.s40CertificateNumber,
      certificateIssuedDate: props.certificateIssuedDate,
      certificateIssuingCourt: props.certificateIssuingCourt,

      // Distribution
      houseSharePercentage: props.houseSharePercentage,

      // Business
      houseBusinessName: props.houseBusinessName,
      houseBusinessKraPin: props.houseBusinessKraPin,
      separateProperty: props.separateProperty || false,

      // Wives Consent
      wivesConsentObtained: props.wivesConsentObtained || false,
      wivesConsentDocumentId: props.wivesConsentDocumentId
        ? new UniqueEntityID(props.wivesConsentDocumentId)
        : undefined,
      wivesAgreementDetails: props.wivesConsentDetails,

      // Instructions
      successionInstructions: props.successionInstructions,

      // Status
      houseAssetsFrozen: false,
    };

    return new PolygamousHouse(id, houseProps, now);
  }

  /**
   * Reconstitute from persistence (Repository)
   */
  public static fromPersistence(
    id: string,
    props: PolygamousHouseProps,
    createdAt: Date,
    updatedAt?: Date,
  ): PolygamousHouse {
    const entityId = new UniqueEntityID(id);
    const house = new PolygamousHouse(entityId, props, createdAt);

    if (updatedAt) {
      (house as any)._updatedAt = updatedAt;
    }

    return house;
  }

  // =========================================================================
  // VALIDATION (Invariants)
  // =========================================================================

  /**
   * Validate polygamous house invariants
   *
   * Kenyan Law Requirements (S. 40 LSA):
   * - House name required
   * - House order must be positive
   * - Established date cannot be future
   * - Share percentage must be 0-100
   * - Court recognized houses need certificate
   * - Subsequent houses need wives' consent
   */
  public validate(): void {
    // Basic validation
    if (!this.props.houseName || this.props.houseName.trim().length === 0) {
      throw new InvalidPolygamousStructureException('House name is required');
    }

    if (this.props.houseOrder < 1) {
      throw new InvalidPolygamousStructureException(
        'House order must be 1 or greater (1 = first house)',
      );
    }

    if (this.props.establishedDate > new Date()) {
      throw new InvalidPolygamousStructureException('Established date cannot be in the future');
    }

    // Share percentage validation
    if (
      this.props.houseSharePercentage !== undefined &&
      (this.props.houseSharePercentage < 0 || this.props.houseSharePercentage > 100)
    ) {
      throw new InvalidPolygamousStructureException(
        'House share percentage must be between 0 and 100',
      );
    }

    // S. 40 LSA Compliance
    if (this.props.courtRecognized && !this.props.s40CertificateNumber) {
      throw new InvalidPolygamousStructureException(
        'Court recognized house must have S. 40 certificate number',
      );
    }

    // Wives consent requirement (subsequent houses)
    if (this.props.houseOrder > 1 && !this.props.wivesConsentObtained) {
      console.warn(
        `Warning: House ${this.props.houseOrder} lacks documented wives consent. ` +
          `May face legal challenges under S. 40 LSA.`,
      );
    }

    // First house validation (doesn't need certification)
    if (this.props.houseOrder === 1 && this.props.courtRecognized) {
      console.warn(
        'First house typically does not require court certification. ' +
          'S. 40 certification is for subsequent marriages.',
      );
    }
  }

  // =========================================================================
  // BUSINESS LOGIC (State Transitions)
  // =========================================================================

  /**
   * Change house head (wife)
   * Required when original wife dies or remarries
   */
  public changeHouseHead(newHeadId: string, reason: string): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    const newHeadEntityId = new UniqueEntityID(newHeadId);

    // No change needed
    if (this.props.houseHeadId?.equals(newHeadEntityId)) {
      return this;
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseHeadId: newHeadEntityId,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Certify under S. 40 LSA (Court recognition)
   *
   * Required for subsequent marriages in polygamous family.
   * Court validates:
   * 1. All wives consented
   * 2. Husband can support all wives
   * 3. No bigamy violation
   */
  public certifyUnderSection40(params: {
    certificateNumber: string;
    courtStation: string;
    issuedDate?: Date;
    courtOrderNumber?: string;
  }): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    // Already certified with same certificate
    if (this.props.s40CertificateNumber === params.certificateNumber) {
      return this;
    }

    // Different certificate - not allowed
    if (this.props.s40CertificateNumber) {
      throw new InvalidPolygamousStructureException(
        `House already certified with certificate ${this.props.s40CertificateNumber}`,
      );
    }

    // Must have house head before certification
    if (!this.props.houseHeadId) {
      throw new InvalidPolygamousStructureException(
        'House must have a head (wife) before S. 40 certification',
      );
    }

    // First house doesn't need certification
    if (this.props.houseOrder === 1) {
      console.warn(
        'Certifying first house under S. 40. Typically only subsequent houses require certification.',
      );
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      s40CertificateNumber: params.certificateNumber,
      courtRecognized: true,
      certificateIssuingCourt: params.courtStation,
      certificateIssuedDate: params.issuedDate || new Date(),
      courtOrderNumber:
        params.courtOrderNumber || `S40-${params.courtStation}-${params.certificateNumber}`,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Update house share percentage
   * Default = equal share, but testator can specify different distribution
   */
  public updateHouseShare(percentage: number): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    if (percentage < 0 || percentage > 100) {
      throw new InvalidPolygamousStructureException('Share percentage must be between 0 and 100');
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseSharePercentage: percentage,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Register house business
   * Polygamous houses can own separate businesses
   */
  public registerHouseBusiness(businessName: string, kraPin?: string): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    if (!businessName || businessName.trim().length === 0) {
      throw new InvalidPolygamousStructureException('Business name is required');
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseBusinessName: businessName,
      houseBusinessKraPin: kraPin,
      separateProperty: true,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Record wives' consent
   * Critical for S. 40 validity - all co-wives must consent to new marriages
   */
  public recordWivesConsent(params: {
    consentObtained: boolean;
    consentDocumentId?: string;
    consentDetails?: {
      consentDate: Date;
      consentingWives: Array<{
        wifeId: string;
        wifeName: string;
        consentedAt: Date;
        signatureWitness?: string;
      }>;
      notarized?: boolean;
      notaryName?: string;
      notaryLicenseNumber?: string;
    };
  }): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    const newProps: PolygamousHouseProps = {
      ...this.props,
      wivesConsentObtained: params.consentObtained,
      wivesConsentDocumentId: params.consentDocumentId
        ? new UniqueEntityID(params.consentDocumentId)
        : this.props.wivesConsentDocumentId,
      wivesAgreementDetails: params.consentDetails || this.props.wivesAgreementDetails,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Add succession instructions
   * Testator can specify how this house's share should be distributed
   */
  public addSuccessionInstructions(instructions: string): PolygamousHouse {
    this.ensureNotDeleted();
    this.ensureNotDissolved();

    if (!instructions || instructions.trim().length === 0) {
      throw new InvalidPolygamousStructureException('Succession instructions cannot be empty');
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      successionInstructions: instructions,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Freeze house assets
   * Done on death of husband to prevent inter-house transfers during succession
   */
  public freezeAssets(): PolygamousHouse {
    this.ensureNotDeleted();

    if (this.props.houseAssetsFrozen) {
      return this; // Already frozen
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseAssetsFrozen: true,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Unfreeze house assets
   * After succession is complete
   */
  public unfreezeAssets(): PolygamousHouse {
    this.ensureNotDeleted();

    if (!this.props.houseAssetsFrozen) {
      return this; // Already unfrozen
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseAssetsFrozen: false,
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  /**
   * Dissolve house
   * Triggered on death of husband - house structure ends
   */
  public dissolve(dissolutionDate: Date): PolygamousHouse {
    this.ensureNotDeleted();

    if (this.props.houseDissolvedAt) {
      throw new InvalidPolygamousStructureException('House is already dissolved');
    }

    if (dissolutionDate > new Date()) {
      throw new InvalidPolygamousStructureException('Dissolution date cannot be in the future');
    }

    const newProps: PolygamousHouseProps = {
      ...this.props,
      houseDissolvedAt: dissolutionDate,
      houseAssetsFrozen: true, // Auto-freeze on dissolution
    };

    return new PolygamousHouse(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GUARDS
  // =========================================================================

  private ensureNotDissolved(): void {
    if (this.props.houseDissolvedAt) {
      throw new InvalidPolygamousStructureException(
        `Cannot modify dissolved house [${this._id.toString()}]`,
      );
    }
  }

  // =========================================================================
  // GETTERS (Read-Only Access)
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get houseName(): string {
    return this.props.houseName;
  }

  get houseOrder(): number {
    return this.props.houseOrder;
  }

  get establishedDate(): Date {
    return this.props.establishedDate;
  }

  get houseHeadId(): UniqueEntityID | undefined {
    return this.props.houseHeadId;
  }

  get courtRecognized(): boolean {
    return this.props.courtRecognized;
  }

  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }

  get s40CertificateNumber(): string | undefined {
    return this.props.s40CertificateNumber;
  }

  get certificateIssuedDate(): Date | undefined {
    return this.props.certificateIssuedDate;
  }

  get certificateIssuingCourt(): string | undefined {
    return this.props.certificateIssuingCourt;
  }

  get houseSharePercentage(): number | undefined {
    return this.props.houseSharePercentage;
  }

  get houseBusinessName(): string | undefined {
    return this.props.houseBusinessName;
  }

  get houseBusinessKraPin(): string | undefined {
    return this.props.houseBusinessKraPin;
  }

  get separateProperty(): boolean {
    return this.props.separateProperty;
  }

  get wivesConsentObtained(): boolean {
    return this.props.wivesConsentObtained;
  }

  get wivesConsentDocumentId(): UniqueEntityID | undefined {
    return this.props.wivesConsentDocumentId;
  }

  get wivesAgreementDetails(): WivesConsentDetails | undefined {
    return this.props.wivesAgreementDetails;
  }

  get successionInstructions(): string | undefined {
    return this.props.successionInstructions;
  }

  get houseDissolvedAt(): Date | undefined {
    return this.props.houseDissolvedAt;
  }

  get houseAssetsFrozen(): boolean {
    return this.props.houseAssetsFrozen;
  }

  // =========================================================================
  // COMPUTED PROPERTIES (Kenyan Law Context)
  // =========================================================================

  /**
   * Is house dissolved (husband died)
   */
  get isDissolved(): boolean {
    return !!this.props.houseDissolvedAt;
  }

  /**
   * Is first house (original marriage)
   * First house doesn't need S. 40 certification
   */
  get isFirstHouse(): boolean {
    return this.props.houseOrder === 1;
  }

  /**
   * Is subsequent house (additional marriage)
   * Requires S. 40 certification
   */
  get isSubsequentHouse(): boolean {
    return this.props.houseOrder > 1;
  }

  /**
   * Is certified under S. 40 LSA
   */
  get isCertifiedS40(): boolean {
    return !!this.props.s40CertificateNumber && this.props.courtRecognized;
  }

  /**
   * Has succession instructions from testator
   */
  get hasSuccessionInstructions(): boolean {
    return (
      !!this.props.successionInstructions && this.props.successionInstructions.trim().length > 0
    );
  }

  /**
   * Has house business registered
   */
  get hasHouseBusiness(): boolean {
    return !!this.props.houseBusinessName;
  }

  /**
   * S. 40 compliance status
   *
   * COMPLIANT: Meets all S. 40 requirements
   * PENDING: Has consent but not court certified
   * NON_COMPLIANT: Missing required elements
   */
  get s40ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' {
    // First house is always compliant (doesn't need certification)
    if (this.isFirstHouse) {
      return 'COMPLIANT';
    }

    // Subsequent houses need court certification
    if (this.props.courtRecognized && this.props.s40CertificateNumber) {
      return 'COMPLIANT';
    }

    // Has consent but not certified
    if (this.props.wivesConsentObtained) {
      return 'PENDING';
    }

    // Missing consent and certification
    return 'NON_COMPLIANT';
  }

  /**
   * Get default share (for equal distribution)
   * Returns undefined - actual calculation done by Family aggregate
   */
  get defaultShare(): number | undefined {
    return this.props.houseSharePercentage;
  }

  /**
   * Is active (not dissolved)
   */
  get isActive(): boolean {
    return !this.isDissolved;
  }

  /**
   * Requires court attention (non-compliant subsequent house)
   */
  get requiresCourtAttention(): boolean {
    return this.isSubsequentHouse && this.s40ComplianceStatus === 'NON_COMPLIANT';
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Convert to plain object (for persistence/API)
   */
  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),

      // Identity
      houseName: this.props.houseName,
      houseOrder: this.props.houseOrder,
      establishedDate: this.props.establishedDate,
      houseHeadId: this.props.houseHeadId?.toString(),

      // S. 40 Certification
      courtRecognized: this.props.courtRecognized,
      courtOrderNumber: this.props.courtOrderNumber,
      s40CertificateNumber: this.props.s40CertificateNumber,
      certificateIssuedDate: this.props.certificateIssuedDate,
      certificateIssuingCourt: this.props.certificateIssuingCourt,

      // Distribution
      houseSharePercentage: this.props.houseSharePercentage,

      // Business
      houseBusinessName: this.props.houseBusinessName,
      houseBusinessKraPin: this.props.houseBusinessKraPin,
      separateProperty: this.props.separateProperty,

      // Wives Consent
      wivesConsentObtained: this.props.wivesConsentObtained,
      wivesConsentDocumentId: this.props.wivesConsentDocumentId?.toString(),
      wivesAgreementDetails: this.props.wivesAgreementDetails,

      // Instructions
      successionInstructions: this.props.successionInstructions,

      // Status
      houseDissolvedAt: this.props.houseDissolvedAt,
      houseAssetsFrozen: this.props.houseAssetsFrozen,

      // Computed
      isDissolved: this.isDissolved,
      isFirstHouse: this.isFirstHouse,
      isSubsequentHouse: this.isSubsequentHouse,
      isCertifiedS40: this.isCertifiedS40,
      hasSuccessionInstructions: this.hasSuccessionInstructions,
      hasHouseBusiness: this.hasHouseBusiness,
      s40ComplianceStatus: this.s40ComplianceStatus,
      isActive: this.isActive,
      requiresCourtAttention: this.requiresCourtAttention,

      // Audit
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
