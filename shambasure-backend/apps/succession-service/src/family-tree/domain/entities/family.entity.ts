import { AggregateRoot } from '@nestjs/cqrs';
import { FamilyTree } from '../value-objects/family-tree.vo';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyUpdatedEvent } from '../events/family-updated.event';

export interface FamilyMetadata {
  culturalBackground?: string;
  ancestralHome?: string;
  clanName?: string;
  totem?: string; // For some Kenyan communities
  familyValues?: string[];
  specialTraditions?: string[];
}

export class Family extends AggregateRoot {
  private id: string;
  private name: string;
  private description: string;
  private creatorId: string;
  private treeData: FamilyTree | null;
  private metadata: FamilyMetadata;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(
    id: string,
    name: string,
    creatorId: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super();

    if (!name?.trim()) {
      throw new Error('Family name is required');
    }

    if (!creatorId) {
      throw new Error('Family creator is required');
    }

    this.id = id;
    this.name = name.trim();
    this.creatorId = creatorId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
    this.description = '';
    this.treeData = null;
    this.metadata = {};
    this.isActive = true;
    this.deletedAt = null;
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string {
    return this.description;
  }
  getCreatorId(): string {
    return this.creatorId;
  }
  getTreeData(): FamilyTree | null {
    return this.treeData;
  }
  getMetadata(): Readonly<FamilyMetadata> {
    return { ...this.metadata };
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }
  getDeletedAt(): Date | null {
    return this.deletedAt ? new Date(this.deletedAt) : null;
  }

  // Business methods
  updateDetails(name: string, description: string): void {
    if (!name?.trim()) {
      throw new Error('Family name cannot be empty');
    }

    this.name = name.trim();
    this.description = description.trim();
    this.updatedAt = new Date();

    this.apply(new FamilyUpdatedEvent(this.id, this.creatorId));
  }

  setTreeData(treeData: FamilyTree): void {
    // Validate tree integrity before setting
    const validation = treeData.validateTreeIntegrity();
    if (!validation.isValid) {
      throw new Error(`Invalid family tree data: ${validation.issues.join(', ')}`);
    }

    this.treeData = treeData;
    this.updatedAt = new Date();

    this.apply(new FamilyUpdatedEvent(this.id, this.creatorId));
  }

  updateMetadata(metadata: FamilyMetadata): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  addCulturalBackground(background: string): void {
    if (!this.metadata.culturalBackground) {
      this.metadata.culturalBackground = background;
    } else {
      this.metadata.culturalBackground += `; ${background}`;
    }
    this.updatedAt = new Date();
  }

  setAncestralHome(location: string): void {
    this.metadata.ancestralHome = location;
    this.updatedAt = new Date();
  }

  setClanInfo(clanName: string, totem?: string): void {
    this.metadata.clanName = clanName;
    if (totem) {
      this.metadata.totem = totem;
    }
    this.updatedAt = new Date();
  }

  addFamilyValue(value: string): void {
    if (!this.metadata.familyValues) {
      this.metadata.familyValues = [];
    }
    this.metadata.familyValues.push(value);
    this.updatedAt = new Date();
  }

  addTradition(tradition: string): void {
    if (!this.metadata.specialTraditions) {
      this.metadata.specialTraditions = [];
    }
    this.metadata.specialTraditions.push(tradition);
    this.updatedAt = new Date();
  }

  // Family tree operations (delegated to the FamilyTree value object)
  addFamilyMemberToTree(memberData: any): void {
    if (!this.treeData) {
      throw new Error('Family tree not initialized');
    }

    this.treeData.addNode(memberData);
    this.updatedAt = new Date();

    this.apply(new FamilyUpdatedEvent(this.id, this.creatorId));
  }

  addRelationshipToTree(fromPersonId: string, toPersonId: string, relationshipType: any): void {
    if (!this.treeData) {
      throw new Error('Family tree not initialized');
    }

    this.treeData.addRelationship(
      fromPersonId,
      toPersonId,
      relationshipType,
      this.getReciprocalType(relationshipType),
    );
    this.updatedAt = new Date();

    this.apply(new FamilyUpdatedEvent(this.id, this.creatorId));
  }

  // Kenyan family specific methods
  getFamilyElders(): any[] {
    if (!this.treeData) return [];

    const nodes = this.treeData.getAllNodes();
    return nodes.filter((node) => {
      if (!node.dateOfBirth) return false;
      const age = this.calculateAge(node.dateOfBirth);
      return age >= 60 && !node.isDeceased; // Elders are 60+ and alive
    });
  }

  getMinors(): any[] {
    if (!this.treeData) return [];

    const nodes = this.treeData.getAllNodes();
    return nodes.filter((node) => node.isMinor && !node.isDeceased);
  }

  getPotentialSuccessors(personId: string): any[] {
    if (!this.treeData) return [];

    // Kenyan succession typically looks at spouse, children, parents, siblings
    const person = this.treeData.getNode(personId);
    if (!person) return [];

    const successors: any[] = [];

    // Spouse
    const spouse = person.relationships.find((rel) => rel.relationshipType === 'SPOUSE');
    if (spouse) {
      const spouseNode = this.treeData.getNode(spouse.targetPersonId);
      if (spouseNode && !spouseNode.isDeceased) {
        successors.push(spouseNode);
      }
    }

    // Children
    const children = person.relationships
      .filter((rel) => rel.relationshipType === 'CHILD' || rel.relationshipType === 'ADOPTED_CHILD')
      .map((rel) => this.treeData.getNode(rel.targetPersonId))
      .filter(Boolean)
      .filter((node) => !node.isDeceased) as any[];

    successors.push(...children);

    // If no spouse or children, look for parents
    if (successors.length === 0) {
      const parents = person.relationships
        .filter((rel) => rel.relationshipType === 'PARENT')
        .map((rel) => this.treeData.getNode(rel.targetPersonId))
        .filter(Boolean)
        .filter((node) => !node.isDeceased) as any[];

      successors.push(...parents);
    }

    // If no parents, look for siblings
    if (successors.length === 0) {
      const siblings = this.treeData.findSiblings(personId).filter((node) => !node.isDeceased);
      successors.push(...siblings);
    }

    return successors;
  }

  // Soft delete
  softDelete(): void {
    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  // Validation
  validateFamilyCompleteness(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.treeData) {
      issues.push('Family tree not initialized');
      return { isValid: false, issues };
    }

    // Check for at least one member
    const nodes = this.treeData.getAllNodes();
    if (nodes.length === 0) {
      issues.push('Family has no members');
    }

    // Check for root person (usually the creator)
    const rootNode = this.treeData.getRootNode();
    if (!rootNode) {
      issues.push('Family tree has no root person');
    }

    // Validate tree integrity
    const treeValidation = this.treeData.validateTreeIntegrity();
    if (!treeValidation.isValid) {
      issues.push(...treeValidation.issues);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Utility methods
  private getReciprocalType(relationshipType: any): any {
    const reciprocalMap: Record<string, string> = {
      PARENT: 'CHILD',
      CHILD: 'PARENT',
      SPOUSE: 'SPOUSE',
      SIBLING: 'SIBLING',
      GRANDPARENT: 'GRANDCHILD',
      GRANDCHILD: 'GRANDPARENT',
    };

    return reciprocalMap[relationshipType] || 'OTHER';
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Static factory method
  static create(id: string, name: string, creatorId: string): Family {
    const family = new Family(id, name, creatorId);
    family.apply(new FamilyCreatedEvent(id, name, creatorId));
    return family;
  }
}
