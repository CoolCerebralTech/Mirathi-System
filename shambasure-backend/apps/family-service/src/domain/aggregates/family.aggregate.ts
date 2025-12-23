// domain/aggregates/family.aggregate.ts
import { KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AdoptionOrder } from '../entities/adoption-order.entity';
import { CohabitationRecord } from '../entities/cohabitation-record.entity';
// Entities
import { FamilyMember } from '../entities/family-member.entity';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { Marriage } from '../entities/marriage.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';
// Exceptions
import {
  InvalidFamilyMemberException,
  InvalidMarriageException,
  InvalidPolygamousStructureException,
  KenyanLawViolationException,
} from '../exceptions/family.exception';

/**
 * Family Aggregate Props (Immutable)
 *
 * Design: Aggregate Root that orchestrates all family-related entities
 * - FamilyMembers (individuals)
 * - Marriages (legal unions)
 * - PolygamousHouses (S. 40 LSA structures)
 * - FamilyRelationships (kinship graph)
 * - CohabitationRecords (S. 29(5) partnerships)
 * - AdoptionOrders (legal adoptions)
 *
 * Kenyan Law Context:
 * - S. 35 LSA: Intestate succession calculations
 * - S. 40 LSA: Polygamous distribution
 * - S. 29 LSA: Dependant qualification
 * - Marriage Act 2014: Marriage validation
 * - Children Act 2022: Adoption rights
 */
export interface FamilyProps {
  // Core Identity
  name: string;
  description?: string;
  creatorId: UniqueEntityID;

  // Kenyan Cultural Identity
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: PrismaKenyanCounty;

  // Entity Collections (stored as IDs, loaded separately)
  memberIds: Set<UniqueEntityID>;
  marriageIds: Set<UniqueEntityID>;
  polygamousHouseIds: Set<UniqueEntityID>;
  relationshipIds: Set<UniqueEntityID>;
  cohabitationRecordIds: Set<UniqueEntityID>;
  adoptionOrderIds: Set<UniqueEntityID>;

  // Performance Counters (Denormalized for queries)
  counters: FamilyCounters;

  // S. 40 Polygamy Status
  polygamyStatus: PolygamyStatus;

  // Archival
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: UniqueEntityID;
  archivalReason?: string;
}

/**
 * Family Counters (Denormalized)
 * Updated via event handlers for performance
 */
export interface FamilyCounters {
  memberCount: number;
  livingMemberCount: number;
  deceasedMemberCount: number;
  minorCount: number;
  dependantCount: number; // S. 29 LSA potential dependants
  marriageCount: number;
  activeMarriageCount: number;
  relationshipCount: number;
  cohabitationCount: number;
  adoptionCount: number;
}

/**
 * Polygamy Status (S. 40 LSA)
 */
export interface PolygamyStatus {
  isPolygamous: boolean;
  houseCount: number;
  isS40Compliant: boolean;
  complianceIssues: string[];
}

/**
 * Factory Props
 */
export interface CreateFamilyProps {
  name: string;
  creatorId: string;
  description?: string;
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: PrismaKenyanCounty;
}

/**
 * Family Aggregate Root
 *
 * Orchestrates all family-related entities and enforces business rules.
 *
 * Responsibilities:
 * 1. Coordinate entity lifecycles (add/remove members, marriages, etc.)
 * 2. Enforce invariants across entities (marriage eligibility, S. 40 compliance)
 * 3. Emit domain events for state changes
 * 4. Calculate succession distributions (S. 35/36/40 LSA)
 * 5. Manage kinship graph (relationships, next-of-kin)
 *
 * Kenyan Law Enforcement:
 * - Marriage Act 2014: Marriage type validation
 * - S. 40 LSA: Polygamous house compliance
 * - S. 35/36 LSA: Intestate succession rules
 * - S. 29 LSA: Dependant qualification
 * - Children Act 2022: Adoption validation
 */
export class Family extends AggregateRoot<FamilyProps> {
  private constructor(id: UniqueEntityID, props: FamilyProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  public static create(props: CreateFamilyProps): Family {
    const id = new UniqueEntityID();
    const now = new Date();

    const familyProps: FamilyProps = {
      name: props.name.trim(),
      description: props.description?.trim(),
      creatorId: new UniqueEntityID(props.creatorId),

      // Cultural Identity
      clanName: props.clanName?.trim(),
      subClan: props.subClan?.trim(),
      ancestralHome: props.ancestralHome?.trim(),
      familyTotem: props.familyTotem?.trim(),
      homeCounty: props.homeCounty,

      // Empty collections
      memberIds: new Set(),
      marriageIds: new Set(),
      polygamousHouseIds: new Set(),
      relationshipIds: new Set(),
      cohabitationRecordIds: new Set(),
      adoptionOrderIds: new Set(),

      // Zero counters
      counters: {
        memberCount: 0,
        livingMemberCount: 0,
        deceasedMemberCount: 0,
        minorCount: 0,
        dependantCount: 0,
        marriageCount: 0,
        activeMarriageCount: 0,
        relationshipCount: 0,
        cohabitationCount: 0,
        adoptionCount: 0,
      },

      // Polygamy status
      polygamyStatus: {
        isPolygamous: false,
        houseCount: 0,
        isS40Compliant: true,
        complianceIssues: [],
      },

      // Not archived
      isArchived: false,
    };

    return new Family(id, familyProps, now);
  }

  public static fromPersistence(
    id: string,
    props: FamilyProps,
    createdAt: Date,
    updatedAt?: Date,
    version?: number,
    lastEventId?: string,
  ): Family {
    const entityId = new UniqueEntityID(id);
    const family = new Family(entityId, props, createdAt);

    if (updatedAt) {
      (family as any)._updatedAt = updatedAt;
    }

    if (version) {
      (family as any)._version = version;
    }

    if (lastEventId) {
      (family as any)._lastEventId = lastEventId;
    }

    return family;
  }

  // =========================================================================
  // VALIDATION (Invariants)
  // =========================================================================

  public validate(): void {
    // Core identity
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new InvalidFamilyMemberException('Family name is required');
    }

    if (!this.props.creatorId) {
      throw new InvalidFamilyMemberException('Creator ID is required');
    }

    // Counter consistency
    const counters = this.props.counters;

    if (counters.memberCount !== counters.livingMemberCount + counters.deceasedMemberCount) {
      console.warn(
        `Family ${this._id.toString()}: Member count mismatch. ` +
          `Total: ${counters.memberCount}, Living: ${counters.livingMemberCount}, ` +
          `Deceased: ${counters.deceasedMemberCount}`,
      );
    }

    if (counters.minorCount > counters.livingMemberCount) {
      throw new InvalidFamilyMemberException('Minor count cannot exceed living member count');
    }

    if (counters.dependantCount > counters.livingMemberCount) {
      throw new InvalidFamilyMemberException('Dependant count cannot exceed living member count');
    }

    // Polygamy consistency
    if (this.props.polygamyStatus.isPolygamous && this.props.polygamyStatus.houseCount === 0) {
      console.warn(`Family ${this._id.toString()}: Marked as polygamous but has no houses`);
    }

    // Archival consistency
    if (this.props.isArchived && !this.props.archivedAt) {
      throw new InvalidFamilyMemberException('Archived family must have archival timestamp');
    }
  }

  // =========================================================================
  // BASIC INFO MANAGEMENT
  // =========================================================================

  public updateBasicInfo(params: {
    name?: string;
    description?: string;
    clanName?: string;
    subClan?: string;
    ancestralHome?: string;
    familyTotem?: string;
    homeCounty?: PrismaKenyanCounty;
  }): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const newProps: FamilyProps = {
      ...this.props,
      name: params.name?.trim() || this.props.name,
      description: params.description?.trim() ?? this.props.description,
      clanName: params.clanName?.trim() ?? this.props.clanName,
      subClan: params.subClan?.trim() ?? this.props.subClan,
      ancestralHome: params.ancestralHome?.trim() ?? this.props.ancestralHome,
      familyTotem: params.familyTotem?.trim() ?? this.props.familyTotem,
      homeCounty: params.homeCounty ?? this.props.homeCounty,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // MEMBER MANAGEMENT
  // =========================================================================

  public addMember(member: FamilyMember): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate member belongs to this family
    if (!member.familyId.equals(this._id)) {
      throw new InvalidFamilyMemberException(
        `Member belongs to family ${member.familyId.toString()}, not ${this._id.toString()}`,
      );
    }

    // Idempotency check
    const memberId = new UniqueEntityID(member.id.toString());
    if (this.props.memberIds.has(memberId)) {
      return this;
    }

    // Kenyan Legal Warning: Adult without verified ID
    if (!member.isMinor && !member.isIdentityVerified && !member.isDeceased) {
      console.warn(
        `Adult member ${member.id.toString()} added without verified National ID. ` +
          `May cause issues with S. 35/36 LSA succession distribution.`,
      );
    }

    // Update counters
    const newCounters = { ...this.props.counters };
    newCounters.memberCount++;

    if (member.isDeceased) {
      newCounters.deceasedMemberCount++;
    } else {
      newCounters.livingMemberCount++;

      if (member.isMinor) {
        newCounters.minorCount++;
      }

      if (member.isPotentialDependant) {
        newCounters.dependantCount++;
      }
    }

    // Create new props
    const newMemberIds = new Set(this.props.memberIds);
    newMemberIds.add(memberId);

    const newProps: FamilyProps = {
      ...this.props,
      memberIds: newMemberIds,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  public removeMember(memberId: string): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const memberEntityId = new UniqueEntityID(memberId);

    // Idempotency check
    if (!this.props.memberIds.has(memberEntityId)) {
      return this;
    }

    // Check if member is referenced in marriages
    // Note: In production, this would query loaded marriages
    console.warn(
      `Removing member ${memberId}. Ensure marriages, relationships, and ` +
        `adoptions are handled separately.`,
    );

    // Remove from collections
    const newMemberIds = new Set(this.props.memberIds);
    newMemberIds.delete(memberEntityId);

    // Note: Counter adjustments require full member data
    // In production, this method would receive the full member entity
    const newCounters = { ...this.props.counters };
    newCounters.memberCount--;

    const newProps: FamilyProps = {
      ...this.props,
      memberIds: newMemberIds,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  public recalculateCounters(members: FamilyMember[], marriages: Marriage[]): Family {
    this.ensureNotDeleted();

    const newCounters: FamilyCounters = {
      memberCount: members.length,
      livingMemberCount: 0,
      deceasedMemberCount: 0,
      minorCount: 0,
      dependantCount: 0,
      marriageCount: marriages.length,
      activeMarriageCount: 0,
      relationshipCount: this.props.counters.relationshipCount,
      cohabitationCount: this.props.counters.cohabitationCount,
      adoptionCount: this.props.counters.adoptionCount,
    };

    // Calculate member counters
    members.forEach((member) => {
      if (member.isDeceased) {
        newCounters.deceasedMemberCount++;
      } else {
        newCounters.livingMemberCount++;

        if (member.isMinor) {
          newCounters.minorCount++;
        }

        if (member.isPotentialDependant) {
          newCounters.dependantCount++;
        }
      }
    });

    // Calculate marriage counters
    marriages.forEach((marriage) => {
      if (marriage.isActive) {
        newCounters.activeMarriageCount++;
      }
    });

    const newProps: FamilyProps = {
      ...this.props,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // MARRIAGE MANAGEMENT
  // =========================================================================

  public addMarriage(marriage: Marriage, members: FamilyMember[]): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate marriage belongs to this family
    if (!marriage.familyId.equals(this._id)) {
      throw new InvalidMarriageException('Marriage does not belong to this family');
    }

    // Idempotency
    const marriageId = new UniqueEntityID(marriage.id.toString());
    if (this.props.marriageIds.has(marriageId)) {
      return this;
    }

    // Validate spouses exist in family
    const spouse1Exists = members.some((m) => m.id.equals(marriage.spouse1Id));
    const spouse2Exists = members.some((m) => m.id.equals(marriage.spouse2Id));

    if (!spouse1Exists || !spouse2Exists) {
      throw new InvalidMarriageException(
        'Both spouses must be members of the family before registering marriage',
      );
    }

    // Validate marriage eligibility
    this.validateMarriageEligibility(marriage, members);

    // Update collections
    const newMarriageIds = new Set(this.props.marriageIds);
    newMarriageIds.add(marriageId);

    // Update counters
    const newCounters = { ...this.props.counters };
    newCounters.marriageCount++;
    if (marriage.isActive) {
      newCounters.activeMarriageCount++;
    }

    // Update polygamy status if applicable
    const newPolygamyStatus = { ...this.props.polygamyStatus };
    if (marriage.isPolygamousUnderS40) {
      newPolygamyStatus.isPolygamous = true;
    }

    const newProps: FamilyProps = {
      ...this.props,
      marriageIds: newMarriageIds,
      counters: newCounters,
      polygamyStatus: newPolygamyStatus,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  private validateMarriageEligibility(marriage: Marriage, members: FamilyMember[]): void {
    // Find spouses
    const spouse1 = members.find((m) => m.id.equals(marriage.spouse1Id));
    const spouse2 = members.find((m) => m.id.equals(marriage.spouse2Id));

    if (!spouse1 || !spouse2) {
      throw new InvalidMarriageException('Spouse not found in family members');
    }

    // Both must be alive
    if (spouse1.isDeceased || spouse2.isDeceased) {
      throw new InvalidMarriageException('Cannot marry deceased person');
    }

    // Both must be adults (18+)
    if (spouse1.isMinor || spouse2.isMinor) {
      throw new KenyanLawViolationException(
        'Marriage Act 2014, Sec 4(1)',
        'Both parties must be at least 18 years old to marry',
      );
    }

    // Cannot marry self
    if (marriage.spouse1Id.equals(marriage.spouse2Id)) {
      throw new InvalidMarriageException('Cannot marry oneself');
    }

    // Marriage date cannot be future
    if (marriage.dates.marriageDate > new Date()) {
      throw new InvalidMarriageException('Marriage date cannot be in the future');
    }

    // S. 40 LSA: Polygamous marriages require certification
    if (marriage.isPolygamousUnderS40 && !marriage.s40CertificateNumber) {
      console.warn(
        'Polygamous marriage registered without S. 40 certificate. ' +
          'May face legal challenges in succession proceedings.',
      );
    }

    // Islamic marriage requires nikah
    if (marriage.isIslamic && !marriage.islamicMarriage) {
      throw new KenyanLawViolationException(
        'Marriage Act 2014, Sec 45-56',
        'Islamic marriage requires nikah details',
      );
    }

    // Customary marriage warnings
    if (marriage.isCustomary && !marriage.customaryMarriage) {
      console.warn('Customary marriage registered without customary details');
    }
  }

  // =========================================================================
  // POLYGAMOUS HOUSE MANAGEMENT (S. 40 LSA)
  // =========================================================================

  public addPolygamousHouse(house: PolygamousHouse, members: FamilyMember[]): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate house belongs to this family
    if (!house.familyId.equals(this._id)) {
      throw new InvalidPolygamousStructureException('House does not belong to this family');
    }

    // Idempotency
    const houseId = new UniqueEntityID(house.id.toString());
    if (this.props.polygamousHouseIds.has(houseId)) {
      return this;
    }

    // Validate house head exists
    if (house.houseHeadId) {
      const houseHeadExists = members.some((m) => m.id.equals(house.houseHeadId));
      if (!houseHeadExists) {
        throw new InvalidPolygamousStructureException('House head must be a family member');
      }
    }

    // S. 40 LSA: Subsequent houses require wives' consent
    if (house.houseOrder > 1 && !house.wivesConsentObtained) {
      throw new KenyanLawViolationException(
        'S. 40 LSA',
        'Subsequent polygamous houses require documented consent from all existing wives',
      );
    }

    // Update collections
    const newHouseIds = new Set(this.props.polygamousHouseIds);
    newHouseIds.add(houseId);

    // Update polygamy status
    const newPolygamyStatus: PolygamyStatus = {
      isPolygamous: true,
      houseCount: this.props.polygamyStatus.houseCount + 1,
      isS40Compliant: this.calculateS40Compliance(newHouseIds, [house]),
      complianceIssues: this.getS40ComplianceIssues([house]),
    };

    const newProps: FamilyProps = {
      ...this.props,
      polygamousHouseIds: newHouseIds,
      polygamyStatus: newPolygamyStatus,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  private calculateS40Compliance(
    houseIds: Set<UniqueEntityID>,
    houses: PolygamousHouse[],
  ): boolean {
    // If not polygamous, automatically compliant
    if (houseIds.size === 0) return true;

    // All subsequent houses must be certified
    const subsequentHouses = houses.filter((h) => h.houseOrder > 1);
    return subsequentHouses.every((h) => h.isCertifiedS40);
  }

  private getS40ComplianceIssues(houses: PolygamousHouse[]): string[] {
    const issues: string[] = [];

    houses.forEach((house) => {
      if (house.houseOrder > 1) {
        if (!house.wivesConsentObtained) {
          issues.push(`House ${house.houseOrder}: Missing wives' consent`);
        }

        if (!house.isCertifiedS40) {
          issues.push(`House ${house.houseOrder}: Not certified under S. 40 LSA`);
        }
      }
    });

    return issues;
  }

  // =========================================================================
  // RELATIONSHIP MANAGEMENT
  // =========================================================================

  public addRelationship(relationship: FamilyRelationship): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate relationship belongs to this family
    if (!relationship.familyId.equals(this._id)) {
      throw new InvalidFamilyMemberException('Relationship does not belong to this family');
    }

    // Validate both members exist
    if (
      !this.props.memberIds.has(relationship.fromMemberId) ||
      !this.props.memberIds.has(relationship.toMemberId)
    ) {
      throw new InvalidFamilyMemberException(
        'Both members must exist in family before establishing relationship',
      );
    }

    // Idempotency
    const relationshipId = new UniqueEntityID(relationship.id.toString());
    if (this.props.relationshipIds.has(relationshipId)) {
      return this;
    }

    // Update collections
    const newRelationshipIds = new Set(this.props.relationshipIds);
    newRelationshipIds.add(relationshipId);

    // Update counters
    const newCounters = { ...this.props.counters };
    newCounters.relationshipCount++;

    const newProps: FamilyProps = {
      ...this.props,
      relationshipIds: newRelationshipIds,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // COHABITATION MANAGEMENT (S. 29(5) LSA)
  // =========================================================================

  public addCohabitationRecord(record: CohabitationRecord): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate record belongs to this family
    if (!record.familyId.equals(this._id)) {
      throw new InvalidFamilyMemberException('Cohabitation record does not belong to this family');
    }

    // Validate both partners exist
    if (
      !this.props.memberIds.has(record.partner1Id) ||
      !this.props.memberIds.has(record.partner2Id)
    ) {
      throw new InvalidFamilyMemberException(
        'Both partners must exist in family before recording cohabitation',
      );
    }

    // Idempotency
    const recordId = new UniqueEntityID(record.id.toString());
    if (this.props.cohabitationRecordIds.has(recordId)) {
      return this;
    }

    // Update collections
    const newRecordIds = new Set(this.props.cohabitationRecordIds);
    newRecordIds.add(recordId);

    // Update counters
    const newCounters = { ...this.props.counters };
    newCounters.cohabitationCount++;

    // Update dependant count if qualifies for S. 29(5)
    if (record.qualifiesForDependantClaim) {
      newCounters.dependantCount++;
    }

    const newProps: FamilyProps = {
      ...this.props,
      cohabitationRecordIds: newRecordIds,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // ADOPTION MANAGEMENT
  // =========================================================================

  public addAdoptionOrder(order: AdoptionOrder): Family {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Validate order belongs to this family
    if (!order.familyId.equals(this._id)) {
      throw new InvalidFamilyMemberException('Adoption order does not belong to this family');
    }

    // Validate adoptee and adopter exist
    if (!this.props.memberIds.has(order.adopteeId) || !this.props.memberIds.has(order.adopterId)) {
      throw new InvalidFamilyMemberException(
        'Both adoptee and adopter must exist in family before recording adoption',
      );
    }

    // Idempotency
    const orderId = new UniqueEntityID(order.id.toString());
    if (this.props.adoptionOrderIds.has(orderId)) {
      return this;
    }

    // Update collections
    const newOrderIds = new Set(this.props.adoptionOrderIds);
    newOrderIds.add(orderId);

    // Update counters
    const newCounters = { ...this.props.counters };
    newCounters.adoptionCount++;

    const newProps: FamilyProps = {
      ...this.props,
      adoptionOrderIds: newOrderIds,
      counters: newCounters,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // ARCHIVAL
  // =========================================================================

  public archive(reason: string, archivedBy: string): Family {
    this.ensureNotDeleted();

    if (this.props.isArchived) {
      throw new InvalidFamilyMemberException('Family is already archived');
    }

    if (this.props.counters.livingMemberCount > 0) {
      throw new InvalidFamilyMemberException('Cannot archive family with living members');
    }

    const newProps: FamilyProps = {
      ...this.props,
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: new UniqueEntityID(archivedBy),
      archivalReason: reason,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  public unarchive(): Family {
    this.ensureNotDeleted();

    if (!this.props.isArchived) {
      throw new InvalidFamilyMemberException('Family is not archived');
    }

    const newProps: FamilyProps = {
      ...this.props,
      isArchived: false,
      archivedAt: undefined,
      archivedBy: undefined,
      archivalReason: undefined,
    };

    return new Family(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GUARDS
  // =========================================================================

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new InvalidFamilyMemberException(
        `Cannot modify archived family [${this._id.toString()}]`,
      );
    }
  }

  // =========================================================================
  // EVENT SOURCING (Required by AggregateRoot)
  // =========================================================================

  protected applyEvent(event: DomainEvent): void {
    // Event replay logic for event sourcing
    // In production, implement specific event handlers
    console.log(`Applying event: ${event.getEventType()}`);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get creatorId(): UniqueEntityID {
    return this.props.creatorId;
  }

  get clanName(): string | undefined {
    return this.props.clanName;
  }

  get homeCounty(): PrismaKenyanCounty | undefined {
    return this.props.homeCounty;
  }

  get counters(): Readonly<FamilyCounters> {
    return Object.freeze({ ...this.props.counters });
  }

  get polygamyStatus(): Readonly<PolygamyStatus> {
    return Object.freeze({ ...this.props.polygamyStatus });
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get memberIds(): UniqueEntityID[] {
    return Array.from(this.props.memberIds);
  }

  get marriageIds(): UniqueEntityID[] {
    return Array.from(this.props.marriageIds);
  }

  get polygamousHouseIds(): UniqueEntityID[] {
    return Array.from(this.props.polygamousHouseIds);
  }

  get relationshipIds(): UniqueEntityID[] {
    return Array.from(this.props.relationshipIds);
  }

  get cohabitationRecordIds(): UniqueEntityID[] {
    return Array.from(this.props.cohabitationRecordIds);
  }

  get adoptionOrderIds(): UniqueEntityID[] {
    return Array.from(this.props.adoptionOrderIds);
  }

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  get hasLivingMembers(): boolean {
    return this.props.counters.livingMemberCount > 0;
  }

  get hasDeceasedMembers(): boolean {
    return this.props.counters.deceasedMemberCount > 0;
  }

  get hasMinors(): boolean {
    return this.props.counters.minorCount > 0;
  }

  get hasPotentialDependants(): boolean {
    return this.props.counters.dependantCount > 0;
  }

  get isPolygamous(): boolean {
    return this.props.polygamyStatus.isPolygamous;
  }

  get isS40Compliant(): boolean {
    return this.props.polygamyStatus.isS40Compliant;
  }

  get s40ComplianceIssues(): string[] {
    return [...this.props.polygamyStatus.complianceIssues];
  }

  get isActive(): boolean {
    return !this.props.isArchived && this.hasLivingMembers;
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      name: this.props.name,
      description: this.props.description,
      creatorId: this.props.creatorId.toString(),
      clanName: this.props.clanName,
      subClan: this.props.subClan,
      ancestralHome: this.props.ancestralHome,
      familyTotem: this.props.familyTotem,
      homeCounty: this.props.homeCounty,

      // Counters
      counters: this.props.counters,

      // Polygamy
      polygamyStatus: this.props.polygamyStatus,

      // Collections (as string arrays)
      memberIds: Array.from(this.props.memberIds).map((id) => id.toString()),
      marriageIds: Array.from(this.props.marriageIds).map((id) => id.toString()),
      polygamousHouseIds: Array.from(this.props.polygamousHouseIds).map((id) => id.toString()),
      relationshipIds: Array.from(this.props.relationshipIds).map((id) => id.toString()),
      cohabitationRecordIds: Array.from(this.props.cohabitationRecordIds).map((id) =>
        id.toString(),
      ),
      adoptionOrderIds: Array.from(this.props.adoptionOrderIds).map((id) => id.toString()),

      // Archival
      isArchived: this.props.isArchived,
      archivedAt: this.props.archivedAt,
      archivedBy: this.props.archivedBy?.toString(),
      archivalReason: this.props.archivalReason,

      // Computed
      hasLivingMembers: this.hasLivingMembers,
      hasDeceasedMembers: this.hasDeceasedMembers,
      hasMinors: this.hasMinors,
      hasPotentialDependants: this.hasPotentialDependants,
      isPolygamous: this.isPolygamous,
      isS40Compliant: this.isS40Compliant,
      s40ComplianceIssues: this.s40ComplianceIssues,
      isActive: this.isActive,

      // Audit
      version: this._version,
      lastEventId: this._lastEventId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
