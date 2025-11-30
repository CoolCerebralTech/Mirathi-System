import { KenyanCounty, MarriageType } from '@prisma/client';

/**
 * Kenyan Marriage Certificate Value Object
 *
 * Immutable representation of official marriage registration details.
 * Reference: Marriage Act (2014).
 */
export class KenyanMarriageCertificate {
  constructor(
    public readonly registrationNumber: string,
    public readonly issuingAuthority: string,
    public readonly certificateIssueDate: Date,
    public readonly registrationDistrict: string,
    public readonly certificateNumber: string,
  ) {
    if (!registrationNumber?.trim()) throw new Error('Registration number is required');
    if (!issuingAuthority?.trim()) throw new Error('Issuing authority is required');
  }

  equals(other: KenyanMarriageCertificate): boolean {
    return this.registrationNumber === other.registrationNumber;
  }
}

/**
 * Kenyan Marriage Officer Value Object
 *
 * Immutable representation of the officer who solemnized the marriage.
 * Reference: Marriage Act (2014) - Registered Marriage Officers.
 */
export class KenyanMarriageOfficer {
  constructor(
    public readonly name: string,
    public readonly title: string,
    public readonly registrationNumber: string,
    public readonly religiousDenomination: string | null,
    public readonly licenseNumber: string,
  ) {
    if (!name?.trim()) throw new Error('Officer name is required');
    if (!licenseNumber?.trim()) throw new Error('License number is required');
  }
}

/**
 * Kenyan Marriage Location Value Object
 *
 * Immutable representation of marriage ceremony location.
 */
export class KenyanMarriageLocation {
  constructor(
    public readonly venue: string,
    public readonly county: KenyanCounty,
    public readonly subCounty: string | null,
    public readonly district: string | null,
    public readonly gpsCoordinates: string | null,
  ) {
    if (!venue?.trim()) throw new Error('Venue is required');
  }
}

/**
 * Customary Marriage Details Value Object
 *
 * Immutable representation of traditional/customary marriage elements.
 * Reference: Customary law practices across Kenyan communities.
 */
export class CustomaryMarriageDetails {
  constructor(
    public readonly bridePricePaid: boolean,
    public readonly bridePriceAmount: number | null,
    public readonly bridePriceCurrency: string,
    public readonly elderWitnesses: readonly string[],
    public readonly ceremonyLocation: string,
    public readonly traditionalCeremonyType: string | null,
    public readonly lobolaReceiptNumber: string | null,
    public readonly marriageElderContact: string | null,
    public readonly clanApproval: boolean,
    public readonly familyConsent: boolean,
    public readonly traditionalRitesPerformed: readonly string[],
  ) {
    if (elderWitnesses.length === 0) {
      throw new Error('Customary marriage requires at least one elder witness');
    }
    if (!ceremonyLocation?.trim()) {
      throw new Error('Ceremony location is required for customary marriage');
    }
  }

  isFullyDocumented(): boolean {
    return (
      this.bridePricePaid &&
      this.elderWitnesses.length >= 2 &&
      this.clanApproval &&
      this.familyConsent
    );
  }
}

/**
 * Marriage Reconstitution Props
 */
export interface MarriageReconstituteProps {
  id: string;
  familyId: string;

  // Spouses
  spouse1Id: string;
  spouse2Id: string;

  // Core Marriage Details
  marriageDate: Date | string;
  marriageType: MarriageType; // FIXED: Use correct enum

  // Certificate
  certificateNumber: string | null;
  registrationNumber: string | null;
  issuingAuthority: string | null;
  certificateIssueDate: Date | string | null;
  registrationDistrict: string | null;

  // Customary Marriage (JSON)
  bridePricePaid: boolean;
  bridePriceAmount: number | null;
  bridePriceCurrency: string | null;
  elderWitnesses: any; // JSON array
  ceremonyLocation: string | null;
  traditionalCeremonyType: string | null;
  lobolaReceiptNumber: string | null;
  marriageElderContact: string | null;
  clanApproval: boolean;
  familyConsent: boolean;
  traditionalRitesPerformed: any; // JSON array

  // Marriage Officer
  marriageOfficerName: string | null;
  marriageOfficerTitle: string | null;
  marriageOfficerRegistrationNumber: string | null;
  marriageOfficerReligiousDenomination: string | null;
  marriageOfficerLicenseNumber: string | null;

  // Location
  marriageVenue: string | null;
  marriageCounty: KenyanCounty | null;
  marriageSubCounty: string | null;
  marriageDistrict: string | null;
  marriageGpsCoordinates: string | null;

  // Dissolution
  divorceDate: Date | string | null;
  divorceType: string | null;
  divorceCertNumber: string | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Marriage Entity (NOT an Aggregate Root)
 *
 * Represents a marriage relationship between two family members.
 * This is a child entity of the Family aggregate.
 *
 * Legal Context:
 * - Marriage Act (2014): Civil, Christian, Islamic, Hindu marriages
 * - Customary law: Traditional/customary marriages
 * - Law of Succession Act, Section 40: Polygamous marriages
 * - Matrimonial Property Act (2013): Property rights in marriage
 *
 * Entity Responsibilities:
 * - Track marriage type and details
 * - Store certificate/registration information
 * - Manage customary marriage specifics
 * - Validate legal compliance
 * - Track dissolution details
 *
 * Does NOT:
 * - Emit domain events (Family aggregate does this)
 * - Validate spouse eligibility (Family validates)
 * - Create itself (Family aggregate creates via factory)
 *
 * Marriage Types (Kenyan Law):
 * - CUSTOMARY: Traditional marriage (potentially polygamous)
 * - CHRISTIAN: Church marriage (monogamous)
 * - CIVIL: Registry marriage (monogamous)
 * - ISLAMIC: Muslim marriage (potentially polygamous)
 * - TRADITIONAL: Other traditional forms
 */
export class Marriage {
  // Core Identity
  private readonly _id: string;
  private readonly _familyId: string;

  // Spouses (FamilyMember IDs)
  private readonly _spouse1Id: string;
  private readonly _spouse2Id: string;

  // Marriage Core Details
  private readonly _marriageDate: Date;
  private readonly _marriageType: MarriageType; // FIXED: Correct enum

  // Certificate (Value Object or null)
  private _certificate: KenyanMarriageCertificate | null;

  // Customary Details (Value Object or null)
  private _customaryDetails: CustomaryMarriageDetails | null;

  // Marriage Officer (Value Object or null)
  private _marriageOfficer: KenyanMarriageOfficer | null;

  // Marriage Location (Value Object or null)
  private _marriageLocation: KenyanMarriageLocation | null;

  // Dissolution
  private _divorceDate: Date | null;
  private _divorceType: string | null; // 'DIVORCE', 'ANNULMENT', 'DEATH', 'CUSTOMARY_DISSOLUTION'
  private _divorceCertNumber: string | null;

  // Status
  private _isActive: boolean;

  // Timestamps
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageType,
    marriageDate: Date,
  ) {
    if (!id?.trim()) throw new Error('Marriage ID is required');
    if (!familyId?.trim()) throw new Error('Family ID is required');
    if (!spouse1Id?.trim()) throw new Error('Spouse 1 ID is required');
    if (!spouse2Id?.trim()) throw new Error('Spouse 2 ID is required');

    if (spouse1Id === spouse2Id) {
      throw new Error('Cannot marry oneself');
    }

    if (marriageDate > new Date()) {
      throw new Error('Marriage date cannot be in the future');
    }

    this._id = id;
    this._familyId = familyId;
    this._spouse1Id = spouse1Id;
    this._spouse2Id = spouse2Id;
    this._marriageType = marriageType;
    this._marriageDate = marriageDate;

    // Defaults
    this._certificate = null;
    this._customaryDetails = null;
    this._marriageOfficer = null;
    this._marriageLocation = null;
    this._divorceDate = null;
    this._divorceType = null;
    this._divorceCertNumber = null;
    this._isActive = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a civil/Christian marriage with certificate.
   */
  static createCivilMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageType.CIVIL | MarriageType.CHRISTIAN,
    marriageDate: Date,
    certificate: KenyanMarriageCertificate,
    marriageOfficer: KenyanMarriageOfficer,
    location: KenyanMarriageLocation,
  ): Marriage {
    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, marriageType, marriageDate);

    marriage._certificate = certificate;
    marriage._marriageOfficer = marriageOfficer;
    marriage._marriageLocation = location;

    return marriage;
  }

  /**
   * Creates a customary marriage.
   */
  static createCustomaryMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDate: Date,
    customaryDetails: CustomaryMarriageDetails,
    location: KenyanMarriageLocation,
  ): Marriage {
    const marriage = new Marriage(
      id,
      familyId,
      spouse1Id,
      spouse2Id,
      MarriageType.CUSTOMARY,
      marriageDate,
    );

    marriage._customaryDetails = customaryDetails;
    marriage._marriageLocation = location;

    return marriage;
  }

  /**
   * Creates an Islamic marriage.
   */
  static createIslamicMarriage(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageDate: Date,
    location: KenyanMarriageLocation,
    certificate?: KenyanMarriageCertificate,
  ): Marriage {
    const marriage = new Marriage(
      id,
      familyId,
      spouse1Id,
      spouse2Id,
      MarriageType.ISLAMIC,
      marriageDate,
    );

    marriage._marriageLocation = location;
    marriage._certificate = certificate || null;

    return marriage;
  }

  static reconstitute(props: MarriageReconstituteProps): Marriage {
    const marriage = new Marriage(
      props.id,
      props.familyId,
      props.spouse1Id,
      props.spouse2Id,
      props.marriageType,
      new Date(props.marriageDate),
    );

    // Reconstitute certificate if present
    if (
      props.certificateNumber &&
      props.registrationNumber &&
      props.issuingAuthority &&
      props.certificateIssueDate &&
      props.registrationDistrict
    ) {
      marriage._certificate = new KenyanMarriageCertificate(
        props.registrationNumber,
        props.issuingAuthority,
        new Date(props.certificateIssueDate),
        props.registrationDistrict,
        props.certificateNumber,
      );
    }

    // Reconstitute customary details if present
    if (props.marriageType === MarriageType.CUSTOMARY && props.ceremonyLocation) {
      const elderWitnesses = Array.isArray(props.elderWitnesses)
        ? (props.elderWitnesses as string[])
        : [];
      const traditionalRites = Array.isArray(props.traditionalRitesPerformed)
        ? (props.traditionalRitesPerformed as string[])
        : [];

      marriage._customaryDetails = new CustomaryMarriageDetails(
        props.bridePricePaid,
        props.bridePriceAmount,
        props.bridePriceCurrency || 'KES',
        elderWitnesses,
        props.ceremonyLocation,
        props.traditionalCeremonyType,
        props.lobolaReceiptNumber,
        props.marriageElderContact,
        props.clanApproval,
        props.familyConsent,
        traditionalRites,
      );
    }

    // Reconstitute marriage officer if present
    if (props.marriageOfficerName && props.marriageOfficerLicenseNumber) {
      marriage._marriageOfficer = new KenyanMarriageOfficer(
        props.marriageOfficerName,
        props.marriageOfficerTitle || '',
        props.marriageOfficerRegistrationNumber || '',
        props.marriageOfficerReligiousDenomination,
        props.marriageOfficerLicenseNumber,
      );
    }

    // Reconstitute location if present
    if (props.marriageVenue && props.marriageCounty) {
      marriage._marriageLocation = new KenyanMarriageLocation(
        props.marriageVenue,
        props.marriageCounty,
        props.marriageSubCounty,
        props.marriageDistrict,
        props.marriageGpsCoordinates,
      );
    }

    // Dissolution
    marriage._divorceDate = props.divorceDate ? new Date(props.divorceDate) : null;
    marriage._divorceType = props.divorceType;
    marriage._divorceCertNumber = props.divorceCertNumber;
    marriage._isActive = props.isActive;

    // Timestamps
    (marriage as any)._createdAt = new Date(props.createdAt);
    marriage._updatedAt = new Date(props.updatedAt);

    return marriage;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Dissolves the marriage.
   *
   * Reference:
   * - Divorce: Matrimonial Causes Act
   * - Death: Automatic dissolution
   * - Customary dissolution: Traditional processes
   */
  dissolve(
    dissolutionDate: Date,
    dissolutionType: 'DIVORCE' | 'ANNULMENT' | 'DEATH' | 'CUSTOMARY_DISSOLUTION',
    certificateNumber?: string,
  ): void {
    if (!this._isActive) {
      throw new Error('Marriage already dissolved');
    }

    if (dissolutionDate < this._marriageDate) {
      throw new Error('Dissolution date cannot be before marriage date');
    }

    if (dissolutionDate > new Date()) {
      throw new Error('Dissolution date cannot be in the future');
    }

    this._isActive = false;
    this._divorceDate = dissolutionDate;
    this._divorceType = dissolutionType;
    this._divorceCertNumber = certificateNumber || null;

    this.markAsUpdated();
  }

  /**
   * Registers a marriage certificate (post-marriage registration).
   */
  registerCertificate(certificate: KenyanMarriageCertificate): void {
    if (this._certificate) {
      throw new Error('Marriage already has a certificate');
    }

    this._certificate = certificate;
    this.markAsUpdated();
  }

  /**
   * Updates customary marriage details.
   */
  updateCustomaryDetails(details: CustomaryMarriageDetails): void {
    if (this._marriageType !== MarriageType.CUSTOMARY) {
      throw new Error('Can only update customary details for customary marriages');
    }

    this._customaryDetails = details;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates marriage compliance with Kenyan law.
   */
  validateLegalCompliance(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Active marriage validation
    if (!this._isActive && !this._divorceDate) {
      issues.push('Inactive marriage must have dissolution date');
    }

    // Type-specific validation
    switch (this._marriageType) {
      case MarriageType.CUSTOMARY:
        if (!this._customaryDetails) {
          issues.push('Customary marriage missing customary details');
        } else if (this._customaryDetails.elderWitnesses.length === 0) {
          issues.push('Customary marriage requires elder witnesses');
        }
        break;

      case MarriageType.CIVIL:
      case MarriageType.CHRISTIAN:
        if (!this._certificate) {
          issues.push(`${this._marriageType} marriage requires certificate`);
        }
        if (!this._marriageOfficer) {
          issues.push('Marriage officer details missing');
        }
        break;

      case MarriageType.ISLAMIC:
        if (!this._marriageLocation) {
          issues.push('Islamic marriage requires location details');
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Determines if this marriage type allows polygamy.
   *
   * Reference: Law of Succession Act, Section 40
   * - Customary marriages: Allow polygyny (man with multiple wives)
   * - Islamic marriages: Allow polygyny (max 4 wives)
   * - Christian/Civil/Hindu: Strictly monogamous
   */
  allowsPolygamy(): boolean {
    return (
      this._marriageType === MarriageType.CUSTOMARY || this._marriageType === MarriageType.ISLAMIC
    );
  }

  /**
   * Calculates marriage duration in years.
   */
  getMarriageDurationYears(): number {
    const endDate = this._divorceDate || (this._isActive ? new Date() : new Date());
    let years = endDate.getFullYear() - this._marriageDate.getFullYear();
    const monthDiff = endDate.getMonth() - this._marriageDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < this._marriageDate.getDate())) {
      years--;
    }

    return Math.max(0, years);
  }

  /**
   * Gets the partner ID for a given member.
   */
  getPartnerOf(memberId: string): string | null {
    if (memberId === this._spouse1Id) return this._spouse2Id;
    if (memberId === this._spouse2Id) return this._spouse1Id;
    return null;
  }

  /**
   * Checks if member is a spouse in this marriage.
   */
  involvesSpouse(memberId: string): boolean {
    return memberId === this._spouse1Id || memberId === this._spouse2Id;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get familyId(): string {
    return this._familyId;
  }

  get spouse1Id(): string {
    return this._spouse1Id;
  }

  get spouse2Id(): string {
    return this._spouse2Id;
  }

  get marriageDate(): Date {
    return new Date(this._marriageDate);
  }

  get marriageType(): MarriageType {
    return this._marriageType;
  }

  get certificate(): KenyanMarriageCertificate | null {
    return this._certificate;
  }

  get customaryDetails(): CustomaryMarriageDetails | null {
    return this._customaryDetails;
  }

  get marriageOfficer(): KenyanMarriageOfficer | null {
    return this._marriageOfficer;
  }

  get marriageLocation(): KenyanMarriageLocation | null {
    return this._marriageLocation;
  }

  get divorceDate(): Date | null {
    return this._divorceDate ? new Date(this._divorceDate) : null;
  }

  get divorceType(): string | null {
    return this._divorceType;
  }

  get divorceCertNumber(): string | null {
    return this._divorceCertNumber;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
