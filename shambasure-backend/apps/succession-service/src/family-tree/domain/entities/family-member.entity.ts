import { AggregateRoot } from '@nestjs/cqrs';
import {
  DependencyLevel,
  GuardianAppointmentSource,
  GuardianType,
  InheritanceRights,
  KenyanCounty,
  RelationshipType,
} from '@prisma/client';

import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyMemberGuardianAssignedEvent } from '../events/family-member-guardian-assigned.event';
import { FamilyMemberMarkedDeceasedEvent } from '../events/family-member-marked-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-member-removed.event';
import { FamilyMemberUpdatedEvent } from '../events/family-member-updated.event';

// Kenyan Legal Value Objects
export class KenyanDependantStatus {
  constructor(
    public readonly isDependant: boolean,
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {}
}

export class KenyanRelationshipContext {
  constructor(
    public readonly isAdopted: boolean,
    public readonly isBiological: boolean,
    public readonly bornOutOfWedlock: boolean,
    public readonly isCustomaryAdoption: boolean,
    public readonly adoptionDate?: Date,
    public readonly adoptionOrderNumber?: string,
    public readonly courtOrderNumber?: string,
  ) {}
}

// Address Value Object matching Prisma schema
export interface KenyanAddress {
  street?: string;
  city?: string;
  county?: KenyanCounty;
  postalCode?: string;
}

// Next of Kin matching Prisma schema
export interface KenyanNextOfKin {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Family Member Reconstitution Interface matching Prisma schema exactly
interface FamilyMemberReconstitutionProps {
  id: string;
  familyId: string;

  // Core Identity (exactly matching Prisma schema)
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  dateOfDeath?: Date | null;

  // Relationship context (exactly matching Prisma schema)
  relationshipTo?: string | null;
  role: RelationshipType;

  // Legal status (exactly matching Prisma schema)
  isMinor: boolean;
  isDeceased: boolean;

  // Metadata (exactly matching Prisma schema)
  notes?: string | null;
  addedBy: string;

  // Timestamps (exactly matching Prisma schema)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export class FamilyMember extends AggregateRoot {
  private id: string;
  private familyId: string;

  // Core Identity (exactly matching Prisma schema)
  private userId: string | null;
  private firstName: string | null;
  private lastName: string | null;
  private email: string | null;
  private phone: string | null;
  private dateOfBirth: Date | null;
  private dateOfDeath: Date | null;

  // Relationship context (exactly matching Prisma schema)
  private relationshipTo: string | null;
  private role: RelationshipType;

  // Legal status (exactly matching Prisma schema)
  private isMinor: boolean;
  private isDeceased: boolean;

  // Metadata (exactly matching Prisma schema)
  private notes: string | null;
  private addedBy: string;

  // Timestamps (exactly matching Prisma schema)
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Kenyan Legal Context (computed properties, not stored in Prisma)
  private dependantStatus: KenyanDependantStatus;
  private relationshipContext: KenyanRelationshipContext;

  private constructor(id: string, familyId: string, role: RelationshipType, addedBy: string) {
    super();
    this.id = id;
    this.familyId = familyId;
    this.role = role;
    this.addedBy = addedBy;

    // Initialize Prisma schema fields
    this.userId = null;
    this.firstName = null;
    this.lastName = null;
    this.email = null;
    this.phone = null;
    this.dateOfBirth = null;
    this.dateOfDeath = null;
    this.relationshipTo = null;
    this.isMinor = false;
    this.isDeceased = false;
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;

    // Initialize Kenyan legal context
    this.dependantStatus = new KenyanDependantStatus(
      false,
      DependencyLevel.NONE,
      InheritanceRights.FULL,
      1.0,
    );
    this.relationshipContext = new KenyanRelationshipContext(false, true, false, false);
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a new FamilyMember with Kenyan succession law considerations
   * Law of Succession Act Section 29 - Definition of dependants
   */
  static create(
    id: string,
    familyId: string,
    role: RelationshipType,
    addedBy: string,
    details?: {
      userId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: Date;
      relationshipTo?: string;
      isMinor?: boolean;
      notes?: string;
    },
  ): FamilyMember {
    // Legal validation - must have identity
    if (!details?.userId && (!details?.firstName || !details?.lastName)) {
      throw new Error('Family member must have either user ID or first and last name.');
    }

    const member = new FamilyMember(id, familyId, role, addedBy);

    // Set provided details
    if (details?.userId) member.userId = details.userId;
    if (details?.firstName) member.firstName = details.firstName;
    if (details?.lastName) member.lastName = details.lastName;
    if (details?.email) member.email = details.email;
    if (details?.phone) member.phone = details.phone;
    if (details?.dateOfBirth) {
      member.setDateOfBirth(details.dateOfBirth);
    }
    if (details?.relationshipTo) member.relationshipTo = details.relationshipTo;
    if (details?.isMinor !== undefined) member.isMinor = details.isMinor;
    if (details?.notes) member.notes = details.notes;

    // Calculate legal status based on provided data
    member.calculateDependantStatus();
    member.calculateRelationshipContext();

    member.apply(
      new FamilyMemberAddedEvent(member.familyId, {
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        isMinor: member.isMinor,
        isDeceased: member.isDeceased,
        dateOfBirth: member.dateOfBirth,
      }),
    );

    return member;
  }

  /**
   * Reconstitutes FamilyMember from persistence exactly matching Prisma schema
   */
  static reconstitute(props: FamilyMemberReconstitutionProps): FamilyMember {
    const member = new FamilyMember(props.id, props.familyId, props.role, props.addedBy);

    // Set all Prisma schema fields exactly
    member.userId = props.userId || null;
    member.firstName = props.firstName || null;
    member.lastName = props.lastName || null;
    member.email = props.email || null;
    member.phone = props.phone || null;
    member.dateOfBirth = props.dateOfBirth || null;
    member.dateOfDeath = props.dateOfDeath || null;
    member.relationshipTo = props.relationshipTo || null;
    member.isMinor = props.isMinor;
    member.isDeceased = props.isDeceased;
    member.notes = props.notes || null;
    member.createdAt = props.createdAt;
    member.updatedAt = props.updatedAt;
    member.deletedAt = props.deletedAt || null;

    // Calculate Kenyan legal context from persisted data
    member.calculateDependantStatus();
    member.calculateRelationshipContext();

    return member;
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Updates member details with Kenyan succession law validation
   */
  updateDetails(updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relationshipTo?: string;
    notes?: string;
  }): void {
    // Legal validation - cannot remove identity
    if (updates.firstName !== undefined) {
      if (!updates.firstName && !this.userId) {
        throw new Error('First name is required for non-user family members.');
      }
      this.firstName = updates.firstName;
    }

    if (updates.lastName !== undefined) {
      if (!updates.lastName && !this.userId) {
        throw new Error('Last name is required for non-user family members.');
      }
      this.lastName = updates.lastName;
    }

    if (updates.email !== undefined) this.email = updates.email;
    if (updates.phone !== undefined) this.phone = updates.phone;
    if (updates.relationshipTo !== undefined) this.relationshipTo = updates.relationshipTo;
    if (updates.notes !== undefined) this.notes = updates.notes;

    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, updates));
  }

  /**
   * Sets date of birth with Kenyan legal age calculations
   * Law of Succession Act considers minors as under 18 years
   */
  setDateOfBirth(dob: Date): void {
    if (dob > new Date()) {
      throw new Error('Date of birth cannot be in the future.');
    }

    this.dateOfBirth = dob;

    // Recalculate minor status based on Kenyan law (age < 18)
    const age = this.calculateAge(dob);
    this.isMinor = age < 18;

    this.updatedAt = new Date();
    this.calculateDependantStatus();
  }

  /**
   * Marks member as deceased with Kenyan legal formalities
   * Law of Succession Act requires proper death documentation
   */
  markAsDeceased(dateOfDeath: Date, markedBy: string, deathCertificateNumber?: string): void {
    // Legal validations
    if (isNaN(dateOfDeath.getTime())) {
      throw new Error('Invalid date of death.');
    }
    if (dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future.');
    }
    if (this.isDeceased) {
      throw new Error('Family member is already marked as deceased.');
    }

    this.isDeceased = true;
    this.dateOfDeath = dateOfDeath;
    this.updatedAt = new Date();

    // Update legal status
    this.calculateDependantStatus();

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

  /**
   * Links to registered user account for Kenyan legal proceedings
   */
  linkToUser(userId: string): void {
    if (this.userId) {
      throw new Error('Family member is already linked to a user.');
    }

    this.userId = userId;
    this.updatedAt = new Date();

    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, { linkedUserId: userId }));
  }

  /**
   * Updates relationship role with Kenyan succession implications
   * Law of Succession Act Sections 35-40 define inheritance rights by relationship
   */
  updateRelationship(role: RelationshipType, relationshipTo?: string): void {
    const oldRole = this.role;
    this.role = role;
    if (relationshipTo !== undefined) this.relationshipTo = relationshipTo;

    this.updatedAt = new Date();
    this.calculateDependantStatus();
    this.calculateRelationshipContext();

    this.apply(
      new FamilyMemberUpdatedEvent(this.id, this.familyId, {
        previousRole: oldRole,
        newRole: role,
        relationshipTo,
      }),
    );
  }

  /**
   * Assigns guardian according to Kenyan law for minors and dependants
   * Law of Succession Act provides for testamentary and court-appointed guardians
   */
  assignAsGuardian(guardianDetails: {
    guardianType: GuardianType;
    appointedBy: GuardianAppointmentSource;
    appointmentDate: Date;
    validUntil?: Date;
    courtOrderNumber?: string;
    courtName?: string;
    caseNumber?: string;
    issuingJudge?: string;
    courtStation?: string;
    conditions?: string[];
    reportingRequirements?: string[];
    restrictedPowers?: string[];
    specialInstructions?: string[];
    isTemporary?: boolean;
    reviewDate?: Date;
    notes?: string;
  }): void {
    // Legal validation for guardian assignment
    if (this.isDeceased) {
      throw new Error('Cannot assign guardian to deceased family member.');
    }

    this.updatedAt = new Date();

    this.apply(new FamilyMemberGuardianAssignedEvent(this.id, this.familyId, guardianDetails));
  }

  /**
   * Removes member with Kenyan succession law considerations
   * Law of Succession Act protects inheritance rights of dependants
   */
  remove(reason?: string): void {
    if (this.isDependantUnderKenyanLaw()) {
      throw new Error('Cannot remove a dependant under Kenyan succession law.');
    }

    this.deletedAt = new Date();
    this.updatedAt = new Date();

    this.apply(new FamilyMemberRemovedEvent(this.id, this.familyId, reason ?? 'removed'));
  }

  // --------------------------------------------------------------------------
  // KENYAN SUCCESSION LAW VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates member for succession purposes under Kenyan law
   * Law of Succession Act Section 29 - Dependant definition
   */
  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Identity validation
    if (!this.userId && (!this.firstName || !this.lastName)) {
      errors.push('Family member must have either user ID or complete name.');
    }

    // Age validation for living members
    if (!this.isDeceased && !this.dateOfBirth) {
      warnings.push('Date of birth is recommended for accurate age determination.');
    }

    // Minor protection validation
    if (this.isMinor && !this.dateOfBirth) {
      errors.push('Minors must have date of birth for age verification and guardianship.');
    }

    // Deceased member validation
    if (this.isDeceased && !this.dateOfDeath) {
      errors.push('Deceased members must have date of death.');
    }

    // Relationship validation
    if (!this.relationshipTo) {
      warnings.push('Relationship context is recommended for succession clarity.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Determines inheritance eligibility under Kenyan law
   * Law of Succession Act Sections 35-40
   */
  isEligibleForInheritance(): { eligible: boolean; restrictions: string[] } {
    const restrictions: string[] = [];

    if (this.isDeceased) {
      restrictions.push('Deceased persons cannot inherit.');
    }

    // Law of Succession Act Section 29 - Dependant rights
    if (this.isDependantUnderKenyanLaw()) {
      restrictions.push('Member is a dependant with protected inheritance rights.');
    }

    return {
      eligible: restrictions.length === 0,
      restrictions,
    };
  }

  /**
   * Determines if member qualifies as a dependant under Kenyan law
   * Law of Succession Act Section 29
   */
  isDependantUnderKenyanLaw(): boolean {
    // Section 29 dependants include:
    // - Wife/wives, children (including adopted, step-children)
    // - Parents, grandchildren, siblings in certain circumstances
    // - Persons maintained by deceased immediately prior to death

    const dependantRelationships: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];

    return (
      dependantRelationships.includes(this.role) ||
      this.dependantStatus.dependencyLevel !== DependencyLevel.NONE
    );
  }

  /**
   * Calculates legal dependant status based on Kenyan law
   */
  private calculateDependantStatus(): void {
    const isDependant = this.isDependantUnderKenyanLaw();
    let dependencyLevel = DependencyLevel.NONE;
    let inheritanceRights = InheritanceRights.FULL;
    let traditionalWeight = 1.0;

    // Law of Succession Act considerations
    if (this.isMinor) {
      dependencyLevel = DependencyLevel.FULL;
      inheritanceRights = InheritanceRights.FULL;
    } else if (this.role === RelationshipType.SPOUSE) {
      inheritanceRights = InheritanceRights.FULL;
      traditionalWeight = 1.0;
    } else if (this.role === RelationshipType.CHILD) {
      inheritanceRights = InheritanceRights.FULL;
    } else if (this.role === RelationshipType.PARENT) {
      // Parents have limited inheritance rights in certain circumstances
      inheritanceRights = InheritanceRights.PARTIAL;
    }

    this.dependantStatus = new KenyanDependantStatus(
      isDependant,
      dependencyLevel,
      inheritanceRights,
      traditionalWeight,
    );
  }

  /**
   * Calculates relationship context for Kenyan customary law
   */
  private calculateRelationshipContext(): void {
    // This would be populated from FamilyRelationship data
    // For now, initialize with defaults
    this.relationshipContext = new KenyanRelationshipContext(
      false, // isAdopted
      true, // isBiological
      false, // bornOutOfWedlock
      false, // isCustomaryAdoption
    );
  }

  /**
   * Calculates age for Kenyan legal purposes (18 years for majority)
   */
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
  // GETTERS (exactly matching Prisma schema fields)
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
  getFirstName(): string | null {
    return this.firstName;
  }
  getLastName(): string | null {
    return this.lastName;
  }
  getEmail(): string | null {
    return this.email;
  }
  getPhone(): string | null {
    return this.phone;
  }
  getDateOfBirth(): Date | null {
    return this.dateOfBirth;
  }
  getDateOfDeath(): Date | null {
    return this.dateOfDeath;
  }
  getRelationshipTo(): string | null {
    return this.relationshipTo;
  }
  getRole(): RelationshipType {
    return this.role;
  }
  getIsMinor(): boolean {
    return this.isMinor;
  }
  getIsDeceased(): boolean {
    return this.isDeceased;
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

  // Kenyan Legal Context Getters
  getDependantStatus(): KenyanDependantStatus {
    return this.dependantStatus;
  }
  getRelationshipContext(): KenyanRelationshipContext {
    return this.relationshipContext;
  }

  /**
   * Gets comprehensive succession profile for Kenyan legal proceedings
   */
  getSuccessionProfile() {
    const age = this.dateOfBirth ? this.calculateAge(this.dateOfBirth) : null;

    return {
      id: this.id,
      userId: this.userId,
      fullName: this.getFullName(),
      age,
      isDeceased: this.isDeceased,
      isMinor: this.isMinor,
      role: this.role,
      relationshipTo: this.relationshipTo,
      dependantStatus: this.dependantStatus,
      inheritanceRights: this.dependantStatus.inheritanceRights,
      isDependant: this.isDependantUnderKenyanLaw(),
      contactInfo: {
        email: this.email,
        phone: this.phone,
      },
      legalValidation: this.validateForSuccession(),
    };
  }

  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.userId ? `User ${this.userId}` : 'Unknown Member';
  }

  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    return this.calculateAge(this.dateOfBirth);
  }
}
