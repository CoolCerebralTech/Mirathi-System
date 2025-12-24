// src/family-service/src/domain/aggregates/family.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
// Assuming a Result class exists in base
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AdoptionRecord } from '../entities/adoption-record.entity';
import { CohabitationRecord } from '../entities/cohabitation-record.entity';
// Entities
import { FamilyMember } from '../entities/family-member.entity';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { Marriage } from '../entities/marriage.entity';
import { NextOfKin } from '../entities/next-of-kin.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';
// Events
import {
  FamilyCreatedEvent,
  FamilyHouseEstablishedEvent,
  FamilyMemberAddedEvent,
  FamilyPolygamyDetectedEvent,
} from '../events/family-events';
// Enums & VOs
import {
  Gender,
  KenyanCounty,
  MarriageStatus,
  RelationshipType,
} from '../value-objects/family-enums.vo';

export interface FamilyProps {
  // Core Identity
  name: string; // e.g., "The Otieno Family"
  description?: string;
  creatorId: UniqueEntityID; // User who started this tree

  // Kenyan Cultural Context
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: KenyanCounty;

  // Aggregate Stats
  memberCount: number;
  isPolygamous: boolean; // Computed fact based on active marriages

  // Child Entities (The Graph)
  members: FamilyMember[];
  marriages: Marriage[];
  houses: PolygamousHouse[]; // For S.40 LSA
  relationships: FamilyRelationship[]; // The edges of the graph
  cohabitations: CohabitationRecord[]; // S.29(5) checks
  adoptions: AdoptionRecord[];
  nextOfKins: NextOfKin[];

  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FamilyAggregate extends AggregateRoot<FamilyProps> {
  private constructor(id: UniqueEntityID, props: FamilyProps) {
    super(id, props);
  }

  // Safe mutable access for internal methods
  private get mutableProps(): FamilyProps {
    return this.props as unknown as FamilyProps;
  }

  // ---------------------------------------------------------------------------
  // 🏭 Factory
  // ---------------------------------------------------------------------------
  public static create(
    props: Omit<
      FamilyProps,
      | 'members'
      | 'marriages'
      | 'houses'
      | 'relationships'
      | 'cohabitations'
      | 'adoptions'
      | 'nextOfKins'
      | 'memberCount'
      | 'isPolygamous'
      | 'version'
      | 'createdAt'
      | 'updatedAt'
    >,
    creatorMember?: FamilyMember, // Optional: Immediately add the creator
    id?: UniqueEntityID,
  ): FamilyAggregate {
    const defaultProps: Partial<FamilyProps> = {
      members: creatorMember ? [creatorMember] : [],
      marriages: [],
      houses: [],
      relationships: [],
      cohabitations: [],
      adoptions: [],
      nextOfKins: [],
      memberCount: creatorMember ? 1 : 0,
      isPolygamous: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const family = new FamilyAggregate(id || new UniqueEntityID(), {
      ...props,
      ...defaultProps,
    } as FamilyProps);

    family.addDomainEvent(
      new FamilyCreatedEvent({
        familyId: family.id.toString(),
        name: props.name,
        creatorId: props.creatorId.toString(),
        timestamp: new Date(),
      }),
    );

    return family;
  }

  // ---------------------------------------------------------------------------
  // 👥 Member Management
  // ---------------------------------------------------------------------------

  public addMember(member: FamilyMember): void {
    if (this.props.members.some((m) => m.id.equals(member.id))) {
      throw new Error('Member already exists in this family.');
    }

    this.mutableProps.members.push(member);
    this.mutableProps.memberCount++;
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new FamilyMemberAddedEvent({
        familyId: this.id.toString(),
        memberId: member.id.toString(),
        name: member.props.name.getFullName(),
        timestamp: new Date(),
      }),
    );
  }

  public getMember(memberId: UniqueEntityID): FamilyMember | undefined {
    return this.props.members.find((m) => m.id.equals(memberId));
  }

  // ---------------------------------------------------------------------------
  // 💍 Marriage & S.40 (Polygamy) Logic
  // ---------------------------------------------------------------------------

  /**
   * Registers a marriage and checks for Polygamy (S.40 LSA).
   */
  public registerMarriage(marriage: Marriage): void {
    // 1. Validation
    const spouse1 = this.getMember(marriage.props.spouse1Id);
    const spouse2 = this.getMember(marriage.props.spouse2Id);

    if (!spouse1 || !spouse2) {
      throw new Error('Both spouses must be members of the family tree first.');
    }

    // 2. Add Marriage
    this.mutableProps.marriages.push(marriage);

    // 3. S.40 Check: Does this create a polygamous situation?
    this.checkForPolygamy(marriage);

    // 4. Update Spousal Relationship Links (if not already present)
    // In a full implementation, we'd ensure FamilyRelationship entities exist here
  }

  /**
   * Defines a "House" for Section 40 distribution.
   * Required for polygamous families before Estate distribution.
   */
  public establishPolygamousHouse(house: PolygamousHouse): void {
    if (!this.props.isPolygamous) {
      // We allow it, but flag a warning or auto-set polygamous
      this.mutableProps.isPolygamous = true;
    }

    // Validation: House Order uniqueness
    const exists = this.props.houses.some((h) => h.props.houseOrder === house.props.houseOrder);
    if (exists) {
      throw new Error(`House #${house.props.houseOrder} already exists.`);
    }

    this.mutableProps.houses.push(house);

    this.addDomainEvent(
      new FamilyHouseEstablishedEvent({
        familyId: this.id.toString(),
        houseId: house.id.toString(),
        houseName: house.props.houseName,
        timestamp: new Date(),
      }),
    );
  }

  private checkForPolygamy(newMarriage: Marriage): void {
    // Check if either spouse has OTHER active marriages
    const spouse1Id = newMarriage.props.spouse1Id;
    const spouse2Id = newMarriage.props.spouse2Id;

    const activeMarriages = this.props.marriages.filter(
      (m) => m.props.marriageStatus === MarriageStatus.MARRIED,
    );

    const spouse1Count = activeMarriages.filter(
      (m) => m.props.spouse1Id.equals(spouse1Id) || m.props.spouse2Id.equals(spouse1Id),
    ).length;

    const spouse2Count = activeMarriages.filter(
      (m) => m.props.spouse1Id.equals(spouse2Id) || m.props.spouse2Id.equals(spouse2Id),
    ).length;

    if (spouse1Count > 1 || spouse2Count > 1) {
      if (!this.props.isPolygamous) {
        this.mutableProps.isPolygamous = true;

        this.addDomainEvent(
          new FamilyPolygamyDetectedEvent({
            familyId: this.id.toString(),
            reason: 'Multiple active marriages detected for a member',
            timestamp: new Date(),
          }),
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 🔗 Kinship & S.29 (Dependants) Logic
  // ---------------------------------------------------------------------------

  public defineRelationship(relationship: FamilyRelationship): void {
    // 1. Cycle Detection (Simple parent-child check)
    if (relationship.props.relationshipType === RelationshipType.CHILD) {
      this.ensureNoLineageCycle(relationship.props.fromMemberId, relationship.props.toMemberId);
    }

    this.mutableProps.relationships.push(relationship);
  }

  public recordCohabitation(record: CohabitationRecord): void {
    this.mutableProps.cohabitations.push(record);
    // Note: Cohabitation doesn't trigger S.40 polygamy automatically in this system,
    // but the ReadinessAssessment aggregate will flag it as a "Potential Claim".
  }

  public recordAdoption(record: AdoptionRecord): void {
    this.mutableProps.adoptions.push(record);
    // Logic: If finalized, we should auto-create Parent-Child relationship
  }

  // ---------------------------------------------------------------------------
  // 🛡️ Validation & Invariants
  // ---------------------------------------------------------------------------

  private ensureNoLineageCycle(parentId: UniqueEntityID, childId: UniqueEntityID): void {
    // DFS check to ensure 'childId' is not an ancestor of 'parentId'
    // Simplified for this snippet
    const isAncestor = this.checkAncestry(childId, parentId);
    if (isAncestor) {
      throw new Error('Lineage cycle detected: A child cannot be their own ancestor.');
    }
  }

  private checkAncestry(
    potentialAncestorId: UniqueEntityID,
    targetId: UniqueEntityID,
    visited = new Set<string>(),
  ): boolean {
    if (potentialAncestorId.equals(targetId)) return true;

    const key = potentialAncestorId.toString();
    if (visited.has(key)) return false;
    visited.add(key);

    // Find all children of potentialAncestor
    const childrenRels = this.props.relationships.filter(
      (r) =>
        r.props.fromMemberId.equals(potentialAncestorId) &&
        r.props.relationshipType === RelationshipType.PARENT,
    );

    for (const rel of childrenRels) {
      if (this.checkAncestry(rel.props.toMemberId, targetId, visited)) return true;
    }
    return false;
  }

  public validate(): void {
    if (!this.props.name) throw new Error('Family name is required.');
    if (this.props.memberCount < 0) throw new Error('Member count cannot be negative.');
  }

  // ---------------------------------------------------------------------------
  // 📊 Read Models (For the "Digital Lawyer" Dashboard)
  // ---------------------------------------------------------------------------

  /**
   * Returns a snapshot of the family structure for visualization.
   */
  public getFamilyTreeStructure(): any {
    return {
      familyId: this.id.toString(),
      name: this.props.name,
      stats: {
        members: this.props.memberCount,
        generations: this.calculateGenerations(),
        isPolygamous: this.props.isPolygamous,
      },
      // In a real app, we'd return a proper graph structure (nodes/edges)
      // For now, simple lists
      heads: this.findFamilyHeads().map((m) => m.getSummary()),
    };
  }

  /**
   * Checks if the family structure is ready for S.40 distribution.
   */
  public checkS40Readiness(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.props.isPolygamous) {
      return { ready: true, issues: [] }; // Not applicable
    }

    if (this.props.houses.length === 0) {
      issues.push('Polygamous family detected but no Houses defined.');
    }

    // Check if every wife is assigned to a house
    const wives = this.findWives();
    wives.forEach((wife) => {
      const assigned = this.props.houses.some(
        (h) =>
          h.props.wifeIds.some((id) => id.equals(wife.id)) ||
          h.props.originalWifeId.equals(wife.id),
      );
      if (!assigned) {
        issues.push(`Wife ${wife.props.name.getFullName()} is not assigned to a House.`);
      }
    });

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  // ---------------------------------------------------------------------------
  // 🔍 Helpers
  // ---------------------------------------------------------------------------

  private calculateGenerations(): number {
    // Simplified depth calculation
    return 1;
  }

  private findFamilyHeads(): FamilyMember[] {
    return this.props.members.filter((m) => m.props.isHeadOfFamily);
  }

  private findWives(): FamilyMember[] {
    // Find female members involved in active marriages
    const wifeIds = new Set<string>();
    this.props.marriages
      .filter((m) => m.props.marriageStatus === MarriageStatus.MARRIED)
      .forEach((m) => {
        // Assuming Logic: Find the female partner.
        // For MVP, checking gender of members via IDs
        const s1 = this.getMember(m.props.spouse1Id);
        const s2 = this.getMember(m.props.spouse2Id);
        if (s1 && s1.props.gender === Gender.FEMALE) wifeIds.add(s1.id.toString());
        if (s2 && s2.props.gender === Gender.FEMALE) wifeIds.add(s2.id.toString());
      });

    return this.props.members.filter((m) => wifeIds.has(m.id.toString()));
  }

  // Base Class Imp
  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing replay logic
  }
}
