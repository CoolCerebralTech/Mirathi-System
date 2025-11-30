import { DependencyLevel, InheritanceRights, RelationshipType } from '@prisma/client';

/**
 * Kenyan Dependant Status Value Object
 *
 * Immutable representation of a family member's dependant status
 * under Kenyan Law of Succession Act (Section 29).
 */
export class KenyanDependantStatus {
  constructor(
    public readonly isDependant: boolean,
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {
    if (traditionalInheritanceWeight < 0 || traditionalInheritanceWeight > 1) {
      throw new Error('Traditional inheritance weight must be between 0 and 1');
    }
  }

  equals(other: KenyanDependantStatus): boolean {
    return (
      this.isDependant === other.isDependant &&
      this.dependencyLevel === other.dependencyLevel &&
      this.inheritanceRights === other.inheritanceRights &&
      this.traditionalInheritanceWeight === other.traditionalInheritanceWeight
    );
  }
}

/**
 * Kenyan Relationship Context Value Object
 *
 * Immutable representation of adoption/biological status
 * for inheritance calculations.
 */
export class KenyanRelationshipContext {
  constructor(
    public readonly isAdopted: boolean,
    public readonly isBiological: boolean,
    public readonly bornOutOfWedlock: boolean,
    public readonly isCustomaryAdoption: boolean,
    public readonly adoptionDate?: Date,
    public readonly adoptionOrderNumber?: string,
    public readonly courtOrderNumber?: string,
  ) {
    if (isAdopted && isBiological) {
      throw new Error('Cannot be both adopted and biological');
    }
  }

  equals(other: KenyanRelationshipContext): boolean {
    return (
      this.isAdopted === other.isAdopted &&
      this.isBiological === other.isBiological &&
      this.bornOutOfWedlock === other.bornOutOfWedlock
    );
  }
}

/**
 * Family Member Reconstitution Props
 */
export interface FamilyMemberReconstituteProps {
  id: string;
  familyId: string;

  // Core Identity
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: Date | string | null;
  dateOfDeath: Date | string | null;

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
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

/**
 * Family Member Entity (NOT an Aggregate Root)
 *
 * Represents an individual person within a Family aggregate.
 * This is a child entity managed by the Family aggregate.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160), Section 29: Dependants definition
 * - Section 35-39: Intestate succession for spouses and children
 * - Children Act (2022): Minor protection and guardianship
 * - Adoption Act: Legal adoption and inheritance rights
 *
 * Entity Responsibilities:
 * - Maintain person identity (name, contact, dates)
 * - Track relationship to family (role, deceased status)
 * - Calculate dependant status per Kenyan law
 * - Validate member-level invariants
 *
 * Does NOT:
 * - Emit domain events (only aggregates do this)
 * - Create guardianships (Guardian entity does this)
 * - Manage relationships (FamilyRelationship entity does this)
 * - Trigger succession workflows (succession-planning module does this)
 *
 * Note: Family aggregate is responsible for:
 * - Adding/removing members
 * - Ensuring family-level consistency
 * - Emitting events about member changes
 */
export class FamilyMember {
  // Core Identity
  private readonly _id: string;
  private readonly _familyId: string;

  // Person Identity
  private _userId: string | null; // Linked registered user
  private _firstName: string | null;
  private _lastName: string | null;
  private _email: string | null;
  private _phone: string | null;
  private _dateOfBirth: Date | null;
  private _dateOfDeath: Date | null;

  // Relationship Context
  private _relationshipTo: string | null; // Descriptive text: "Son of John Kamau"
  private _role: RelationshipType;

  // Legal Status
  private _isMinor: boolean;
  private _isDeceased: boolean;

  // Metadata
  private _notes: string | null;
  private readonly _addedBy: string; // User who added this member

  // Kenyan Law Computed Properties (Value Objects)
  private _dependantStatus: KenyanDependantStatus;
  private _relationshipContext: KenyanRelationshipContext;

  // Timestamps
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(id: string, familyId: string, role: RelationshipType, addedBy: string) {
    if (!id?.trim()) throw new Error('Family member ID is required');
    if (!familyId?.trim()) throw new Error('Family ID is required');
    if (!addedBy?.trim()) throw new Error('AddedBy user ID is required');

    this._id = id;
    this._familyId = familyId;
    this._role = role;
    this._addedBy = addedBy;

    // Defaults
    this._userId = null;
    this._firstName = null;
    this._lastName = null;
    this._email = null;
    this._phone = null;
    this._dateOfBirth = null;
    this._dateOfDeath = null;
    this._relationshipTo = null;
    this._isMinor = false;
    this._isDeceased = false;
    this._notes = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;

    // Initialize value objects with defaults
    this._dependantStatus = new KenyanDependantStatus(
      false,
      DependencyLevel.NONE,
      InheritanceRights.NONE,
      0.0,
    );
    this._relationshipContext = new KenyanRelationshipContext(
      false, // isAdopted
      true, // isBiological (default assumption)
      false, // bornOutOfWedlock
      false, // isCustomaryAdoption
    );
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Creates a new family member entity.
   *
   * Note: This does NOT emit events. The Family aggregate will emit
   * FamilyMemberLinkedEvent when this member is linked to the family.
   */
  static create(
    id: string,
    familyId: string,
    role: RelationshipType,
    addedBy: string,
    details: {
      userId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: Date;
      relationshipTo?: string;
      notes?: string;
    },
  ): FamilyMember {
    // Validation: Must have either userId OR name
    if (!details.userId && (!details.firstName || !details.lastName)) {
      throw new Error('Family member must have either userId or firstName + lastName');
    }

    // Validation: Minors must have date of birth (Kenyan law requirement)
    if (details.dateOfBirth) {
      const age = FamilyMember.calculateAge(details.dateOfBirth);
      if (age < 18 && !details.dateOfBirth) {
        throw new Error('Minors must have a date of birth (Children Act, 2022)');
      }
    }

    const member = new FamilyMember(id, familyId, role, addedBy);

    // Set identity
    member._userId = details.userId || null;
    member._firstName = details.firstName?.trim() || null;
    member._lastName = details.lastName?.trim() || null;
    member._email = details.email?.trim() || null;
    member._phone = details.phone?.trim() || null;
    member._relationshipTo = details.relationshipTo?.trim() || null;
    member._notes = details.notes?.trim() || null;

    // Set date of birth and calculate minor status
    if (details.dateOfBirth) {
      member.setDateOfBirth(details.dateOfBirth);
    }

    // Calculate Kenyan legal properties
    member.recalculateDependantStatus();
    member.recalculateRelationshipContext();

    return member;
  }

  static reconstitute(props: FamilyMemberReconstituteProps): FamilyMember {
    const member = new FamilyMember(props.id, props.familyId, props.role, props.addedBy);

    member._userId = props.userId;
    member._firstName = props.firstName;
    member._lastName = props.lastName;
    member._email = props.email;
    member._phone = props.phone;
    member._dateOfBirth = props.dateOfBirth ? new Date(props.dateOfBirth) : null;
    member._dateOfDeath = props.dateOfDeath ? new Date(props.dateOfDeath) : null;
    member._relationshipTo = props.relationshipTo;
    member._isMinor = props.isMinor;
    member._isDeceased = props.isDeceased;
    member._notes = props.notes;

    // Override constructor dates
    (member as any)._createdAt = new Date(props.createdAt);
    member._updatedAt = new Date(props.updatedAt);
    member._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    // Recalculate computed properties
    member.recalculateDependantStatus();
    member.recalculateRelationshipContext();

    return member;
  }

  // --------------------------------------------------------------------------
  // DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates basic member details.
   */
  updateDetails(updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relationshipTo?: string;
    notes?: string;
  }): void {
    // Prevent removing required fields for non-user members
    if (updates.firstName !== undefined) {
      if (!updates.firstName && !this._userId) {
        throw new Error('First name required for non-user family members');
      }
      this._firstName = updates.firstName?.trim() || null;
    }

    if (updates.lastName !== undefined) {
      if (!updates.lastName && !this._userId) {
        throw new Error('Last name required for non-user family members');
      }
      this._lastName = updates.lastName?.trim() || null;
    }

    if (updates.email !== undefined) this._email = updates.email?.trim() || null;
    if (updates.phone !== undefined) this._phone = updates.phone?.trim() || null;
    if (updates.relationshipTo !== undefined) {
      this._relationshipTo = updates.relationshipTo?.trim() || null;
    }
    if (updates.notes !== undefined) this._notes = updates.notes?.trim() || null;

    this.markAsUpdated();
  }

  /**
   * Sets or updates date of birth.
   * Automatically calculates minor status.
   */
  setDateOfBirth(dateOfBirth: Date): void {
    if (dateOfBirth > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    this._dateOfBirth = dateOfBirth;
    this._isMinor = FamilyMember.calculateAge(dateOfBirth) < 18;

    this.recalculateDependantStatus();
    this.markAsUpdated();
  }

  /**
   * Marks member as deceased.
   *
   * Legal Context:
   * - Section 45: Death triggers estate administration
   * - This method only records death in family context
   * - Estate opening happens in succession-planning module
   */
  markAsDeceased(dateOfDeath: Date): void {
    if (dateOfDeath > new Date()) {
      throw new Error('Date of death cannot be in the future');
    }

    if (this._dateOfBirth && dateOfDeath < this._dateOfBirth) {
      throw new Error('Date of death cannot be before date of birth');
    }

    if (this._isDeceased) {
      throw new Error('Member already marked as deceased');
    }

    this._isDeceased = true;
    this._dateOfDeath = dateOfDeath;

    // Deceased persons lose dependant status
    this.recalculateDependantStatus();
    this.markAsUpdated();
  }

  /**
   * Links this member to a registered user account.
   */
  linkToUser(userId: string): void {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    if (this._userId) {
      throw new Error('Member already linked to a user');
    }

    this._userId = userId;
    this.markAsUpdated();
  }

  /**
   * Updates the relationship role.
   */
  updateRelationship(role: RelationshipType, relationshipTo?: string): void {
    this._role = role;

    if (relationshipTo !== undefined) {
      this._relationshipTo = relationshipTo.trim() || null;
    }

    // Recalculate legal status based on new role
    this.recalculateDependantStatus();
    this.recalculateRelationshipContext();
    this.markAsUpdated();
  }

  /**
   * Marks member for removal (soft delete).
   */
  markForRemoval(): void {
    this._deletedAt = new Date();
    this.markAsUpdated();
  }

  /**
   * Restores a removed member.
   */
  restore(): void {
    this._deletedAt = null;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // KENYAN LAW CALCULATIONS (Section 29 - Dependants)
  // --------------------------------------------------------------------------

  /**
   * Determines if member is a dependant under Kenyan Law.
   *
   * Reference: Section 29 - Dependants include:
   * - Wife or wives (or former wives)
   * - Children (including adopted/step-children treated as family)
   * - Any person being maintained by deceased immediately before death
   */
  isDependantUnderKenyanLaw(): boolean {
    if (this._isDeceased) return false;

    // Primary dependants (Section 29)
    const dependantRoles = [
      RelationshipType.SPOUSE,
      RelationshipType.EX_SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
    ];

    return dependantRoles.includes(this._role);
  }

  /**
   * Recalculates dependant status based on role, age, and deceased status.
   */
  private recalculateDependantStatus(): void {
    const isDependant = this.isDependantUnderKenyanLaw();

    if (this._isDeceased) {
      // Deceased persons have no inheritance rights
      this._dependantStatus = new KenyanDependantStatus(
        false,
        DependencyLevel.NONE,
        InheritanceRights.NONE,
        0.0,
      );
      return;
    }

    let dependencyLevel: DependencyLevel;
    let inheritanceRights: InheritanceRights;
    let weight: number;

    // Calculate based on role (Sections 35-39 - Intestacy rules)
    switch (this._role) {
      case RelationshipType.SPOUSE:
      case RelationshipType.EX_SPOUSE:
        dependencyLevel = DependencyLevel.FULL;
        inheritanceRights = InheritanceRights.FULL;
        weight = 1.0; // Equal share with children
        break;

      case RelationshipType.CHILD:
      case RelationshipType.ADOPTED_CHILD:
        dependencyLevel = this._isMinor ? DependencyLevel.FULL : DependencyLevel.PARTIAL;
        inheritanceRights = InheritanceRights.FULL;
        weight = 1.0; // Equal share
        break;

      case RelationshipType.STEPCHILD:
        dependencyLevel = this._isMinor ? DependencyLevel.FULL : DependencyLevel.PARTIAL;
        inheritanceRights = InheritanceRights.PARTIAL;
        weight = 0.5; // Reduced share (customary law)
        break;

      case RelationshipType.PARENT:
        dependencyLevel = DependencyLevel.PARTIAL;
        inheritanceRights = InheritanceRights.PARTIAL;
        weight = 0.5; // Parents inherit if no spouse/children
        break;

      case RelationshipType.SIBLING:
      case RelationshipType.HALF_SIBLING:
        dependencyLevel = DependencyLevel.NONE;
        inheritanceRights = InheritanceRights.CUSTOMARY;
        weight = 0.25; // Customary inheritance only
        break;

      default:
        dependencyLevel = DependencyLevel.NONE;
        inheritanceRights = InheritanceRights.CUSTOMARY;
        weight = 0.0;
    }

    this._dependantStatus = new KenyanDependantStatus(
      isDependant,
      dependencyLevel,
      inheritanceRights,
      weight,
    );
  }

  /**
   * Recalculates relationship context (adoption/biological status).
   */
  private recalculateRelationshipContext(): void {
    const isAdopted = this._role === RelationshipType.ADOPTED_CHILD;
    const isBiological =
      !isAdopted &&
      this._role !== RelationshipType.STEPCHILD &&
      this._role !== RelationshipType.SPOUSE;

    this._relationshipContext = new KenyanRelationshipContext(
      isAdopted,
      isBiological,
      false, // bornOutOfWedlock - would be set via separate method
      false, // isCustomaryAdoption - would be set via separate method
    );
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates if member can act as a guardian.
   *
   * Reference: Children Act (2022) - Guardian eligibility
   */
  canBeGuardian(): { canBeGuardian: boolean; reason?: string } {
    if (this._isDeceased) {
      return { canBeGuardian: false, reason: 'Deceased persons cannot be guardians' };
    }

    if (this._isMinor) {
      return { canBeGuardian: false, reason: 'Minors cannot be guardians' };
    }

    return { canBeGuardian: true };
  }

  /**
   * Validates if member can be a witness to a will.
   *
   * Reference: Section 13 - Witness requirements
   */
  canBeWillWitness(): { canBeWitness: boolean; reason?: string } {
    if (this._isDeceased) {
      return { canBeWitness: false, reason: 'Deceased persons cannot witness wills' };
    }

    if (this._isMinor) {
      return { canBeWitness: false, reason: 'Minors cannot witness wills (must be 18+)' };
    }

    return { canBeWitness: true };
  }

  // --------------------------------------------------------------------------
  // QUERIES & HELPERS
  // --------------------------------------------------------------------------

  /**
   * Calculates age from date of birth.
   */
  static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  }

  getAge(): number | null {
    return this._dateOfBirth ? FamilyMember.calculateAge(this._dateOfBirth) : null;
  }

  getFullName(): string {
    if (this._firstName && this._lastName) {
      return `${this._firstName} ${this._lastName}`;
    }

    if (this._firstName) return this._firstName;
    if (this._userId) return `User ${this._userId}`;

    return 'Unknown Member';
  }

  isRemoved(): boolean {
    return this._deletedAt !== null;
  }

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get familyId(): string {
    return this._familyId;
  }

  get userId(): string | null {
    return this._userId;
  }

  get firstName(): string | null {
    return this._firstName;
  }

  get lastName(): string | null {
    return this._lastName;
  }

  get email(): string | null {
    return this._email;
  }

  get phone(): string | null {
    return this._phone;
  }

  get dateOfBirth(): Date | null {
    return this._dateOfBirth;
  }

  get dateOfDeath(): Date | null {
    return this._dateOfDeath;
  }

  get relationshipTo(): string | null {
    return this._relationshipTo;
  }

  get role(): RelationshipType {
    return this._role;
  }

  get isMinor(): boolean {
    return this._isMinor;
  }

  get isDeceased(): boolean {
    return this._isDeceased;
  }

  get notes(): string | null {
    return this._notes;
  }

  get addedBy(): string {
    return this._addedBy;
  }

  get dependantStatus(): KenyanDependantStatus {
    return this._dependantStatus;
  }

  get relationshipContext(): KenyanRelationshipContext {
    return this._relationshipContext;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get deletedAt(): Date | null {
    return this._deletedAt ? new Date(this._deletedAt) : null;
  }
}
