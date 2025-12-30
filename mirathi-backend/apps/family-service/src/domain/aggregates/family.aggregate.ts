// src/family-service/src/domain/aggregates/family.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AdoptionRecord } from '../entities/adoption-record.entity';
import { CohabitationRecord } from '../entities/cohabitation-record.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { FamilyRelationship } from '../entities/family-relationship.entity';
import { Marriage } from '../entities/marriage.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';
import {
  AdoptionRecordedEvent,
  CohabitationRecordedEvent,
  FamilyCreatedEvent,
  FamilyHouseEstablishedEvent,
  FamilyMemberAddedEvent,
  FamilyPolygamyDetectedEvent,
  MarriageRegisteredEvent,
  RelationshipDefinedEvent,
} from '../events/family-events';
import { KenyanCounty, MarriageStatus, RelationshipType } from '../value-objects/family-enums.vo';

export interface FamilyProps {
  // Core Identity
  name: string;
  description?: string;
  creatorId: UniqueEntityID;

  // Kenyan Cultural Context
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: KenyanCounty;

  // The Graph (Entities)
  members: FamilyMember[];
  marriages: Marriage[];
  houses: PolygamousHouse[];
  relationships: FamilyRelationship[];
  cohabitations: CohabitationRecord[];
  adoptions: AdoptionRecord[];

  createdAt: Date;
  updatedAt: Date;
}

export class FamilyAggregate extends AggregateRoot<FamilyProps> {
  // Private constructor ensures controlled creation
  private constructor(id: UniqueEntityID, props: FamilyProps) {
    super(id, props);
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // 🏭 FACTORY METHODS
  // ---------------------------------------------------------------------------

  /**
   * Create a new Family Aggregate
   */
  public static create(
    props: Omit<
      FamilyProps,
      | 'members'
      | 'marriages'
      | 'houses'
      | 'relationships'
      | 'cohabitations'
      | 'adoptions'
      | 'createdAt'
      | 'updatedAt'
    >,
    creatorMember?: FamilyMember,
    id?: UniqueEntityID,
  ): FamilyAggregate {
    const now = new Date();
    const defaultProps: Partial<FamilyProps> = {
      members: creatorMember ? [creatorMember] : [],
      marriages: [],
      houses: [],
      relationships: [],
      cohabitations: [],
      adoptions: [],
      createdAt: now,
      updatedAt: now,
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
        timestamp: now,
      }),
    );

    return family;
  }

  /**
   * Restore from persistence (for event sourcing or database)
   */
  public static restore(props: FamilyProps, id: UniqueEntityID, version: number): FamilyAggregate {
    const family = new FamilyAggregate(id, props);
    family.setVersion(version);
    return family;
  }

  // ---------------------------------------------------------------------------
  // 🔍 COMPUTED PROPERTIES (Derived Facts - Never Stored)
  // ---------------------------------------------------------------------------

  /**
   * Get current member count
   */
  public get memberCount(): number {
    return this.props.members.length;
  }

  /**
   * Check if family is polygamous (S.40 compliance)
   */
  public isPolygamous(): boolean {
    const activeMarriages = this.props.marriages.filter(
      (m) => m.props.marriageStatus === MarriageStatus.MARRIED,
    );

    // Count occurrences of each spouse ID
    const spouseCounts = new Map<string, number>();

    activeMarriages.forEach((m) => {
      const s1 = m.props.spouse1Id.toString();
      const s2 = m.props.spouse2Id.toString();
      spouseCounts.set(s1, (spouseCounts.get(s1) || 0) + 1);
      spouseCounts.set(s2, (spouseCounts.get(s2) || 0) + 1);
    });

    // If any member has > 1 active marriage, it's polygamous
    for (const count of spouseCounts.values()) {
      if (count > 1) return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------
  // ✅ AGGREGATE INVARIANTS (Explicit Validation)
  // ---------------------------------------------------------------------------

  public validate(): void {
    if (!this.props.name) {
      throw new Error('Family name is required.');
    }

    // Invariant: No duplicate relationships
    const relKeys = new Set<string>();
    for (const r of this.props.relationships) {
      const key = `${r.props.fromMemberId.toString()}-${r.props.toMemberId.toString()}-${r.props.relationshipType}`;
      if (relKeys.has(key)) {
        throw new Error('Duplicate family relationship detected.');
      }
      relKeys.add(key);
    }

    // Invariant: Polygamous houses only allowed if polygamy exists
    if (this.props.houses.length > 0 && !this.isPolygamous()) {
      throw new Error('Polygamous houses exist without polygamous marriage.');
    }

    // Invariant: No duplicate members
    const memberIds = new Set<string>();
    for (const member of this.props.members) {
      if (memberIds.has(member.id.toString())) {
        throw new Error('Duplicate family member detected.');
      }
      memberIds.add(member.id.toString());
    }

    // Invariant: Members in relationships must exist in family
    for (const rel of this.props.relationships) {
      const fromMember = this.getMember(rel.props.fromMemberId);
      const toMember = this.getMember(rel.props.toMemberId);

      if (!fromMember) {
        throw new Error(
          `Relationship references non-existent fromMember: ${rel.props.fromMemberId.toString()}`,
        );
      }
      if (!toMember) {
        throw new Error(
          `Relationship references non-existent toMember: ${rel.props.toMemberId.toString()}`,
        );
      }
    }

    // Invariant: Spouses in marriages must exist in family
    for (const marriage of this.props.marriages) {
      const spouse1 = this.getMember(marriage.props.spouse1Id);
      const spouse2 = this.getMember(marriage.props.spouse2Id);

      if (!spouse1) {
        throw new Error(
          `Marriage references non-existent spouse1: ${marriage.props.spouse1Id.toString()}`,
        );
      }
      if (!spouse2) {
        throw new Error(
          `Marriage references non-existent spouse2: ${marriage.props.spouse2Id.toString()}`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 👥 MEMBER MANAGEMENT (Command Intent)
  // ---------------------------------------------------------------------------

  /**
   * Add a member to the family
   */
  public addMember(member: FamilyMember): void {
    if (this.props.members.some((m) => m.id.equals(member.id))) {
      throw new Error('Member already exists in this family.');
    }

    this.mutableProps.members.push(member);
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new FamilyMemberAddedEvent({
        familyId: this.id.toString(),
        memberId: member.id.toString(),
        name: member.props.name.getFullName(),
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  /**
   * Find a member by ID
   */
  public getMember(memberId: UniqueEntityID): FamilyMember | undefined {
    return this.props.members.find((m) => m.id.equals(memberId));
  }

  // ---------------------------------------------------------------------------
  // 💍 MARRIAGE MANAGEMENT (Command Intent)
  // ---------------------------------------------------------------------------

  /**
   * Register a marriage between two family members
   */
  public registerMarriage(marriage: Marriage): void {
    const spouse1 = this.getMember(marriage.props.spouse1Id);
    const spouse2 = this.getMember(marriage.props.spouse2Id);

    if (!spouse1 || !spouse2) {
      throw new Error('Both spouses must be members of the family tree first.');
    }

    // Check for existing active marriage
    const existingMarriage = this.props.marriages.find(
      (m) =>
        (m.props.spouse1Id.equals(marriage.props.spouse1Id) &&
          m.props.spouse2Id.equals(marriage.props.spouse2Id)) ||
        (m.props.spouse1Id.equals(marriage.props.spouse2Id) &&
          m.props.spouse2Id.equals(marriage.props.spouse1Id)),
    );

    if (existingMarriage && !existingMarriage.props.isMarriageDissolved) {
      throw new Error('Active marriage already exists between these spouses.');
    }

    // Check if this creates polygamy
    const wasPolygamous = this.isPolygamous();

    this.mutableProps.marriages.push(marriage);
    this.mutableProps.updatedAt = new Date();

    // Check if polygamy was just created
    const isNowPolygamous = this.isPolygamous();
    if (isNowPolygamous && !wasPolygamous) {
      this.addDomainEvent(
        new FamilyPolygamyDetectedEvent({
          familyId: this.id.toString(),
          reason: 'Multiple active marriages detected',
          timestamp: new Date(),
        }),
      );
    }

    this.addDomainEvent(
      new MarriageRegisteredEvent({
        familyId: this.id.toString(),
        marriageId: marriage.id.toString(),
        spouse1Id: spouse1.id.toString(),
        spouse2Id: spouse2.id.toString(),
        marriageType: marriage.props.marriageType,
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // 🏠 POLYGAMOUS HOUSE MANAGEMENT (S.40)
  // ---------------------------------------------------------------------------

  /**
   * Establish a polygamous house (S.40 compliance)
   */
  public establishPolygamousHouse(house: PolygamousHouse): void {
    if (!this.isPolygamous()) {
      throw new Error('Cannot establish polygamous house in non-polygamous family.');
    }

    if (!house.props.familyId.equals(this.id)) {
      throw new Error('Polygamous house must belong to this family.');
    }

    const exists = this.props.houses.some((h) => h.props.houseOrder === house.props.houseOrder);
    if (exists) {
      throw new Error(`House #${house.props.houseOrder} already exists.`);
    }

    this.mutableProps.houses.push(house);
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new FamilyHouseEstablishedEvent({
        familyId: this.id.toString(),
        houseId: house.id.toString(),
        houseName: house.props.houseName,
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // 🔗 KINSHIP RELATIONSHIPS (Command Intent)
  // ---------------------------------------------------------------------------

  /**
   * Define a relationship between two family members
   */
  public defineRelationship(relationship: FamilyRelationship): void {
    // Cycle detection for parent-child relationships
    if (relationship.props.relationshipType === RelationshipType.PARENT) {
      this.ensureNoLineageCycle(relationship.props.fromMemberId, relationship.props.toMemberId);
    }

    const fromMember = this.getMember(relationship.props.fromMemberId);
    const toMember = this.getMember(relationship.props.toMemberId);

    if (!fromMember || !toMember) {
      throw new Error('Both members in relationship must exist in the family.');
    }

    // Check for duplicate
    const duplicate = this.props.relationships.find(
      (r) =>
        r.props.fromMemberId.equals(relationship.props.fromMemberId) &&
        r.props.toMemberId.equals(relationship.props.toMemberId) &&
        r.props.relationshipType === relationship.props.relationshipType,
    );

    if (duplicate) {
      throw new Error('Relationship already exists.');
    }

    this.mutableProps.relationships.push(relationship);
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new RelationshipDefinedEvent({
        familyId: this.id.toString(),
        relationshipId: relationship.id.toString(),
        fromMemberId: fromMember.id.toString(),
        toMemberId: toMember.id.toString(),
        relationshipType: relationship.props.relationshipType,
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  /**
   * Record a cohabitation relationship
   */
  public recordCohabitation(record: CohabitationRecord): void {
    if (!record.props.familyId.equals(this.id)) {
      throw new Error('Cohabitation record must belong to this family.');
    }

    this.mutableProps.cohabitations.push(record);
    this.mutableProps.updatedAt = new Date();

    this.addDomainEvent(
      new CohabitationRecordedEvent({
        familyId: this.id.toString(),
        recordId: record.id.toString(),
        partner1Id: record.props.partner1Id.toString(),
        partner2Id: record.props.partner2Id.toString(),
        startDate: record.props.startDate,
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  /**
   * Record an adoption with automatic relationship creation
   */
  public recordAdoption(record: AdoptionRecord): void {
    if (!record.props.familyId.equals(this.id)) {
      throw new Error('Adoption record must belong to this family.');
    }

    const adoptee = this.getMember(record.props.adopteeId);
    const adoptiveParent = this.getMember(record.props.adoptiveParentId);

    if (!adoptee) {
      throw new Error('Adoptee must be a family member.');
    }
    if (!adoptiveParent) {
      throw new Error('Adoptive parent must be a family member.');
    }

    this.mutableProps.adoptions.push(record);
    this.mutableProps.updatedAt = new Date();

    // Create legal parent-child relationship
    const adoptionRelationship = FamilyRelationship.create({
      familyId: this.id,
      fromMemberId: record.props.adoptiveParentId,
      toMemberId: record.props.adopteeId,
      relationshipType: RelationshipType.PARENT,
      inverseRelationshipType: RelationshipType.CHILD,
      isBiological: false,
      isLegal: true,
      isCustomary: record.props.adoptionType === 'CUSTOMARY',
      isSpiritual: false,
      isActive: true,
      legalBasis: record.props.legalBasis,
      legalDocuments: record.props.consentDocuments,
      courtOrderId: record.props.courtOrderNumber,
      verificationLevel: 'FULLY_VERIFIED',
      verificationMethod: 'COURT_ORDER',
      verificationScore: 100,
      customaryRecognition: record.props.adoptionType === 'CUSTOMARY',
      clanRecognized: record.props.clanInvolved,
      elderWitnesses: record.props.clanElders,
      relationshipStrength: 100,
      closenessIndex: 100,
      contactFrequency: 'DAILY',
      isFinancialDependent: true,
      isCareDependent: true,
      dependencyLevel: 'FULL',
      supportProvided: {
        financial: true,
        housing: true,
        medical: true,
        educational: true,
      },
      inheritanceRights: 'FULL',
      disinherited: false,
      hasConflict: false,
      communicationLanguage: 'SWAHILI',
      createdBy: record.props.createdBy,
      lastUpdatedBy: record.props.lastUpdatedBy,
      isArchived: false,
    });

    this.defineRelationship(adoptionRelationship);

    this.addDomainEvent(
      new AdoptionRecordedEvent({
        familyId: this.id.toString(),
        adoptionRecordId: record.id.toString(),
        adopteeId: adoptee.id.toString(),
        adoptiveParentId: adoptiveParent.id.toString(),
        adoptionType: record.props.adoptionType,
        timestamp: new Date(),
      }),
    );

    this.incrementVersion();
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // 🛡️ LINEAGE VALIDATION (Private Helpers)
  // ---------------------------------------------------------------------------

  /**
   * Prevent lineage cycles (child cannot be ancestor of parent)
   */
  private ensureNoLineageCycle(parentId: UniqueEntityID, childId: UniqueEntityID): void {
    const isAncestor = this.checkAncestry(childId, parentId);
    if (isAncestor) {
      throw new Error('Lineage cycle detected: A child cannot be their own ancestor.');
    }
  }

  /**
   * Recursive ancestry check
   */
  private checkAncestry(
    potentialAncestorId: UniqueEntityID,
    targetId: UniqueEntityID,
    visited = new Set<string>(),
  ): boolean {
    if (potentialAncestorId.equals(targetId)) return true;

    const key = potentialAncestorId.toString();
    if (visited.has(key)) return false;
    visited.add(key);

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

  // ---------------------------------------------------------------------------
  // 🧠 PUBLIC QUERIES (Read-only, no side effects)
  // ---------------------------------------------------------------------------

  public getSpouses(memberId: UniqueEntityID): FamilyMember[] {
    const marriages = this.props.marriages.filter(
      (m) => m.props.spouse1Id.equals(memberId) || m.props.spouse2Id.equals(memberId),
    );

    return marriages
      .filter((m) => m.props.marriageStatus === MarriageStatus.MARRIED)
      .map((m) =>
        m.props.spouse1Id.equals(memberId)
          ? this.getMember(m.props.spouse2Id)!
          : this.getMember(m.props.spouse1Id)!,
      )
      .filter(Boolean);
  }

  public getChildren(parentId: UniqueEntityID): FamilyMember[] {
    return this.props.relationships
      .filter(
        (r) =>
          r.props.fromMemberId.equals(parentId) &&
          r.props.relationshipType === RelationshipType.PARENT,
      )
      .map((r) => this.getMember(r.props.toMemberId)!)
      .filter(Boolean);
  }

  public getParents(childId: UniqueEntityID): FamilyMember[] {
    return this.props.relationships
      .filter(
        (r) =>
          r.props.toMemberId.equals(childId) &&
          r.props.relationshipType === RelationshipType.PARENT,
      )
      .map((r) => this.getMember(r.props.fromMemberId)!)
      .filter(Boolean);
  }

  public getSiblings(memberId: UniqueEntityID): FamilyMember[] {
    const parents = this.getParents(memberId);
    if (parents.length === 0) return [];

    const siblingIds = new Set<string>();

    for (const parent of parents) {
      const parentChildren = this.getChildren(parent.id);
      for (const child of parentChildren) {
        if (!child.id.equals(memberId)) {
          siblingIds.add(child.id.toString());
        }
      }
    }

    return Array.from(siblingIds)
      .map((id) => this.getMember(new UniqueEntityID(id))!)
      .filter(Boolean);
  }

  // ---------------------------------------------------------------------------
  // 📊 AGGREGATE STATE PROJECTION (For Persistence)
  // ---------------------------------------------------------------------------

  public toProps(): FamilyProps {
    return {
      name: this.props.name,
      description: this.props.description,
      creatorId: this.props.creatorId,
      clanName: this.props.clanName,
      subClan: this.props.subClan,
      ancestralHome: this.props.ancestralHome,
      familyTotem: this.props.familyTotem,
      homeCounty: this.props.homeCounty,
      members: this.props.members,
      marriages: this.props.marriages,
      houses: this.props.houses,
      relationships: this.props.relationships,
      cohabitations: this.props.cohabitations,
      adoptions: this.props.adoptions,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // 🎭 BASE CLASS IMPLEMENTATION
  // ---------------------------------------------------------------------------

  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing replay logic handled in base class
  }

  /**
   * Helper to safely set version (if needed)
   */
  private setVersion(version: number): void {
    // This assumes AggregateRoot has a protected or public setter for version
    // Adjust based on your actual base class implementation
    if ((this as any).setVersion) {
      (this as any).setVersion(version);
    } else {
      (this as any)._version = version;
    }
  }

  public incrementVersion(): void {
    (this as any)._version = ((this as any)._version || 0) + 1;
  }

  public getVersion(): number {
    return (this as any)._version || 1;
  }

  private get mutableProps(): FamilyProps {
    return this.props as unknown as FamilyProps;
  }
}

// -----------------------------------------------------------------------------
// 🎯 DOMAIN SERVICES (Moved out of aggregate)
// -----------------------------------------------------------------------------

/**
 * Family Analysis Service - COMPUTES derived analysis, doesn't store
 */
export class FamilyAnalysisService {
  /**
   * Analyze family structure and polygamy strength
   */
  static analyzeFamilyStructure(family: FamilyAggregate): {
    polygamyStrength: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    complexityScore: number; // 0-100
    structureType: 'NUCLEAR' | 'EXTENDED' | 'POLYGAMOUS' | 'BLENDED' | 'COMPLEX';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let complexityScore = 0;

    // Polygamy analysis
    const isPolygamous = family.isPolygamous();
    let polygamyStrength: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';

    if (isPolygamous) {
      const houses = family.props.houses.length;

      if (houses >= 3) {
        polygamyStrength = 'HIGH';
        complexityScore += 40;
        recommendations.push('High polygamy complexity: Consider specialized S.40 distribution');
      } else if (houses === 2) {
        polygamyStrength = 'MEDIUM';
        complexityScore += 25;
      } else {
        polygamyStrength = 'LOW';
        complexityScore += 15;
      }
    }

    // Member count complexity
    if (family.memberCount > 20) {
      complexityScore += 30;
      recommendations.push('Large family: Consider estate distribution planning');
    } else if (family.memberCount > 10) {
      complexityScore += 20;
    } else if (family.memberCount > 5) {
      complexityScore += 10;
    }

    // Relationship complexity
    const relationshipTypes = new Set(
      family.props.relationships.map((r) => r.props.relationshipType),
    );
    if (relationshipTypes.size > 8) {
      complexityScore += 20;
      recommendations.push('Complex relationship web: Verify inheritance eligibility');
    }

    // Determine structure type
    let structureType: 'NUCLEAR' | 'EXTENDED' | 'POLYGAMOUS' | 'BLENDED' | 'COMPLEX' = 'NUCLEAR';

    if (isPolygamous) {
      structureType = 'POLYGAMOUS';
    } else if (family.memberCount > 8) {
      structureType = 'EXTENDED';
    } else if (family.props.adoptions.length > 0 || family.props.cohabitations.length > 0) {
      structureType = 'BLENDED';
    }

    if (complexityScore > 50) {
      structureType = 'COMPLEX';
    }

    // Cap complexity score
    complexityScore = Math.min(complexityScore, 100);

    return {
      polygamyStrength,
      complexityScore,
      structureType,
      recommendations,
    };
  }

  /**
   * Calculate family health indicators
   */
  static calculateHealthIndicators(family: FamilyAggregate): {
    dataCompleteness: number; // 0-100
    verificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    relationshipIntegrity: 'STRONG' | 'GOOD' | 'WEAK' | 'POOR';
    issues: string[];
  } {
    const issues: string[] = [];
    let completenessScore = 0;
    let verifiedRelationships = 0;

    // Data completeness
    if (family.memberCount > 0) {
      completenessScore += 30;
    } else {
      issues.push('No family members added');
    }

    if (family.props.marriages.length > 0) {
      completenessScore += 20;
    }

    if (family.props.relationships.length > 0) {
      completenessScore += 30;
    } else {
      issues.push('No relationships defined');
    }

    // Verification analysis
    family.props.relationships.forEach((rel) => {
      if (rel.props.verificationLevel === 'FULLY_VERIFIED') {
        verifiedRelationships++;
      }
    });

    const verificationRatio =
      family.props.relationships.length > 0
        ? verifiedRelationships / family.props.relationships.length
        : 0;

    let verificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (verificationRatio >= 0.8) verificationLevel = 'HIGH';
    else if (verificationRatio >= 0.5) verificationLevel = 'MEDIUM';

    // Relationship integrity (check for cycles, missing links)
    let relationshipIntegrity: 'STRONG' | 'GOOD' | 'WEAK' | 'POOR' = 'STRONG';

    // Check for members without relationships
    const membersWithoutRelations = family.props.members.filter((member) => {
      const hasParent = family.props.relationships.some(
        (r) =>
          r.props.toMemberId.equals(member.id) &&
          r.props.relationshipType === RelationshipType.PARENT,
      );
      const hasChild = family.props.relationships.some(
        (r) =>
          r.props.fromMemberId.equals(member.id) &&
          r.props.relationshipType === RelationshipType.PARENT,
      );
      const hasSpouse = family.getSpouses(member.id).length > 0;
      return !hasParent && !hasChild && !hasSpouse;
    });

    if (membersWithoutRelations.length > 3) {
      relationshipIntegrity = 'POOR';
      issues.push(`${membersWithoutRelations.length} members isolated (no relationships)`);
    } else if (membersWithoutRelations.length > 0) {
      relationshipIntegrity = 'WEAK';
    }

    // Check for parent-child completeness
    const childrenWithoutBothParents = family.props.members.filter((member) => {
      const parents = family.getParents(member.id);
      return (
        parents.length === 1 &&
        member.props.isAlive &&
        family.getMember(parents[0].id)?.props.isAlive
      );
    });

    if (childrenWithoutBothParents.length > 5) {
      relationshipIntegrity = relationshipIntegrity === 'STRONG' ? 'WEAK' : relationshipIntegrity;
      issues.push(
        `${childrenWithoutBothParents.length} children with single parent (may affect inheritance)`,
      );
    }

    return {
      dataCompleteness: Math.min(completenessScore, 100),
      verificationLevel,
      relationshipIntegrity,
      issues,
    };
  }
}

/**
 * Succession Readiness Service - COMPUTES derived readiness for estate distribution
 */
export class SuccessionReadinessService {
  /**
   * Analyze family readiness for succession under Kenyan law
   */
  static analyzeSuccessionReadiness(family: FamilyAggregate): {
    s29Readiness: 'READY' | 'PARTIAL' | 'NOT_READY';
    s40Readiness: 'READY' | 'PARTIAL' | 'NOT_APPLICABLE';
    legalClarity: 'CLEAR' | 'MODERATE' | 'UNCLEAR';
    missingElements: string[];
    recommendations: string[];
  } {
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    // S.29 Analysis (Dependency Claims)
    let s29Readiness: 'READY' | 'PARTIAL' | 'NOT_READY' = 'READY';

    const cohabitations = family.props.cohabitations.filter((c) => c.props.qualifiesForS29);
    const adoptions = family.props.adoptions.filter((a) => a.isLegallyValid());

    if (cohabitations.length === 0 && adoptions.length === 0) {
      missingElements.push('No S.29 qualified cohabitations or adoptions documented');
      s29Readiness = 'PARTIAL';
    }

    // Check for dependents
    const potentialDependents = family.props.members.filter((member) => {
      const age = member.calculateAge();
      return (
        (age !== null && age < 18) ||
        member.props.hasDisability ||
        member.props.isMentallyIncapacitated ||
        (age !== null && age >= 65)
      );
    });

    if (potentialDependents.length > 0) {
      recommendations.push(
        `Found ${potentialDependents.length} potential dependents for S.29 claims`,
      );
    }

    // S.40 Analysis (Polygamous Distribution)
    let s40Readiness: 'READY' | 'PARTIAL' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';

    if (family.isPolygamous()) {
      s40Readiness = 'READY';

      if (family.props.houses.length === 0) {
        missingElements.push('Polygamous family has no established houses for S.40 distribution');
        s40Readiness = 'PARTIAL';
        recommendations.push('Establish polygamous houses for proper S.40 distribution');
      } else {
        // Check house validity
        const invalidHouses = family.props.houses.filter((h) => !h.props.isActive);
        if (invalidHouses.length > 0) {
          missingElements.push(`${invalidHouses.length} inactive polygamous houses`);
          s40Readiness = 'PARTIAL';
        }
      }
    }

    // Legal Clarity Analysis
    let legalClarity: 'CLEAR' | 'MODERATE' | 'UNCLEAR' = 'CLEAR';

    // Check for ambiguous relationships
    const ambiguousRelationships = family.props.relationships.filter(
      (r) =>
        r.props.verificationLevel !== 'FULLY_VERIFIED' &&
        (r.props.relationshipType === RelationshipType.PARENT ||
          r.props.relationshipType === RelationshipType.CHILD ||
          r.props.relationshipType === RelationshipType.SPOUSE),
    );

    if (ambiguousRelationships.length > 3) {
      legalClarity = 'UNCLEAR';
      missingElements.push(`${ambiguousRelationships.length} unverified critical relationships`);
      recommendations.push('Verify parent-child and spousal relationships for legal clarity');
    } else if (ambiguousRelationships.length > 0) {
      legalClarity = 'MODERATE';
    }

    // Check for competing claims
    const membersWithMultipleSpouses = family.props.members.filter((member) => {
      const spouses = family.getSpouses(member.id);
      return spouses.length > 1;
    });

    if (membersWithMultipleSpouses.length > 0 && !family.isPolygamous()) {
      legalClarity = legalClarity === 'CLEAR' ? 'MODERATE' : legalClarity;
      recommendations.push(
        `Found ${membersWithMultipleSpouses.length} members with multiple spouses - check marriage validity`,
      );
    }

    return {
      s29Readiness,
      s40Readiness,
      legalClarity,
      missingElements,
      recommendations,
    };
  }
}

/**
 * Family Dashboard Service - READ MODEL builder
 */
export class FamilyDashboardService {
  /**
   * Build comprehensive family dashboard
   */
  static buildDashboard(family: FamilyAggregate): {
    summary: Record<string, any>;
    structure: Record<string, any>;
    legal: Record<string, any>;
    analysis: Record<string, any>;
    timeline: Array<Record<string, any>>;
  } {
    const structureAnalysis = FamilyAnalysisService.analyzeFamilyStructure(family);
    const healthIndicators = FamilyAnalysisService.calculateHealthIndicators(family);
    const successionReadiness = SuccessionReadinessService.analyzeSuccessionReadiness(family);

    // Generate recent timeline from events (simplified)
    const timeline: Array<Record<string, any>> = [
      {
        date: family.props.createdAt,
        event: 'Family Created',
        details: `Created by ${family.props.creatorId.toString()}`,
      },
    ];

    // Add marriage events
    family.props.marriages.slice(-5).forEach((marriage) => {
      timeline.push({
        date: marriage.props.startDate,
        event: 'Marriage Registered',
        details: `${marriage.props.marriageType} marriage`,
      });
    });

    // Add member events
    family.props.members.slice(-5).forEach((member) => {
      if (!member.props.isAlive && member.props.dateOfDeath) {
        timeline.push({
          date: member.props.dateOfDeath,
          event: 'Member Deceased',
          details: member.props.name.getFullName(),
        });
      }
    });

    // Sort timeline
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      summary: {
        familyName: family.props.name,
        memberCount: family.memberCount,
        isPolygamous: family.isPolygamous(),
        establishedDate: family.props.createdAt,
        structureType: structureAnalysis.structureType,
      },
      structure: {
        houses: family.props.houses.length,
        marriages: family.props.marriages.length,
        relationships: family.props.relationships.length,
        cohabitations: family.props.cohabitations.length,
        adoptions: family.props.adoptions.length,
        complexityScore: structureAnalysis.complexityScore,
      },
      legal: {
        s29Readiness: successionReadiness.s29Readiness,
        s40Readiness: successionReadiness.s40Readiness,
        legalClarity: successionReadiness.legalClarity,
        polygamyStrength: structureAnalysis.polygamyStrength,
      },
      analysis: {
        dataCompleteness: healthIndicators.dataCompleteness,
        verificationLevel: healthIndicators.verificationLevel,
        relationshipIntegrity: healthIndicators.relationshipIntegrity,
        issues: healthIndicators.issues,
      },
      timeline: timeline.slice(0, 10), // Last 10 events
    };
  }
}
