import { AggregateRoot } from '../base/aggregate-root';
import {
  FamilyMemberAgeRecalculatedEvent,
  FamilyMemberArchivedEvent,
  FamilyMemberContactInfoUpdatedEvent,
  FamilyMemberCreatedEvent,
  FamilyMemberDeceasedEvent,
  FamilyMemberDependencyStatusAssessedEvent,
  FamilyMemberDisabilityStatusUpdatedEvent,
  FamilyMemberIdentityVerifiedEvent,
  FamilyMemberMissingStatusChangedEvent,
  FamilyMemberPersonalInfoUpdatedEvent,
  FamilyMemberPolygamousHouseAssignedEvent,
  FamilyMemberS40PolygamousStatusChangedEvent,
  IdentityDocumentType,
} from '../events/family-events';
import { InvalidFamilyMemberException } from '../exceptions/family.exception';
import { KenyanLocation } from '../value-objects/geographical/kenyan-location.vo';
import { BirthCertificate } from '../value-objects/identity/birth-certificate.vo';
import { DeathCertificate } from '../value-objects/identity/death-certificate.vo';
import { KenyanIdentity } from '../value-objects/identity/kenyan-identity.vo';
import { KraPin } from '../value-objects/identity/kra-pin.vo';
import { NationalId } from '../value-objects/identity/national-id.vo';
import { AgeCalculation } from '../value-objects/personal/age-calculation.vo';
import { ContactInfo } from '../value-objects/personal/contact-info.vo';
import { DemographicInfo } from '../value-objects/personal/demographic-info.vo';
import { DisabilityStatus } from '../value-objects/personal/disability-status.vo';
import { KenyanName } from '../value-objects/personal/kenyan-name.vo';
import { LifeStatus } from '../value-objects/personal/life-status.vo';

export interface FamilyMemberProps {
  id: string;
  userId?: string;
  familyId: string;

  // The Single Source of Truth (Value Objects)
  name: KenyanName;
  identity: KenyanIdentity;
  lifeStatus: LifeStatus;

  // Optional VOs
  contactInfo?: ContactInfo;
  demographicInfo?: DemographicInfo;
  ageCalculation?: AgeCalculation;
  disabilityStatus?: DisabilityStatus;
  birthLocation?: KenyanLocation;
  deathLocation?: KenyanLocation;

  // Domain Fields
  occupation?: string;
  polygamousHouseId?: string;

  // System/Audit
  version: number;
  lastEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  isArchived: boolean;
}

export interface CreateFamilyMemberProps {
  userId?: string;
  familyId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  nationalId?: string;
  kraPin?: string;
  dateOfBirth?: Date;
  gender?: string;
  citizenship?: string;
  religion?: string;
  ethnicity?: string;
  clan?: string;
  subClan?: string;
  phoneNumber?: string;
  email?: string;
  alternativePhone?: string;
  placeOfBirth?: string;
  occupation?: string;
  maidenName?: string;
  disabilityType?: string;
  requiresSupportedDecisionMaking?: boolean;
  isDeceased?: boolean;
  dateOfDeath?: Date;
  deathCertificateNumber?: string;
  placeOfDeath?: string;
  isMinor?: boolean;
  currentAge?: number;
  birthCertificateEntryNumber?: string;
}

export class FamilyMember extends AggregateRoot<FamilyMemberProps> {
  private constructor(props: FamilyMemberProps) {
    super(props.id, props);
    this.validate();
  }

  // Factory method for creating a new living family member
  static create(props: CreateFamilyMemberProps): FamilyMember {
    const id = props.userId || this.generateId();
    const now = new Date();

    // Create Kenyan Identity
    let identity = KenyanIdentity.create(
      (props.citizenship as 'KENYAN' | 'DUAL' | 'FOREIGN') || 'KENYAN',
    );

    // Add National ID if provided
    if (props.nationalId) {
      const nationalId = NationalId.createUnverified(props.nationalId);
      identity = identity.withNationalId(nationalId);
    }

    // Add KRA PIN if provided
    if (props.kraPin) {
      const kraPin = KraPin.create(props.kraPin);
      identity = identity.withKraPin(kraPin);
    }

    // Add Birth Certificate if provided
    if (props.birthCertificateEntryNumber && props.dateOfBirth) {
      const birthCertificate = BirthCertificate.create(
        props.birthCertificateEntryNumber,
        props.dateOfBirth,
        new Date(), // date of registration (default to now)
        '', // mother name (can be updated later)
        '', // district of birth (can be updated later)
      );
      identity = identity.withBirthCertificate(birthCertificate);
    }

    // Add cultural details to identity
    if (props.ethnicity || props.religion || props.clan) {
      identity = identity.withCulturalDetails(
        props.ethnicity || '',
        props.religion || '',
        props.clan,
      );
    }

    // Create Kenyan Name (including maiden name)
    let name = KenyanName.create(props.firstName, props.lastName, props.middleName);
    if (props.maidenName) {
      name = name.withMaidenName(props.maidenName);
    }

    // Create Life Status
    let lifeStatus: LifeStatus;
    if (props.isDeceased && props.dateOfDeath) {
      lifeStatus = LifeStatus.createDeceased(props.dateOfDeath);
    } else if (props.isDeceased) {
      lifeStatus = LifeStatus.createDeceased(new Date());
    } else {
      lifeStatus = LifeStatus.createAlive();
    }

    // Create demographic info
    let demographicInfo = DemographicInfo.create();
    if (props.gender || props.religion || props.ethnicity) {
      // Update demographic info
      demographicInfo = demographicInfo.updateEthnicity(props.ethnicity, props.subClan);
      if (props.religion) {
        demographicInfo = demographicInfo.updateReligion(props.religion as any);
      }
    }

    // Create contact info if available
    let contactInfo: ContactInfo | undefined;
    if (props.phoneNumber) {
      try {
        contactInfo = ContactInfo.create(props.phoneNumber, ''); // county can be updated later
      } catch (error) {
        console.warn('Invalid phone number format:', error);
      }
    }

    // Create disability status if provided
    let disabilityStatus: DisabilityStatus | undefined;
    if (props.disabilityType) {
      disabilityStatus = DisabilityStatus.create(true);
      // Note: Would need more details to add disability
    } else if (props.requiresSupportedDecisionMaking) {
      disabilityStatus = DisabilityStatus.create(false);
      disabilityStatus = disabilityStatus.setSupportedDecisionMaking(true);
    }

    // Create birth location if provided
    let birthLocation: KenyanLocation | undefined;
    if (props.placeOfBirth) {
      try {
        // This is a simplified version - in production, parse the place of birth
        birthLocation = KenyanLocation.createFromProps({
          county: 'UNKNOWN' as any,
          placeName: props.placeOfBirth,
          isUrban: false,
          isRural: true,
        });
      } catch (error) {
        console.warn('Could not create birth location:', error);
      }
    }

    // Create age calculation
    let ageCalculation: AgeCalculation | undefined;
    if (props.dateOfBirth) {
      ageCalculation = AgeCalculation.create(props.dateOfBirth);
    }

    const familyMember = new FamilyMember({
      id,
      userId: props.userId,
      familyId: props.familyId,
      name,
      identity,
      contactInfo,
      disabilityStatus,
      lifeStatus,
      demographicInfo,
      ageCalculation,
      birthLocation,
      deathLocation: undefined,
      occupation: props.occupation,
      polygamousHouseId: undefined,
      version: 1,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    });

    // Add domain event
    familyMember.addDomainEvent(
      new FamilyMemberCreatedEvent({
        familyMemberId: familyMember.id,
        familyId: familyMember.familyId,
        userId: familyMember.userId,
        firstName: props.firstName,
        lastName: props.lastName,
        middleName: props.middleName,
        dateOfBirth: props.dateOfBirth,
        gender: props.gender,
        citizenship: props.citizenship || 'KENYAN',
        religion: props.religion,
        ethnicity: props.ethnicity,
        isDeceased: props.isDeceased || false,
        isMinor: props.isMinor || false,
        identityStatus: familyMember.isIdentityVerified ? 'VERIFIED' : 'UNVERIFIED',
        createdAt: now,
      }),
    );

    // Assess and emit dependency status event
    familyMember.assessAndEmitDependencyStatus();

    return familyMember;
  }

  // Factory method for creating from existing data (e.g., from database)
  static createFromProps(props: FamilyMemberProps): FamilyMember {
    return new FamilyMember(props);
  }

  private validate(): void {
    if (!this.props.id) {
      throw new InvalidFamilyMemberException('Family member ID is required');
    }

    if (!this.props.familyId) {
      throw new InvalidFamilyMemberException('Family ID is required');
    }

    if (!this.props.name) {
      throw new InvalidFamilyMemberException('Name is required');
    }

    if (!this.props.identity) {
      throw new InvalidFamilyMemberException('Identity is required');
    }

    if (!this.props.lifeStatus) {
      throw new InvalidFamilyMemberException('Life status is required');
    }

    // Validate deceased status consistency
    if (this.props.lifeStatus.isDeceased && !this.props.lifeStatus.dateOfDeath) {
      throw new InvalidFamilyMemberException('Date of death is required for deceased members');
    }

    // If deceased, identity should have death certificate
    if (this.props.lifeStatus.isDeceased && !this.props.identity.deathCertificate?.isVerified) {
      // Warning, not error - death certificate might be added later
      console.warn('Deceased member lacks verified death certificate');
    }

    // Validate age consistency
    if (this.props.ageCalculation?.dateOfBirth && this.props.lifeStatus.dateOfDeath) {
      if (this.props.ageCalculation.dateOfBirth > this.props.lifeStatus.dateOfDeath) {
        throw new InvalidFamilyMemberException('Date of birth cannot be after date of death');
      }
    }

    // Validate polygamous house membership
    if (this.props.polygamousHouseId && this.isDeceased) {
      throw new InvalidFamilyMemberException(
        'Deceased members cannot be assigned to polygamous houses',
      );
    }
  }

  private static generateId(): string {
    // In production, use a proper UUID generator
    return `fm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Domain methods

  updatePersonalInfo(params: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    maidenName?: string;
    occupation?: string;
    gender?: string;
    religion?: string;
    ethnicity?: string;
    clan?: string;
    subClan?: string;
  }): void {
    // Update name
    let updatedName = this.props.name;
    if (params.firstName || params.lastName || params.middleName) {
      updatedName = KenyanName.create(
        params.firstName || this.props.name.firstName,
        params.lastName || this.props.name.lastName,
        params.middleName || this.props.name.middleName,
      );
    }

    if (params.maidenName) {
      updatedName = updatedName.withMaidenName(params.maidenName);
    }

    // Update demographic info (if it exists, otherwise create)
    let updatedDemographicInfo = this.props.demographicInfo || DemographicInfo.create();

    // Update ethnicity in demographic info
    if (params.ethnicity) {
      updatedDemographicInfo = updatedDemographicInfo.updateEthnicity(
        params.ethnicity,
        params.subClan,
      );
    }

    // Update religion in demographic info
    if (params.religion) {
      updatedDemographicInfo = updatedDemographicInfo.updateReligion(params.religion as any);
    }

    // Update cultural details in identity
    if (params.ethnicity || params.religion || params.clan) {
      this.props.identity = this.props.identity.withCulturalDetails(
        params.ethnicity || this.props.identity['_value'].ethnicity || '',
        params.religion || this.props.identity['_value'].religion || '',
        params.clan || this.props.identity['_value'].clan,
      );
    }

    this.props.name = updatedName;
    this.props.demographicInfo = updatedDemographicInfo;
    this.props.occupation = params.occupation || this.props.occupation;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit personal info updated event
    this.addDomainEvent(
      new FamilyMemberPersonalInfoUpdatedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        updatedFields: params,
        timestamp: new Date(),
      }),
    );

    // Re-assess dependency status if age or disability changed
    this.assessAndEmitDependencyStatus();
  }

  updateContactInfo(params: {
    phoneNumber?: string;
    email?: string;
    alternativePhone?: string;
    emergencyContact?: any;
  }): void {
    const oldValues = {
      phoneNumber: this.props.contactInfo?.primaryPhone,
      email: this.props.contactInfo?.email,
      alternativePhone: this.props.contactInfo?.secondaryPhone,
    };

    if (!this.props.contactInfo && params.phoneNumber) {
      // Create new contact info
      this.props.contactInfo = ContactInfo.create(params.phoneNumber, ''); // County will need to be set
    } else if (this.props.contactInfo) {
      // Update existing contact info
      if (params.phoneNumber) {
        this.props.contactInfo = this.props.contactInfo.updatePrimaryPhone(params.phoneNumber);
      }
      if (params.email !== undefined) {
        this.props.contactInfo = this.props.contactInfo.updateEmail(params.email);
      }
      if (params.alternativePhone !== undefined) {
        this.props.contactInfo = this.props.contactInfo.updateSecondaryPhone(
          params.alternativePhone,
        );
      }
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit contact info updated event
    this.addDomainEvent(
      new FamilyMemberContactInfoUpdatedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        oldPhoneNumber: oldValues.phoneNumber,
        newPhoneNumber: params.phoneNumber,
        oldEmail: oldValues.email,
        newEmail: params.email,
        emergencyContactUpdated: !!params.emergencyContact,
        timestamp: new Date(),
      }),
    );
  }

  addNationalId(idNumber: string): void {
    const nationalId = NationalId.createUnverified(idNumber);
    this.props.identity = this.props.identity.withNationalId(nationalId);
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  verifyNationalId(verifiedBy: string, verificationMethod: string): void {
    if (!this.props.identity.nationalId) {
      throw new InvalidFamilyMemberException('No national ID to verify');
    }

    const verifiedNationalId = this.props.identity.nationalId.verify(
      verifiedBy,
      verificationMethod,
    );
    this.props.identity = this.props.identity.withNationalId(verifiedNationalId);
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit identity verified event
    this.addDomainEvent(
      new FamilyMemberIdentityVerifiedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        documentType: IdentityDocumentType.NATIONAL_ID,
        documentNumber: verifiedNationalId.idNumber,
        verifiedBy,
        verificationMethod,
        verificationDate: new Date(),
        timestamp: new Date(),
      }),
    );
  }

  addKraPin(pinNumber: string): void {
    const kraPin = KraPin.create(pinNumber);
    this.props.identity = this.props.identity.withKraPin(kraPin);
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  verifyKraPin(verifiedBy: string, isTaxCompliant: boolean): void {
    if (!this.props.identity.kraPin) {
      throw new InvalidFamilyMemberException('No KRA PIN to verify');
    }

    const verifiedKraPin = this.props.identity.kraPin.verify(verifiedBy, isTaxCompliant);
    this.props.identity = this.props.identity.withKraPin(verifiedKraPin);
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit identity verified event
    this.addDomainEvent(
      new FamilyMemberIdentityVerifiedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        documentType: IdentityDocumentType.KRA_PIN,
        documentNumber: verifiedKraPin.pinNumber,
        verifiedBy,
        verificationMethod: 'ITAX_SYSTEM',
        verificationDate: new Date(),
        timestamp: new Date(),
      }),
    );
  }

  markAsDeceased(params: {
    dateOfDeath: Date;
    placeOfDeath?: string;
    deathCertificateNumber?: string;
    causeOfDeath?: string;
    issuingAuthority?: string;
  }): void {
    if (this.isDeceased) {
      throw new InvalidFamilyMemberException('Member is already marked as deceased');
    }

    if (params.dateOfDeath > new Date()) {
      throw new InvalidFamilyMemberException('Date of death cannot be in the future');
    }

    // Calculate age at death
    const ageAtDeath = this.props.ageCalculation?.age || null;

    // Update life status
    this.props.lifeStatus = this.props.lifeStatus.markDeceased(
      params.dateOfDeath,
      params.placeOfDeath,
      params.causeOfDeath,
    );

    // Update death location if provided
    if (params.placeOfDeath) {
      this.props.deathLocation = KenyanLocation.createFromProps({
        county: 'UNKNOWN' as any,
        placeName: params.placeOfDeath,
        isUrban: false,
        isRural: true,
      });
    }

    // Add death certificate if provided
    if (params.deathCertificateNumber) {
      const deathCertificate = DeathCertificate.create(
        params.deathCertificateNumber,
        params.dateOfDeath,
        new Date(),
        params.placeOfDeath || '',
      );
      this.props.identity = this.props.identity.withDeathCertificate(deathCertificate);
    }

    this.props.updatedAt = new Date();
    this.props.version++;
    this.props.isArchived = true; // Archive deceased members

    // Emit deceased event
    this.addDomainEvent(
      new FamilyMemberDeceasedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        dateOfDeath: params.dateOfDeath,
        placeOfDeath: params.placeOfDeath,
        causeOfDeath: params.causeOfDeath,
        deathCertificateNumber: params.deathCertificateNumber,
        ageAtDeath: ageAtDeath || undefined,
        timestamp: new Date(),
      }),
    );

    // Emit age recalculated event
    this.emitAgeRecalculatedEvent();

    // Emit archived event
    this.addDomainEvent(
      new FamilyMemberArchivedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        archivedBy: 'SYSTEM',
        reason: 'Deceased',
        isDeceased: true,
        timestamp: new Date(),
      }),
    );
  }

  updateDisabilityStatus(params: {
    disabilityType: string;
    requiresSupportedDecisionMaking: boolean;
    certificateId?: string;
  }): void {
    let disabilityStatus = this.props.disabilityStatus || DisabilityStatus.create(true);

    // Add a disability detail
    const disabilityDetail = {
      type: params.disabilityType as any,
      severity: 'MODERATE' as const,
      requiresAssistance: params.requiresSupportedDecisionMaking,
    };

    disabilityStatus = disabilityStatus.addDisability(disabilityDetail);
    disabilityStatus = disabilityStatus.setSupportedDecisionMaking(
      params.requiresSupportedDecisionMaking,
    );

    this.props.disabilityStatus = disabilityStatus;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit disability status updated event
    this.addDomainEvent(
      new FamilyMemberDisabilityStatusUpdatedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        hasDisability: disabilityStatus.hasDisability,
        disabilityType: params.disabilityType,
        requiresSupportedDecisionMaking: params.requiresSupportedDecisionMaking,
        registeredWithNCPWD: disabilityStatus.registeredWithNCPWD,
        disabilityCardNumber: disabilityStatus.disabilityCardNumber,
        timestamp: new Date(),
      }),
    );

    // Re-assess dependency status
    this.assessAndEmitDependencyStatus();
  }

  assignToPolygamousHouse(houseId: string, houseName?: string, houseOrder: number = 1): void {
    if (this.isDeceased) {
      throw new InvalidFamilyMemberException('Cannot assign deceased member to polygamous house');
    }

    if (this.gender !== 'MALE') {
      throw new InvalidFamilyMemberException('Only male members can be assigned as house heads');
    }

    this.props.polygamousHouseId = houseId;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit polygamous house assigned event
    this.addDomainEvent(
      new FamilyMemberPolygamousHouseAssignedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        polygamousHouseId: houseId,
        houseName,
        houseOrder,
        assignedAs: 'HOUSE_HEAD',
        timestamp: new Date(),
      }),
    );

    // Emit S.40 status changed event
    this.addDomainEvent(
      new FamilyMemberS40PolygamousStatusChangedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        polygamousHouseId: houseId,
        houseOrder,
        isPolygamousHouseHead: true,
        s40CertificateNumber: undefined, // Would come from court
        courtRecognized: false,
        timestamp: new Date(),
      }),
    );
  }

  removeFromPolygamousHouse(): void {
    this.props.polygamousHouseId = undefined;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Note: We need a FamilyMemberPolygamousHouseRemovedEvent or similar
    // For now, we'll use a generic approach
    console.warn('Polygamous house removal event not implemented');
  }

  markAsMissing(missingSince: Date, lastSeenLocation?: string): void {
    this.props.lifeStatus = this.props.lifeStatus.markMissing(missingSince, lastSeenLocation);
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit missing status changed event
    this.addDomainEvent(
      new FamilyMemberMissingStatusChangedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        status: 'MISSING',
        missingSince,
        lastSeenLocation,
        timestamp: new Date(),
      }),
    );
  }

  markAsFound(): void {
    this.props.lifeStatus = this.props.lifeStatus.markAlive();
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit missing status changed event
    this.addDomainEvent(
      new FamilyMemberMissingStatusChangedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        status: 'FOUND',
        timestamp: new Date(),
      }),
    );
  }

  archive(reason: string, deletedBy: string): void {
    if (this.props.isArchived) {
      throw new InvalidFamilyMemberException('Member is already archived');
    }

    this.props.isArchived = true;
    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
    this.props.deletionReason = reason;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit archived event
    this.addDomainEvent(
      new FamilyMemberArchivedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        archivedBy: deletedBy,
        reason,
        isDeceased: this.isDeceased,
        timestamp: new Date(),
      }),
    );
  }

  unarchive(): void {
    if (!this.props.isArchived) {
      throw new InvalidFamilyMemberException('Member is not archived');
    }

    this.props.isArchived = false;
    this.props.deletedAt = undefined;
    this.props.deletedBy = undefined;
    this.props.deletionReason = undefined;
    this.props.updatedAt = new Date();
    this.props.version++;

    // Note: We need a FamilyMemberUnarchivedEvent
    console.warn('Unarchive event not implemented');
  }

  // Helper method to assess and emit dependency status
  private assessAndEmitDependencyStatus(): void {
    const isPotentialDependant = this.isPotentialDependant;
    const assessmentReasons: string[] = [];

    if (this.isMinor) assessmentReasons.push('MINOR');
    if (this.hasDisability) assessmentReasons.push('DISABILITY');
    if (this.props.ageCalculation?.isYoungAdult) assessmentReasons.push('STUDENT_AGE');
    if (this.props.disabilityStatus?.qualifiesForDependantStatus)
      assessmentReasons.push('SEVERE_DISABILITY');

    const qualifiesForS29 = assessmentReasons.length > 0;
    const dependencyLevel = this.determineDependencyLevel();

    // Emit dependency status assessed event
    this.addDomainEvent(
      new FamilyMemberDependencyStatusAssessedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        isPotentialDependant,
        assessmentReasons,
        qualifiesForS29,
        dependencyLevel,
        timestamp: new Date(),
      }),
    );
  }

  private determineDependencyLevel(): 'NONE' | 'PARTIAL' | 'FULL' {
    if (!this.isPotentialDependant) return 'NONE';

    if (this.hasDisability && this.props.disabilityStatus?.hasSevereDisability) {
      return 'FULL';
    }

    if (this.isMinor) {
      return 'FULL';
    }

    if (this.props.ageCalculation?.isYoungAdult) {
      return 'PARTIAL';
    }

    return 'NONE';
  }

  private emitAgeRecalculatedEvent(): void {
    if (!this.props.ageCalculation) return;

    const age = this.props.ageCalculation.age;
    if (age === null) return;

    this.addDomainEvent(
      new FamilyMemberAgeRecalculatedEvent({
        familyMemberId: this.id,
        familyId: this.familyId,
        oldAge: undefined, // We don't track old age changes
        newAge: age,
        isMinor: this.props.ageCalculation.isMinor,
        isYoungAdult: this.props.ageCalculation.isYoungAdult,
        isElderly: this.props.ageCalculation.isElderly,
        timestamp: new Date(),
      }),
    );
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get familyId(): string {
    return this.props.familyId;
  }

  get name(): KenyanName {
    return this.props.name;
  }

  get identity(): KenyanIdentity {
    return this.props.identity;
  }

  get contactInfo(): ContactInfo | undefined {
    return this.props.contactInfo;
  }

  get disabilityStatus(): DisabilityStatus | undefined {
    return this.props.disabilityStatus;
  }

  get lifeStatus(): LifeStatus {
    return this.props.lifeStatus;
  }

  get demographicInfo(): DemographicInfo | undefined {
    return this.props.demographicInfo;
  }

  get ageCalculation(): AgeCalculation | undefined {
    return this.props.ageCalculation;
  }

  get birthLocation(): KenyanLocation | undefined {
    return this.props.birthLocation;
  }

  get deathLocation(): KenyanLocation | undefined {
    return this.props.deathLocation;
  }

  get occupation(): string | undefined {
    return this.props.occupation;
  }

  get maidenName(): string | undefined {
    return this.props.name.maidenName;
  }

  get polygamousHouseId(): string | undefined {
    return this.props.polygamousHouseId;
  }

  get version(): number {
    return this.props.version;
  }

  get lastEventId(): string | undefined {
    return this.props.lastEventId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get deletedBy(): string | undefined {
    return this.props.deletedBy;
  }

  get deletionReason(): string | undefined {
    return this.props.deletionReason;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  // Computed properties
  get isDeceased(): boolean {
    return this.props.lifeStatus.isDeceased;
  }

  get isMinor(): boolean {
    if (this.isDeceased) return false;
    return this.props.ageCalculation?.isMinor || false;
  }

  get currentAge(): number | null {
    if (this.isDeceased) {
      return this.props.ageCalculation?.age || null;
    }
    return this.props.ageCalculation?.age || null;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.ageCalculation?.dateOfBirth;
  }

  get dateOfDeath(): Date | undefined {
    return this.props.lifeStatus.dateOfDeath;
  }

  get gender(): string | undefined {
    return this.props.demographicInfo?.gender;
  }

  get religion(): string | undefined {
    return this.props.demographicInfo?.religion;
  }

  get ethnicity(): string | undefined {
    return this.props.demographicInfo?.ethnicGroup;
  }

  get isMuslim(): boolean {
    return this.props.demographicInfo?.isMuslim || false;
  }

  // FIXED: Use correct method from KenyanIdentity
  get isCustomaryLawApplicable(): boolean {
    return this.props.identity['_value'].appliesCustomaryLaw || false;
  }

  // FIXED: Use correct property from KenyanIdentity
  get isIdentityVerified(): boolean {
    return this.props.identity['_value'].isLegallyVerified || false;
  }

  get hasDisability(): boolean {
    return this.props.disabilityStatus?.hasDisability || false;
  }

  get requiresSupportedDecisionMaking(): boolean {
    return this.props.disabilityStatus?.requiresSupportedDecisionMaking || false;
  }

  get isPresumedAlive(): boolean {
    return this.props.lifeStatus.isAlive;
  }

  get missingSince(): Date | undefined {
    return this.props.lifeStatus.missingSince;
  }

  // FIXED: Get from death certificate if it exists
  get deathCertificateIssued(): boolean {
    return !!this.props.identity.deathCertificate;
  }

  get isActive(): boolean {
    return !this.isArchived && !this.isDeceased && this.props.lifeStatus.isAlive;
  }

  get isEligibleForInheritance(): boolean {
    // For inheritance eligibility under Kenyan law:
    // 1. Must not be deceased
    // 2. Must have verified identity
    // 3. Must be alive (not presumed dead)
    // 4. Must not be archived
    return !this.isDeceased && this.isIdentityVerified && this.isPresumedAlive && !this.isArchived;
  }

  // For S.29 dependant qualification
  get isPotentialDependant(): boolean {
    // A person is a potential dependant if:
    // 1. Is a minor
    // 2. Has disability
    // 3. Is a student (age 18-25)
    // 4. Was financially dependent on deceased
    const isStudentAge = this.props.ageCalculation?.isYoungAdult || false;

    return this.isMinor || this.hasDisability || isStudentAge;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      familyId: this.familyId,
      name: this.name.toJSON(),
      identity: this.identity.toJSON(),
      contactInfo: this.contactInfo?.toJSON(),
      disabilityStatus: this.disabilityStatus?.toJSON(),
      lifeStatus: this.lifeStatus.toJSON(),
      demographicInfo: this.demographicInfo?.toJSON(),
      ageCalculation: this.ageCalculation?.toJSON(),
      birthLocation: this.birthLocation?.toJSON(),
      deathLocation: this.deathLocation?.toJSON(),
      occupation: this.occupation,
      maidenName: this.maidenName,
      polygamousHouseId: this.polygamousHouseId,
      isDeceased: this.isDeceased,
      isMinor: this.isMinor,
      currentAge: this.currentAge,
      gender: this.gender,
      religion: this.religion,
      ethnicity: this.ethnicity,
      isMuslim: this.isMuslim,
      isCustomaryLawApplicable: this.isCustomaryLawApplicable,
      isIdentityVerified: this.isIdentityVerified,
      hasDisability: this.hasDisability,
      requiresSupportedDecisionMaking: this.requiresSupportedDecisionMaking,
      isPresumedAlive: this.isPresumedAlive,
      missingSince: this.missingSince,
      deathCertificateIssued: this.deathCertificateIssued,
      isActive: this.isActive,
      isEligibleForInheritance: this.isEligibleForInheritance,
      isPotentialDependant: this.isPotentialDependant,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      deletedBy: this.deletedBy,
      deletionReason: this.deletionReason,
      isArchived: this.isArchived,
    };
  }
}
