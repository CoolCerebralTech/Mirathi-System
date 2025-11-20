import { AggregateRoot } from '@nestjs/cqrs';
import { MarriageStatus } from '@prisma/client';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { MarriageDissolvedEvent } from '../events/marriage-dissolved.event';
import { KENYAN_FAMILY_LAW } from '../../../common/constants/kenyan-law.constants';

export class Marriage extends AggregateRoot {
  private id: string;
  private familyId: string;

  private spouse1Id: string;
  private spouse2Id: string;

  // Legal details
  private marriageDate: Date;
  private marriageType: MarriageStatus; // Mapped to Prisma Enum (CUSTOMARY, CIVIL, etc.)
  private certificateNumber: string | null;

  // Dissolution details
  private divorceDate: Date | null;
  private divorceCertNumber: string | null;

  // Status
  private isActive: boolean;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor
  private constructor(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDate: Date,
  ) {
    super();
    if (spouse1Id === spouse2Id) {
      throw new Error('Cannot marry oneself.');
    }

    this.id = id;
    this.familyId = familyId;
    this.spouse1Id = spouse1Id;
    this.spouse2Id = spouse2Id;
    this.marriageType = marriageType;
    this.marriageDate = marriageDate;

    // Defaults
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

  static create(
    id: string,
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    type: MarriageStatus,
    date: Date,
    certificateNumber?: string,
  ): Marriage {
    const marriage = new Marriage(id, familyId, spouse1Id, spouse2Id, type, date);

    if (certificateNumber) {
      marriage.certificateNumber = certificateNumber;
    }

    marriage.apply(new MarriageRegisteredEvent(id, familyId, spouse1Id, spouse2Id, type, date));

    return marriage;
  }

  static reconstitute(props: any): Marriage {
    const marriage = new Marriage(
      props.id,
      props.familyId,
      props.spouse1Id,
      props.spouse2Id,
      props.marriageType,
      new Date(props.marriageDate),
    );

    marriage.certificateNumber = props.certificateNumber || null;
    marriage.divorceDate = props.divorceDate ? new Date(props.divorceDate) : null;
    marriage.divorceCertNumber = props.divorceCertNumber || null;
    marriage.isActive = props.isActive;
    marriage.createdAt = new Date(props.createdAt);
    marriage.updatedAt = new Date(props.updatedAt);

    return marriage;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Dissolves the marriage (Divorce).
   * In Kenya, this requires a Court Order (Decree Absolute).
   */
  dissolve(date: Date, certificateNumber: string): void {
    if (!this.isActive) {
      throw new Error('Marriage is already inactive/dissolved.');
    }

    if (date < this.marriageDate) {
      throw new Error('Divorce date cannot be before marriage date.');
    }

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
        'Legal Dissolution',
      ),
    );
  }

  /**
   * Updates the certificate number (e.g., after registering a Customary Marriage).
   */
  registerCertificate(certNumber: string): void {
    this.certificateNumber = certNumber;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // DOMAIN RULES / HELPERS
  // --------------------------------------------------------------------------

  /**
   * Checks if this marriage regime theoretically allows polygamy.
   * Used by Policies to validate if a user can add a second spouse.
   */
  allowsPolygamy(): boolean {
    // Logic derived from Constants -> Mapped to Schema Enum
    // CUSTOMARY_MARRIAGE and ISLAMIC (if added to enum) allow polygamy.
    // CIVIL_UNION and CHRISTIAN (if added) do not.

    const polygamousTypes = [
      'CUSTOMARY_MARRIAGE',
      // 'ISLAMIC_MARRIAGE' - if supported in schema enum
    ];

    // Check if the current type string is in the allowed list
    return polygamousTypes.includes(this.marriageType.toString());
  }

  /**
   * Returns the ID of the spouse of the given member ID in this marriage.
   */
  getPartnerId(memberId: string): string | null {
    if (memberId === this.spouse1Id) return this.spouse2Id;
    if (memberId === this.spouse2Id) return this.spouse1Id;
    return null; // Member not part of this marriage
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getFamilyId() {
    return this.familyId;
  }
  getSpouse1Id() {
    return this.spouse1Id;
  }
  getSpouse2Id() {
    return this.spouse2Id;
  }
  getType() {
    return this.marriageType;
  }
  getDate() {
    return this.marriageDate;
  }
  getCertificateNumber() {
    return this.certificateNumber;
  }
  getIsActive() {
    return this.isActive;
  }
}
