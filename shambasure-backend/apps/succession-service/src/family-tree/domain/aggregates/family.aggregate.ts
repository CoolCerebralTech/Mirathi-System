import { AggregateRoot } from '@nestjs/cqrs';

import { FamilyMember } from '../entities/family-member.entity';
import { Family } from '../entities/family.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { Marriage } from '../entities/marriage.entity';
import { Relationship } from '../entities/relationship.entity';
import { CustomaryMarriageRegisteredEvent } from '../events/customary-marriage-registered.event';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyHeadAppointedEvent } from '../events/family-head-appointed.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { RelationshipCreatedEvent } from '../events/relationship-created.event';

export interface TreeVisualizationData {
  nodes: any[];
  edges: any[];
  metadata: {
    generationCount: number;
    memberCount: number;
    deceasedCount: number;
    minorCount: number;
    lastCalculated: string;
    familyHeadId?: string;
    customaryMarriages: number;
  };
}

export interface KenyanFamilyMetadata {
  hasCustomaryMarriage: boolean;
  hasPolygamousMarriage: boolean;
  familyHeadId?: string;
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
}

export class FamilyAggregate extends AggregateRoot {
  private family: Family;
  private members: Map<string, FamilyMember> = new Map();
  private marriages: Map<string, Marriage> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private guardianships: Map<string, Guardianship> = new Map();

  private constructor(family: Family) {
    super();
    this.family = family;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    ownerId: string,
    name: string,
    description?: string,
    metadata?: Partial<KenyanFamilyMetadata>,
  ): FamilyAggregate {
    const family = Family.create(id, ownerId, name, description, metadata);
    const aggregate = new FamilyAggregate(family);

    aggregate.apply(
      new FamilyCreatedEvent(id, ownerId, name, {
        hasCustomaryMarriage: false,
        hasPolygamousMarriage: false,
        familyHeadId: undefined,
        clanName: undefined,
        subClan: undefined,
        ancestralHome: undefined,
        familyTotem: undefined,
        ...(metadata ?? {}),
      }),
    );

    return aggregate;
  }

  static reconstitute(
    family: Family,
    members: FamilyMember[] = [],
    marriages: Marriage[] = [],
    relationships: Relationship[] = [],
    guardianships: Guardianship[] = [],
  ): FamilyAggregate {
    const aggregate = new FamilyAggregate(family);

    members.forEach((member) => aggregate.members.set(member.getId(), member));
    marriages.forEach((marriage) => aggregate.marriages.set(marriage.getId(), marriage));
    relationships.forEach((relationship) =>
      aggregate.relationships.set(relationship.getId(), relationship),
    );
    guardianships.forEach((guardianship) =>
      aggregate.guardianships.set(guardianship.getId(), guardianship),
    );

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT
  // --------------------------------------------------------------------------

  addFamilyMember(member: FamilyMember): void {
    if (this.members.has(member.getId())) {
      throw new Error(`Family member ${member.getId()} already exists in this family.`);
    }

    this.members.set(member.getId(), member);

    // Delegate to root entity to update counters (memberCount, livingCount, etc.)
    this.family.addFamilyMember({
      memberId: member.getId(),
      firstName: member.getFirstName(),
      lastName: member.getLastName(),
      dateOfBirth: member.getDateOfBirth(),
      isDeceased: member.getIsDeceased(),
      dateOfDeath: member.getDateOfDeath() || undefined,
      isMinor: member.getIsMinor(),
    });

    const gender = member.getGender();
    const memberDetails = {
      memberId: member.getId(),
      firstName: member.getFirstName(),
      lastName: member.getLastName(),
      dateOfBirth: member.getDateOfBirth(),
      isDeceased: member.getIsDeceased(),
      dateOfDeath: member.getDateOfDeath() ?? undefined,
      isMinor: member.getIsMinor(),
      gender: gender === 'MALE' || gender === 'FEMALE' ? gender : undefined,
      nationalId: member.getKenyanIdentification()?.nationalId ?? undefined,
    };

    this.apply(new FamilyMemberAddedEvent(this.family.getId(), memberDetails));
  }

  removeFamilyMember(memberId: string): void {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Family member ${memberId} not found.`);
    }

    this.members.delete(memberId);

    // Delegate to root entity to update counters
    this.family.removeFamilyMember({
      memberId,
      wasDeceased: member.getIsDeceased(),
      wasMinor: member.getIsMinor(),
    });

    // Remove relationships involving this member
    this.relationships.forEach((relationship, relationshipId) => {
      if (
        relationship.getFromMemberId() === memberId ||
        relationship.getToMemberId() === memberId
      ) {
        this.relationships.delete(relationshipId);
      }
    });
  }

  updateFamilyMember(
    memberId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      contactInfo?: any;
      notes?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
    },
  ): void {
    const member = this.members.get(memberId);
    if (!member) throw new Error(`Family member ${memberId} not found.`);
    member.updateDetails(updates);
  }

  // --------------------------------------------------------------------------
  // MARRIAGE MANAGEMENT
  // --------------------------------------------------------------------------

  registerMarriage(marriage: Marriage): void {
    if (this.marriages.has(marriage.getId()))
      throw new Error(`Marriage ${marriage.getId()} already exists.`);
    if (!this.members.has(marriage.getSpouse1Id()) || !this.members.has(marriage.getSpouse2Id())) {
      throw new Error('Both spouses must be family members.');
    }

    this.marriages.set(marriage.getId(), marriage);

    this.apply(
      new MarriageRegisteredEvent(
        marriage.getId(),
        this.family.getId(),
        marriage.getSpouse1Id(),
        marriage.getSpouse2Id(),
        marriage.getMarriageType(),
        marriage.getMarriageDate(),
      ),
    );

    if (marriage.getMarriageType() === 'CUSTOMARY_MARRIAGE') {
      this.family.registerCustomaryMarriage({
        spouse1Id: marriage.getSpouse1Id(),
        spouse2Id: marriage.getSpouse2Id(),
        marriageDate: marriage.getMarriageDate(),
        elderWitnesses: marriage.getCustomaryMarriageDetails()?.elderWitnesses || [],
        bridePricePaid: marriage.getCustomaryMarriageDetails()?.bridePricePaid || false,
        ceremonyLocation: marriage.getCustomaryMarriageDetails()?.ceremonyLocation || '',
      });
    }
  }

  registerCustomaryMarriage(marriageDetails: {
    spouse1Id: string;
    spouse2Id: string;
    marriageDate: Date;
    elderWitnesses: string[];
    bridePricePaid: boolean;
    ceremonyLocation: string;
    marriageType?: 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC';
    lobolaAmount?: number;
    traditionalCeremonyType?: string;
  }): void {
    const detailsWithType = {
      ...marriageDetails,
      marriageType: marriageDetails.marriageType ?? 'CUSTOMARY',
    };
    this.family.registerCustomaryMarriage(detailsWithType);
    this.apply(new CustomaryMarriageRegisteredEvent(this.family.getId(), detailsWithType));
  }

  dissolveMarriage(marriageId: string, dissolutionDate: Date, certificateNumber: string): void {
    const marriage = this.marriages.get(marriageId);
    if (!marriage) throw new Error(`Marriage ${marriageId} not found.`);
    marriage.dissolve(dissolutionDate, certificateNumber);
  }

  // --------------------------------------------------------------------------
  // RELATIONSHIP MANAGEMENT
  // --------------------------------------------------------------------------

  createRelationship(relationship: Relationship): void {
    if (this.relationships.has(relationship.getId()))
      throw new Error(`Relationship ${relationship.getId()} already exists.`);
    if (
      !this.members.has(relationship.getFromMemberId()) ||
      !this.members.has(relationship.getToMemberId())
    ) {
      throw new Error('Both members in the relationship must exist in the family.');
    }

    this.relationships.set(relationship.getId(), relationship);

    this.apply(
      new RelationshipCreatedEvent(
        relationship.getId(),
        this.family.getId(),
        relationship.getFromMemberId(),
        relationship.getToMemberId(),
        relationship.getType(),
        relationship.getMetadata(),
      ),
    );
  }

  verifyRelationship(
    relationshipId: string,
    method:
      | 'BIRTH_CERTIFICATE'
      | 'AFFIDAVIT'
      | 'DNA_TEST'
      | 'COMMUNITY_RECOGNITION'
      | 'COURT_ORDER',
    verifiedBy: string,
  ): void {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) throw new Error(`Relationship ${relationshipId} not found.`);
    relationship.verify(method, verifiedBy);
  }

  removeRelationship(relationshipId: string): void {
    if (!this.relationships.has(relationshipId))
      throw new Error(`Relationship ${relationshipId} not found.`);
    this.relationships.delete(relationshipId);
  }

  // --------------------------------------------------------------------------
  // GUARDIANSHIP MANAGEMENT
  // --------------------------------------------------------------------------

  assignGuardian(guardianship: Guardianship): void {
    if (this.guardianships.has(guardianship.getId()))
      throw new Error(`Guardianship ${guardianship.getId()} already exists.`);
    if (
      !this.members.has(guardianship.getGuardianId()) ||
      !this.members.has(guardianship.getWardId())
    ) {
      throw new Error('Both guardian and ward must be family members.');
    }

    this.guardianships.set(guardianship.getId(), guardianship);

    this.apply(
      new GuardianAssignedEvent(this.family.getId(), {
        guardianId: guardianship.getGuardianId(),
        wardId: guardianship.getWardId(),
        guardianType: guardianship.getType(),
        appointedBy: 'family',
        appointmentDate: guardianship.getAppointmentDate(),
        validUntil: guardianship.getValidUntil() || undefined,
        notes: guardianship.getNotes?.() || undefined,
      }),
    );
  }

  revokeGuardianship(guardianshipId: string, reason: string, revokedBy: string): void {
    const guardianship = this.guardianships.get(guardianshipId);
    if (!guardianship) throw new Error(`Guardianship ${guardianshipId} not found.`);

    // FIX: Remove incorrect first argument. revoke(reason, revokedBy, courtOrder?)
    guardianship.revoke(reason, revokedBy);
    this.guardianships.delete(guardianshipId);
  }

  // --------------------------------------------------------------------------
  // KENYAN FAMILY STRUCTURE
  // --------------------------------------------------------------------------

  appointFamilyHead(memberId: string, appointedBy: string): void {
    const member = this.members.get(memberId);
    if (!member) throw new Error(`Family member ${memberId} not found.`);

    this.family.appointFamilyHead(memberId);
    member.assignAsFamilyHead();

    this.apply(
      new FamilyHeadAppointedEvent(
        this.family.getId(),
        memberId,
        appointedBy,
        member.getFullName(),
      ),
    );
  }

  updateKenyanMetadata(metadata: Partial<KenyanFamilyMetadata>): void {
    this.family.updateKenyanMetadata(metadata);
  }

  registerPolygamousMarriage(): void {
    this.family.registerPolygamousMarriage();
  }

  updateTreeVisualization(treeData: TreeVisualizationData): void {
    this.family.updateTreeVisualization(treeData);
    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.family.getId()));
  }

  // --------------------------------------------------------------------------
  // STATISTICS & ANALYTICS
  // --------------------------------------------------------------------------

  getFamilyStatistics() {
    const members = Array.from(this.members.values());
    const marriages = Array.from(this.marriages.values());
    const relationships = Array.from(this.relationships.values());
    const guardianships = Array.from(this.guardianships.values());

    const livingMembers = members.filter((m) => m.getIsDeceased() === false);
    const minors = members.filter((m) => m.getIsMinor() === true);
    const deceased = members.filter((m) => m.getIsDeceased() === true);
    const activeMarriages = marriages.filter((m) => m.getIsActive() === true);
    const customaryMarriages = marriages.filter(
      (m) => m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
    );
    const verifiedRelationships = relationships.filter((r) => r.getIsVerified() === true);
    const activeGuardianships = guardianships.filter((g) => g.getIsActiveRecord() === true);

    let familyHeadName = 'Not appointed';
    const headId = this.family.getMetadata().familyHeadId;
    if (headId) {
      const headMember = this.members.get(headId);
      if (headMember) familyHeadName = headMember.getFullName();
    }

    return {
      totalMembers: members.length,
      livingMembers: livingMembers.length,
      minors: minors.length,
      deceased: deceased.length,
      marriages: marriages.length,
      activeMarriages: activeMarriages.length,
      customaryMarriages: customaryMarriages.length,
      relationships: relationships.length,
      verifiedRelationships: verifiedRelationships.length,
      guardianships: guardianships.length,
      activeGuardianships: activeGuardianships.length,
      familyHead: familyHeadName,
    };
  }

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.members.size === 0)
      errors.push('Family must have at least one member for succession purposes.');

    const minors = Array.from(this.members.values()).filter((m) => m.getIsMinor());
    if (minors.length > 0 && !this.family.getMetadata().familyHeadId) {
      warnings.push(
        'Family with minors should have an appointed family head for guardianship decisions.',
      );
    }

    const criticalRelationships = Array.from(this.relationships.values()).filter(
      (r) => ['PARENT', 'CHILD', 'SPOUSE'].includes(r.getType()) && !r.getIsVerified(),
    );
    if (criticalRelationships.length > 0) {
      warnings.push(`${criticalRelationships.length} critical relationships are not verified.`);
    }

    const minorsWithoutGuardians = minors.filter((minor) => {
      const hasGuardian = Array.from(this.guardianships.values()).some(
        (g) => g.getWardId() === minor.getId() && g.getIsActiveRecord(),
      );
      return !hasGuardian;
    });
    if (minorsWithoutGuardians.length > 0) {
      warnings.push(`${minorsWithoutGuardians.length} minors do not have appointed guardians.`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  getSuccessionReadiness(): {
    isReady: boolean;
    score: number;
    criticalIssues: string[];
    recommendations: string[];
  } {
    const validation = this.validateForSuccession();
    let score = 100;

    score -= validation.errors.length * 20;
    score -= validation.warnings.length * 5;
    score = Math.max(0, score);

    const recommendations: string[] = [];
    if (!this.family.getMetadata().familyHeadId) recommendations.push('Appoint a family head.');
    const unverifiedRelationships = Array.from(this.relationships.values()).filter(
      (r) => ['PARENT', 'CHILD', 'SPOUSE'].includes(r.getType()) && !r.getIsVerified(),
    );
    if (unverifiedRelationships.length > 0) recommendations.push('Verify critical relationships.');

    return {
      isReady: validation.isValid && score >= 70,
      score,
      criticalIssues: validation.errors,
      recommendations,
    };
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getFamily(): Family {
    return this.family;
  }
  getId(): string {
    return this.family.getId();
  }
  getMembers(): FamilyMember[] {
    return Array.from(this.members.values());
  }
  getMember(memberId: string): FamilyMember | undefined {
    return this.members.get(memberId);
  }
  getMarriages(): Marriage[] {
    return Array.from(this.marriages.values());
  }
  getRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }
  getGuardianships(): Guardianship[] {
    return Array.from(this.guardianships.values());
  }

  getSnapshot() {
    return {
      family: this.family,
      members: this.getMembers(),
      marriages: this.getMarriages(),
      relationships: this.getRelationships(),
      guardianships: this.getGuardianships(),
      statistics: this.getFamilyStatistics(),
      successionReadiness: this.getSuccessionReadiness(),
    };
  }
}
