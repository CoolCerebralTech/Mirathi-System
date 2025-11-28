import { AggregateRoot } from '@nestjs/cqrs';
import { KenyanCounty, MarriageStatus } from '@prisma/client';

import { CustomaryMarriageDetailsUpdatedEvent } from '../events/customary-marriage-details-updated.event';
import { MarriageDissolvedEvent } from '../events/marriage-dissolved.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';

// Kenyan Marriage Value Objects
export class KenyanMarriageCertificate {
  constructor(
    public readonly registrationNumber: string,
    public readonly issuingAuthority: string,
    public readonly certificateIssueDate: Date,
    public readonly registrationDistrict: string,
  ) {}
}

export class KenyanMarriageOfficer {
  constructor(
    public readonly name: string,
    public readonly title: string,
    public readonly registrationNumber: string,
    public readonly religiousDenomination: string,
    public readonly licenseNumber: string,
  ) {}
}

export class KenyanMarriageLocation {
  constructor(
    public readonly venue: string,
    public readonly county: KenyanCounty,
    public readonly subCounty: string,
    public readonly district: string,
    public readonly gpsCoordinates: string,
  ) {}
}

// Marriage Reconstitution Interface matching Prisma schema exactly
interface MarriageReconstitutionProps {
  id: string;
  familyId: string;

  // Parties (exactly matching Prisma schema)
  spouse1Id: string;
  spouse2Id: string;

  // Kenyan Marriage Certificate Details (exactly matching Prisma schema)
  registrationNumber?: string | null;
  issuingAuthority?: string | null;
  certificateIssueDate?: Date | null;
  registrationDistrict?: string | null;

  // Dissolution Details (exactly matching Prisma schema)
  divorceType?: string | null;

  // Customary Marriage Details (exactly matching Prisma schema)
  bridePricePaid: boolean;
  bridePriceAmount?: number | null;
  bridePriceCurrency?: string | null;
  elderWitnesses?: any | null; // JSON array
  ceremonyLocation?: string | null;
  traditionalCeremonyType?: string | null;
  lobolaReceiptNumber?: string | null;
  marriageElderContact?: string | null;
  clanApproval: boolean;
  familyConsent: boolean;
  traditionalRitesPerformed?: any | null; // JSON array

  // Marriage Officer Details (exactly matching Prisma schema)
  marriageOfficerName?: string | null;
  marriageOfficerTitle?: string | null;
  marriageOfficerRegistrationNumber?: string | null;
  marriageOfficerReligiousDenomination?: string | null;
  marriageOfficerLicenseNumber?: string | null;

  // Marriage Location Details (exactly matching Prisma schema)
  marriageVenue?: string | null;
  marriageCounty?: KenyanCounty | null;
  marriageSubCounty?: string | null;
  marriageDistrict?: string | null;
  marriageGpsCoordinates?: string | null;

  // Marriage details (exactly matching Prisma schema)
  marriageDate: Date;
  marriageType: MarriageStatus;
  certificateNumber?: string | null;

  // Dissolution (exactly matching Prisma schema)
  divorceDate?: Date | null;
  divorceCertNumber?: string | null;

  // Status (exactly matching Prisma schema)
  isActive: boolean;

  // Timestamps (exactly matching Prisma schema)
  createdAt: Date;
  updatedAt: Date;
}

export class Marriage extends AggregateRoot {
  private id: string;
  private familyId: string;

  // Parties (exactly matching Prisma schema)
  private spouse1Id: string;
  private spouse2Id: string;

  // Kenyan Marriage Certificate Details (exactly matching Prisma schema)
  private registrationNumber: string | null;
  private issuingAuthority: string | null;
  private certificateIssueDate: Date | null;
  private registrationDistrict: string | null;

  // Dissolution Details (exactly matching Prisma schema)
  private divorceType: string | null;

  // Customary Marriage Details (exactly matching Prisma schema)
  private bridePricePaid: boolean;
  private bridePriceAmount: number | null;
  private bridePriceCurrency: string | null;
  private elderWitnesses: string[];
  private ceremonyLocation: string | null;
  private traditionalCeremonyType: string | null;
  private lobolaReceiptNumber: string | null;
  private marriageElderContact: string | null;
  private clanApproval: boolean;
  private familyConsent: boolean;
  private traditionalRitesPerformed: string[];

  // Marriage Officer Details (exactly matching Prisma schema)
  private marriageOfficerName: string | null;
  private marriageOfficerTitle: string | null;
  private marriageOfficerRegistrationNumber: string | null;
  private marriageOfficerReligiousDenomination: string | null;
  private marriageOfficerLicenseNumber: string | null;

  // Marriage Location Details (exactly matching Prisma schema)
  private marriageVenue: string | null;
  private marriageCounty: KenyanCounty | null;
  private marriageSubCounty: string | null;
  private marriageDistrict: string | null;
  private marriageGpsCoordinates: string | null;

  // Marriage details (exactly matching Prisma schema)
  private marriageDate: Date;
  private marriageType: MarriageStatus;
  private certificateNumber: string | null;

  // Dissolution (exactly matching Prisma schema)
  private divorceDate: Date | null;
  private divorceCertNumber: string | null;

  // Status (exactly matching Prisma schema)
  private isActive: boolean;

  // Timestamps (exactly matching Prisma schema)
  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
  ) {
    super();

    this.validateMarriageCreation(spouse1Id, spouse2Id, marriageType, marriageDate);

    this.id = id;
    this.familyId = familyId;
    this.spouse1Id = spouse1Id;
    this.spouse2Id = spouse2Id;
    this.marriageType = marriageType;
    this.marriageDate = marriageDate;

    // Initialize Prisma schema fields with defaults
    this.registrationNumber = null;
    this.issuingAuthority = null;
    this.certificateIssueDate = null;
    this.registrationDistrict = null;
    this.divorceType = null;
    this.bridePricePaid = false;
    this.bridePriceAmount = null;
    this.bridePriceCurrency = 'KES';
    this.elderWitnesses = [];
    this.ceremonyLocation = null;
    this.traditionalCeremonyType = null;
    this.lobolaReceiptNumber = null;
    this.marriageElderContact = null;
    this.clanApproval = false;
    this.familyConsent = false;
    this.traditionalRitesPerformed = [];
    this.marriageOfficerName = null;
    this.marriageOfficerTitle = null;
    this.marriageOfficerRegistrationNumber = null;
    this.marriageOfficerReligiousDenomination = null;
    this.marriageOfficerLicenseNumber = null;
    this.marriageVenue = null;
    this.marriageCounty = null;
    this.marriageSubCounty = null;
    this.marriageDistrict = null;
    this.marriageGpsCoordinates = null;
    this.certificateNumber = null;
    this.divorceDate = null;
    this.divorceCertNumber = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a new Marriage with Kenyan legal compliance
   * Marriage Act and African Christian Marriage and Divorce Act provisions
   */
  static create(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
    details?: {
      certificateNumber?: string;
      registrationNumber?: string;
      issuingAuthority?: string;
      certificateIssueDate?: Date;
      registrationDistrict?: string;
      marriageOfficerName?: string;
      marriageOfficerTitle?: string;
      marriageOfficerRegistrationNumber?: string;
      marriageOfficerReligiousDenomination?: string;
      marriageOfficerLicenseNumber?: string;
      marriageVenue?: string;
      marriageCounty?: KenyanCounty;
      marriageSubCounty?: string;
      marriageDistrict?: string;
      marriageGpsCoordinates?: string;

      // Customary marriage details
      bridePricePaid?: boolean;
      bridePriceAmount?: number;
      bridePriceCurrency?: string;
      elderWitnesses?: string[];
      ceremonyLocation?: string;
      traditionalCeremonyType?: string;
      lobolaReceiptNumber?: string;
      marriageElderContact?: string;
      clanApproval?: boolean;
      familyConsent?: boolean;
      traditionalRitesPerformed?: string[];
    },
  ): Marriage {
    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, marriageType, marriageDate);

    // Set certificate details
    if (details?.certificateNumber) marriage.certificateNumber = details.certificateNumber;
    if (details?.registrationNumber) marriage.registrationNumber = details.registrationNumber;
    if (details?.issuingAuthority) marriage.issuingAuthority = details.issuingAuthority;
    if (details?.certificateIssueDate) marriage.certificateIssueDate = details.certificateIssueDate;
    if (details?.registrationDistrict) marriage.registrationDistrict = details.registrationDistrict;

    // Set marriage officer details
    if (details?.marriageOfficerName) marriage.marriageOfficerName = details.marriageOfficerName;
    if (details?.marriageOfficerTitle) marriage.marriageOfficerTitle = details.marriageOfficerTitle;
    if (details?.marriageOfficerRegistrationNumber)
      marriage.marriageOfficerRegistrationNumber = details.marriageOfficerRegistrationNumber;
    if (details?.marriageOfficerReligiousDenomination)
      marriage.marriageOfficerReligiousDenomination = details.marriageOfficerReligiousDenomination;
    if (details?.marriageOfficerLicenseNumber)
      marriage.marriageOfficerLicenseNumber = details.marriageOfficerLicenseNumber;

    // Set location details
    if (details?.marriageVenue) marriage.marriageVenue = details.marriageVenue;
    if (details?.marriageCounty) marriage.marriageCounty = details.marriageCounty;
    if (details?.marriageSubCounty) marriage.marriageSubCounty = details.marriageSubCounty;
    if (details?.marriageDistrict) marriage.marriageDistrict = details.marriageDistrict;
    if (details?.marriageGpsCoordinates)
      marriage.marriageGpsCoordinates = details.marriageGpsCoordinates;

    // Set customary marriage details if applicable
    if (marriageType === MarriageStatus.CUSTOMARY_MARRIAGE) {
      marriage.bridePricePaid = details?.bridePricePaid || false;
      marriage.bridePriceAmount = details?.bridePriceAmount || null;
      marriage.bridePriceCurrency = details?.bridePriceCurrency || 'KES';
      marriage.elderWitnesses = details?.elderWitnesses || [];
      marriage.ceremonyLocation = details?.ceremonyLocation || null;
      marriage.traditionalCeremonyType = details?.traditionalCeremonyType || null;
      marriage.lobolaReceiptNumber = details?.lobolaReceiptNumber || null;
      marriage.marriageElderContact = details?.marriageElderContact || null;
      marriage.clanApproval = details?.clanApproval || false;
      marriage.familyConsent = details?.familyConsent || false;
      marriage.traditionalRitesPerformed = details?.traditionalRitesPerformed || [];
    }

    marriage.apply(
      new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id, marriageType, marriageDate),
    );

    // Emit customary marriage event if applicable
    if (marriageType === MarriageStatus.CUSTOMARY_MARRIAGE && details) {
      marriage.apply(
        new CustomaryMarriageDetailsUpdatedEvent(id, familyId, {
          bridePricePaid: marriage.bridePricePaid,
          bridePriceAmount: marriage.bridePriceAmount,
          bridePriceCurrency: marriage.bridePriceCurrency,
          elderWitnesses: marriage.elderWitnesses,
          ceremonyLocation: marriage.ceremonyLocation,
          traditionalCeremonyType: marriage.traditionalCeremonyType,
          lobolaReceiptNumber: marriage.lobolaReceiptNumber,
          marriageElderContact: marriage.marriageElderContact,
          clanApproval: marriage.clanApproval,
          familyConsent: marriage.familyConsent,
          traditionalRitesPerformed: marriage.traditionalRitesPerformed,
        }),
      );
    }

    return marriage;
  }

  /**
   * Reconstitutes Marriage from persistence exactly matching Prisma schema
   */
  static reconstitute(props: MarriageReconstitutionProps): Marriage {
    const marriage = new Marriage(
      props.id,
      props.familyId,
      props.spouse1Id,
      props.spouse2Id,
      props.marriageType,
      props.marriageDate,
    );

    // Set all Prisma schema fields exactly
    marriage.registrationNumber = props.registrationNumber || null;
    marriage.issuingAuthority = props.issuingAuthority || null;
    marriage.certificateIssueDate = props.certificateIssueDate || null;
    marriage.registrationDistrict = props.registrationDistrict || null;
    marriage.divorceType = props.divorceType || null;
    marriage.bridePricePaid = props.bridePricePaid;
    marriage.bridePriceAmount = props.bridePriceAmount || null;
    marriage.bridePriceCurrency = props.bridePriceCurrency || 'KES';
    marriage.elderWitnesses = Array.isArray(props.elderWitnesses) ? props.elderWitnesses : [];
    marriage.ceremonyLocation = props.ceremonyLocation || null;
    marriage.traditionalCeremonyType = props.traditionalCeremonyType || null;
    marriage.lobolaReceiptNumber = props.lobolaReceiptNumber || null;
    marriage.marriageElderContact = props.marriageElderContact || null;
    marriage.clanApproval = props.clanApproval;
    marriage.familyConsent = props.familyConsent;
    marriage.traditionalRitesPerformed = Array.isArray(props.traditionalRitesPerformed)
      ? props.traditionalRitesPerformed
      : [];
    marriage.marriageOfficerName = props.marriageOfficerName || null;
    marriage.marriageOfficerTitle = props.marriageOfficerTitle || null;
    marriage.marriageOfficerRegistrationNumber = props.marriageOfficerRegistrationNumber || null;
    marriage.marriageOfficerReligiousDenomination =
      props.marriageOfficerReligiousDenomination || null;
    marriage.marriageOfficerLicenseNumber = props.marriageOfficerLicenseNumber || null;
    marriage.marriageVenue = props.marriageVenue || null;
    marriage.marriageCounty = props.marriageCounty || null;
    marriage.marriageSubCounty = props.marriageSubCounty || null;
    marriage.marriageDistrict = props.marriageDistrict || null;
    marriage.marriageGpsCoordinates = props.marriageGpsCoordinates || null;
    marriage.certificateNumber = props.certificateNumber || null;
    marriage.divorceDate = props.divorceDate || null;
    marriage.divorceCertNumber = props.divorceCertNumber || null;
    marriage.isActive = props.isActive;
    marriage.createdAt = props.createdAt;
    marriage.updatedAt = props.updatedAt;

    return marriage;
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Dissolves marriage according to Kenyan legal procedures
   * Marriage Act and Matrimonial Causes Act provisions
   */
  dissolve(
    dissolutionDate: Date,
    dissolutionType: 'DIVORCE' | 'ANNULMENT' | 'DEATH' | 'CUSTOMARY_DISSOLUTION',
    certificateNumber?: string,
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) {
      throw new Error('Marriage is already inactive/dissolved.');
    }

    // Legal validations
    if (dissolutionDate < this.marriageDate) {
      throw new Error('Dissolution date cannot be before marriage date.');
    }
    if (dissolutionDate > new Date()) {
      throw new Error('Dissolution date cannot be in the future.');
    }

    this.isActive = false;
    this.divorceDate = dissolutionDate;
    this.divorceType = dissolutionType;

    if (certificateNumber) {
      this.divorceCertNumber = certificateNumber;
    }

    this.updatedAt = new Date();

    this.apply(
      new MarriageDissolvedEvent(
        this.id,
        this.familyId,
        this.spouse1Id,
        this.spouse2Id,
        dissolutionDate,
        dissolutionType,
        certificateNumber,
        courtOrderNumber,
      ),
    );
  }

  /**
   * Registers marriage certificate with Kenyan authorities
   */
  registerCertificate(
    certNumber: string,
    registrationNumber?: string,
    issuingAuthority?: string,
    certificateIssueDate?: Date,
    registrationDistrict?: string,
  ): void {
    this.certificateNumber = certNumber;

    if (registrationNumber) this.registrationNumber = registrationNumber;
    if (issuingAuthority) this.issuingAuthority = issuingAuthority;
    if (certificateIssueDate) this.certificateIssueDate = certificateIssueDate;
    if (registrationDistrict) this.registrationDistrict = registrationDistrict;

    this.updatedAt = new Date();
  }

  /**
   * Updates customary marriage details with Kenyan legal validation
   * Customary Marriage Act requirements
   */
  updateCustomaryMarriageDetails(details: {
    bridePricePaid?: boolean;
    bridePriceAmount?: number;
    bridePriceCurrency?: string;
    elderWitnesses?: string[];
    ceremonyLocation?: string;
    traditionalCeremonyType?: string;
    lobolaReceiptNumber?: string;
    marriageElderContact?: string;
    clanApproval?: boolean;
    familyConsent?: boolean;
    traditionalRitesPerformed?: string[];
  }): void {
    if (this.marriageType !== MarriageStatus.CUSTOMARY_MARRIAGE) {
      throw new Error('Customary marriage details can only be set for customary marriages.');
    }

    // Legal validation for customary marriage
    if (details.elderWitnesses && details.elderWitnesses.length === 0) {
      throw new Error('Customary marriages require at least one elder witness.');
    }

    if (details.ceremonyLocation !== undefined) this.ceremonyLocation = details.ceremonyLocation;
    if (details.bridePricePaid !== undefined) this.bridePricePaid = details.bridePricePaid;
    if (details.bridePriceAmount !== undefined) this.bridePriceAmount = details.bridePriceAmount;
    if (details.bridePriceCurrency !== undefined)
      this.bridePriceCurrency = details.bridePriceCurrency;
    if (details.elderWitnesses !== undefined) this.elderWitnesses = details.elderWitnesses;
    if (details.traditionalCeremonyType !== undefined)
      this.traditionalCeremonyType = details.traditionalCeremonyType;
    if (details.lobolaReceiptNumber !== undefined)
      this.lobolaReceiptNumber = details.lobolaReceiptNumber;
    if (details.marriageElderContact !== undefined)
      this.marriageElderContact = details.marriageElderContact;
    if (details.clanApproval !== undefined) this.clanApproval = details.clanApproval;
    if (details.familyConsent !== undefined) this.familyConsent = details.familyConsent;
    if (details.traditionalRitesPerformed !== undefined)
      this.traditionalRitesPerformed = details.traditionalRitesPerformed;

    this.updatedAt = new Date();

    this.apply(
      new CustomaryMarriageDetailsUpdatedEvent(this.id, this.familyId, {
        bridePricePaid: this.bridePricePaid,
        bridePriceAmount: this.bridePriceAmount,
        bridePriceCurrency: this.bridePriceCurrency,
        elderWitnesses: this.elderWitnesses,
        ceremonyLocation: this.ceremonyLocation,
        traditionalCeremonyType: this.traditionalCeremonyType,
        lobolaReceiptNumber: this.lobolaReceiptNumber,
        marriageElderContact: this.marriageElderContact,
        clanApproval: this.clanApproval,
        familyConsent: this.familyConsent,
        traditionalRitesPerformed: this.traditionalRitesPerformed,
      }),
    );
  }

  /**
   * Updates marriage officer details for registered marriages
   */
  updateMarriageOfficerDetails(details: {
    name?: string;
    title?: string;
    registrationNumber?: string;
    religiousDenomination?: string;
    licenseNumber?: string;
  }): void {
    if (details.name !== undefined) this.marriageOfficerName = details.name;
    if (details.title !== undefined) this.marriageOfficerTitle = details.title;
    if (details.registrationNumber !== undefined)
      this.marriageOfficerRegistrationNumber = details.registrationNumber;
    if (details.religiousDenomination !== undefined)
      this.marriageOfficerReligiousDenomination = details.religiousDenomination;
    if (details.licenseNumber !== undefined)
      this.marriageOfficerLicenseNumber = details.licenseNumber;

    this.updatedAt = new Date();
  }

  /**
   * Updates marriage location details
   */
  updateMarriageLocation(details: {
    venue?: string;
    county?: KenyanCounty;
    subCounty?: string;
    district?: string;
    gpsCoordinates?: string;
  }): void {
    if (details.venue !== undefined) this.marriageVenue = details.venue;
    if (details.county !== undefined) this.marriageCounty = details.county;
    if (details.subCounty !== undefined) this.marriageSubCounty = details.subCounty;
    if (details.district !== undefined) this.marriageDistrict = details.district;
    if (details.gpsCoordinates !== undefined) this.marriageGpsCoordinates = details.gpsCoordinates;

    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates marriage compliance with Kenyan law
   * Marriage Act, Customary Marriage Act, and African Christian Marriage and Divorce Act
   */
  isValidUnderKenyanLaw(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!this.isActive) {
      errors.push('Marriage must be active to be valid.');
    }
    if (this.marriageDate > new Date()) {
      errors.push('Marriage date cannot be in the future.');
    }

    // Marriage type specific validations
    switch (this.marriageType) {
      case MarriageStatus.CUSTOMARY_MARRIAGE:
        this.validateCustomaryMarriage(errors, warnings);
        break;
      case MarriageStatus.CIVIL_UNION:
      case MarriageStatus.MARRIED:
        this.validateCivilMarriage(errors, warnings);
        break;
      case MarriageStatus.ISLAMIC:
        this.validateIslamicMarriage(errors, warnings);
        break;
    }

    // Succession law considerations
    if (this.isActive && this.getMarriageDuration() === 0) {
      warnings.push('Marriage duration is less than one year - may affect succession rights.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates customary marriage requirements under Kenyan law
   */
  private validateCustomaryMarriage(errors: string[], warnings: string[]): void {
    if (!this.elderWitnesses || this.elderWitnesses.length === 0) {
      errors.push('Customary marriages require elder witnesses.');
    }
    if (!this.ceremonyLocation) {
      errors.push('Customary marriages require a ceremony location.');
    }
    if (!this.clanApproval) {
      warnings.push('Clan approval is recommended for customary marriages.');
    }
    if (!this.familyConsent) {
      warnings.push('Family consent is recommended for customary marriages.');
    }
    if (this.bridePricePaid && !this.lobolaReceiptNumber) {
      warnings.push('Lobola receipt number is recommended when bride price is paid.');
    }
  }

  /**
   * Validates civil marriage requirements under Kenyan law
   */
  private validateCivilMarriage(errors: string[], warnings: string[]): void {
    if (!this.certificateNumber) {
      errors.push('Civil marriages require a certificate number.');
    }
    if (!this.marriageOfficerName) {
      warnings.push('Marriage officer name is recommended for civil marriages.');
    }
    if (!this.marriageVenue) {
      warnings.push('Marriage venue is recommended for civil marriages.');
    }
  }

  /**
   * Validates Islamic marriage requirements
   */
  private validateIslamicMarriage(errors: string[], warnings: string[]): void {
    if (!this.marriageOfficerName) {
      warnings.push('Islamic marriages typically have a presiding official.');
    }
    if (!this.marriageVenue) {
      warnings.push('Marriage venue is recommended for Islamic marriages.');
    }
  }

  /**
   * Determines if marriage allows polygamy under Kenyan law
   * Customary and Islamic marriages may allow polygamy
   */
  allowsPolygamy(): boolean {
    const polygamousTypes: MarriageStatus[] = [
      MarriageStatus.CUSTOMARY_MARRIAGE,
      MarriageStatus.ISLAMIC,
    ];
    return polygamousTypes.includes(this.marriageType);
  }

  /**
   * Calculates marriage duration in years for succession purposes
   * Law of Succession Act considers marriage duration for spousal rights
   */
  getMarriageDuration(): number | null {
    const endDate = this.divorceDate || (this.isActive ? new Date() : null);
    if (!endDate) return null;

    const start = this.marriageDate;
    const end = endDate;
    let years = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(0, years);
  }

  /**
   * Gets partner ID for succession and relationship purposes
   */
  getPartnerId(memberId: string): string | null {
    if (memberId === this.spouse1Id) return this.spouse2Id;
    if (memberId === this.spouse2Id) return this.spouse1Id;
    return null;
  }

  /**
   * Determines if member can enter another marriage under Kenyan law
   */
  canMemberMarry(memberId: string): { canMarry: boolean; reason?: string } {
    if (!this.allowsPolygamy() && this.isActive) {
      return {
        canMarry: false,
        reason: 'This marriage type does not allow polygamy and marriage is still active.',
      };
    }
    if ((memberId === this.spouse1Id || memberId === this.spouse2Id) && this.isActive) {
      return {
        canMarry: this.allowsPolygamy(),
        reason: this.allowsPolygamy()
          ? 'Polygamous marriage allows additional spouses.'
          : 'Member is already part of an active monogamous marriage.',
      };
    }
    return { canMarry: true };
  }

  // --------------------------------------------------------------------------
  // PRIVATE VALIDATION METHODS
  // --------------------------------------------------------------------------

  private validateMarriageCreation(
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
  ): void {
    // Legal prohibition - cannot marry oneself
    if (spouse1Id === spouse2Id) {
      throw new Error('Cannot marry oneself under Kenyan law.');
    }

    // Validate marriage type
    const validTypes = Object.values(MarriageStatus);
    if (!validTypes.includes(marriageType)) {
      throw new Error(`Invalid marriage type: ${marriageType}`);
    }

    // Validate marriage date
    if (marriageDate > new Date()) {
      throw new Error('Marriage date cannot be in the future.');
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS (exactly matching Prisma schema fields)
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getFamilyId(): string {
    return this.familyId;
  }
  getSpouse1Id(): string {
    return this.spouse1Id;
  }
  getSpouse2Id(): string {
    return this.spouse2Id;
  }
  getRegistrationNumber(): string | null {
    return this.registrationNumber;
  }
  getIssuingAuthority(): string | null {
    return this.issuingAuthority;
  }
  getCertificateIssueDate(): Date | null {
    return this.certificateIssueDate;
  }
  getRegistrationDistrict(): string | null {
    return this.registrationDistrict;
  }
  getDivorceType(): string | null {
    return this.divorceType;
  }
  getBridePricePaid(): boolean {
    return this.bridePricePaid;
  }
  getBridePriceAmount(): number | null {
    return this.bridePriceAmount;
  }
  getBridePriceCurrency(): string | null {
    return this.bridePriceCurrency;
  }
  getElderWitnesses(): string[] {
    return [...this.elderWitnesses];
  }
  getCeremonyLocation(): string | null {
    return this.ceremonyLocation;
  }
  getTraditionalCeremonyType(): string | null {
    return this.traditionalCeremonyType;
  }
  getLobolaReceiptNumber(): string | null {
    return this.lobolaReceiptNumber;
  }
  getMarriageElderContact(): string | null {
    return this.marriageElderContact;
  }
  getClanApproval(): boolean {
    return this.clanApproval;
  }
  getFamilyConsent(): boolean {
    return this.familyConsent;
  }
  getTraditionalRitesPerformed(): string[] {
    return [...this.traditionalRitesPerformed];
  }
  getMarriageOfficerName(): string | null {
    return this.marriageOfficerName;
  }
  getMarriageOfficerTitle(): string | null {
    return this.marriageOfficerTitle;
  }
  getMarriageOfficerRegistrationNumber(): string | null {
    return this.marriageOfficerRegistrationNumber;
  }
  getMarriageOfficerReligiousDenomination(): string | null {
    return this.marriageOfficerReligiousDenomination;
  }
  getMarriageOfficerLicenseNumber(): string | null {
    return this.marriageOfficerLicenseNumber;
  }
  getMarriageVenue(): string | null {
    return this.marriageVenue;
  }
  getMarriageCounty(): KenyanCounty | null {
    return this.marriageCounty;
  }
  getMarriageSubCounty(): string | null {
    return this.marriageSubCounty;
  }
  getMarriageDistrict(): string | null {
    return this.marriageDistrict;
  }
  getMarriageGpsCoordinates(): string | null {
    return this.marriageGpsCoordinates;
  }
  getMarriageDate(): Date {
    return this.marriageDate;
  }
  getMarriageType(): MarriageStatus {
    return this.marriageType;
  }
  getCertificateNumber(): string | null {
    return this.certificateNumber;
  }
  getDivorceDate(): Date | null {
    return this.divorceDate;
  }
  getDivorceCertNumber(): string | null {
    return this.divorceCertNumber;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets Kenyan marriage certificate details for legal documentation
   */
  getKenyanMarriageCertificate(): KenyanMarriageCertificate | null {
    if (
      !this.registrationNumber ||
      !this.issuingAuthority ||
      !this.certificateIssueDate ||
      !this.registrationDistrict
    ) {
      return null;
    }

    return new KenyanMarriageCertificate(
      this.registrationNumber,
      this.issuingAuthority,
      this.certificateIssueDate,
      this.registrationDistrict,
    );
  }

  /**
   * Gets marriage officer details for legal documentation
   */
  getMarriageOfficer(): KenyanMarriageOfficer | null {
    if (!this.marriageOfficerName || !this.marriageOfficerRegistrationNumber) {
      return null;
    }

    return new KenyanMarriageOfficer(
      this.marriageOfficerName,
      this.marriageOfficerTitle || '',
      this.marriageOfficerRegistrationNumber,
      this.marriageOfficerReligiousDenomination || '',
      this.marriageOfficerLicenseNumber || '',
    );
  }

  /**
   * Gets marriage location details for legal documentation
   */
  getMarriageLocation(): KenyanMarriageLocation | null {
    if (!this.marriageVenue || !this.marriageCounty) {
      return null;
    }

    return new KenyanMarriageLocation(
      this.marriageVenue,
      this.marriageCounty,
      this.marriageSubCounty || '',
      this.marriageDistrict || '',
      this.marriageGpsCoordinates || '',
    );
  }

  /**
   * Gets comprehensive marriage summary for Kenyan legal proceedings
   */
  getMarriageSummary() {
    const validation = this.isValidUnderKenyanLaw();

    return {
      id: this.id,
      familyId: this.familyId,
      spouse1Id: this.spouse1Id,
      spouse2Id: this.spouse2Id,
      marriageType: this.marriageType,
      marriageDate: this.marriageDate,
      isActive: this.isActive,
      durationYears: this.getMarriageDuration(),
      allowsPolygamy: this.allowsPolygamy(),
      isValid: validation.isValid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      hasCustomaryDetails: this.marriageType === MarriageStatus.CUSTOMARY_MARRIAGE,
      hasCivilRegistration: !!this.certificateNumber,
      dissolutionType: this.divorceType,
      certificateDetails: this.getKenyanMarriageCertificate(),
      officerDetails: this.getMarriageOfficer(),
      locationDetails: this.getMarriageLocation(),
    };
  }
}
