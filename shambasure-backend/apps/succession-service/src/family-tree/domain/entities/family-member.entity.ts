import { AggregateRoot } from '@nestjs/cqrs';
import { RelationshipType } from '@prisma/client';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyMemberUpdatedEvent } from '../events/family-member-updated.event';
import { FamilyMemberMarkedDeceasedEvent } from '../events/family-member-marked-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-member-removed.event';
import { FamilyMemberGuardianAssignedEvent } from '../events/family-member-guardian-assigned.event';

export interface MemberContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface KenyanIdentification {
  nationalId?: string;
  birthCertificateNumber?: string;
  passportNumber?: string;
  alienId?: string;
}

export interface KenyanFamilyMemberMetadata {
  clan?: string;
  subClan?: string;
  birthOrder?: number;
  isFamilyHead: boolean;
  isElder: boolean;
  traditionalTitle?: string;
  educationLevel?: 'NONE' | 'PRIMARY' | 'SECONDARY' | 'COLLEGE' | 'UNIVERSITY';
  occupation?: string;
  disabilityStatus?: 'NONE' | 'PHYSICAL' | 'MENTAL' | 'VISUAL' | 'HEARING';
  dependencyStatus: 'INDEPENDENT' | 'PARTIAL' | 'FULL';
}

interface FamilyMemberReconstitutionProps {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  role: RelationshipType;
  addedBy: string;
  userId?: string | null;
  dateOfBirth?: string | Date | null;
  dateOfDeath?: string | Date | null;
  isDeceased?: boolean;
  isMinor?: boolean;
  contactInfo?: MemberContactInfo;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  kenyanIdentification?: KenyanIdentification;
  metadata?: Partial<KenyanFamilyMemberMetadata>;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  middleName?: string;
}

export class FamilyMember extends AggregateRoot {
  private id: string;
  private familyId: string;
  private userId: string | null;
  private firstName: string;
  private middleName?: string;
  private lastName: string;

  // dateOfBirth is always a Date internally (guaranteed). If unknown, defaults to epoch (1970-01-01).
  private dateOfBirth: Date;

  // dateOfDeath may be null when alive
  private dateOfDeath: Date | null;

  private isDeceased: boolean;
  private isMinor: boolean;
  private gender: 'MALE' | 'FEMALE' | 'OTHER';
  private kenyanIdentification: KenyanIdentification;
  private metadata: KenyanFamilyMemberMetadata;
  private role: RelationshipType;
  private contactInfo: MemberContactInfo;
  private notes: string | null;
  private addedBy: string;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  private constructor(
    id: string,
    familyId: string,
    firstName: string,
    lastName: string,
    role: RelationshipType,
    addedBy: string,
    gender: 'MALE' | 'FEMALE' | 'OTHER' = 'OTHER',
    dateOfBirth?: Date,
  ) {
    super();
    this.id = id;
    this.familyId = familyId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.addedBy = addedBy;
    this.gender = gender;

    // Defaults
    this.userId = null;

    // Ensure internal invariants: dateOfBirth always a Date object (never null/undefined)
    // If the caller doesn't provide a DOB, we use epoch (1970-01-01) as a sentinel.
    // NOTE: prefer callers to pass a real DOB. This avoids TS type mismatch with events.
    this.dateOfBirth = dateOfBirth ?? new Date(0);

    this.dateOfDeath = null;
    this.isDeceased = false;
    this.isMinor = false;
    this.contactInfo = {};
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;

    // Kenyan-specific defaults
    this.kenyanIdentification = {};
    this.metadata = {
      isFamilyHead: false,
      isElder: false,
      dependencyStatus: 'INDEPENDENT',
    };

    // derive minor status at creation
    this.recalculateMinorStatus();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    familyId: string,
    firstName: string,
    lastName: string,
    role: RelationshipType,
    addedBy: string,
    details?: {
      userId?: string;
      dateOfBirth?: Date;
      isDeceased?: boolean;
      contactInfo?: MemberContactInfo;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      middleName?: string;
      kenyanIdentification?: KenyanIdentification;
      metadata?: Partial<KenyanFamilyMemberMetadata>;
      notes?: string;
    },
  ): FamilyMember {
    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error('First and Last Name are required.');
    }

    const member = new FamilyMember(
      id,
      familyId,
      firstName.trim(),
      lastName.trim(),
      role,
      addedBy,
      details?.gender || 'OTHER',
      details?.dateOfBirth, // may be undefined => constructor uses epoch fallback
    );

    if (details?.userId) member.userId = details.userId;
    if (details?.contactInfo) member.contactInfo = details.contactInfo;
    if (details?.middleName) member.middleName = details.middleName.trim();
    if (details?.kenyanIdentification) member.kenyanIdentification = details.kenyanIdentification;
    if (details?.metadata) member.updateMetadata(details.metadata);
    if (details?.notes) member.notes = details.notes;

    if (details?.isDeceased) {
      member.isDeceased = true;
      // dateOfDeath should be set via markAsDeceased when available; leave null otherwise
    }

    // Emit event with strongly-typed Date fields.
    // Map internal 'OTHER' gender to undefined for event (event expects optional MALE|FEMALE).
    member.apply(
      new FamilyMemberAddedEvent(member.familyId, {
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        dateOfBirth: member.dateOfBirth,
        isDeceased: member.isDeceased || undefined,
        dateOfDeath: member.dateOfDeath ?? undefined,
        isMinor: member.isMinor,
        gender: member.gender === 'MALE' || member.gender === 'FEMALE' ? member.gender : undefined,
        nationalId: member.kenyanIdentification.nationalId,
      }),
    );

    return member;
  }

  static reconstitute(props: FamilyMemberReconstitutionProps): FamilyMember {
    const member = new FamilyMember(
      props.id,
      props.familyId,
      props.firstName,
      props.lastName,
      props.role,
      props.addedBy,
      props.gender || 'OTHER',
      // normalize incoming dateOfBirth string|Date|null -> Date or epoch fallback
      props.dateOfBirth instanceof Date
        ? props.dateOfBirth
        : props.dateOfBirth
          ? new Date(props.dateOfBirth)
          : new Date(0),
    );

    member.userId = props.userId || null;

    if (props.dateOfDeath) {
      member.dateOfDeath =
        props.dateOfDeath instanceof Date ? props.dateOfDeath : new Date(props.dateOfDeath);
    } else {
      member.dateOfDeath = null;
    }

    member.isDeceased = props.isDeceased ?? false;
    member.isMinor = props.isMinor ?? false;

    if (props.contactInfo) {
      member.contactInfo = props.contactInfo;
    }

    member.notes = props.notes || null;
    member.createdAt =
      props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    member.updatedAt =
      props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);

    if (props.deletedAt) {
      member.deletedAt =
        props.deletedAt instanceof Date ? props.deletedAt : new Date(props.deletedAt);
    } else {
      member.deletedAt = null;
    }

    if (props.kenyanIdentification) {
      member.kenyanIdentification = props.kenyanIdentification;
    }

    if (props.metadata) {
      member.metadata = {
        isFamilyHead: false,
        isElder: false,
        dependencyStatus: 'INDEPENDENT',
        ...props.metadata,
      };
    }

    if (props.middleName) {
      member.middleName = props.middleName;
    }

    // ensure derived state is consistent
    member.recalculateMinorStatus();

    return member;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateDetails(updates: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    contactInfo?: MemberContactInfo;
    notes?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }): void {
    if (updates.firstName) this.firstName = updates.firstName.trim();
    if (updates.lastName) this.lastName = updates.lastName.trim();
    if (updates.middleName !== undefined) this.middleName = updates.middleName?.trim();
    if (updates.contactInfo) {
      this.contactInfo = { ...this.contactInfo, ...updates.contactInfo };
    }
    if (updates.notes !== undefined) this.notes = updates.notes;
    if (updates.gender) this.gender = updates.gender;

    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, updates));
  }

  setDateOfBirth(dob: Date): void {
    if (dob > new Date()) {
      throw new Error('Date of Birth cannot be in the future.');
    }
    this.dateOfBirth = dob;
    this.recalculateMinorStatus();
    this.updatedAt = new Date();
  }

  markAsDeceased(
    dateOfDeathInput: Date | string, // Accept string or Date
    markedBy: string,
    deathCertificateNumber?: string,
  ): void {
    // Normalize to Date
    const dateOfDeath =
      dateOfDeathInput instanceof Date ? dateOfDeathInput : new Date(dateOfDeathInput);

    if (isNaN(dateOfDeath.getTime())) {
      throw new Error('Invalid Date of Death.');
    }

    if (dateOfDeath > new Date()) {
      throw new Error('Date of Death cannot be in the future.');
    }

    if (this.isDeceased) {
      throw new Error('Family member is already marked as deceased.');
    }

    this.isDeceased = true;
    this.dateOfDeath = dateOfDeath;
    this.updatedAt = new Date();

    this.updateDependencyStatus();

    this.apply(
      new FamilyMemberMarkedDeceasedEvent(
        this.id,
        this.familyId,
        dateOfDeath,
        markedBy,
        deathCertificateNumber,
      ),
    );
  }

  linkToUser(userId: string): void {
    if (this.userId) {
      throw new Error('Family Member is already linked to a User.');
    }
    this.userId = userId;
    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, { linkedUserId: userId }));
  }

  updateKenyanIdentification(identification: Partial<KenyanIdentification>): void {
    this.kenyanIdentification = { ...this.kenyanIdentification, ...identification };
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<KenyanFamilyMemberMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  assignAsFamilyHead(): void {
    this.metadata.isFamilyHead = true;
    this.metadata.isElder = true;
    this.updatedAt = new Date();
  }

  /**
   * Assign guardian details and emit event. appointedBy constrained to match event contract.
   */
  assignAsGuardian(guardianDetails: {
    guardianType: string;
    appointedBy: 'court' | 'family' | 'will';
    validUntil?: Date;
    courtOrderNumber?: string;
    notes?: string;
  }): void {
    this.metadata.dependencyStatus = 'FULL';
    this.updatedAt = new Date();

    const fullGuardianDetails = {
      ...guardianDetails,
      appointmentDate: new Date(), // current date as default
    };

    this.apply(new FamilyMemberGuardianAssignedEvent(this.id, this.familyId, fullGuardianDetails));
  }

  updateDependencyStatus(): void {
    if (this.isDeceased) {
      this.metadata.dependencyStatus = 'INDEPENDENT';
    } else if (this.isMinor) {
      this.metadata.dependencyStatus = 'FULL';
    } else if (this.metadata.disabilityStatus && this.metadata.disabilityStatus !== 'NONE') {
      this.metadata.dependencyStatus = 'PARTIAL';
    } else {
      this.metadata.dependencyStatus = 'INDEPENDENT';
    }
    this.updatedAt = new Date();
  }

  remove(reason?: string): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.apply(new FamilyMemberRemovedEvent(this.id, this.familyId, reason ?? 'removed'));
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.firstName || !this.lastName) {
      errors.push('Family member must have both first and last name for succession purposes.');
    }

    // dateOfBirth is always a Date internally; if it's epoch (unknown) and member is living, warn/error
    const isDobEpoch = this.dateOfBirth.getTime() === 0;
    if (isDobEpoch && !this.isDeceased) {
      errors.push('Date of birth is required for living family members.');
    }

    if (this.isDeceased && !this.dateOfDeath) {
      errors.push('Date of death is required for deceased family members.');
    }

    if (!this.isMinor && !this.isDeceased && !this.kenyanIdentification.nationalId) {
      errors.push('National ID is recommended for adult family members for legal identification.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  isEligibleForInheritance(): boolean {
    if (this.isDeceased) return false;
    return true;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private recalculateMinorStatus(): void {
    if (!this.dateOfBirth) {
      this.isMinor = false;
      return;
    }

    const age = this.calculateAge(this.dateOfBirth);
    this.isMinor = age < 18;
    this.updateDependencyStatus();
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
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
  getUserId(): string | null {
    return this.userId;
  }
  getFirstName(): string {
    return this.firstName;
  }
  getLastName(): string {
    return this.lastName;
  }
  getMiddleName(): string | undefined {
    return this.middleName;
  }
  getFullName(): string {
    return this.middleName
      ? `${this.firstName} ${this.middleName} ${this.lastName}`
      : `${this.firstName} ${this.lastName}`;
  }
  // dateOfBirth always returns a Date (may be epoch if unknown)
  getDateOfBirth(): Date {
    return this.dateOfBirth;
  }
  getDateOfDeath(): Date | null {
    return this.dateOfDeath;
  }
  getIsDeceased(): boolean {
    return this.isDeceased;
  }
  getIsMinor(): boolean {
    return this.isMinor;
  }
  getGender(): 'MALE' | 'FEMALE' | 'OTHER' {
    return this.gender;
  }
  getRole(): RelationshipType {
    return this.role;
  }
  getContactInfo(): MemberContactInfo {
    return { ...this.contactInfo };
  }
  getNotes(): string | null {
    return this.notes;
  }
  getAddedBy(): string {
    return this.addedBy;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  getKenyanIdentification(): KenyanIdentification {
    return { ...this.kenyanIdentification };
  }
  getMetadata(): KenyanFamilyMemberMetadata {
    return { ...this.metadata };
  }

  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    if (this.isDeceased && this.dateOfDeath) {
      return this.calculateAgeAtDeath(this.dateOfBirth, this.dateOfDeath);
    }
    return this.calculateAge(this.dateOfBirth);
  }

  private calculateAgeAtDeath(dob: Date, dod: Date): number {
    let age = dod.getFullYear() - dob.getFullYear();
    const monthDiff = dod.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && dod.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  getSuccessionProfile() {
    return {
      id: this.id,
      fullName: this.getFullName(),
      age: this.getAge(),
      isDeceased: this.isDeceased,
      isMinor: this.isMinor,
      dependencyStatus: this.metadata.dependencyStatus,
      relationship: this.role,
      gender: this.gender,
      hasNationalId: !!this.kenyanIdentification.nationalId,
      isFamilyHead: this.metadata.isFamilyHead,
      disabilityStatus: this.metadata.disabilityStatus,
    };
  }
}
