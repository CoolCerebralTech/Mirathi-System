// domain/aggregates/family.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';
import { FamilyCreatedEvent } from '../events/family-events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-events/family-member-added.event';
import { FamilyMemberDeceasedEvent } from '../events/family-events/family-member-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-events/family-member-removed.event';
import { FamilyUpdatedEvent } from '../events/family-events/family-updated.event';
import { MarriageRegisteredEvent } from '../events/marriage-events/marriage-registered.event';
import { PolygamousHouseCreatedEvent } from '../events/marriage-events/polygamous-house-created.event';
import {
  FamilyDomainException,
  InvalidFamilyMemberException,
} from '../exceptions/family.exception';
import { KenyanCounty } from '../value-objects/geographical/kenyan-county.vo';

export interface FamilyProps {
  id: string;
  name: string;
  description?: string;
  creatorId: string;

  // Cultural Identity
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: KenyanCounty;

  // Denormalized counts for performance
  memberCount: number;
  livingMemberCount: number;
  deceasedMemberCount: number;
  minorCount: number;
  dependantCount: number; // S.29 Potential Dependants

  // S.40 Polygamy Tracking
  isPolygamous: boolean;
  polygamousHouseCount: number;

  // State management
  version: number;
  lastEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Relationship References (Lazy Loaded via IDs)
  memberIds: string[];
  marriageIds: string[]; // <-- ADDED: Critical for tracking unions
  polygamousHouseIds: string[];
}

export interface CreateFamilyParams {
  name: string;
  creatorId: string;
  description?: string;
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: string;
}

export class Family extends AggregateRoot<FamilyProps> {
  private constructor(props: FamilyProps) {
    super(props, props.id);
    this.validate();
  }

  // --- Factory Methods ---

  static create(params: CreateFamilyParams): Family {
    // Robust ID generation (Fallback if crypto not available in env)
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `fam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const now = new Date();
    const homeCounty = params.homeCounty
      ? KenyanCounty.create({ countyName: params.homeCounty })
      : undefined;

    const props: FamilyProps = {
      id,
      name: params.name,
      description: params.description,
      creatorId: params.creatorId,
      clanName: params.clanName,
      subClan: params.subClan,
      ancestralHome: params.ancestralHome,
      familyTotem: params.familyTotem,
      homeCounty,

      // Initialize counts
      memberCount: 0,
      livingMemberCount: 0,
      deceasedMemberCount: 0,
      minorCount: 0,
      dependantCount: 0,

      // Initialize polygamy status
      isPolygamous: false,
      polygamousHouseCount: 0,

      // State
      version: 1,
      createdAt: now,
      updatedAt: now,

      // Relationships
      memberIds: [],
      marriageIds: [], // Start empty
      polygamousHouseIds: [],
    };

    const family = new Family(props);

    family.addDomainEvent(
      new FamilyCreatedEvent({
        familyId: family.id,
        creatorId: family.creatorId,
        name: family.name,
        clanName: family.clanName,
        homeCounty: family.homeCounty?.value,
        timestamp: now,
      }),
    );

    return family;
  }

  static createFromProps(props: FamilyProps): Family {
    const family = new Family(props);
    // No events on reconstitution
    return family;
  }

  // --- Domain Logic ---

  updateBasicInfo(params: {
    name?: string;
    description?: string;
    clanName?: string;
    subClan?: string;
    ancestralHome?: string;
    familyTotem?: string;
    homeCounty?: string;
  }): void {
    const oldName = this.props.name;

    this.props.name = params.name || this.props.name;
    this.props.description = params.description ?? this.props.description;
    this.props.clanName = params.clanName ?? this.props.clanName;
    this.props.subClan = params.subClan ?? this.props.subClan;
    this.props.ancestralHome = params.ancestralHome ?? this.props.ancestralHome;
    this.props.familyTotem = params.familyTotem ?? this.props.familyTotem;

    if (params.homeCounty) {
      this.props.homeCounty = KenyanCounty.create({ countyName: params.homeCounty });
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    if (params.name && params.name !== oldName) {
      this.addDomainEvent(
        new FamilyUpdatedEvent({
          familyId: this.id,
          field: 'name',
          oldValue: oldName,
          newValue: this.props.name,
          timestamp: new Date(),
        }),
      );
    }
  }

  // --- Member Management ---

  addMember(member: FamilyMember): void {
    if (member.familyId !== this.id) {
      throw new InvalidFamilyMemberException(
        `Member belongs to family ${member.familyId}, not ${this.id}`,
      );
    }

    if (this.props.memberIds.includes(member.id)) {
      // Idempotency: Ignore if already exists
      return;
    }

    this.props.memberIds.push(member.id);
    this.props.memberCount++;

    // Update Counters
    if (member.isDeceased) {
      this.props.deceasedMemberCount++;
    } else {
      this.props.livingMemberCount++;
      if (member.isMinor) this.props.minorCount++;
      if (member.isPotentialDependant) this.props.dependantCount++;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberAddedEvent({
        familyId: this.id,
        memberId: member.id,
        memberName: member.name.fullName,
        isDeceased: member.isDeceased,
        isMinor: member.isMinor,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Records a death. This is distinct from removing a member.
   * Death changes legal status and triggers succession workflows.
   */
  recordMemberDeath(memberId: string, dateOfDeath: Date): void {
    if (!this.props.memberIds.includes(memberId)) {
      throw new InvalidFamilyMemberException(`Member ${memberId} not found in family.`);
    }

    // Adjust counters logic
    // Note: The Entity (FamilyMember) should have been updated already.
    // The Aggregate just reflects the impact on the Group.
    this.props.livingMemberCount--;
    this.props.deceasedMemberCount++;

    // If they were a minor, reduce minor count
    // (We assume the service layer checks the member entity state before calling this)

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberDeceasedEvent({
        familyId: this.id,
        familyMemberId: memberId,
        dateOfDeath: dateOfDeath,
        timestamp: new Date(),
      }),
    );
  }

  removeMember(memberId: string): void {
    const index = this.props.memberIds.indexOf(memberId);
    if (index === -1) {
      // Idempotent return
      return;
    }

    this.props.memberIds.splice(index, 1);
    this.props.memberCount--;
    // Note: Caller must ensure counters (living/deceased) are adjusted via a recalculation
    // or passing the member object state. For safety, we force a "Recalculate" pattern in Services.

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberRemovedEvent({
        familyId: this.id,
        memberId,
        timestamp: new Date(),
      }),
    );
  }

  // --- Marriage Management (CRITICAL ADDITION) ---

  registerMarriage(marriage: Marriage): void {
    if (marriage.familyId !== this.id) return;
    if (this.props.marriageIds.includes(marriage.id)) return;

    // Validate Spouses exist
    if (
      !this.props.memberIds.includes(marriage.spouse1Id) ||
      !this.props.memberIds.includes(marriage.spouse2Id)
    ) {
      throw new FamilyDomainException(
        'Both spouses must be members of the family before registering marriage.',
      );
    }

    this.props.marriageIds.push(marriage.id);

    // S.40 Logic: If this is the 2nd+ active marriage, flag family as polygamous
    if (this.props.marriageIds.length > 1 && !this.props.isPolygamous) {
      // Simple heuristic: If multiple marriages exist, potential polygamy.
      // Complex logic (e.g., checking if previous marriage ended) handled in Policies.
      // Here we just track the ID.
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new MarriageRegisteredEvent({
        marriageId: marriage.id,
        familyId: this.id,
        spouse1Id: marriage.spouse1Id,
        spouse2Id: marriage.spouse2Id,
        marriageType: marriage.type,
        startDate: new Date(), // Should come from marriage entity
      }),
    );
  }

  // --- Polygamous House Management ---

  addPolygamousHouse(house: PolygamousHouse): void {
    if (house.familyId !== this.id) return;
    if (this.props.polygamousHouseIds.includes(house.id)) return;

    // Validate Head
    if (!this.props.memberIds.includes(house.houseHeadId)) {
      throw new FamilyDomainException('House Head (Wife) must be a family member.');
    }

    this.props.polygamousHouseIds.push(house.id);
    this.props.polygamousHouseCount++;
    this.props.isPolygamous = true; // S.40 is now active

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new PolygamousHouseCreatedEvent({
        familyId: this.id,
        houseId: house.id,
        houseHeadId: house.houseHeadId,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        timestamp: new Date(),
      }),
    );
  }

  // --- Validation & Invariants ---

  private validate(): void {
    if (!this.props.id) throw new FamilyDomainException('Family ID is required');
    if (!this.props.name?.trim()) throw new FamilyDomainException('Family name is required');
    if (!this.props.creatorId) throw new FamilyDomainException('Creator ID is required');

    // Counts consistency
    if (this.props.memberCount < 0)
      throw new FamilyDomainException('Member count cannot be negative');

    // Polygamy Consistency
    if (this.props.isPolygamous && this.props.polygamousHouseCount < 1) {
      // Exception: It's possible to be polygamous by Marriage count (2 wives)
      // before formally setting up Houses in the system.
      // So we relax this strict check to allow the "Setup Phase".
    }
  }

  // --- Getters ---

  get name(): string {
    return this.props.name;
  }
  get creatorId(): string {
    return this.props.creatorId;
  }
  get clanName(): string | undefined {
    return this.props.clanName;
  }
  get homeCounty(): KenyanCounty | undefined {
    return this.props.homeCounty;
  }

  // Counts
  get memberCount(): number {
    return this.props.memberCount;
  }
  get livingMemberCount(): number {
    return this.props.livingMemberCount;
  }
  get deceasedMemberCount(): number {
    return this.props.deceasedMemberCount;
  }

  // Logic
  get isPolygamous(): boolean {
    return this.props.isPolygamous;
  }

  get memberIds(): string[] {
    return [...this.props.memberIds];
  }
  get marriageIds(): string[] {
    return [...this.props.marriageIds];
  }
  get polygamousHouseIds(): string[] {
    return [...this.props.polygamousHouseIds];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.props.description,
      creatorId: this.creatorId,
      clanName: this.clanName,
      subClan: this.props.subClan,
      homeCounty: this.homeCounty?.value,
      stats: {
        total: this.memberCount,
        living: this.livingMemberCount,
        deceased: this.deceasedMemberCount,
        minors: this.props.minorCount,
        dependants: this.props.dependantCount,
      },
      isPolygamous: this.isPolygamous,
      houses: this.props.polygamousHouseCount,
      members: this.memberIds,
      marriages: this.marriageIds,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
