import { AggregateRoot } from '@nestjs/cqrs';
import { Family } from '../entities/family.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Relationship } from '../entities/relationship.entity';
import { Marriage } from '../entities/marriage.entity';
import { Guardianship } from '../entities/guardianship.entity';

// Policies (Used as pure functions or logic within)
import { RelationshipValidationPolicy } from '../policies/relationship-validation.policy';
import { FamilyTreeIntegrityPolicy } from '../policies/family-tree-integrity.policy';

export class FamilyTreeAggregate extends AggregateRoot {
  private family: Family;

  // The Graph Components
  private members: Map<string, FamilyMember> = new Map();
  private relationships: Map<string, Relationship> = new Map(); // Blood
  private marriages: Map<string, Marriage> = new Map(); // Spousal
  private guardianships: Map<string, Guardianship> = new Map();

  // Helper Policies (Injected or Instantiated)
  private relValidationPolicy = new RelationshipValidationPolicy();
  private integrityPolicy = new FamilyTreeIntegrityPolicy();

  private constructor(family: Family) {
    super();
    this.family = family;
  }

  // --------------------------------------------------------------------------
  // RECONSTITUTION (Loading from DB)
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
    if (this.members.has(member.getId())) {
      throw new Error(`Member ${member.getId()} already exists in this tree.`);
    }
    if (member.getFamilyId() !== this.family.getId()) {
      throw new Error('Member belongs to a different family.');
    }
    this.members.set(member.getId(), member);
  }

  removeMember(memberId: string): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found.`);
    }
    // Validation: Can we remove a node with edges?
    // Strict Mode: No, must remove relationships first.
    const hasEdges =
      Array.from(this.relationships.values()).some(
        (r) => r.getFromMemberId() === memberId || r.getToMemberId() === memberId,
      ) ||
      Array.from(this.marriages.values()).some(
        (m) => m.getSpouse1Id() === memberId || m.getSpouse2Id() === memberId,
      );

    if (hasEdges) {
      throw new Error(
        'Cannot remove member with existing relationships/marriages. Remove links first.',
      );
    }

    const member = this.members.get(memberId);
    member?.remove('Removed from tree');
    this.members.delete(memberId);
  }

  // --------------------------------------------------------------------------
  // RELATIONSHIP (BLOOD) MANAGEMENT
  // --------------------------------------------------------------------------

  addRelationship(relationship: Relationship): void {
    const fromId = relationship.getFromMemberId();
    const toId = relationship.getToMemberId();
    const type = relationship.getType();

    // 1. Existence Check
    const fromMember = this.members.get(fromId);
    const toMember = this.members.get(toId);

    if (!fromMember || !toMember) {
      throw new Error('Both members must exist in the tree to create a relationship.');
    }

    // 2. Policy: Biological Validation (Age etc.)
    const validation = this.relValidationPolicy.validateRelationship(fromMember, toMember, type);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 3. Policy: Cycle Detection (Graph Integrity)
    const existingArray = Array.from(this.relationships.values());
    const hasCycle = this.integrityPolicy.checkCycle(fromId, toId, type, existingArray);

    if (hasCycle) {
      throw new Error('This relationship creates a cycle in the family tree.');
    }

    this.relationships.set(relationship.getId(), relationship);
  }

  removeRelationship(relationshipId: string): void {
    if (!this.relationships.has(relationshipId)) {
      throw new Error('Relationship not found.');
    }
    const rel = this.relationships.get(relationshipId);
    rel?.remove('Removed by user');
    this.relationships.delete(relationshipId);
  }

  // --------------------------------------------------------------------------
  // MARRIAGE MANAGEMENT
  // --------------------------------------------------------------------------

  registerMarriage(marriage: Marriage): void {
    const s1 = marriage.getSpouse1Id();
    const s2 = marriage.getSpouse2Id();

    // 1. Existence
    if (!this.members.has(s1) || !this.members.has(s2)) {
      throw new Error('Both spouses must be members of the tree.');
    }

    // 2. Active Marriage Check (Simple logic, detailed logic in Policy Service usually)
    // Ensure these two aren't already married to each other
    const existing = Array.from(this.marriages.values()).find(
      (m) =>
        m.getIsActive() &&
        ((m.getSpouse1Id() === s1 && m.getSpouse2Id() === s2) ||
          (m.getSpouse1Id() === s2 && m.getSpouse2Id() === s1)),
    );

    if (existing) {
      throw new Error('These members are already listed as married.');
    }

    this.marriages.set(marriage.getId(), marriage);
  }

  dissolveMarriage(marriageId: string, date: Date, cert: string): void {
    const marriage = this.marriages.get(marriageId);
    if (!marriage) throw new Error('Marriage not found.');

    marriage.dissolve(date, cert);
  }

  // --------------------------------------------------------------------------
  // GUARDIANSHIP MANAGEMENT
  // --------------------------------------------------------------------------

  assignGuardian(guardianship: Guardianship): void {
    const ward = this.members.get(guardianship.getWardId());
    const guardian = this.members.get(guardianship.getGuardianId());

    if (!ward || !guardian) throw new Error('Guardian and Ward must be in tree.');

    // Note: Detailed eligibility checked by Policy Service before creation.
    // Here we just enforce uniqueness.

    this.guardianships.set(guardianship.getId(), guardianship);
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
}
