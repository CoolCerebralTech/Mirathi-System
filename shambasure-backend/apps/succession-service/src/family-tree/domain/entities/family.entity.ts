import { AggregateRoot } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';

import { FamilyArchivedEvent } from '../events/family-archived.event';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyHeadAppointedEvent } from '../events/family-head-appointed.event';
import { FamilyIdentityUpdatedEvent } from '../events/family-identity-updated.event';
import { FamilyMemberLinkedEvent } from '../events/family-member-linked.event';
import { FamilyMemberRemovedEvent } from '../events/family-member-removed.event';
import { FamilyRestoredEvent } from '../events/family-restored.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

/**
 * Kenyan Clan Identity Information
 */
export interface KenyanClanIdentity {
  clanName: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
}

/**
 * Family Statistics (Calculated, not stored)
 */
export interface FamilyStatistics {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  minors: number;
  adults: number;
  customaryMarriages: number;
  polygamousMarriages: number;
}

/**
 * Tree Visualization Data matching Frontend expectations
 */
export interface TreeVisualizationData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'person' | 'spouse' | 'deceased';
    data: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    type: 'marriage' | 'parent_child' | 'sibling' | 'guardianship';
    data: Record<string, any>;
  }>;
  metadata: {
    generationCount: number;
    memberCount: number;
    lastCalculated: string;
    [key: string]: any;
  };
}

/**
 * Family Reconstitution Props
 */
export interface FamilyReconstituteProps {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;

  // Kenyan Identity
  clanName: string | null;
  subClan: string | null;
  ancestralHome: string | null;
  familyTotem: string | null;
  familyHeadId: string | null;

  // Denormalized Statistics (from Prisma schema)
  memberCount: number;
  livingMemberCount: number;
  minorCount: number;
  customaryMarriageCount: number;
  polygamousMarriageCount: number;

  // Legal Status Flags
  hasCustomaryMarriage: boolean;
  hasPolygamousMarriage: boolean;

  // Visualization
  treeData: Prisma.JsonValue;

  // Lifecycle
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;

  // Member/Marriage IDs (for reconstitution)
  memberIds?: string[];
  marriageIds?: string[];
  guardianshipIds?: string[];
  relationshipIds?: string[];
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: FAMILY
// -----------------------------------------------------------------------------

/**
 * Family Aggregate Root
 *
 * Represents a Kenyan family unit with clan identity, members, marriages,
 * and relationships. Acts as consistency boundary for family-level operations.
 *
 * Legal Context:
 * - Law of Succession Act (Cap 160) - Sections 29-42 (Intestacy & Family)
 * - Matrimonial Property Act (2013) - Family property rights
 * - Children Act (2022) - Guardianship and minor protection
 * - Kenyan Customary Law - Clan system, polygamy, traditional succession
 *
 * Aggregate Responsibilities:
 * - Maintain family identity (clan, totem, ancestral home)
 * - Track family members (IDs only, not full entities)
 * - Track marriages (IDs only)
 * - Track guardianships (IDs only)
 * - Coordinate family tree visualization
 * - Enforce family-level invariants
 *
 * Does NOT Manage:
 * - Individual member details (managed by FamilyMember entity)
 * - Marriage ceremony details (managed by Marriage entity)
 * - Guardian duties (managed by Guardian entity)
 * - Relationship details (managed by FamilyRelationship entity)
 */
export class Family extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private _name: string;
  private _description: string | null;
  private readonly _creatorId: string;

  // Kenyan Clan Identity (Section 40 - Customary Law)
  private _clanName: string | null;
  private _subClan: string | null;
  private _ancestralHome: string | null;
  private _familyTotem: string | null;
  private _familyHeadId: string | null; // Reference to FamilyMember

  // Aggregate Children (IDs only for DDD consistency boundary)
  private _memberIds: Set<string>;
  private _marriageIds: Set<string>;
  private _guardianshipIds: Set<string>;
  private _relationshipIds: Set<string>;

  // Denormalized Statistics (Performance optimization - recalculated periodically)
  // These match Prisma schema fields for ORM compatibility
  private _memberCount: number;
  private _livingMemberCount: number;
  private _minorCount: number;
  private _customaryMarriageCount: number;
  private _polygamousMarriageCount: number;

  // Legal Status Flags (Denormalized for query performance)
  private _hasCustomaryMarriage: boolean;
  private _hasPolygamousMarriage: boolean;

  // Visualization Cache
  private _treeData: Prisma.JsonValue;

  // Lifecycle
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(id: string, creatorId: string, name: string, description: string | null) {
    super();

    if (!id?.trim()) throw new Error('Family ID is required');
    if (!creatorId?.trim()) throw new Error('Creator ID is required');
    if (!name?.trim()) throw new Error('Family name is required');

    this._id = id;
    this._creatorId = creatorId;
    this._name = name.trim();
    this._description = description?.trim() || null;

    // Kenyan Identity Defaults
    this._clanName = null;
    this._subClan = null;
    this._ancestralHome = null;
    this._familyTotem = null;
    this._familyHeadId = null;

    // Initialize empty sets for child IDs
    this._memberIds = new Set();
    this._marriageIds = new Set();
    this._guardianshipIds = new Set();
    this._relationshipIds = new Set();

    // Statistics Defaults
    this._memberCount = 0;
    this._livingMemberCount = 0;
    this._minorCount = 0;
    this._customaryMarriageCount = 0;
    this._polygamousMarriageCount = 0;

    // Flags
    this._hasCustomaryMarriage = false;
    this._hasPolygamousMarriage = false;

    // Visualization
    this._treeData = null;

    // Lifecycle
    this._isActive = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(id: string, creatorId: string, name: string, description?: string): Family {
    const family = new Family(id, creatorId, name, description || null);

    family.apply(
      new FamilyCreatedEvent(family._id, family._creatorId, family._name, family._createdAt),
    );

    return family;
  }

  static reconstitute(props: FamilyReconstituteProps): Family {
    const family = new Family(props.id, props.creatorId, props.name, props.description);

    // Kenyan Identity
    family._clanName = props.clanName;
    family._subClan = props.subClan;
    family._ancestralHome = props.ancestralHome;
    family._familyTotem = props.familyTotem;
    family._familyHeadId = props.familyHeadId;

    // Denormalized Statistics (from database)
    family._memberCount = props.memberCount;
    family._livingMemberCount = props.livingMemberCount;
    family._minorCount = props.minorCount;
    family._customaryMarriageCount = props.customaryMarriageCount;
    family._polygamousMarriageCount = props.polygamousMarriageCount;

    // Flags
    family._hasCustomaryMarriage = props.hasCustomaryMarriage;
    family._hasPolygamousMarriage = props.hasPolygamousMarriage;

    // Visualization
    family._treeData = props.treeData;

    // Child IDs
    family._memberIds = new Set(props.memberIds || []);
    family._marriageIds = new Set(props.marriageIds || []);
    family._guardianshipIds = new Set(props.guardianshipIds || []);
    family._relationshipIds = new Set(props.relationshipIds || []);

    // Lifecycle
    family._isActive = props.isActive;
    // Override constructor dates with persisted values
    (family as any)._createdAt = new Date(props.createdAt);
    family._updatedAt = new Date(props.updatedAt);
    family._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    return family;
  }

  // --------------------------------------------------------------------------
  // KENYAN CLAN IDENTITY MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Updates Kenyan clan identity information.
   * Reference: Customary Law - Clan system for inheritance determination.
   */
  updateClanIdentity(identity: KenyanClanIdentity): void {
    if (!identity.clanName?.trim()) {
      throw new Error('Clan name is required for Kenyan family identity');
    }

    this._clanName = identity.clanName.trim();
    this._subClan = identity.subClan?.trim() || null;
    this._ancestralHome = identity.ancestralHome?.trim() || null;
    this._familyTotem = identity.familyTotem?.trim() || null;

    this.markAsUpdated();

    this.apply(
      new FamilyIdentityUpdatedEvent(
        this._id,
        this._clanName,
        this._subClan,
        this._ancestralHome,
        this._familyTotem,
      ),
    );
  }

  /**
   * Appoints a family head (typically eldest male in Kenyan customary law).
   * Reference: Law of Succession Act, Section 40 - Customary succession.
   */
  appointFamilyHead(familyMemberId: string): void {
    if (!familyMemberId?.trim()) {
      throw new Error('Family member ID is required for head appointment');
    }

    if (!this._memberIds.has(familyMemberId)) {
      throw new Error('Cannot appoint family head: member not in this family');
    }

    const previousHeadId = this._familyHeadId;
    this._familyHeadId = familyMemberId;

    this.markAsUpdated();

    this.apply(new FamilyHeadAppointedEvent(this._id, familyMemberId, previousHeadId));
  }

  clearFamilyHead(): void {
    this._familyHeadId = null;
    this.markAsUpdated();
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT (ID Tracking Only)
  // --------------------------------------------------------------------------

  /**
   * Links a family member to this family.
   * Note: FamilyMember entity is created separately.
   * This method only tracks the relationship.
   */
  linkMember(memberId: string): void {
    if (!memberId?.trim()) {
      throw new Error('Member ID is required');
    }

    if (this._memberIds.has(memberId)) {
      return; // Idempotent
    }

    this._memberIds.add(memberId);
    this.markAsUpdated();

    this.apply(new FamilyMemberLinkedEvent(this._id, memberId));
  }

  /**
   * Removes a member from the family.
   * Note: This doesn't delete the FamilyMember entity, just unlinks it.
   */
  unlinkMember(memberId: string): void {
    if (!this._memberIds.has(memberId)) {
      throw new Error('Member not found in family');
    }

    // Prevent removing family head without clearing first
    if (this._familyHeadId === memberId) {
      throw new Error('Cannot remove family head. Clear family head appointment first.');
    }

    this._memberIds.delete(memberId);
    this.markAsUpdated();

    this.apply(new FamilyMemberRemovedEvent(this._id, memberId));
  }

  hasMember(memberId: string): boolean {
    return this._memberIds.has(memberId);
  }

  getMemberIds(): string[] {
    return Array.from(this._memberIds);
  }

  getMemberCount(): number {
    return this._memberIds.size;
  }

  // --------------------------------------------------------------------------
  // MARRIAGE TRACKING (ID Tracking Only)
  // --------------------------------------------------------------------------

  /**
   * Links a marriage to this family.
   * Note: Marriage entity is created separately.
   */
  linkMarriage(marriageId: string, isCustomary: boolean, isPolygamous: boolean): void {
    if (!marriageId?.trim()) {
      throw new Error('Marriage ID is required');
    }

    if (this._marriageIds.has(marriageId)) {
      return; // Idempotent
    }

    this._marriageIds.add(marriageId);

    // Update flags (these are denormalized for performance)
    if (isCustomary) {
      this._hasCustomaryMarriage = true;
    }

    if (isPolygamous) {
      this._hasPolygamousMarriage = true;
    }

    this.markAsUpdated();
  }

  unlinkMarriage(marriageId: string): void {
    this._marriageIds.delete(marriageId);
    this.markAsUpdated();
  }

  getMarriageIds(): string[] {
    return Array.from(this._marriageIds);
  }

  getMarriageCount(): number {
    return this._marriageIds.size;
  }

  // --------------------------------------------------------------------------
  // GUARDIANSHIP TRACKING (ID Tracking Only)
  // --------------------------------------------------------------------------

  /**
   * Links a guardianship to this family.
   * Note: Guardian entity is created separately.
   */
  linkGuardianship(guardianshipId: string): void {
    if (!guardianshipId?.trim()) {
      throw new Error('Guardianship ID is required');
    }

    if (this._guardianshipIds.has(guardianshipId)) {
      return; // Idempotent
    }

    this._guardianshipIds.add(guardianshipId);
    this.markAsUpdated();
  }

  unlinkGuardianship(guardianshipId: string): void {
    this._guardianshipIds.delete(guardianshipId);
    this.markAsUpdated();
  }

  getGuardianshipIds(): string[] {
    return Array.from(this._guardianshipIds);
  }

  // --------------------------------------------------------------------------
  // RELATIONSHIP TRACKING (ID Tracking Only)
  // --------------------------------------------------------------------------

  /**
   * Links a family relationship to this family.
   * Note: FamilyRelationship entity is created separately.
   */
  linkRelationship(relationshipId: string): void {
    if (!relationshipId?.trim()) {
      throw new Error('Relationship ID is required');
    }

    if (this._relationshipIds.has(relationshipId)) {
      return; // Idempotent
    }

    this._relationshipIds.add(relationshipId);
    this.markAsUpdated();
  }

  unlinkRelationship(relationshipId: string): void {
    this._relationshipIds.delete(relationshipId);
    this.markAsUpdated();
  }

  getRelationshipIds(): string[] {
    return Array.from(this._relationshipIds);
  }

  // --------------------------------------------------------------------------
  // STATISTICS MANAGEMENT (Denormalized for Performance)
  // --------------------------------------------------------------------------

  /**
   * Updates denormalized statistics.
   * Called by application service after calculating from actual entities.
   */
  updateStatistics(stats: {
    memberCount: number;
    livingMemberCount: number;
    minorCount: number;
    customaryMarriageCount: number;
    polygamousMarriageCount: number;
  }): void {
    this._memberCount = stats.memberCount;
    this._livingMemberCount = stats.livingMemberCount;
    this._minorCount = stats.minorCount;
    this._customaryMarriageCount = stats.customaryMarriageCount;
    this._polygamousMarriageCount = stats.polygamousMarriageCount;

    this.markAsUpdated();
  }

  /**
   * Returns current statistics.
   * Note: These may be stale. Application service should recalculate periodically.
   */
  getStatistics(): FamilyStatistics {
    return {
      totalMembers: this._memberCount,
      livingMembers: this._livingMemberCount,
      deceasedMembers: this._memberCount - this._livingMemberCount,
      minors: this._minorCount,
      adults: this._livingMemberCount - this._minorCount,
      customaryMarriages: this._customaryMarriageCount,
      polygamousMarriages: this._polygamousMarriageCount,
    };
  }

  // --------------------------------------------------------------------------
  // FAMILY TREE VISUALIZATION
  // --------------------------------------------------------------------------

  /**
   * Updates cached family tree visualization data.
   * Called after tree recalculation at application service level.
   */
  updateTreeVisualization(data: TreeVisualizationData): void {
    this._treeData = data as Prisma.JsonValue;
    this.markAsUpdated();

    this.apply(new FamilyTreeVisualizationUpdatedEvent(this._id, new Date()));
  }

  getTreeVisualization(): Prisma.JsonValue {
    return this._treeData;
  }

  hasTreeVisualization(): boolean {
    return this._treeData !== null;
  }

  // --------------------------------------------------------------------------
  // VALIDATION & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Validates family readiness for succession planning.
   * Note: This is aggregate-level validation. Detailed validation requires loading entities.
   */
  validateForSuccession(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this._memberIds.size === 0) {
      issues.push('Family must have at least one member for succession planning');
    }

    if (this._livingMemberCount === 0) {
      issues.push(
        'No living family members. Estate must be administered by Public Trustee (Section 42)',
      );
    }

    if (this._minorCount > 0 && this._guardianshipIds.size === 0) {
      issues.push('Minors present but no guardians appointed (Children Act, 2022)');
    }

    if (this._hasPolygamousMarriage && this._customaryMarriageCount === 0) {
      issues.push('Polygamous marriage detected but no customary marriage registered (Section 40)');
    }

    if (!this._clanName) {
      issues.push('Clan name not set (required for customary succession under Section 40)');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Archives the family (soft delete).
   */
  archive(archivedBy: string): void {
    if (!this._isActive) {
      return; // Idempotent
    }

    this._isActive = false;
    this._deletedAt = new Date();
    this.markAsUpdated();

    this.apply(new FamilyArchivedEvent(this._id, archivedBy, this._deletedAt));
  }

  /**
   * Restores an archived family.
   */
  restore(restoredBy: string): void {
    if (this._isActive) {
      return; // Idempotent
    }

    this._isActive = true;
    this._deletedAt = null;
    this.markAsUpdated();

    this.apply(new FamilyRestoredEvent(this._id, restoredBy, new Date()));
  }

  isArchived(): boolean {
    return !this._isActive;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get creatorId(): string {
    return this._creatorId;
  }

  get clanName(): string | null {
    return this._clanName;
  }

  get subClan(): string | null {
    return this._subClan;
  }

  get ancestralHome(): string | null {
    return this._ancestralHome;
  }

  get familyTotem(): string | null {
    return this._familyTotem;
  }

  get familyHeadId(): string | null {
    return this._familyHeadId;
  }

  get hasCustomaryMarriage(): boolean {
    return this._hasCustomaryMarriage;
  }

  get hasPolygamousMarriage(): boolean {
    return this._hasPolygamousMarriage;
  }

  get memberCount(): number {
    return this._memberCount;
  }

  get livingMemberCount(): number {
    return this._livingMemberCount;
  }

  get minorCount(): number {
    return this._minorCount;
  }

  get customaryMarriageCount(): number {
    return this._customaryMarriageCount;
  }

  get polygamousMarriageCount(): number {
    return this._polygamousMarriageCount;
  }

  get treeData(): Prisma.JsonValue {
    return this._treeData;
  }

  get isActive(): boolean {
    return this._isActive;
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
