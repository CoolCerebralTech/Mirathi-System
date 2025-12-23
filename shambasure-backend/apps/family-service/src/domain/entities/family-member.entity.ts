// src/family-service/src/domain/entities/family-member.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  FamilyMemberCreatedEvent,
  FamilyMemberDeathRecordedEvent,
  FamilyMemberNationalIdVerifiedEvent,
  FamilyMemberUpdatedEvent,
} from '../events/family-events';
import { Gender, KenyanCounty } from '../value-objects/family-enums.vo';
import { KenyanNationalId } from '../value-objects/kenyan-identity.vo';
import { KraPin } from '../value-objects/kenyan-identity.vo';
import { PersonName } from '../value-objects/person-name.vo';

/**
 * Family Member Entity
 *
 * Innovations:
 * 1. Multi-generational identity tracking
 * 2. Life event timeline
 * 3. Digital twin with real-world identity verification
 * 4. Smart age calculation with cultural context
 * 5. Health and capacity tracking (for guardianship)
 */
export interface FamilyMemberProps {
  // Core Identity
  name: PersonName;
  userId?: UniqueEntityID; // Link to Auth user (if registered)

  // Kenyan Legal Identity
  nationalId?: KenyanNationalId;
  nationalIdVerified: boolean;
  kraPin?: KraPin;
  passportNumber?: string;
  birthCertificateNumber?: string;
  hudumaNumber?: string;

  // Demographics
  gender: Gender;
  dateOfBirth?: Date;
  dateOfBirthEstimated: boolean; // For older members without birth certificates
  placeOfBirth?: KenyanCounty;
  religion?: string;
  tribe?: string;
  languages: string[];

  // Life Status
  isAlive: boolean;
  dateOfDeath?: Date;
  deathCertificateNumber?: string;
  causeOfDeath?: string;
  burialLocation?: string;
  isMissing: boolean;
  missingSince?: Date;

  // Physical & Health Status (for dependency and guardianship)
  hasDisability: boolean;
  disabilityType?: string;
  disabilityPercentage?: number;
  isMentallyIncapacitated: boolean;
  medicalConditions: string[];

  // Educational & Professional
  educationLevel?: string;
  occupation?: string;
  employer?: string;
  isStudent: boolean;

  // Contact Information
  phoneNumber?: string;
  email?: string;
  currentResidence?: string;
  postalAddress?: string;

  // Family Context
  isHeadOfFamily: boolean;
  isMarried: boolean;
  hasChildren: boolean;

  // Cultural Context
  initiationRitesCompleted: boolean;
  clanRole?: string;
  traditionalTitles: string[];

  // Digital Identity
  profilePictureUrl?: string;
  biometricData?: {
    fingerprintHash?: string;
    facialRecognitionId?: string;
  };

  // Metadata
  createdBy: UniqueEntityID; // User who created this record
  lastUpdatedBy: UniqueEntityID;
  verificationStatus: 'UNVERIFIED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNotes?: string;

  // Audit Trail
  lastVerifiedAt?: Date;
  lastMedicalCheck?: Date;

  // Soft Delete
  isArchived: boolean;
  archivedReason?: string;
}

export class FamilyMember extends Entity<FamilyMemberProps> {
  private constructor(props: FamilyMemberProps, id?: UniqueEntityID, createdAt?: Date) {
    super(id || new UniqueEntityID(), props, createdAt);
  }

  /**
   * Factory method to create a new Family Member
   * This is the primary way to create a member, ensuring all invariants
   */
  public static create(props: FamilyMemberProps, id?: UniqueEntityID): FamilyMember {
    // Validate business rules before creation
    FamilyMember.validateCreation(props);

    const member = new FamilyMember(props, id);

    // Record the creation event
    member.addDomainEvent(
      new FamilyMemberCreatedEvent({
        memberId: member.id.toString(),
        fullName: member.props.name.getFullName(),
        nationalId: member.props.nationalId?.toString(),
        createdBy: member.props.createdBy.toString(),
        timestamp: member.createdAt,
      }),
    );

    return member;
  }

  /**
   * Restore from persistence (without events)
   */
  public static restore(
    props: FamilyMemberProps,
    id: UniqueEntityID,
    createdAt: Date,
  ): FamilyMember {
    return new FamilyMember(props, id, createdAt);
  }

  /**
   * Update basic information
   */
  public updateInformation(updates: Partial<FamilyMemberProps>, updatedBy: UniqueEntityID): void {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const changes: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const oldValue = (this.props as any)[key];

        if (JSON.stringify(oldValue) === JSON.stringify(value)) {
          return;
        }

        (this.props as any)[key] = value;
        changes[key] = { old: oldValue, new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      (this.props as any).lastUpdatedBy = updatedBy;

      this.addDomainEvent(
        new FamilyMemberUpdatedEvent({
          memberId: this.id.toString(),
          changes,
          updatedBy: updatedBy.toString(),
          timestamp: new Date(),
        }),
      );
    }
  }

  /**
   * Record death with Kenyan legal requirements
   */
  public recordDeath(
    dateOfDeath: Date,
    deathCertificateNumber: string,
    recordedBy: UniqueEntityID,
    causeOfDeath?: string,
    burialLocation?: string,
  ): void {
    this.ensureNotDeleted();

    if (dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future');
    }

    if (this.props.dateOfBirth && dateOfDeath < this.props.dateOfBirth) {
      throw new Error('Date of death cannot be before date of birth');
    }

    (this.props as any).isAlive = false;
    (this.props as any).dateOfDeath = dateOfDeath;
    (this.props as any).deathCertificateNumber = deathCertificateNumber;
    (this.props as any).causeOfDeath = causeOfDeath;
    (this.props as any).burialLocation = burialLocation;
    (this.props as any).lastUpdatedBy = recordedBy;

    this.addDomainEvent(
      new FamilyMemberDeathRecordedEvent({
        memberId: this.id.toString(),
        fullName: this.props.name.getFullName(),
        dateOfBirth: this.props.dateOfBirth,
        dateOfDeath,
        ageAtDeath: this.calculateAgeAtDeath(),
        causeOfDeath,
        burialLocation,
        deathCertificateNumber,
        recordedBy: recordedBy.toString(),
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Calculate current age or age at death
   */
  public calculateAge(): number | null {
    if (!this.props.dateOfBirth) return null;

    const referenceDate = this.props.dateOfDeath || new Date();
    const birthDate = new Date(this.props.dateOfBirth);

    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Calculate age at death
   */
  private calculateAgeAtDeath(): number | null {
    if (!this.props.dateOfDeath || !this.props.dateOfBirth) return null;
    return this.calculateAge();
  }

  /**
   * Check if member is a minor (under 18)
   */
  public isMinor(): boolean {
    const age = this.calculateAge();
    return age !== null && age < 18;
  }

  /**
   * Check if member is an adult (18+)
   */
  public isAdult(): boolean {
    const age = this.calculateAge();
    return age !== null && age >= 18;
  }

  /**
   * Check if member is elderly (65+)
   */
  public isElderly(): boolean {
    const age = this.calculateAge();
    return age !== null && age >= 65;
  }

  /**
   * Check if member qualifies for S.29 dependency claim
   */
  public qualifiesForDependencyClaim(): boolean {
    return (
      this.props.isAlive &&
      (this.isMinor() ||
        this.props.hasDisability ||
        this.props.isMentallyIncapacitated ||
        this.isElderly())
    );
  }

  /**
   * Verify national ID with external system
   */
  public verifyNationalId(
    verified: boolean,
    verifiedBy: UniqueEntityID, // Moved before optional params
    notes?: string,
  ): void {
    (this.props as any).nationalIdVerified = verified;
    (this.props as any).verificationStatus = verified ? 'VERIFIED' : 'REJECTED';
    (this.props as any).verificationNotes = notes;
    (this.props as any).lastVerifiedAt = new Date();
    (this.props as any).lastUpdatedBy = verifiedBy;

    this.addDomainEvent(
      new FamilyMemberNationalIdVerifiedEvent({
        memberId: this.id.toString(),
        nationalId: this.props.nationalId?.toString(),
        verified,
        notes,
        verifiedBy: verifiedBy.toString(),
        action: 'NATIONAL_ID_VERIFIED',
      }),
    );
  }

  /**
   * Add disability information
   */
  public recordDisability(
    disabilityType: string,
    percentage: number,
    recordedBy: UniqueEntityID,
    medicalReportId?: string,
  ): void {
    (this.props as any).hasDisability = true;
    (this.props as any).disabilityType = disabilityType;
    (this.props as any).disabilityPercentage = Math.min(Math.max(percentage, 0), 100);
    (this.props as any).lastUpdatedBy = recordedBy;
    (this.props as any).lastMedicalCheck = new Date();

    if (medicalReportId) {
      // Link to medical report logic
    }
  }

  /**
   * Archive member (soft delete with reason)
   */
  public archive(reason: string, archivedBy: UniqueEntityID): void {
    if (this.props.isArchived) {
      throw new Error('Member is already archived');
    }

    (this.props as any).isArchived = true;
    (this.props as any).archivedReason = reason;
    (this.props as any).lastUpdatedBy = archivedBy;
  }

  /**
   * Restore from archive
   */
  public restoreFromArchive(restoredBy: UniqueEntityID): void {
    if (!this.props.isArchived) {
      throw new Error('Member is not archived');
    }

    (this.props as any).isArchived = false;
    (this.props as any).archivedReason = undefined;
    (this.props as any).lastUpdatedBy = restoredBy;
  }

  /**
   * Get member summary for display
   */
  public getSummary(): Record<string, any> {
    const age = this.calculateAge();

    return {
      id: this.id.toString(),
      fullName: this.props.name.getFullName(),
      displayName: this.props.name.getFullName('FORMAL'),
      initials: this.props.name.getInitials(),
      age,
      ageGroup: this.getAgeGroup(),
      gender: this.props.gender,
      isAlive: this.props.isAlive,
      isMinor: this.isMinor(),
      isAdult: this.isAdult(),
      isElderly: this.isElderly(),
      hasDisability: this.props.hasDisability,
      disabilityPercentage: this.props.disabilityPercentage,
      qualifiesForDependency: this.qualifiesForDependencyClaim(),
      verificationStatus: this.props.verificationStatus,
      isArchived: this.props.isArchived,
      lastVerifiedAt: this.props.lastVerifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Get age group for demographic analysis
   */
  private getAgeGroup(): string {
    const age = this.calculateAge();
    if (age === null) return 'UNKNOWN';

    if (age < 1) return 'INFANT';
    if (age < 5) return 'TODDLER';
    if (age < 13) return 'CHILD';
    if (age < 20) return 'TEENAGER';
    if (age < 35) return 'YOUNG_ADULT';
    if (age < 50) return 'ADULT';
    if (age < 65) return 'MIDDLE_AGED';
    return 'ELDERLY';
  }

  /**
   * Generate QR code for physical identification
   */
  public generateIdentificationQR(): string {
    // This would integrate with a QR service
    const data = {
      id: this.id.toString(),
      name: this.props.name.getFullName(),
      nationalId: this.props.nationalId?.toString(),
      dob: this.props.dateOfBirth?.toISOString().split('T')[0],
      verificationUrl: `/verify/member/${this.id.toString()}`,
    };

    return JSON.stringify(data);
  }

  /**
   * Validate creation invariants
   */
  private static validateCreation(props: FamilyMemberProps): void {
    // At least one identifier must be provided
    if (!props.nationalId && !props.passportNumber && !props.birthCertificateNumber) {
      throw new Error('At least one identification document must be provided');
    }

    // Date of birth validation
    if (props.dateOfBirth && props.dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    // Death date must be after birth date if both exist
    if (props.dateOfBirth && props.dateOfDeath && props.dateOfDeath < props.dateOfBirth) {
      throw new Error('Date of death cannot be before date of birth');
    }

    // Can't be both dead and missing
    if (!props.isAlive && props.isMissing) {
      throw new Error('Member cannot be both deceased and missing');
    }

    // Disability percentage must be 0-100 if provided
    if (props.disabilityPercentage !== undefined) {
      if (props.disabilityPercentage < 0 || props.disabilityPercentage > 100) {
        throw new Error('Disability percentage must be between 0 and 100');
      }
    }

    // National ID verification requires national ID
    if (props.nationalIdVerified && !props.nationalId) {
      throw new Error('Cannot verify non-existent national ID');
    }
  }

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new Error(`Cannot modify archived member: ${this.id.toString()}`);
    }
  }

  /**
   * Get computed properties for business logic
   */
  public get computedProperties() {
    return {
      isMinor: this.isMinor(),
      isAdult: this.isAdult(),
      isElderly: this.isElderly(),
      qualifiesForDependency: this.qualifiesForDependencyClaim(),
      age: this.calculateAge(),
      ageGroup: this.getAgeGroup(),
      fullName: this.props.name.getFullName(),
      formalName: this.props.name.getFullName('FORMAL'),
      officialName: this.props.name.toOfficialFormat(),
      culturalOrigins: this.props.name.detectCulturalOrigin(),
      isAnglicizedName: this.props.name.isAnglicizedName(),
      searchVariations: this.props.name.getSearchVariations(),
      qrCode: this.generateIdentificationQR(),
      lifeStatus: this.getLifeStatus(),
      legalCapacity: this.getLegalCapacity(),
    };
  }

  private getLifeStatus(): string {
    if (this.props.isMissing) return 'MISSING';
    if (!this.props.isAlive) return 'DECEASED';
    if (this.isMinor()) return 'MINOR';
    if (this.isElderly()) return 'ELDERLY';
    return 'ADULT';
  }

  private getLegalCapacity(): string {
    if (this.props.isMentallyIncapacitated) return 'INCAPACITATED';
    if (this.isMinor()) return 'MINOR';
    return 'FULL_CAPACITY';
  }

  /**
   * Get member for export/API response
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      ...this.props.name.toJSON(),
      demographics: {
        gender: this.props.gender,
        dateOfBirth: this.props.dateOfBirth,
        dateOfBirthEstimated: this.props.dateOfBirthEstimated,
        placeOfBirth: this.props.placeOfBirth,
        religion: this.props.religion,
        tribe: this.props.tribe,
        languages: this.props.languages,
      },
      identification: {
        nationalId: this.props.nationalId?.toJSON(),
        nationalIdVerified: this.props.nationalIdVerified,
        kraPin: this.props.kraPin?.toJSON(),
        passportNumber: this.props.passportNumber,
        birthCertificateNumber: this.props.birthCertificateNumber,
        hudumaNumber: this.props.hudumaNumber,
      },
      lifeStatus: {
        isAlive: this.props.isAlive,
        dateOfDeath: this.props.dateOfDeath,
        deathCertificateNumber: this.props.deathCertificateNumber,
        causeOfDeath: this.props.causeOfDeath,
        burialLocation: this.props.burialLocation,
        isMissing: this.props.isMissing,
        missingSince: this.props.missingSince,
      },
      healthStatus: {
        hasDisability: this.props.hasDisability,
        disabilityType: this.props.disabilityType,
        disabilityPercentage: this.props.disabilityPercentage,
        isMentallyIncapacitated: this.props.isMentallyIncapacitated,
        medicalConditions: this.props.medicalConditions,
        lastMedicalCheck: this.props.lastMedicalCheck,
      },
      computedProperties: this.computedProperties,
      contact: {
        phoneNumber: this.props.phoneNumber,
        email: this.props.email,
        currentResidence: this.props.currentResidence,
        postalAddress: this.props.postalAddress,
      },
      professional: {
        educationLevel: this.props.educationLevel,
        occupation: this.props.occupation,
        employer: this.props.employer,
        isStudent: this.props.isStudent,
      },
      cultural: {
        initiationRitesCompleted: this.props.initiationRitesCompleted,
        clanRole: this.props.clanRole,
        traditionalTitles: this.props.traditionalTitles,
      },
      verification: {
        status: this.props.verificationStatus,
        notes: this.props.verificationNotes,
        lastVerifiedAt: this.props.lastVerifiedAt,
      },
      audit: {
        createdBy: this.props.createdBy.toString(),
        lastUpdatedBy: this.props.lastUpdatedBy.toString(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        isArchived: this.props.isArchived,
        archivedReason: this.props.archivedReason,
      },
      metadata: {
        version: this.version,
        isDeleted: this.isDeleted,
        profilePictureUrl: this.props.profilePictureUrl,
      },
    };
  }
}
