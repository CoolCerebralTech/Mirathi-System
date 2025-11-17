import { AggregateRoot } from '@nestjs/cqrs';
import { RelationshipType, GuardianType } from '@prisma/client';
import { Family } from '../entities/family.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';
import { FamilyTree } from '../value-objects/family-tree.vo';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { MarriageRegisteredEvent } from '../events/marriage-registered.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';

export class FamilyAggregate extends AggregateRoot {
  private family: Family;
  private members: Map<string, FamilyMember> = new Map();
  private marriages: Map<string, Marriage> = new Map();
  private guardianships: Map<string, Guardianship> = new Map();

  constructor(family: Family) {
    super();
    this.family = family;
  }

  // Family methods
  getFamily(): Family {
    return this.family;
  }

  updateFamilyDetails(name: string, description: string): void {
    this.family.updateDetails(name, description);
  }

  updateFamilyMetadata(metadata: any): void {
    this.family.updateMetadata(metadata);
  }

  // Member management
  addMember(member: FamilyMember): void {
    if (this.members.has(member.getId())) {
      throw new Error(`Member ${member.getId()} already exists in this family`);
    }

    this.members.set(member.getId(), member);

    // Update family tree if it exists
    if (this.family.getTreeData()) {
      const treeNode = {
        id: member.getId(),
        personId: member.getId(),
        firstName: member.getPersonalDetails().firstName,
        lastName: member.getPersonalDetails().lastName,
        dateOfBirth: member.getPersonalDetails().dateOfBirth,
        dateOfDeath: member.getPersonalDetails().dateOfDeath,
        isDeceased: member.getIsDeceased(),
        isMinor: member.getIsMinor(),
        relationships: []
      };
      this.family.addFamilyMemberToTree(treeNode);
    }

    this.apply(new FamilyMemberAddedEvent(member.getId(), this.family.getId(), member.getAddedBy()));
  }

  updateMember(memberId: string, updates: Partial<FamilyMember>): void {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found in family`);
    }

    // Apply updates (in reality, we'd use proper methods on FamilyMember)
    // For now, we'll simulate the update
    if (updates.getPersonalDetails) {
      member.updatePersonalDetails(updates.getPersonalDetails());
    }

    if (updates.getContactInfo) {
      member.updateContactInfo(updates.getContactInfo());
    }

    if (updates.getRelationshipType && updates.getRelationshipTo) {
      member.updateRelationship(updates.getRelationshipType(), updates.getRelationshipTo());
    }
  }

  removeMember(memberId: string): void {
    if (!this.members.has(memberId)) {
      throw new Error(`Member ${memberId} not found in family`);
    }

    // Check if member has active guardianships
    const activeGuardianships = Array.from(this.guardianships.values()).filter(
      guardianship => 
        (guardianship.getGuardianId() === memberId || guardianship.getWardId() === memberId) &&
        guardianship.getIsActive()
    );

    if (activeGuardianships.length > 0) {
      throw new Error(`Cannot remove member with active guardianships`);
    }

    // Check if member has active marriages
    const activeMarriages = Array.from(this.marriages.values()).filter(
      marriage => 
        (marriage.getSpouse1Id() === memberId || marriage.getSpouse2Id() === memberId) &&
        marriage.getIsActive()
    );

    if (activeMarriages.length > 0) {
      throw new Error(`Cannot remove member with active marriages`);
    }

    this.members.delete(memberId);

    // Remove from family tree if it exists
    if (this.family.getTreeData()) {
      // Note: FamilyTree VO doesn't have removeNode method yet, we'd need to add it
      // this.family.getTreeData()?.removeNode(memberId);
    }
  }

  getMember(memberId: string): FamilyMember | undefined {
    return this.members.get(memberId);
  }

  getAllMembers(): FamilyMember[] {
    return Array.from(this.members.values());
  }

  getMembersByRelationship(relationshipType: RelationshipType): FamilyMember[] {
    return Array.from(this.members.values()).filter(
      member => member.getRelationshipType().getRelationshipType() === relationshipType
    );
  }

  // Marriage management
  registerMarriage(marriage: Marriage): void {
    if (this.marriages.has(marriage.getId())) {
      throw new Error(`Marriage ${marriage.getId()} already exists in this family`);
    }

    // Validate both spouses are family members
    if (!this.members.has(marriage.getSpouse1Id()) || !this.members.has(marriage.getSpouse2Id())) {
      throw new Error('Both spouses must be family members');
    }

    this.marriages.set(marriage.getId(), marriage);

    // Update family tree if it exists
    if (this.family.getTreeData()) {
      this.family.addRelationshipToTree(
        marriage.getSpouse1Id(),
        marriage.getSpouse2Id(),
        RelationshipType.SPOUSE
      );
    }

    this.apply(new MarriageRegisteredEvent(
      marriage.getId(),
      this.family.getId(),
      marriage.getSpouse1Id(),
      marriage.getSpouse2Id()
    ));
  }

  dissolveMarriage(marriageId: string, divorceDate: Date, divorceCertNumber?: string): void {
    const marriage = this.marriages.get(marriageId);
    if (!marriage) {
      throw new Error(`Marriage ${marriageId} not found in family`);
    }

    marriage.dissolve(divorceDate, divorceCertNumber);

    // Update family tree if it exists
    if (this.family.getTreeData()) {
      // Note: We'd need to update the relationship status in the tree
      // This would require enhancing the FamilyTree VO
    }
  }

  getMarriage(marriageId: string): Marriage | undefined {
    return this.marriages.get(marriageId);
  }

  getAllMarriages(): Marriage[] {
    return Array.from(this.marriages.values());
  }

  getActiveMarriages(): Marriage[] {
    return Array.from(this.marriages.values()).filter(marriage => marriage.getIsActive());
  }

  // Guardianship management
  assignGuardian(guardianship: Guardianship): void {
    if (this.guardianships.has(guardianship.getId())) {
      throw new Error(`Guardianship ${guardianship.getId()} already exists in this family`);
    }

    // Validate both guardian and ward are family members
    if (!this.members.has(guardianship.getGuardianId()) || !this.members.has(guardianship.getWardId())) {
      throw new Error('Both guardian and ward must be family members');
    }

    // Validate ward is a minor or dependent
    const ward = this.members.get(guardianship.getWardId());
    if (!ward?.getIsMinor() && !this.isDependentAdult(ward)) {
      throw new Error('Ward must be a minor or dependent adult');
    }

    // Validate no conflicting active guardianships for the same ward
    const existingGuardianships = Array.from(this.guardianships.values()).filter(
      g => g.getWardId() === guardianship.getWardId() && g.getIsActive()
    );

    if (existingGuardianships.length > 0) {
      throw new Error('Ward already has an active guardianship');
    }

    this.guardianships.set(guardianship.getId(), guardianship);

    this.apply(new GuardianAssignedEvent(
      guardianship.getId(),
      guardianship.getGuardianId(),
      guardianship.getWardId(),
      guardianship.getGuardianType()
    ));
  }

  updateGuardianship(guardianshipId: string, updates: Partial<Guardianship>): void {
    const guardianship = this.guardianships.get(guardianshipId);
    if (!guardianship) {
      throw new Error(`Guardianship ${guardianshipId} not found in family`);
    }

    // Apply updates (in reality, we'd use proper methods on Guardianship)
    if (updates.getGuardianType) {
      guardianship.updateGuardianType(updates.getGuardianType());
    }

    if (updates.getResponsibilities) {
      guardianship.updateResponsibilities(updates.getResponsibilities());
    }
  }

  terminateGuardianship(guardianshipId: string, terminationDate: Date, reason: string): void {
    const guardianship = this.guardianships.get(guardianshipId);
    if (!guardianship) {
      throw new Error(`Guardianship ${guardianshipId} not found in family`);
    }

    guardianship.terminate(terminationDate, reason);
  }

  getGuardianship(guardianshipId: string): Guardianship | undefined {
    return this.guardianships.get(guardianshipId);
  }

  getAllGuardianships(): Guardianship[] {
    return Array.from(this.guardianships.values());
  }

  getActiveGuardianships(): Guardianship[] {
    return Array.from(this.guardianships.values()).filter(guardianship => guardianship.getIsActive());
  }

  getGuardianshipsForWard(wardId: string): Guardianship[] {
    return Array.from(this.guardianships.values()).filter(
      guardianship => guardianship.getWardId() === wardId
    );
  }

  getGuardianshipsByGuardian(guardianId: string): Guardianship[] {
    return Array.from(this.guardianships.values()).filter(
      guardianship => guardianship.getGuardianId() === guardianId
    );
  }

  // Kenyan family specific business logic
  identifyDependants(personId: string): FamilyMember[] {
    const person = this.members.get(personId);
    if (!person) return [];

    const dependants: FamilyMember[] = [];

    // Spouse
    const spouseMarriages = Array.from(this.marriages.values()).filter(
      marriage => 
        (marriage.getSpouse1Id() === personId || marriage.getSpouse2Id() === personId) &&
        marriage.getIsActive()
    );

    for (const marriage of spouseMarriages) {
      const spouseId = marriage.getSpouse1Id() === personId ? marriage.getSpouse2Id() : marriage.getSpouse1Id();
      const spouse = this.members.get(spouseId);
      if (spouse && !spouse.getIsDeceased()) {
        dependants.push(spouse);
      }
    }

    // Children
    const children = Array.from(this.members.values()).filter(member => {
      // This is simplified - in reality, we'd check parent-child relationships in the tree
      return !member.getIsDeceased() && member.getIsMinor();
    });

    dependants.push(...children);

    // Parents (if dependent)
    const parents = Array.from(this.members.values()).filter(member => {
      // Simplified - check if they might be parents and are elderly/dependent
      const age = member.getAge();
      return age !== null && age >= 65 && !member.getIsDeceased();
    });

    dependants.push(...parents);

    return dependants;
  }

  validateFamilyStructure(): { isValid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for minors without guardians
    const minors = Array.from(this.members.values()).filter(member => member.getIsMinor());
    for (const minor of minors) {
      const guardianships = this.getGuardianshipsForWard(minor.getId());
      const activeGuardianships = guardianships.filter(g => g.getIsActive());

      if (activeGuardianships.length === 0) {
        issues.push(`Minor ${minor.getFullName()} has no active guardian assigned`);
        recommendations.push(`Assign a legal guardian for ${minor.getFullName()}`);
      }
    }

    // Check for elderly members who might need care
    const elderly = Array.from(this.members.values()).filter(member => {
      const age = member.getAge();
      return age !== null && age >= 70 && !member.getIsDeceased();
    });

    if (elderly.length > 0) {
      recommendations.push('Consider care arrangements for elderly family members');
    }

    // Check family tree integrity
    if (this.family.getTreeData()) {
      const treeValidation = this.family.getTreeData().validateTreeIntegrity();
      if (!treeValidation.isValid) {
        issues.push(...treeValidation.issues);
      }
    }

    // Validate marriages
    for (const marriage of this.marriages.values()) {
      const validation = marriage.validateForSuccession();
      if (!validation.isValid) {
        issues.push(...validation.issues.map(issue => `Marriage ${marriage.getId()}: ${issue}`));
      }
    }

    // Validate guardianships
    for (const guardianship of this.guardianships.values()) {
      const validation = guardianship.validateForKenyanLaw();
      if (!validation.isValid) {
        issues.push(...validation.issues.map(issue => `Guardianship ${guardianship.getId()}: ${issue}`));
      }
      recommendations.push(...validation.recommendations);
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  getFamilyElders(): FamilyMember[] {
    return Array.from(this.members.values()).filter(member => 
      member.isElder() && !member.getIsDeceased()
    );
  }

  getSuccessionLine(personId: string): FamilyMember[] {
    // Kenyan intestate succession order: spouse, children, parents, siblings
    const successionOrder: FamilyMember[] = [];
    const person = this.members.get(personId);
    if (!person) return successionOrder;

    // Spouse
    const spouseMarriages = Array.from(this.marriages.values()).filter(
      marriage => 
        (marriage.getSpouse1Id() === personId || marriage.getSpouse2Id() === personId) &&
        marriage.getIsActive()
    );

    for (const marriage of spouseMarriages) {
      const spouseId = marriage.getSpouse1Id() === personId ? marriage.getSpouse2Id() : marriage.getSpouse1Id();
      const spouse = this.members.get(spouseId);
      if (spouse && !spouse.getIsDeceased()) {
        successionOrder.push(spouse);
      }
    }

    // Children
    const children = Array.from(this.members.values()).filter(member => {
      // Simplified - in reality, we'd check parent-child relationships
      return !member.getIsDeceased() && member.hasInheritanceRights();
    });

    successionOrder.push(...children);

    // Parents
    const parents = Array.from(this.members.values()).filter(member => {
      // Simplified - check potential parents
      return !member.getIsDeceased() && member.getRelationshipType().getRelationshipType() === RelationshipType.PARENT;
    });

    successionOrder.push(...parents);

    // Siblings
    const siblings = Array.from(this.members.values()).filter(member => {
      // Simplified - check potential siblings
      return !member.getIsDeceased() && member.getRelationshipType().getRelationshipType() === RelationshipType.SIBLING;
    });

    successionOrder.push(...siblings);

    return successionOrder;
  }

  // Utility methods
  private isDependentAdult(member: FamilyMember | undefined): boolean {
    if (!member) return false;

    // Check if adult is disabled or otherwise dependent
    // This would require additional member attributes
    return false;
  }

  // Static factory method
  static create(
    id: string,
    name: string,
    creatorId: string
  ): FamilyAggregate {
    const family = Family.create(id, name, creatorId);
    const aggregate = new FamilyAggregate(family);
    aggregate.apply(new FamilyCreatedEvent(id, name, creatorId));
    return aggregate;
  }
}