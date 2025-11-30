import { AggregateRoot } from '@nestjs/cqrs';
import {
  DependencyLevel,
  GuardianAppointmentSource,
  GuardianType,
  InheritanceRights,
  RelationshipType,
} from '@prisma/client';

import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyMemberGuardianAssignedEvent } from '../events/family-member-guardian-assigned.event';
import { FamilyMemberMarkedDeceasedEvent } from '../events/family-member-marked-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-member-removed.event';
import { FamilyMemberUpdatedEvent } from '../events/family-member-updated.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

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

// Next of Kin matching Prisma schema usage in profiles
export interface KenyanNextOfKin {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Family Member Reconstitution Interface matching Prisma schema
export interface FamilyMemberReconstitutionProps {
  id: string;
  familyId: string;

  // Core Identity
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: Date | null;
  dateOfDeath: Date | null;

  // Relationship context
  relationshipTo: string | null;
  role: RelationshipType;

  // Legal status
  isMinor: boolean;
  isDeceased: boolean;

  // Metadata
  notes: string | null;
  addedBy: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: FAMILY MEMBER
// -----------------------------------------------------------------------------

export class FamilyMember extends AggregateRoot {
  private readonly id: string;
  private readonly familyId: string;

  // Core Identity
  private userId: string | null;
  private firstName: string | null;
  private lastName: string | null;
  private email: string | null;
  private phone: string | null;
  private dateOfBirth: Date | null;
  private dateOfDeath: Date | null;

  // Relationship context
  private relationshipTo: string | null;
  private role: RelationshipType;

  // Legal status
  private isMinor: boolean;
  private isDeceased: boolean;

  // Metadata
  private notes: string | null;
  private readonly addedBy: string;

  // Timestamps
  private readonly createdAt: Date; // Immutable
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Kenyan Legal Context
  private dependantStatus: KenyanDependantStatus;
  private relationshipContext: KenyanRelationshipContext;

  private constructor(
    id: string,
    familyId: string,
    role: RelationshipType,
    addedBy: string,
    // Lifecycle injection for reconstitution
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
  ) {
    super();
    this.id = id;
    this.familyId = familyId;
    this.role = role;
    this.addedBy = addedBy;

    // Initialize fields
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

    // Lifecycle
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.deletedAt = deletedAt ?? null;

    // Initialize Kenyan legal context (defaults)
    this.dependantStatus = new KenyanDependantStatus(
      false,
      DependencyLevel.NONE,
      InheritanceRights.NONE,
      0.0,
    );
    this.relationshipContext = new KenyanRelationshipContext(false, true, false, false);
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

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
    // Identity Validation
    if (!details?.userId && (!details?.firstName || !details?.lastName)) {
      throw new Error('Family member must have either a linked User ID or First and Last Name.');
    }

    const member = new FamilyMember(id, familyId, role, addedBy);

    // Apply Details
    if (details?.userId) member.userId = details.userId;
    if (details?.firstName) member.firstName = details.firstName;
    if (details?.lastName) member.lastName = details.lastName;
    if (details?.email) member.email = details.email;
    if (details?.phone) member.phone = details.phone;

    if (details?.dateOfBirth) {
      member.setDateOfBirth(details.dateOfBirth);
    } else if (details?.isMinor !== undefined) {
      member.isMinor = details.isMinor;
    }

    if (details?.relationshipTo) member.relationshipTo = details.relationshipTo;
    if (details?.notes) member.notes = details.notes;

    // Run Initial Computations
    member.calculateDependantStatus();
    member.calculateRelationshipContext();

    member.apply(
      new FamilyMemberAddedEvent(member.familyId, {
        memberId: member.id,
        userId: member.userId || undefined,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        role: member.role,
        isMinor: member.isMinor,
        isDeceased: member.isDeceased,
        dateOfBirth: member.dateOfBirth || new Date(),
        relationshipTo: member.relationshipTo || undefined,
      }),
    );

    return member;
  }

  static reconstitute(props: FamilyMemberReconstitutionProps): FamilyMember {
    const member = new FamilyMember(
      props.id,
      props.familyId,
      props.role,
      props.addedBy,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );

    member.userId = props.userId;
    member.firstName = props.firstName;
    member.lastName = props.lastName;
    member.email = props.email;
    member.phone = props.phone;
    member.dateOfBirth = props.dateOfBirth;
    member.dateOfDeath = props.dateOfDeath;
    member.relationshipTo = props.relationshipTo;
    member.isMinor = props.isMinor;
    member.isDeceased = props.isDeceased;
    member.notes = props.notes;

    member.calculateDependantStatus();
    member.calculateRelationshipContext();

    return member;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateDetails(updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relationshipTo?: string;
    notes?: string;
  }): void {
    if (updates.firstName !== undefined) {
      if (!updates.firstName && !this.userId) {
        throw new Error('First name cannot be removed for non-user family members.');
      }
      this.firstName = updates.firstName ?? null;
    }

    if (updates.lastName !== undefined) {
      if (!updates.lastName && !this.userId) {
        throw new Error('Last name cannot be removed for non-user family members.');
      }
      this.lastName = updates.lastName ?? null;
    }

    if (updates.email !== undefined) this.email = updates.email ?? null;
    if (updates.phone !== undefined) this.phone = updates.phone ?? null;
    if (updates.relationshipTo !== undefined) this.relationshipTo = updates.relationshipTo ?? null;
    if (updates.notes !== undefined) this.notes = updates.notes ?? null;

    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, updates));
  }

  setDateOfBirth(dob: Date): void {
    if (dob > new Date()) {
      throw new Error('Date of birth cannot be in the future.');
    }
    this.dateOfBirth = dob;
    this.isMinor = this.calculateAge(dob) < 18;
    this.updatedAt = new Date();
    this.calculateDependantStatus();
  }

  markAsDeceased(dateOfDeath: Date, markedBy: string, deathCertificateNumber?: string): void {
    if (isNaN(dateOfDeath.getTime())) throw new Error('Invalid date of death.');
    if (dateOfDeath > new Date()) throw new Error('Date of death cannot be in the future.');
    if (this.isDeceased) throw new Error('Family member is already marked as deceased.');

    this.isDeceased = true;
    this.dateOfDeath = dateOfDeath;
    this.updatedAt = new Date();

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

  linkToUser(userId: string): void {
    if (this.userId) throw new Error('Family member is already linked to a user.');
    this.userId = userId;
    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, { linkedUserId: userId }));
  }

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

  assignAsGuardian(guardianDetails: {
    guardianType: GuardianType;
    appointedBy: GuardianAppointmentSource;
    appointmentDate: Date;
    courtOrderNumber?: string;
  }): void {
    if (this.isDeceased) throw new Error('Cannot assign a deceased person as a guardian.');
    if (this.isMinor) throw new Error('A minor cannot act as a guardian.');

    this.updatedAt = new Date();
    this.apply(new FamilyMemberGuardianAssignedEvent(this.id, this.familyId, guardianDetails));
  }

  remove(reason?: string): void {
    if (this.isDependantUnderKenyanLaw() && !this.deletedAt) {
      // Warning logic handled by service
    }

    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.apply(new FamilyMemberRemovedEvent(this.id, this.familyId, reason ?? 'removed'));
  }

  // --------------------------------------------------------------------------
  // KENYAN SUCCESSION RULES & CALCULATIONS
  // --------------------------------------------------------------------------

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  isDependantUnderKenyanLaw(): boolean {
    if (this.isDeceased) return false;
    // Primary Dependants (Section 29)
    if (
      this.role === RelationshipType.SPOUSE ||
      this.role === RelationshipType.CHILD ||
      this.role === RelationshipType.ADOPTED_CHILD
    ) {
      return true;
    }
    return false;
  }

  private calculateDependantStatus(): void {
    const isDependant = this.isDependantUnderKenyanLaw();

    // Explicit Typing fixes "Type not assignable" errors
    let dependencyLevel: DependencyLevel = DependencyLevel.NONE;
    let inheritanceRights: InheritanceRights = InheritanceRights.NONE;
    let traditionalWeight = 0.0;

    if (this.isDeceased) {
      inheritanceRights = InheritanceRights.NONE;
    } else {
      if (this.role === RelationshipType.SPOUSE) {
        dependencyLevel = DependencyLevel.FULL;
        inheritanceRights = InheritanceRights.FULL;
        traditionalWeight = 1.0;
      } else if (
        this.role === RelationshipType.CHILD ||
        this.role === RelationshipType.ADOPTED_CHILD
      ) {
        dependencyLevel = this.isMinor ? DependencyLevel.FULL : DependencyLevel.PARTIAL;
        inheritanceRights = InheritanceRights.FULL;
        traditionalWeight = 1.0;
      } else if (this.role === RelationshipType.PARENT) {
        inheritanceRights = InheritanceRights.PARTIAL;
        traditionalWeight = 0.5;
      } else {
        inheritanceRights = InheritanceRights.CUSTOMARY;
      }
    }

    this.dependantStatus = new KenyanDependantStatus(
      isDependant,
      dependencyLevel,
      inheritanceRights,
      traditionalWeight,
    );
  }

  private calculateRelationshipContext(): void {
    const isAdopted = this.role === RelationshipType.ADOPTED_CHILD;
    const isBiological =
      !isAdopted &&
      this.role !== RelationshipType.STEPCHILD &&
      this.role !== RelationshipType.SPOUSE;

    this.relationshipContext = new KenyanRelationshipContext(isAdopted, isBiological, false, false);
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

  getDependantStatus(): KenyanDependantStatus {
    return this.dependantStatus;
  }
  getRelationshipContext(): KenyanRelationshipContext {
    return this.relationshipContext;
  }

  getFullName(): string {
    if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
    return this.userId ? `User ${this.userId}` : 'Unknown Member';
  }

  // Added to ensure private fields are accessed and provide comprehensive data to consumers
  getSuccessionProfile() {
    return {
      id: this.id,
      fullName: this.getFullName(),
      isDependant: this.isDependantUnderKenyanLaw(),
      dependantStatus: this.dependantStatus,
      relationshipContext: this.relationshipContext, // Solves unused property error
      inheritanceRights: this.dependantStatus.inheritanceRights,
    };
  }
}
