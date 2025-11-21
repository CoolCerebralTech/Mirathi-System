import { AggregateRoot } from '@nestjs/cqrs';
import { Family } from '../entities/family.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { Relationship } from '../entities/relationship.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { RelationshipCreatedEvent } from '../events/relationship-created.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';
import { CustomaryMarriageRegisteredEvent } from '../events/customary-marriage-registered.event';
import { FamilyHeadAppointedEvent } from '../events/family-head-appointed.event';

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

    // Rehydrate all entities
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
  // MEMBER MANAGEMENT BUSINESS LOGIC
  // --------------------------------------------------------------------------

  addFamilyMember(member: FamilyMember): void {
    if (this.members.has(member.getId())) {
      throw new Error(`Family member ${member.getId()} already exists in this family.`);
    }

    this.members.set(member.getId(), member);

    const gender = member.getGender();
    const memberDetails = {
      memberId: member.getId(),
      firstName: member.getFirstName(),
      lastName: member.getLastName(),
      dateOfBirth: member.getDateOfBirth(),
      isDeceased: member.getIsDeceased(),
      dateOfDeath: member.getDateOfDeath() ?? undefined,
      isMinor: member.getIsMinor(),
      // Only allow 'MALE' | 'FEMALE' or undefined for the event
      gender: gender === 'MALE' || gender === 'FEMALE' ? gender : undefined,
      nationalId: member.getKenyanIdentification()?.nationalId ?? undefined,
    };

    this.apply(new FamilyMemberAddedEvent(this.family.getId(), memberDetails));

    this.updateFamilyStatistics();
  }

  removeFamilyMember(memberId: string): void {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Family member ${memberId} not found.`);
    }

    // Remove member and associated relationships
    this.members.delete(memberId);

    // Remove relationships where this member is involved
    this.relationships.forEach((relationship, relationshipId) => {
      if (
        relationship.getFromMemberId() === memberId ||
        relationship.getToMemberId() === memberId
      ) {
        this.relationships.delete(relationshipId);
      }
    });

    // Update family statistics
    this.updateFamilyStatistics();
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
    if (!member) {
      throw new Error(`Family member ${memberId} not found.`);
    }

    member.updateDetails(updates);
    this.updateFamilyStatistics();
  }

  // --------------------------------------------------------------------------
  // MARRIAGE MANAGEMENT BUSINESS LOGIC
  // --------------------------------------------------------------------------

  registerMarriage(marriage: Marriage): void {
    if (this.marriages.has(marriage.getId())) {
      throw new Error(`Marriage ${marriage.getId()} already exists.`);
    }

    // Validate both spouses exist in the family
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

    // Update Kenyan family metadata
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

    this.updateFamilyStatistics();
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
    // Ensure marriageType is always set
    const detailsWithType = {
      ...marriageDetails,
      marriageType: marriageDetails.marriageType ?? 'CUSTOMARY', // default to CUSTOMARY if undefined
    };

    this.family.registerCustomaryMarriage(detailsWithType);

    this.apply(new CustomaryMarriageRegisteredEvent(this.family.getId(), detailsWithType));
  }

  dissolveMarriage(marriageId: string, dissolutionDate: Date, certificateNumber: string): void {
    const marriage = this.marriages.get(marriageId);
    if (!marriage) {
      throw new Error(`Marriage ${marriageId} not found.`);
    }

    marriage.dissolve(dissolutionDate, certificateNumber);
    this.updateFamilyStatistics();
  }

  // --------------------------------------------------------------------------
  // RELATIONSHIP MANAGEMENT BUSINESS LOGIC
  // --------------------------------------------------------------------------

  createRelationship(relationship: Relationship): void {
    if (this.relationships.has(relationship.getId())) {
      throw new Error(`Relationship ${relationship.getId()} already exists.`);
    }

    // Validate both members exist
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

    this.updateFamilyStatistics();
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
    if (!relationship) {
      throw new Error(`Relationship ${relationshipId} not found.`);
    }

    relationship.verify(method, verifiedBy);
  }

  removeRelationship(relationshipId: string): void {
    if (!this.relationships.has(relationshipId)) {
      throw new Error(`Relationship ${relationshipId} not found.`);
    }

    this.relationships.delete(relationshipId);
    this.updateFamilyStatistics();
  }

  // --------------------------------------------------------------------------
  // GUARDIANSHIP MANAGEMENT BUSINESS LOGIC
  // --------------------------------------------------------------------------

  assignGuardian(guardianship: Guardianship): void {
    if (this.guardianships.has(guardianship.getId())) {
      throw new Error(`Guardianship ${guardianship.getId()} already exists.`);
    }

    // Validate guardian and ward exist
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
        appointedBy: 'family', // or 'court'/'will', depending on your logic
        appointmentDate: guardianship.getAppointmentDate(),
        validUntil: guardianship.getValidUntil() || undefined,
        notes: guardianship.getNotes?.() || undefined, // optional if you have notes method
      }),
    );

    this.updateFamilyStatistics();
  }

  revokeGuardianship(guardianshipId: string, reason: string, revokedBy: string): void {
    const guardianship = this.guardianships.get(guardianshipId);
    if (!guardianship) {
      throw new Error(`Guardianship ${guardianshipId} not found.`);
    }

    guardianship.revoke(this.family.getId(), reason, revokedBy);
    this.guardianships.delete(guardianshipId);
    this.updateFamilyStatistics();
  }

  // --------------------------------------------------------------------------
  // KENYAN FAMILY STRUCTURE BUSINESS LOGIC
  // --------------------------------------------------------------------------

  appointFamilyHead(memberId: string, appointedBy: string): void {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Family member ${memberId} not found.`);
    }

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

  // --------------------------------------------------------------------------
  // FAMILY TREE VISUALIZATION BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateTreeVisualization(treeData: TreeVisualizationData): void {
    this.family.updateTreeVisualization(treeData);

    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.family.getId()));
  }

  // --------------------------------------------------------------------------
  // FAMILY STATISTICS & ANALYTICS
  // --------------------------------------------------------------------------

  private updateFamilyStatistics(): void {
    // Calculate real-time statistics from the aggregate's entities
    // Update member status in the family (this would update the Family entity's internal counters)
    // Note: We're using the aggregate's state to update statistics
  }

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

    // Safely resolve family head name
    let familyHeadName = 'Not appointed';
    const headId = this.family.getMetadata().familyHeadId;
    if (headId) {
      const headMember = this.members.get(headId);
      if (headMember) {
        const fullName = headMember.getFullName();
        if (fullName && typeof fullName === 'string') {
          familyHeadName = fullName;
        }
      }
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
  // VALIDATION METHODS - KENYAN LAW COMPLIANCE
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (this.members.size === 0) {
      errors.push('Family must have at least one member for succession purposes.');
    }

    // Kenyan law specific validations
    const minors = Array.from(this.members.values()).filter((m) => m.getIsMinor());
    if (minors.length > 0 && !this.family.getMetadata().familyHeadId) {
      warnings.push(
        'Family with minors should have an appointed family head for guardianship decisions.',
      );
    }

    // Check for unverified critical relationships
    const criticalRelationships = Array.from(this.relationships.values()).filter(
      (r) => ['PARENT', 'CHILD', 'SPOUSE'].includes(r.getType()) && !r.getIsVerified(),
    );
    if (criticalRelationships.length > 0) {
      warnings.push(`${criticalRelationships.length} critical relationships are not verified.`);
    }

    // Check guardianship coverage for minors
    const minorsWithoutGuardians = minors.filter((minor) => {
      const hasGuardian = Array.from(this.guardianships.values()).some(
        (g) => g.getWardId() === minor.getId() && g.getIsActiveRecord(),
      );
      return !hasGuardian;
    });
    if (minorsWithoutGuardians.length > 0) {
      warnings.push(`${minorsWithoutGuardians.length} minors do not have appointed guardians.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getSuccessionReadiness(): {
    isReady: boolean;
    score: number;
    criticalIssues: string[];
    recommendations: string[];
  } {
    const validation = this.validateForSuccession();
    let score = 100;

    // Deduct points for warnings and errors
    score -= validation.errors.length * 20;
    score -= validation.warnings.length * 5;
    score = Math.max(0, score);

    const recommendations: string[] = [];

    if (!this.family.getMetadata().familyHeadId) {
      recommendations.push('Appoint a family head for decision-making authority.');
    }

    const unverifiedRelationships = Array.from(this.relationships.values()).filter(
      (r) => ['PARENT', 'CHILD', 'SPOUSE'].includes(r.getType()) && !r.getIsVerified(),
    );
    if (unverifiedRelationships.length > 0) {
      recommendations.push('Verify critical relationships to prevent succession disputes.');
    }

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
