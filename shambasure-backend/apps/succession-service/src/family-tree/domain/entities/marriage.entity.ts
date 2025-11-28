import { AggregateRoot } from '@nestjs/cqrs';
import { MarriageStatus } from '@prisma/client';

import { CustomaryMarriageDetailsUpdatedEvent } from '../events/customary-marriage-details-updated.event';
import { MarriageDissolvedEvent } from '../events/marriage-dissolved.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';

export interface CustomaryMarriageDetails {
  bridePricePaid: boolean;
  bridePriceAmount?: number;
  bridePriceCurrency?: string;
  elderWitnesses: string[];
  ceremonyLocation: string;
  traditionalCeremonyType?: string;
  lobolaReceiptNumber?: string;
  marriageElderContact?: string;
}

export interface MarriageReconstitutionProps {
  id: string;
  familyId: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageDate: string | Date;
  marriageType: MarriageStatus;
  certificateNumber?: string | null;
  divorceDate?: string | Date | null;
  divorceCertNumber?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  customaryMarriageDetails?: CustomaryMarriageDetails | null;
  marriageRegistrationNumber?: string | null;
  marriageOfficer?: string | null;
  marriageLocation?: string | null;
}

export class Marriage extends AggregateRoot {
  private id: string;
  private familyId: string;
  private spouse1Id: string;
  private spouse2Id: string;
  private marriageDate: Date;
  private marriageType: MarriageStatus;
  private certificateNumber: string | null;
  private divorceDate: Date | null;
  private divorceCertNumber: string | null;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  // Kenyan Marriage Specific Details
  private customaryMarriageDetails: CustomaryMarriageDetails | null;
  private marriageRegistrationNumber: string | null;
  private marriageOfficer: string | null;
  private marriageLocation: string | null;

  private constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
  ) {
    super();

    if (spouse1Id === spouse2Id) throw new Error('Cannot marry oneself.');

    this.id = id;
    this.familyId = familyId;
    this.spouse1Id = spouse1Id;
    this.spouse2Id = spouse2Id;
    this.marriageType = marriageType;
    this.marriageDate = marriageDate;

    this.certificateNumber = null;
    this.divorceDate = null;
    this.divorceCertNumber = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.customaryMarriageDetails = null;
    this.marriageRegistrationNumber = null;
    this.marriageOfficer = null;
    this.marriageLocation = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    type: MarriageStatus,
    date: Date,
    details?: {
      certificateNumber?: string;
      marriageRegistrationNumber?: string;
      marriageOfficer?: string;
      marriageLocation?: string;
      customaryMarriageDetails?: CustomaryMarriageDetails;
    },
  ): Marriage {
    if (!this.isValidMarriageType(type)) {
      throw new Error(`Invalid marriage type for Kenyan law: ${type}`);
    }

    if (date > new Date()) throw new Error('Marriage date cannot be in the future.');

    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, type, date);

    if (details?.certificateNumber) marriage.certificateNumber = details.certificateNumber;
    if (details?.marriageRegistrationNumber)
      marriage.marriageRegistrationNumber = details.marriageRegistrationNumber;
    if (details?.marriageOfficer) marriage.marriageOfficer = details.marriageOfficer;
    if (details?.marriageLocation) marriage.marriageLocation = details.marriageLocation;
    if (details?.customaryMarriageDetails)
      marriage.customaryMarriageDetails = details.customaryMarriageDetails;

    marriage.apply(new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id, type, date));

    if (details?.customaryMarriageDetails) {
      marriage.apply(
        new CustomaryMarriageDetailsUpdatedEvent(id, familyId, details.customaryMarriageDetails),
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
      props.marriageDate instanceof Date ? props.marriageDate : new Date(props.marriageDate),
    );

    marriage.certificateNumber = props.certificateNumber || null;

    if (props.divorceDate) {
      marriage.divorceDate =
        props.divorceDate instanceof Date ? props.divorceDate : new Date(props.divorceDate);
    } else {
      marriage.divorceDate = null;
    }

    marriage.divorceCertNumber = props.divorceCertNumber || null;
    marriage.isActive = props.isActive;
    marriage.createdAt =
      props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    marriage.updatedAt =
      props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);

    marriage.customaryMarriageDetails = props.customaryMarriageDetails || null;
    marriage.marriageRegistrationNumber = props.marriageRegistrationNumber || null;
    marriage.marriageOfficer = props.marriageOfficer || null;
    marriage.marriageLocation = props.marriageLocation || null;

    return marriage;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  dissolve(
    date: Date,
    certificateNumber: string,
    dissolutionType: 'DIVORCE' | 'ANNULMENT' | 'DEATH' = 'DIVORCE',
  ): void {
    if (!this.isActive) throw new Error('Marriage is already inactive/dissolved.');
    if (date < this.marriageDate)
      throw new Error('Dissolution date cannot be before marriage date.');
    if (date > new Date()) throw new Error('Dissolution date cannot be in the future.');

    this.isActive = false;
    this.divorceDate = date;
    this.divorceCertNumber = certificateNumber;
    this.updatedAt = new Date();

    this.apply(
      new MarriageDissolvedEvent(
        this.id,
        this.familyId,
        this.spouse1Id,
        this.spouse2Id,
        date,
        dissolutionType,
      ),
    );
  }

  registerCertificate(certNumber: string, registrationNumber?: string): void {
    this.certificateNumber = certNumber;
    if (registrationNumber) this.marriageRegistrationNumber = registrationNumber;
    this.updatedAt = new Date();
  }

  updateCustomaryMarriageDetails(details: CustomaryMarriageDetails): void {
    if (this.marriageType !== 'CUSTOMARY_MARRIAGE') {
      throw new Error('Customary marriage details can only be set for customary marriages.');
    }
    this.customaryMarriageDetails = details;
    this.updatedAt = new Date();
    this.apply(new CustomaryMarriageDetailsUpdatedEvent(this.id, this.familyId, details));
  }

  isValidUnderKenyanLaw(): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (!this.isActive) reasons.push('Marriage must be active to be valid.');
    if (this.marriageDate > new Date()) reasons.push('Marriage date cannot be in the future.');

    if (this.marriageType === 'CUSTOMARY_MARRIAGE') {
      if (!this.customaryMarriageDetails) {
        reasons.push('Customary marriages require customary marriage details.');
      } else {
        if (!this.customaryMarriageDetails.elderWitnesses?.length)
          reasons.push('Customary marriages require elder witnesses.');
        if (!this.customaryMarriageDetails.ceremonyLocation)
          reasons.push('Customary marriages require a ceremony location.');
      }
    }

    if (this.marriageType === 'CIVIL_UNION' && !this.certificateNumber) {
      reasons.push('Civil unions require a certificate number.');
    }

    return { isValid: reasons.length === 0, reasons };
  }

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

  allowsPolygamy(): boolean {
    const polygamousTypes: MarriageStatus[] = ['CUSTOMARY_MARRIAGE'];
    return polygamousTypes.includes(this.marriageType);
  }

  getPartnerId(memberId: string): string | null {
    if (memberId === this.spouse1Id) return this.spouse2Id;
    if (memberId === this.spouse2Id) return this.spouse1Id;
    return null;
  }

  canMemberMarry(memberId: string): { canMarry: boolean; reason?: string } {
    if (!this.allowsPolygamy() && this.isActive) {
      return {
        canMarry: false,
        reason: 'This marriage type does not allow polygamy and marriage is still active.',
      };
    }
    if (memberId === this.spouse1Id || memberId === this.spouse2Id) {
      return { canMarry: false, reason: 'Member is already part of this marriage.' };
    }
    return { canMarry: true };
  }

  private static isValidMarriageType(type: MarriageStatus): boolean {
    const validTypes: MarriageStatus[] = ['CUSTOMARY_MARRIAGE', 'CIVIL_UNION', 'MARRIED'];
    return validTypes.includes(type);
  }

  // Getters
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
  getMarriageType(): MarriageStatus {
    return this.marriageType;
  }
  getMarriageDate(): Date {
    return this.marriageDate;
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
  getCustomaryMarriageDetails(): CustomaryMarriageDetails | null {
    return this.customaryMarriageDetails;
  }
  getMarriageRegistrationNumber(): string | null {
    return this.marriageRegistrationNumber;
  }
  getMarriageOfficer(): string | null {
    return this.marriageOfficer;
  }
  getMarriageLocation(): string | null {
    return this.marriageLocation;
  }

  getMarriageSummary() {
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
      hasCustomaryDetails: !!this.customaryMarriageDetails,
      isValid: this.isValidUnderKenyanLaw().isValid,
    };
  }
}
