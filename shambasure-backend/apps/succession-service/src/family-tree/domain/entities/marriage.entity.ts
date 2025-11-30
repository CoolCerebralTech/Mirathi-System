import { AggregateRoot } from '@nestjs/cqrs';
import { KenyanCounty, MarriageStatus, Prisma } from '@prisma/client';

import { CustomaryMarriageDetailsUpdatedEvent } from '../events/customary-marriage-details-updated.event';
import { MarriageDissolvedEvent } from '../events/marriage-dissolved.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

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

// Marriage Reconstitution Interface matching Prisma schema
export interface MarriageReconstitutionProps {
  id: string;
  familyId: string;

  // Parties
  spouse1Id: string;
  spouse2Id: string;

  // Kenyan Marriage Certificate Details
  registrationNumber: string | null;
  issuingAuthority: string | null;
  certificateIssueDate: Date | null;
  registrationDistrict: string | null;

  // Dissolution Details
  divorceType: string | null;

  // Customary Marriage Details (JSON fields as Prisma.JsonValue)
  bridePricePaid: boolean;
  bridePriceAmount: number | null;
  bridePriceCurrency: string | null;
  elderWitnesses: Prisma.JsonValue;
  ceremonyLocation: string | null;
  traditionalCeremonyType: string | null;
  lobolaReceiptNumber: string | null;
  marriageElderContact: string | null;
  clanApproval: boolean;
  familyConsent: boolean;
  traditionalRitesPerformed: Prisma.JsonValue;

  // Marriage Officer Details
  marriageOfficerName: string | null;
  marriageOfficerTitle: string | null;
  marriageOfficerRegistrationNumber: string | null;
  marriageOfficerReligiousDenomination: string | null;
  marriageOfficerLicenseNumber: string | null;

  // Marriage Location Details
  marriageVenue: string | null;
  marriageCounty: KenyanCounty | null;
  marriageSubCounty: string | null;
  marriageDistrict: string | null;
  marriageGpsCoordinates: string | null;

  // Marriage details
  marriageDate: Date;
  marriageType: MarriageStatus;
  certificateNumber: string | null;

  // Dissolution
  divorceDate: Date | null;
  divorceCertNumber: string | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: MARRIAGE
// -----------------------------------------------------------------------------

export class Marriage extends AggregateRoot {
  private readonly id: string;
  private readonly familyId: string;

  // Parties
  private readonly spouse1Id: string;
  private readonly spouse2Id: string;

  // Kenyan Marriage Certificate Details
  private registrationNumber: string | null;
  private issuingAuthority: string | null;
  private certificateIssueDate: Date | null;
  private registrationDistrict: string | null;

  // Dissolution Details
  private divorceType: string | null;

  // Customary Marriage Details
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

  // Marriage Officer Details
  private marriageOfficerName: string | null;
  private marriageOfficerTitle: string | null;
  private marriageOfficerRegistrationNumber: string | null;
  private marriageOfficerReligiousDenomination: string | null;
  private marriageOfficerLicenseNumber: string | null;

  // Marriage Location Details
  private marriageVenue: string | null;
  private marriageCounty: KenyanCounty | null;
  private marriageSubCounty: string | null;
  private marriageDistrict: string | null;
  private marriageGpsCoordinates: string | null;

  // Marriage details
  private readonly marriageDate: Date;
  private readonly marriageType: MarriageStatus;
  private certificateNumber: string | null;

  // Dissolution
  private divorceDate: Date | null;
  private divorceCertNumber: string | null;

  // Status
  private isActive: boolean;

  // Timestamps
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
    // Lifecycle injection for reconstitution
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super();

    // Basic Validation
    if (spouse1Id === spouse2Id) {
      throw new Error('Cannot marry oneself under Kenyan law.');
    }
    if (marriageDate > new Date()) {
      throw new Error('Marriage date cannot be in the future.');
    }

    this.id = id;
    this.familyId = familyId;
    this.spouse1Id = spouse1Id;
    this.spouse2Id = spouse2Id;
    this.marriageType = marriageType;
    this.marriageDate = marriageDate;

    // Defaults
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

    // Lifecycle
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

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

    // Apply details if provided
    if (details) {
      if (details.certificateNumber) marriage.certificateNumber = details.certificateNumber;
      if (details.registrationNumber) marriage.registrationNumber = details.registrationNumber;
      if (details.issuingAuthority) marriage.issuingAuthority = details.issuingAuthority;
      if (details.certificateIssueDate)
        marriage.certificateIssueDate = details.certificateIssueDate;
      if (details.registrationDistrict)
        marriage.registrationDistrict = details.registrationDistrict;

      if (details.marriageOfficerName) marriage.marriageOfficerName = details.marriageOfficerName;
      if (details.marriageOfficerTitle)
        marriage.marriageOfficerTitle = details.marriageOfficerTitle;
      if (details.marriageOfficerRegistrationNumber)
        marriage.marriageOfficerRegistrationNumber = details.marriageOfficerRegistrationNumber;
      if (details.marriageOfficerReligiousDenomination)
        marriage.marriageOfficerReligiousDenomination =
          details.marriageOfficerReligiousDenomination;
      if (details.marriageOfficerLicenseNumber)
        marriage.marriageOfficerLicenseNumber = details.marriageOfficerLicenseNumber;

      if (details.marriageVenue) marriage.marriageVenue = details.marriageVenue;
      if (details.marriageCounty) marriage.marriageCounty = details.marriageCounty;
      if (details.marriageSubCounty) marriage.marriageSubCounty = details.marriageSubCounty;
      if (details.marriageDistrict) marriage.marriageDistrict = details.marriageDistrict;
      if (details.marriageGpsCoordinates)
        marriage.marriageGpsCoordinates = details.marriageGpsCoordinates;

      if (marriageType === MarriageStatus.CUSTOMARY_MARRIAGE) {
        marriage.bridePricePaid = details.bridePricePaid ?? false;
        marriage.bridePriceAmount = details.bridePriceAmount ?? null;
        marriage.bridePriceCurrency = details.bridePriceCurrency ?? 'KES';
        marriage.elderWitnesses = details.elderWitnesses ?? [];
        marriage.ceremonyLocation = details.ceremonyLocation ?? null;
        marriage.traditionalCeremonyType = details.traditionalCeremonyType ?? null;
        marriage.lobolaReceiptNumber = details.lobolaReceiptNumber ?? null;
        marriage.marriageElderContact = details.marriageElderContact ?? null;
        marriage.clanApproval = details.clanApproval ?? false;
        marriage.familyConsent = details.familyConsent ?? false;
        marriage.traditionalRitesPerformed = details.traditionalRitesPerformed ?? [];
      }
    }

    marriage.apply(
      new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id, marriageType, marriageDate),
    );

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

  static reconstitute(props: MarriageReconstitutionProps): Marriage {
    const marriage = new Marriage(
      props.id,
      props.familyId,
      props.spouse1Id,
      props.spouse2Id,
      props.marriageType,
      props.marriageDate,
      props.createdAt,
      props.updatedAt,
    );

    marriage.registrationNumber = props.registrationNumber;
    marriage.issuingAuthority = props.issuingAuthority;
    marriage.certificateIssueDate = props.certificateIssueDate;
    marriage.registrationDistrict = props.registrationDistrict;
    marriage.divorceType = props.divorceType;
    marriage.bridePricePaid = props.bridePricePaid;
    marriage.bridePriceAmount = props.bridePriceAmount;
    marriage.bridePriceCurrency = props.bridePriceCurrency;

    // JSON Safe Parsing
    marriage.elderWitnesses = Array.isArray(props.elderWitnesses)
      ? (props.elderWitnesses as string[])
      : [];

    marriage.ceremonyLocation = props.ceremonyLocation;
    marriage.traditionalCeremonyType = props.traditionalCeremonyType;
    marriage.lobolaReceiptNumber = props.lobolaReceiptNumber;
    marriage.marriageElderContact = props.marriageElderContact;
    marriage.clanApproval = props.clanApproval;
    marriage.familyConsent = props.familyConsent;

    // JSON Safe Parsing
    marriage.traditionalRitesPerformed = Array.isArray(props.traditionalRitesPerformed)
      ? (props.traditionalRitesPerformed as string[])
      : [];

    marriage.marriageOfficerName = props.marriageOfficerName;
    marriage.marriageOfficerTitle = props.marriageOfficerTitle;
    marriage.marriageOfficerRegistrationNumber = props.marriageOfficerRegistrationNumber;
    marriage.marriageOfficerReligiousDenomination = props.marriageOfficerReligiousDenomination;
    marriage.marriageOfficerLicenseNumber = props.marriageOfficerLicenseNumber;
    marriage.marriageVenue = props.marriageVenue;
    marriage.marriageCounty = props.marriageCounty;
    marriage.marriageSubCounty = props.marriageSubCounty;
    marriage.marriageDistrict = props.marriageDistrict;
    marriage.marriageGpsCoordinates = props.marriageGpsCoordinates;
    marriage.certificateNumber = props.certificateNumber;
    marriage.divorceDate = props.divorceDate;
    marriage.divorceCertNumber = props.divorceCertNumber;
    marriage.isActive = props.isActive;

    return marriage;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  dissolve(
    dissolutionDate: Date,
    dissolutionType: 'DIVORCE' | 'ANNULMENT' | 'DEATH' | 'CUSTOMARY_DISSOLUTION',
    certificateNumber?: string,
    courtOrderNumber?: string,
  ): void {
    if (!this.isActive) {
      throw new Error('Marriage is already inactive/dissolved.');
    }
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

    if (details.elderWitnesses && details.elderWitnesses.length === 0) {
      throw new Error('Customary marriages require at least one elder witness.');
    }

    if (details.ceremonyLocation !== undefined)
      this.ceremonyLocation = details.ceremonyLocation ?? null;
    if (details.bridePricePaid !== undefined) this.bridePricePaid = details.bridePricePaid ?? false;
    if (details.bridePriceAmount !== undefined)
      this.bridePriceAmount = details.bridePriceAmount ?? null;
    if (details.bridePriceCurrency !== undefined)
      this.bridePriceCurrency = details.bridePriceCurrency ?? null;
    if (details.elderWitnesses !== undefined) this.elderWitnesses = details.elderWitnesses ?? [];
    if (details.traditionalCeremonyType !== undefined)
      this.traditionalCeremonyType = details.traditionalCeremonyType ?? null;
    if (details.lobolaReceiptNumber !== undefined)
      this.lobolaReceiptNumber = details.lobolaReceiptNumber ?? null;
    if (details.marriageElderContact !== undefined)
      this.marriageElderContact = details.marriageElderContact ?? null;
    if (details.clanApproval !== undefined) this.clanApproval = details.clanApproval ?? false;
    if (details.familyConsent !== undefined) this.familyConsent = details.familyConsent ?? false;
    if (details.traditionalRitesPerformed !== undefined)
      this.traditionalRitesPerformed = details.traditionalRitesPerformed ?? [];

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

  updateMarriageOfficerDetails(details: {
    name?: string;
    title?: string;
    registrationNumber?: string;
    religiousDenomination?: string;
    licenseNumber?: string;
  }): void {
    if (details.name !== undefined) this.marriageOfficerName = details.name ?? null;
    if (details.title !== undefined) this.marriageOfficerTitle = details.title ?? null;
    if (details.registrationNumber !== undefined)
      this.marriageOfficerRegistrationNumber = details.registrationNumber ?? null;
    if (details.religiousDenomination !== undefined)
      this.marriageOfficerReligiousDenomination = details.religiousDenomination ?? null;
    if (details.licenseNumber !== undefined)
      this.marriageOfficerLicenseNumber = details.licenseNumber ?? null;
    this.updatedAt = new Date();
  }

  updateMarriageLocation(details: {
    venue?: string;
    county?: KenyanCounty;
    subCounty?: string;
    district?: string;
    gpsCoordinates?: string;
  }): void {
    if (details.venue !== undefined) this.marriageVenue = details.venue ?? null;
    if (details.county !== undefined) this.marriageCounty = details.county ?? null;
    if (details.subCounty !== undefined) this.marriageSubCounty = details.subCounty ?? null;
    if (details.district !== undefined) this.marriageDistrict = details.district ?? null;
    if (details.gpsCoordinates !== undefined)
      this.marriageGpsCoordinates = details.gpsCoordinates ?? null;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // LEGAL VALIDATION
  // --------------------------------------------------------------------------

  isValidUnderKenyanLaw(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isActive && !this.divorceDate) {
      errors.push('Inactive marriage must have a dissolution date/record.');
    }

    switch (this.marriageType) {
      case MarriageStatus.CUSTOMARY_MARRIAGE:
        this.validateCustomaryMarriage(errors, warnings);
        break;
      case MarriageStatus.CIVIL_UNION:
      case MarriageStatus.MARRIED: // Assuming 'MARRIED' implies statutory marriage
      case MarriageStatus.CHRISTIAN:
        this.validateCivilMarriage(errors, warnings);
        break;
      case MarriageStatus.ISLAMIC:
        this.validateIslamicMarriage(errors, warnings);
        break;
    }

    // Succession Duration warning (Section 29)
    if (this.isActive && this.getMarriageDuration() < 1) {
      warnings.push('Short duration marriage (less than 1 year).');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateCustomaryMarriage(errors: string[], warnings: string[]): void {
    if (!this.elderWitnesses || this.elderWitnesses.length === 0) {
      errors.push('Customary marriages require elder witnesses to be valid.');
    }
    if (!this.ceremonyLocation) {
      errors.push('Customary marriages require a ceremony location.');
    }
    if (!this.clanApproval) warnings.push('Clan approval is recommended.');
    if (!this.familyConsent) warnings.push('Family consent is recommended.');
  }

  private validateCivilMarriage(errors: string[], warnings: string[]): void {
    if (!this.certificateNumber) {
      errors.push('Civil/Christian marriages require a Certificate Number.');
    }
    if (!this.marriageOfficerName) warnings.push('Marriage officer name missing.');
  }

  private validateIslamicMarriage(errors: string[], warnings: string[]): void {
    if (!this.marriageVenue) warnings.push('Venue required for Islamic marriage.');
  }

  allowsPolygamy(): boolean {
    // Under Kenyan Law: Customary and Islamic marriages are potentially polygamous.
    // Christian, Civil, and Hindu marriages are strictly monogamous.
    const polygamousTypes: MarriageStatus[] = [
      MarriageStatus.CUSTOMARY_MARRIAGE,
      MarriageStatus.ISLAMIC,
    ];
    return polygamousTypes.includes(this.marriageType);
  }

  getMarriageDuration(): number {
    const endDate = this.divorceDate || (this.isActive ? new Date() : null);
    if (!endDate) return 0;

    const start = this.marriageDate;
    let years = endDate.getFullYear() - start.getFullYear();
    const monthDiff = endDate.getMonth() - start.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(0, years);
  }

  getPartnerId(memberId: string): string | null {
    if (memberId === this.spouse1Id) return this.spouse2Id;
    if (memberId === this.spouse2Id) return this.spouse1Id;
    return null;
  }

  canMemberMarry(memberId: string): { canMarry: boolean; reason?: string } {
    if (!this.isActive) return { canMarry: true }; // Divorced/Widowed can remarry

    // Member is in THIS active marriage
    if (memberId === this.spouse1Id || memberId === this.spouse2Id) {
      if (this.allowsPolygamy()) {
        return { canMarry: true, reason: 'Polygamous marriage allows additional spouses.' };
      }
      return { canMarry: false, reason: 'Member is in an active monogamous marriage.' };
    }

    // Member is not in this marriage, so this marriage doesn't block them (logic handled by Family aggregate)
    return { canMarry: true };
  }

  // --------------------------------------------------------------------------
  // GETTERS
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
    };
  }
}
