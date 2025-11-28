import { AggregateRoot } from '@nestjs/cqrs';
import { Family } from '../entities/family.entity';
import {
  FamilyMember,
  KenyanFamilyMemberMetadata,
  KenyanIdentification,
  MemberContactInfo,
} from '../entities/family-member.entity';
import { Relationship } from '../entities/relationship.entity';
import { Marriage } from '../entities/marriage.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { RelationshipValidationPolicy } from '../policies/relationship-validation.policy';
import { FamilyTreeIntegrityPolicy } from '../policies/family-tree-integrity.policy';
import { PolygamousFamilyPolicy } from '../policies/polygamous-family.policy';
import { GuardianEligibilityPolicy } from '../policies/guardian-eligibility.policy';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { RelationshipCreatedEvent } from '../events/relationship-created.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { FamilyTreeVerifiedEvent } from '../events/family-tree-verified.event';
import { SuccessionAnalysisCompletedEvent } from '../events/succession-analysis-completed.event';

export interface FamilyTreeSnapshot {
  family: Family;
  members: FamilyMember[];
  relationships: Relationship[];
  marriages: Marriage[];
  guardianships: Guardianship[];
  statistics: {
    totalMembers: number;
    livingMembers: number;
    deceasedMembers: number;
    minorCount: number;
    marriageCount: number;
    customaryMarriageCount: number;
    verifiedRelationships: number;
    activeGuardianships: number;
  };
  integrity: {
    hasCircularRelationships: boolean;
    orphanedMembers: string[];
    minorsWithoutGuardians: string[];
    unverifiedCriticalRelationships: string[];
  };
}

// Use strict typing for updates
export interface UpdateMemberDetails {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  contactInfo?: MemberContactInfo;
  notes?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  kenyanIdentification?: Partial<KenyanIdentification>;
  metadata?: Partial<KenyanFamilyMemberMetadata>;
}

export class FamilyTreeAggregate extends AggregateRoot {
  private family: Family;
  private members: Map<string, FamilyMember> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private marriages: Map<string, Marriage> = new Map();
  private guardianships: Map<string, Guardianship> = new Map();

  // Policies
  private relValidationPolicy = new RelationshipValidationPolicy();
  private integrityPolicy = new FamilyTreeIntegrityPolicy();
  private polygamyPolicy = new PolygamousFamilyPolicy();
  private guardianPolicy = new GuardianEligibilityPolicy();

  private constructor(family: Family) {
    super();
    this.family = family;
  }

  // --------------------------------------------------------------------------
  // RECONSTITUTION
  // --------------------------------------------------------------------------

  static reconstitute(
    family: Family,
    members: FamilyMember[],
    relationships: Relationship[],
    marriages: Marriage[],
    guardianships: Guardianship[],
  ): FamilyTreeAggregate {
    const agg = new FamilyTreeAggregate(family);
    members.forEach((m) => agg.members.set(m.getId(), m));
    relationships.forEach((r) => agg.relationships.set(r.getId(), r));
    marriages.forEach((m) => agg.marriages.set(m.getId(), m));
    guardianships.forEach((g) => agg.guardianships.set(g.getId(), g));
    return agg;
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT
  // --------------------------------------------------------------------------

  addMember(member: FamilyMember): void {
    if (this.members.has(member.getId()))
      throw new Error(`Member ${member.getId()} already exists.`);
    if (member.getFamilyId() !== this.family.getId())
      throw new Error('Member belongs to a different family.');

    const validation = member.validateForSuccession();
    if (!validation.isValid)
      throw new Error(`Member validation failed: ${validation.errors.join(', ')}`);

    this.members.set(member.getId(), member);

    const genderForEvent =
      member.getGender() === 'MALE' || member.getGender() === 'FEMALE'
        ? (member.getGender() as 'MALE' | 'FEMALE')
        : undefined;

    this.apply(
      new FamilyMemberAddedEvent(this.family.getId(), {
        memberId: member.getId(),
        firstName: member.getFirstName(),
        lastName: member.getLastName(),
        dateOfBirth: member.getDateOfBirth(),
        isDeceased: member.getIsDeceased() ?? undefined,
        dateOfDeath: member.getDateOfDeath() ?? undefined,
        isMinor: member.getIsMinor(),
        gender: genderForEvent,
        nationalId: member.getKenyanIdentification().nationalId ?? undefined,
      }),
    );

    this.updateTreeStatistics();
  }

  removeMember(memberId: string, reason: string = 'Removed from tree'): void {
    const member = this.members.get(memberId);
    if (!member) throw new Error(`Member ${memberId} not found.`);
    if (member.getIsDeceased())
      throw new Error('Cannot remove deceased members (succession implications).');

    const criticalRelationships = this.getCriticalRelationshipsForMember(memberId);
    if (criticalRelationships.length > 0) {
      throw new Error(
        `Cannot remove member with ${criticalRelationships.length} critical relationships.`,
      );
    }

    member.remove(reason);
    this.members.delete(memberId);
    this.updateTreeStatistics();
  }

  updateMemberDetails(memberId: string, updates: UpdateMemberDetails): void {
    const member = this.members.get(memberId);
    if (!member) throw new Error(`Member ${memberId} not found.`);

    member.updateDetails({
      firstName: updates.firstName,
      lastName: updates.lastName,
      middleName: updates.middleName,
      contactInfo: updates.contactInfo,
      notes: updates.notes,
      gender: updates.gender,
    });

    if (updates.kenyanIdentification)
      member.updateKenyanIdentification(updates.kenyanIdentification);
    if (updates.metadata) member.updateMetadata(updates.metadata);

    this.updateTreeStatistics();
  }

  markMemberAsDeceased(
    memberId: string,
    dateOfDeath: Date,
    markedBy: string,
    deathCertificateNumber?: string,
  ): void {
    const member = this.members.get(memberId);
    if (!member) throw new Error(`Member ${memberId} not found.`);

    member.markAsDeceased(dateOfDeath, markedBy, deathCertificateNumber);
    this.updateTreeStatistics();
    this.analyzeSuccessionImplications(memberId);
  }

  // --------------------------------------------------------------------------
  // RELATIONSHIP MANAGEMENT
  // --------------------------------------------------------------------------

  addRelationship(relationship: Relationship): void {
    const fromId = relationship.getFromMemberId();
    const toId = relationship.getToMemberId();
    const type = relationship.getType();

    const fromMember = this.members.get(fromId);
    const toMember = this.members.get(toId);
    if (!fromMember || !toMember) throw new Error('Both members must exist in the tree.');

    const validation = this.relValidationPolicy.validateRelationship(fromMember, toMember, type);
    if (!validation.isValid) throw new Error(validation.error);

    const existingArray = Array.from(this.relationships.values());
    if (this.integrityPolicy.checkCycle(fromId, toId, type, existingArray)) {
      throw new Error('This relationship creates a cycle in the family tree.');
    }

    const exists = existingArray.some(
      (r) => r.getFromMemberId() === fromId && r.getToMemberId() === toId && r.getType() === type,
    );
    if (exists) throw new Error('Relationship already exists.');

    this.relationships.set(relationship.getId(), relationship);
    this.apply(
      new RelationshipCreatedEvent(
        relationship.getId(),
        this.family.getId(),
        fromId,
        toId,
        type,
        relationship.getMetadata(),
      ),
    );
    this.updateTreeStatistics();
  }

  removeRelationship(relationshipId: string, reason: string = 'Removed by user'): void {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) throw new Error('Relationship not found.');
    if (this.isCriticalRelationship(relationship))
      throw new Error('Cannot remove critical relationship without succession review.');

    relationship.remove(reason);
    this.relationships.delete(relationshipId);
    this.updateTreeStatistics();
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
    notes?: string,
  ): void {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) throw new Error('Relationship not found.');

    relationship.verify(method, verifiedBy, notes);
    this.updateTreeStatistics();

    if (this.areAllCriticalRelationshipsVerified()) {
      this.apply(new FamilyTreeVerifiedEvent(this.family.getId()));
    }
  }

  // --------------------------------------------------------------------------
  // MARRIAGE MANAGEMENT
  // --------------------------------------------------------------------------

  registerMarriage(marriage: Marriage): void {
    const s1 = marriage.getSpouse1Id();
    const s2 = marriage.getSpouse2Id();

    if (!this.members.has(s1) || !this.members.has(s2))
      throw new Error('Both spouses must be members.');

    const spouse1 = this.members.get(s1)!;
    const spouse2 = this.members.get(s2)!;

    const age1 = spouse1.getAge();
    const age2 = spouse2.getAge();
    if (age1 !== null && age1 < 18) throw new Error(`Spouse 1 is under 18 (age: ${age1}).`);
    if (age2 !== null && age2 < 18) throw new Error(`Spouse 2 is under 18 (age: ${age2}).`);

    const existingMarriages1 = Array.from(this.marriages.values()).filter(
      (m) => m.getSpouse1Id() === s1 || m.getSpouse2Id() === s1,
    );
    const existingMarriages2 = Array.from(this.marriages.values()).filter(
      (m) => m.getSpouse1Id() === s2 || m.getSpouse2Id() === s2,
    );

    const pCheck1 = this.polygamyPolicy.checkMarriageEligibility(
      s1,
      existingMarriages1,
      marriage.getMarriageType(),
    );
    if (!pCheck1.isAllowed) throw new Error(`Spouse 1 ineligible: ${pCheck1.error}`);

    const pCheck2 = this.polygamyPolicy.checkMarriageEligibility(
      s2,
      existingMarriages2,
      marriage.getMarriageType(),
    );
    if (!pCheck2.isAllowed) throw new Error(`Spouse 2 ineligible: ${pCheck2.error}`);

    const existingActive = Array.from(this.marriages.values()).find(
      (m) =>
        m.getIsActive() &&
        ((m.getSpouse1Id() === s1 && m.getSpouse2Id() === s2) ||
          (m.getSpouse1Id() === s2 && m.getSpouse2Id() === s1)),
    );
    if (existingActive) throw new Error('These members are already married.');

    if (
      marriage.getMarriageType() === 'CUSTOMARY_MARRIAGE' &&
      !marriage.getCustomaryMarriageDetails()
    ) {
      throw new Error('Customary marriage details missing.');
    }

    this.marriages.set(marriage.getId(), marriage);
    this.apply(
      new MarriageRegisteredEvent(
        marriage.getId(),
        this.family.getId(),
        s1,
        s2,
        marriage.getMarriageType(),
        marriage.getMarriageDate(),
      ),
    );

    if (marriage.getMarriageType() === 'CUSTOMARY_MARRIAGE') {
      this.family.registerCustomaryMarriage({
        spouse1Id: s1,
        spouse2Id: s2,
        marriageDate: marriage.getMarriageDate(),
        elderWitnesses: marriage.getCustomaryMarriageDetails()?.elderWitnesses || [],
        bridePricePaid: marriage.getCustomaryMarriageDetails()?.bridePricePaid || false,
        ceremonyLocation: marriage.getCustomaryMarriageDetails()?.ceremonyLocation || '',
      });
    }
    this.updateTreeStatistics();
  }

  dissolveMarriage(
    marriageId: string,
    date: Date,
    cert: string,
    dissolutionType: 'DIVORCE' | 'ANNULMENT' | 'DEATH' = 'DIVORCE',
  ): void {
    const marriage = this.marriages.get(marriageId);
    if (!marriage) throw new Error('Marriage not found.');
    marriage.dissolve(date, cert, dissolutionType);
    this.updateTreeStatistics();
  }

  // --------------------------------------------------------------------------
  // GUARDIANSHIP MANAGEMENT
  // --------------------------------------------------------------------------

  assignGuardian(guardianship: Guardianship): void {
    const ward = this.members.get(guardianship.getWardId());
    const guardian = this.members.get(guardianship.getGuardianId());

    if (!ward || !guardian) throw new Error('Guardian and Ward must be in tree.');

    const eligibility = this.guardianPolicy.checkEligibility(
      guardian,
      ward,
      guardianship.getType(),
    );
    if (!eligibility.isEligible) throw new Error(`Guardian ineligible: ${eligibility.reason}`);

    if (!ward.getIsMinor() && guardianship.getType() !== 'FINANCIAL_GUARDIAN') {
      throw new Error('Guardianship typically applies to minors only.');
    }

    const existing = Array.from(this.guardianships.values()).filter(
      (g) => g.getWardId() === guardianship.getWardId() && g.getIsActiveRecord(),
    );
    if (existing.length > 0) throw new Error('Ward already has active guardianship.');

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
    this.updateTreeStatistics();
  }

  revokeGuardianship(guardianshipId: string, reason: string, revokedBy: string): void {
    const guardianship = this.guardianships.get(guardianshipId);
    if (!guardianship) throw new Error('Guardianship not found.');
    guardianship.revoke(reason, revokedBy);
    this.guardianships.delete(guardianshipId);
    this.updateTreeStatistics();
  }

  // --------------------------------------------------------------------------
  // ANALYSIS & INTEGRITY
  // --------------------------------------------------------------------------

  analyzeSuccessionImplications(deceasedMemberId?: string): void {
    const analysis = {
      deceasedMemberId,
      potentialHeirs: this.identifyPotentialHeirs(deceasedMemberId),
      dependants: this.identifyLegalDependants(deceasedMemberId),
      successionType: this.determineSuccessionType(),
      complexity: this.assessSuccessionComplexity(),
      recommendations: this.generateSuccessionRecommendations(),
    };
    this.apply(new SuccessionAnalysisCompletedEvent(this.family.getId(), analysis));
  }

  validateTreeIntegrity(): {
    isValid: boolean;
    issues: Array<{
      type: 'ERROR' | 'WARNING';
      code: string;
      message: string;
      affectedMembers?: string[];
    }>;
  } {
    const issues: Array<{
      type: 'ERROR' | 'WARNING';
      code: string;
      message: string;
      affectedMembers?: string[];
    }> = [];

    const circularCheck = this.integrityPolicy.detectCircularRelationships(
      Array.from(this.relationships.values()),
    );
    if (circularCheck.hasCircular) {
      issues.push({
        type: 'ERROR',
        code: 'CIRCULAR_RELATIONSHIPS',
        message: 'Circular relationships detected',
      });
    }

    const orphaned = this.findOrphanedMembers();
    if (orphaned.length > 0) {
      issues.push({
        type: 'WARNING',
        code: 'ORPHANED_MEMBERS',
        message: `${orphaned.length} orphaned members`,
        affectedMembers: orphaned,
      });
    }

    const minorsNoGuardian = this.findMinorsWithoutGuardians();
    if (minorsNoGuardian.length > 0) {
      issues.push({
        type: 'ERROR',
        code: 'MINORS_WITHOUT_GUARDIANS',
        message: `${minorsNoGuardian.length} minors have no guardian`,
        affectedMembers: minorsNoGuardian,
      });
    }

    const unverified = this.findUnverifiedCriticalRelationships();
    if (unverified.length > 0) {
      issues.push({
        type: 'WARNING',
        code: 'UNVERIFIED_RELATIONSHIPS',
        message: `${unverified.length} critical relationships unverified`,
        affectedMembers: unverified,
      });
    }

    return { isValid: issues.filter((i) => i.type === 'ERROR').length === 0, issues };
  }

  getSuccessionReadiness() {
    const integrity = this.validateTreeIntegrity();
    let score = 100;
    score -= integrity.issues.filter((i) => i.type === 'ERROR').length * 20;
    score -= integrity.issues.filter((i) => i.type === 'WARNING').length * 5;
    score = Math.max(0, score);

    const recommendations: string[] = [];
    if (this.findMinorsWithoutGuardians().length > 0)
      recommendations.push('Appoint guardians for minors.');
    if (this.findUnverifiedCriticalRelationships().length > 0)
      recommendations.push('Verify critical relationships.');
    if (!this.family.getMetadata().familyHeadId)
      recommendations.push('Consider appointing a family head.');

    return {
      isReady: integrity.isValid && score >= 70,
      score,
      criticalIssues: integrity.issues.filter((i) => i.type === 'ERROR').map((i) => i.message),
      recommendations,
    };
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private updateTreeStatistics(): void {
    // Stub for future statistics updating logic
  }

  private getCriticalRelationshipsForMember(memberId: string): Relationship[] {
    const criticalTypes = ['PARENT', 'CHILD', 'SPOUSE'];
    return Array.from(this.relationships.values()).filter(
      (r) =>
        (r.getFromMemberId() === memberId || r.getToMemberId() === memberId) &&
        criticalTypes.includes(r.getType()),
    );
  }

  private isCriticalRelationship(relationship: Relationship): boolean {
    return ['PARENT', 'CHILD', 'SPOUSE'].includes(relationship.getType());
  }

  private areAllCriticalRelationshipsVerified(): boolean {
    return Array.from(this.relationships.values())
      .filter((r) => this.isCriticalRelationship(r))
      .every((r) => r.getIsVerified());
  }

  private findOrphanedMembers(): string[] {
    const connected = new Set<string>();
    this.relationships.forEach((r) => {
      connected.add(r.getFromMemberId());
      connected.add(r.getToMemberId());
    });
    this.marriages.forEach((m) => {
      connected.add(m.getSpouse1Id());
      connected.add(m.getSpouse2Id());
    });
    return Array.from(this.members.values())
      .filter((m) => !connected.has(m.getId()))
      .map((m) => m.getId());
  }

  private findMinorsWithoutGuardians(): string[] {
    const minors = Array.from(this.members.values()).filter(
      (m) => m.getIsMinor() && !m.getIsDeceased(),
    );
    const protectedWards = new Set(
      Array.from(this.guardianships.values())
        .filter((g) => g.getIsActiveRecord())
        .map((g) => g.getWardId()),
    );
    return minors.filter((m) => !protectedWards.has(m.getId())).map((m) => m.getId());
  }

  private findUnverifiedCriticalRelationships(): string[] {
    return Array.from(this.relationships.values())
      .filter((r) => this.isCriticalRelationship(r) && !r.getIsVerified())
      .map((r) => r.getId());
  }

  private identifyPotentialHeirs(deceasedMemberId?: string): string[] {
    if (!deceasedMemberId) return [];
    const heirs: string[] = [];

    this.marriages.forEach((m) => {
      if (m.getIsActive()) {
        if (m.getSpouse1Id() === deceasedMemberId) heirs.push(m.getSpouse2Id());
        if (m.getSpouse2Id() === deceasedMemberId) heirs.push(m.getSpouse1Id());
      }
    });

    this.relationships.forEach((r) => {
      if (r.getFromMemberId() === deceasedMemberId && r.getType() === 'CHILD')
        heirs.push(r.getToMemberId());
    });

    return heirs;
  }

  private identifyLegalDependants(deceasedMemberId?: string): string[] {
    if (!deceasedMemberId) return [];
    const dependants = this.identifyPotentialHeirs(deceasedMemberId);

    this.relationships.forEach((r) => {
      if (r.getToMemberId() === deceasedMemberId && r.getType() === 'PARENT') {
        const parent = this.members.get(r.getFromMemberId());
        if (parent && parent.getMetadata().dependencyStatus !== 'INDEPENDENT')
          dependants.push(parent.getId());
      }
    });
    return dependants;
  }

  private determineSuccessionType(): 'TESTATE' | 'INTESTATE' | 'MIXED' {
    return 'INTESTATE';
  }

  private assessSuccessionComplexity(): 'SIMPLE' | 'MODERATE' | 'COMPLEX' {
    const polygamous = Array.from(this.marriages.values()).filter(
      (m) => m.allowsPolygamy() && m.getIsActive(),
    );
    const minors = Array.from(this.members.values()).filter(
      (m) => m.getIsMinor() && !m.getIsDeceased(),
    );
    const customary = Array.from(this.marriages.values()).filter(
      (m) => m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
    );

    if (polygamous.length > 1 || minors.length > 3) return 'COMPLEX';
    if (customary.length > 0 || minors.length > 0) return 'MODERATE';
    return 'SIMPLE';
  }

  private generateSuccessionRecommendations(): string[] {
    const recommendations: string[] = [];
    const readiness = this.getSuccessionReadiness();
    if (!readiness.isReady) recommendations.push('Address critical issues.');

    const minors = this.findMinorsWithoutGuardians();
    if (minors.length > 0) recommendations.push(`Appoint guardians for ${minors.length} minor(s).`);

    const unverified = this.findUnverifiedCriticalRelationships();
    if (unverified.length > 0)
      recommendations.push(`Verify ${unverified.length} critical relationship(s).`);

    if (this.assessSuccessionComplexity() === 'COMPLEX')
      recommendations.push('Consider legal assistance.');
    return recommendations;
  }

  // --------------------------------------------------------------------------
  // ACCESSORS
  // --------------------------------------------------------------------------

  getMembers(): FamilyMember[] {
    return Array.from(this.members.values());
  }
  getRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }
  getMarriages(): Marriage[] {
    return Array.from(this.marriages.values());
  }
  getGuardianships(): Guardianship[] {
    return Array.from(this.guardianships.values());
  }
  getFamily(): Family {
    return this.family;
  }

  getSnapshot(): FamilyTreeSnapshot {
    const members = this.getMembers();
    const integrity = this.validateTreeIntegrity();

    return {
      family: this.family,
      members,
      relationships: this.getRelationships(),
      marriages: this.getMarriages(),
      guardianships: this.getGuardianships(),
      statistics: {
        totalMembers: members.length,
        livingMembers: members.filter((m) => !m.getIsDeceased()).length,
        deceasedMembers: members.filter((m) => m.getIsDeceased()).length,
        minorCount: members.filter((m) => m.getIsMinor()).length,
        marriageCount: this.marriages.size,
        customaryMarriageCount: Array.from(this.marriages.values()).filter(
          (m) => m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
        ).length,
        verifiedRelationships: Array.from(this.relationships.values()).filter((r) =>
          r.getIsVerified(),
        ).length,
        activeGuardianships: Array.from(this.guardianships.values()).filter((g) =>
          g.getIsActiveRecord(),
        ).length,
      },
      integrity: {
        hasCircularRelationships: integrity.issues.some((i) => i.code === 'CIRCULAR_RELATIONSHIPS'),
        orphanedMembers: this.findOrphanedMembers(),
        minorsWithoutGuardians: this.findMinorsWithoutGuardians(),
        unverifiedCriticalRelationships: this.findUnverifiedCriticalRelationships(),
      },
    };
  }
}
