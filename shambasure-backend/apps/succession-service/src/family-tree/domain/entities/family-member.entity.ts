import { AggregateRoot } from '@nestjs/cqrs';
import { RelationshipType } from '@prisma/client'; // Using Prisma Enum directly
import { MINOR_PROTECTION } from '../../../common/constants/distribution-rules.constants';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyMemberUpdatedEvent } from '../events/family-member-updated.event';
import { FamilyMemberMarkedDeceasedEvent } from '../events/family-member-marked-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-member-removed.event';

export interface MemberContactInfo {
  email?: string;
  phone?: string; // Should be validated as KenyanPhoneNumber VO in command handler
  address?: string;
}

export class FamilyMember extends AggregateRoot {
  private id: string;
  private familyId: string;

  // Identity
  private userId: string | null;
  private firstName: string;
  private lastName: string;

  // Vital Statistics
  private dateOfBirth: Date | null;
  private dateOfDeath: Date | null;
  private isDeceased: boolean;
  private isMinor: boolean;

  // Role & Context
  private role: RelationshipType;
  private relationshipTo: string | null; // Contextual description (e.g., "Father of John")

  // Contact
  private contactInfo: MemberContactInfo;
  private notes: string | null;

  private addedBy: string;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Private constructor
  private constructor(
    id: string,
    familyId: string,
    firstName: string,
    lastName: string,
    role: RelationshipType,
    addedBy: string,
  ) {
    super();
    this.id = id;
    this.familyId = familyId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;
    this.addedBy = addedBy;

    // Defaults
    this.userId = null;
    this.dateOfBirth = null;
    this.dateOfDeath = null;
    this.isDeceased = false;
    this.isMinor = false;
    this.relationshipTo = null;
    this.contactInfo = {};
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
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
    },
  ): FamilyMember {
    if (!firstName || !lastName) {
      throw new Error('First and Last Name are required.');
    }

    const member = new FamilyMember(id, familyId, firstName, lastName, role, addedBy);

    if (details?.userId) member.userId = details.userId;
    if (details?.contactInfo) member.contactInfo = details.contactInfo;

    if (details?.dateOfBirth) {
      member.setDateOfBirth(details.dateOfBirth);
    }

    if (details?.isDeceased) {
      member.isDeceased = true;
      // Note: If creating as deceased, we usually want a date, but boolean is mandatory
    }

    member.apply(
      new FamilyMemberAddedEvent(id, familyId, `${firstName} ${lastName}`, role, details?.userId),
    );

    return member;
  }

  static reconstitute(props: any): FamilyMember {
    const member = new FamilyMember(
      props.id,
      props.familyId,
      props.firstName,
      props.lastName,
      props.role,
      props.addedBy,
    );

    member.userId = props.userId || null;
    member.dateOfBirth = props.dateOfBirth ? new Date(props.dateOfBirth) : null;
    member.dateOfDeath = props.dateOfDeath ? new Date(props.dateOfDeath) : null;
    member.isDeceased = props.isDeceased;
    member.isMinor = props.isMinor;
    member.relationshipTo = props.relationshipTo || null;

    member.contactInfo = {
      email: props.email,
      phone: props.phone,
      address: props.address, // Assuming flattened storage or passed as object
    };

    member.notes = props.notes || null;
    member.createdAt = new Date(props.createdAt);
    member.updatedAt = new Date(props.updatedAt);
    member.deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    return member;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateDetails(
    firstName?: string,
    lastName?: string,
    contactInfo?: MemberContactInfo,
    notes?: string,
  ): void {
    if (firstName) this.firstName = firstName;
    if (lastName) this.lastName = lastName;
    if (contactInfo) {
      this.contactInfo = { ...this.contactInfo, ...contactInfo };
    }
    if (notes !== undefined) this.notes = notes;

    this.updatedAt = new Date();
    this.apply(
      new FamilyMemberUpdatedEvent(this.id, this.familyId, { firstName, lastName, contactInfo }),
    );
  }

  setDateOfBirth(dob: Date): void {
    if (dob > new Date()) {
      throw new Error('Date of Birth cannot be in the future.');
    }
    this.dateOfBirth = dob;
    this.recalculateMinorStatus();
    this.updatedAt = new Date();
  }

  /**
   * Marks the family member as deceased.
   * This is a critical action that affects inheritance logic.
   */
  markAsDeceased(dateOfDeath: Date, markedBy: string): void {
    if (dateOfDeath > new Date()) {
      throw new Error('Date of Death cannot be in the future.');
    }

    this.isDeceased = true;
    this.dateOfDeath = dateOfDeath;
    this.updatedAt = new Date();

    this.apply(new FamilyMemberMarkedDeceasedEvent(this.id, this.familyId, dateOfDeath, markedBy));
  }

  /**
   * Links this node to a real system User ID.
   * E.g., "Inviting Uncle Bob to join" -> Uncle Bob accepts -> Link User ID.
   */
  linkToUser(userId: string): void {
    if (this.userId) {
      throw new Error('Family Member is already linked to a User.');
    }
    this.userId = userId;
    this.updatedAt = new Date();
    this.apply(new FamilyMemberUpdatedEvent(this.id, this.familyId, { linkedUserId: userId }));
  }

  remove(reason?: string): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.apply(new FamilyMemberRemovedEvent(this.id, this.familyId, reason));
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private recalculateMinorStatus(): void {
    if (!this.dateOfBirth) {
      this.isMinor = false; // Default assumption if unknown
      return;
    }

    const age = this.calculateAge(this.dateOfBirth);
    this.isMinor = age < MINOR_PROTECTION.MINORS.ageLimit;
  }

  private calculateAge(dob: Date): number {
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
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
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  getUserId() {
    return this.userId;
  }
  getRole() {
    return this.role;
  }
  getIsDeceased() {
    return this.isDeceased;
  }
  getIsMinor() {
    return this.isMinor;
  }
  getDateOfBirth() {
    return this.dateOfBirth;
  }
  getContactInfo() {
    return { ...this.contactInfo };
  }
  getDeletedAt() {
    return this.deletedAt;
  }
}
