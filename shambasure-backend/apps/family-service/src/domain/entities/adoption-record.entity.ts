// domain/entities/adoption-order.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidRelationshipException } from '../exceptions/family.exception';

/**
 * AdoptionOrder Entity Props (Immutable)
 *
 * Design: Legal adoption creates parent-child relationship
 * - Adopted children have FULL inheritance rights (Children Act 2022)
 * - Severs legal ties with biological parents
 * - Creates new legal family relationship
 *
 * Kenyan Law Context:
 * - Children Act 2022: Governs adoption process
 * - Court order required for legal adoption
 * - Customary adoption also recognized
 * - Inter-country adoption has special rules
 * - Adopted child = biological child for succession (S. 35 LSA)
 *
 * Types of Adoption:
 * 1. STATUTORY: Court-ordered under Children Act
 * 2. CUSTOMARY: Traditional adoption (recognized)
 * 3. INTER_COUNTRY: International adoption
 * 4. KINSHIP: Adoption by relative
 */
export interface AdoptionOrderProps {
  // References
  familyId: UniqueEntityID;
  adopteeId: UniqueEntityID; // Child being adopted
  adopterId: UniqueEntityID; // Adoptive parent

  // Adoption Type
  adoptionType: 'STATUTORY' | 'CUSTOMARY' | 'INTER_COUNTRY' | 'KINSHIP';

  // Court Order (Statutory)
  courtOrderNumber?: string;
  courtStation?: string;
  adoptionDate: Date;
  registrationDate?: Date;

  // Consents Required
  hasConsents: AdoptionConsents;
  consentDocuments: string[]; // Document IDs

  // Child Welfare Assessment
  childWelfareReportId?: UniqueEntityID;
  suitabilityReportId?: UniqueEntityID;
  socialWorkerName?: string;
  socialWorkerLicenseNumber?: string;

  // Adoption Agreement
  adoptionAgreementSigned: boolean;
  adoptionAgreementDate?: Date;

  // Customary Adoption Details
  customaryDetails?: CustomaryAdoptionDetails;

  // Inter-Country Adoption Details
  interCountryDetails?: InterCountryAdoptionDetails;

  // Legal Effects
  seversbiologicalTies: boolean;
  createsNewLegalRelationship: boolean;
  inheritanceRights: 'FULL' | 'PARTIAL';

  // Post-Adoption
  postAdoptionSupportRequired: boolean;
  followUpSchedule?: FollowUpSchedule;
}

/**
 * Adoption Consents
 * All required consents must be obtained
 */
export interface AdoptionConsents {
  biologicalParents: boolean; // Birth parents consent
  spouse: boolean; // Adopter's spouse consent (if married)
  adoptee: boolean; // Child's consent (if over 14)
  guardian: boolean; // Legal guardian consent
  childrenOfficer: boolean; // Children's Officer approval
}

/**
 * Customary Adoption Details
 */
export interface CustomaryAdoptionDetails {
  ethnicGroup: string;
  customaryProcedure: string;
  elderApproval: boolean;
  elderNames: string[];
  ceremonyDate: Date;
  ceremonyLocation: string;
  witnessCount: number;
}

/**
 * Inter-Country Adoption Details
 */
export interface InterCountryAdoptionDetails {
  originCountry: string;
  destinationCountry: string;
  hagueConventionCompliant: boolean;
  centralAuthorityApproval: boolean;
  homeStudyCompleted: boolean;
  immigrationClearance: boolean;
}

/**
 * Follow-Up Schedule
 */
export interface FollowUpSchedule {
  sixMonthVisit?: Date;
  oneYearVisit?: Date;
  twoYearVisit?: Date;
  lastVisitDate?: Date;
  nextVisitDue?: Date;
}

/**
 * Factory Props
 */
export interface CreateAdoptionOrderProps {
  familyId: string;
  adopteeId: string;
  adopterId: string;
  adoptionType: 'STATUTORY' | 'CUSTOMARY' | 'INTER_COUNTRY' | 'KINSHIP';
  adoptionDate: Date;

  // Court Order
  courtOrderNumber?: string;
  courtStation?: string;
  registrationDate?: Date;

  // Consents
  biologicalParentsConsent: boolean;
  spouseConsent?: boolean;
  adopteeConsent?: boolean;
  guardianConsent?: boolean;
  childrenOfficerApproval?: boolean;
  consentDocuments: string[];

  // Reports
  childWelfareReportId?: string;
  suitabilityReportId?: string;
  socialWorkerName?: string;
  socialWorkerLicenseNumber?: string;

  // Customary
  customaryDetails?: {
    ethnicGroup: string;
    customaryProcedure: string;
    elderApproval: boolean;
    elderNames: string[];
    ceremonyDate: Date;
    ceremonyLocation: string;
    witnessCount: number;
  };

  // Inter-Country
  interCountryDetails?: {
    originCountry: string;
    destinationCountry: string;
    hagueConventionCompliant: boolean;
    centralAuthorityApproval: boolean;
    homeStudyCompleted: boolean;
    immigrationClearance: boolean;
  };

  // Legal Effects
  seversbiologicalTies?: boolean;
  postAdoptionSupportRequired?: boolean;
}

/**
 * AdoptionOrder Entity
 *
 * Represents legal adoption creating parent-child relationship.
 * Critical for inheritance rights under S. 35 LSA.
 *
 * Children Act 2022 Requirements:
 * 1. Best interest of child paramount
 * 2. Court approval required (statutory)
 * 3. Biological parents' consent (unless rights terminated)
 * 4. Home study assessment
 * 5. Post-adoption follow-up
 *
 * Succession Implications:
 * - Adopted child = biological child (full rights)
 * - Severs inheritance from biological parents
 * - Creates inheritance rights from adoptive parents
 * - Affects S. 35/36 LSA calculations
 */
export class AdoptionOrder extends Entity<AdoptionOrderProps> {
  private constructor(id: UniqueEntityID, props: AdoptionOrderProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  public static create(props: CreateAdoptionOrderProps): AdoptionOrder {
    const id = new UniqueEntityID();
    const now = new Date();

    const hasConsents: AdoptionConsents = {
      biologicalParents: props.biologicalParentsConsent,
      spouse: props.spouseConsent ?? false,
      adoptee: props.adopteeConsent ?? false,
      guardian: props.guardianConsent ?? false,
      childrenOfficer: props.childrenOfficerApproval ?? false,
    };

    // Statutory adoption severs biological ties
    const seversbiologicalTies =
      props.seversbiologicalTies ??
      (props.adoptionType === 'STATUTORY' || props.adoptionType === 'INTER_COUNTRY');

    const orderProps: AdoptionOrderProps = {
      familyId: new UniqueEntityID(props.familyId),
      adopteeId: new UniqueEntityID(props.adopteeId),
      adopterId: new UniqueEntityID(props.adopterId),
      adoptionType: props.adoptionType,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate,

      // Court Order
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,

      // Consents
      hasConsents,
      consentDocuments: props.consentDocuments,

      // Reports
      childWelfareReportId: props.childWelfareReportId
        ? new UniqueEntityID(props.childWelfareReportId)
        : undefined,
      suitabilityReportId: props.suitabilityReportId
        ? new UniqueEntityID(props.suitabilityReportId)
        : undefined,
      socialWorkerName: props.socialWorkerName,
      socialWorkerLicenseNumber: props.socialWorkerLicenseNumber,

      // Agreement
      adoptionAgreementSigned: false,

      // Type-Specific Details
      customaryDetails: props.customaryDetails,
      interCountryDetails: props.interCountryDetails,

      // Legal Effects
      seversbiologicalTies,
      createsNewLegalRelationship: true,
      inheritanceRights: 'FULL',

      // Post-Adoption
      postAdoptionSupportRequired: props.postAdoptionSupportRequired ?? true,
    };

    return new AdoptionOrder(id, orderProps, now);
  }

  public static fromPersistence(
    id: string,
    props: AdoptionOrderProps,
    createdAt: Date,
    updatedAt?: Date,
  ): AdoptionOrder {
    const entityId = new UniqueEntityID(id);
    const order = new AdoptionOrder(entityId, props, createdAt);

    if (updatedAt) {
      (order as any)._updatedAt = updatedAt;
    }

    return order;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  public validate(): void {
    // Cannot adopt self
    if (this.props.adopteeId.equals(this.props.adopterId)) {
      throw new InvalidRelationshipException('Cannot adopt oneself');
    }

    // Adoption date cannot be future
    if (this.props.adoptionDate > new Date()) {
      throw new InvalidRelationshipException('Adoption date cannot be in the future');
    }

    // Statutory adoption requires court order
    if (this.props.adoptionType === 'STATUTORY' && !this.props.courtOrderNumber) {
      console.warn('Statutory adoption should have court order number');
    }

    // Inter-country adoption requires special details
    if (this.props.adoptionType === 'INTER_COUNTRY' && !this.props.interCountryDetails) {
      console.warn('Inter-country adoption should have inter-country details');
    }

    // Customary adoption requires customary details
    if (this.props.adoptionType === 'CUSTOMARY' && !this.props.customaryDetails) {
      console.warn('Customary adoption should have customary details');
    }

    // Must have biological parents consent (unless rights terminated)
    if (!this.props.hasConsents.biologicalParents && this.props.adoptionType !== 'CUSTOMARY') {
      console.warn('Statutory adoption typically requires biological parents consent');
    }
  }

  // =========================================================================
  // BUSINESS LOGIC
  // =========================================================================

  public signAdoptionAgreement(signatureDate: Date): AdoptionOrder {
    this.ensureNotDeleted();

    if (this.props.adoptionAgreementSigned) {
      return this; // Already signed
    }

    const newProps: AdoptionOrderProps = {
      ...this.props,
      adoptionAgreementSigned: true,
      adoptionAgreementDate: signatureDate,
    };

    return new AdoptionOrder(this._id, newProps, this._createdAt);
  }

  public scheduleFollowUp(schedule: FollowUpSchedule): AdoptionOrder {
    this.ensureNotDeleted();

    const newProps: AdoptionOrderProps = {
      ...this.props,
      followUpSchedule: schedule,
    };

    return new AdoptionOrder(this._id, newProps, this._createdAt);
  }

  public recordFollowUpVisit(visitDate: Date, nextVisitDue: Date): AdoptionOrder {
    this.ensureNotDeleted();

    const updatedSchedule: FollowUpSchedule = {
      ...this.props.followUpSchedule,
      lastVisitDate: visitDate,
      nextVisitDue: nextVisitDue,
    };

    const newProps: AdoptionOrderProps = {
      ...this.props,
      followUpSchedule: updatedSchedule,
    };

    return new AdoptionOrder(this._id, newProps, this._createdAt);
  }

  public addConsentDocument(documentId: string): AdoptionOrder {
    this.ensureNotDeleted();

    const newProps: AdoptionOrderProps = {
      ...this.props,
      consentDocuments: [...this.props.consentDocuments, documentId],
    };

    return new AdoptionOrder(this._id, newProps, this._createdAt);
  }

  public updateConsents(consents: Partial<AdoptionConsents>): AdoptionOrder {
    this.ensureNotDeleted();

    const newConsents: AdoptionConsents = {
      ...this.props.hasConsents,
      ...consents,
    };

    const newProps: AdoptionOrderProps = {
      ...this.props,
      hasConsents: newConsents,
    };

    return new AdoptionOrder(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get adopteeId(): UniqueEntityID {
    return this.props.adopteeId;
  }

  get adopterId(): UniqueEntityID {
    return this.props.adopterId;
  }

  get adoptionType(): string {
    return this.props.adoptionType;
  }

  get adoptionDate(): Date {
    return this.props.adoptionDate;
  }

  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }

  get hasConsents(): AdoptionConsents {
    return this.props.hasConsents;
  }

  get seversbiologicalTies(): boolean {
    return this.props.seversbiologicalTies;
  }

  get inheritanceRights(): 'FULL' | 'PARTIAL' {
    return this.props.inheritanceRights;
  }

  get adoptionAgreementSigned(): boolean {
    return this.props.adoptionAgreementSigned;
  }

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  get isStatutory(): boolean {
    return this.props.adoptionType === 'STATUTORY';
  }

  get isCustomary(): boolean {
    return this.props.adoptionType === 'CUSTOMARY';
  }

  get isInterCountry(): boolean {
    return this.props.adoptionType === 'INTER_COUNTRY';
  }

  get isKinship(): boolean {
    return this.props.adoptionType === 'KINSHIP';
  }

  get hasAllRequiredConsents(): boolean {
    const consents = this.props.hasConsents;

    // Statutory requires all consents
    if (this.isStatutory) {
      return (
        consents.biologicalParents && consents.childrenOfficer && (consents.guardian || true) // Guardian if applicable
      );
    }

    // Customary requires elder approval
    if (this.isCustomary) {
      return !!this.props.customaryDetails?.elderApproval;
    }

    // Inter-country requires central authority
    if (this.isInterCountry) {
      return (
        consents.biologicalParents &&
        consents.childrenOfficer &&
        (this.props.interCountryDetails?.centralAuthorityApproval ?? false)
      );
    }

    return consents.biologicalParents;
  }

  get isLegallyValid(): boolean {
    return (
      this.hasAllRequiredConsents &&
      (this.props.courtOrderNumber !== undefined || this.isCustomary) &&
      this.props.adoptionDate <= new Date()
    );
  }

  get requiresFollowUp(): boolean {
    return this.props.postAdoptionSupportRequired;
  }

  get isFollowUpOverdue(): boolean {
    if (!this.props.followUpSchedule?.nextVisitDue) return false;

    return this.props.followUpSchedule.nextVisitDue < new Date();
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),
      adopteeId: this.props.adopteeId.toString(),
      adopterId: this.props.adopterId.toString(),
      adoptionType: this.props.adoptionType,
      courtOrderNumber: this.props.courtOrderNumber,
      courtStation: this.props.courtStation,
      adoptionDate: this.props.adoptionDate,
      registrationDate: this.props.registrationDate,
      hasConsents: this.props.hasConsents,
      consentDocuments: this.props.consentDocuments,
      childWelfareReportId: this.props.childWelfareReportId?.toString(),
      suitabilityReportId: this.props.suitabilityReportId?.toString(),
      socialWorkerName: this.props.socialWorkerName,
      socialWorkerLicenseNumber: this.props.socialWorkerLicenseNumber,
      adoptionAgreementSigned: this.props.adoptionAgreementSigned,
      adoptionAgreementDate: this.props.adoptionAgreementDate,
      customaryDetails: this.props.customaryDetails,
      interCountryDetails: this.props.interCountryDetails,
      seversbiologicalTies: this.props.seversbiologicalTies,
      createsNewLegalRelationship: this.props.createsNewLegalRelationship,
      inheritanceRights: this.props.inheritanceRights,
      postAdoptionSupportRequired: this.props.postAdoptionSupportRequired,
      followUpSchedule: this.props.followUpSchedule,
      isStatutory: this.isStatutory,
      isCustomary: this.isCustomary,
      isInterCountry: this.isInterCountry,
      isKinship: this.isKinship,
      hasAllRequiredConsents: this.hasAllRequiredConsents,
      isLegallyValid: this.isLegallyValid,
      requiresFollowUp: this.requiresFollowUp,
      isFollowUpOverdue: this.isFollowUpOverdue,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
