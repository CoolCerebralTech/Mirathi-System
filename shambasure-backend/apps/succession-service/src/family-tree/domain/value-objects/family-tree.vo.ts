import { RelationshipType } from '@prisma/client';

export interface FamilyTreeNode {
  id: string;
  personId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  isDeceased: boolean;
  isMinor: boolean;
  relationships: FamilyTreeRelationship[];
}

export interface FamilyTreeRelationship {
  targetPersonId: string;
  relationshipType: RelationshipType;
  reciprocalType: RelationshipType;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export class FamilyTree {
  private readonly nodes: Map<string, FamilyTreeNode> = new Map();
  private readonly rootPersonId: string;

  constructor(rootPersonId: string, nodes: FamilyTreeNode[] = []) {
    this.rootPersonId = rootPersonId;
    nodes.forEach((node) => this.nodes.set(node.id, node));
  }

  // Core tree operations
  addNode(node: FamilyTreeNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node ${node.id} already exists in family tree`);
    }
    this.nodes.set(node.id, node);
  }

  removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node ${nodeId} not found in family tree`);
    }

    // Remove all relationships involving this node
    for (const node of this.nodes.values()) {
      node.relationships = node.relationships.filter((rel) => rel.targetPersonId !== nodeId);
    }

    this.nodes.delete(nodeId);
  }

  addRelationship(
    fromPersonId: string,
    toPersonId: string,
    relationshipType: RelationshipType,
    reciprocalType: RelationshipType,
    startDate?: Date,
    endDate?: Date,
  ): void {
    const fromNode = this.nodes.get(fromPersonId);
    const toNode = this.nodes.get(toPersonId);

    if (!fromNode) {
      throw new Error(`Source person ${fromPersonId} not found`);
    }
    if (!toNode) {
      throw new Error(`Target person ${toPersonId} not found`);
    }

    // Check if relationship already exists
    const existingRelationship = fromNode.relationships.find(
      (rel) => rel.targetPersonId === toPersonId,
    );

    if (existingRelationship) {
      throw new Error(`Relationship already exists between ${fromPersonId} and ${toPersonId}`);
    }

    // Add relationship
    fromNode.relationships.push({
      targetPersonId: toPersonId,
      relationshipType,
      reciprocalType,
      startDate,
      endDate,
      isActive: !endDate,
    });

    // Add reciprocal relationship
    toNode.relationships.push({
      targetPersonId: fromPersonId,
      relationshipType: reciprocalType,
      reciprocalType: relationshipType,
      startDate,
      endDate,
      isActive: !endDate,
    });
  }

  removeRelationship(fromPersonId: string, toPersonId: string): void {
    const fromNode = this.nodes.get(fromPersonId);
    const toNode = this.nodes.get(toPersonId);

    if (!fromNode || !toNode) {
      throw new Error('One or both persons not found in family tree');
    }

    // Remove relationship from both nodes
    fromNode.relationships = fromNode.relationships.filter(
      (rel) => rel.targetPersonId !== toPersonId,
    );
    toNode.relationships = toNode.relationships.filter(
      (rel) => rel.targetPersonId !== fromPersonId,
    );
  }

  // Query operations
  getNode(personId: string): FamilyTreeNode | undefined {
    return this.nodes.get(personId);
  }

  getRootNode(): FamilyTreeNode | undefined {
    return this.nodes.get(this.rootPersonId);
  }

  getAllNodes(): FamilyTreeNode[] {
    return Array.from(this.nodes.values());
  }

  getRelationships(personId: string): FamilyTreeRelationship[] {
    const node = this.nodes.get(personId);
    return node ? [...node.relationships] : [];
  }

  getRelationship(fromPersonId: string, toPersonId: string): FamilyTreeRelationship | undefined {
    const node = this.nodes.get(fromPersonId);
    return node?.relationships.find((rel) => rel.targetPersonId === toPersonId);
  }

  // Family analysis operations
  findAncestors(personId: string, maxGenerations: number = 10): FamilyTreeNode[] {
    const ancestors: FamilyTreeNode[] = [];
    this.traverseAncestors(personId, ancestors, maxGenerations, 0);
    return ancestors;
  }

  findDescendants(personId: string, maxGenerations: number = 10): FamilyTreeNode[] {
    const descendants: FamilyTreeNode[] = [];
    this.traverseDescendants(personId, descendants, maxGenerations, 0);
    return descendants;
  }

  findSiblings(personId: string): FamilyTreeNode[] {
    const person = this.nodes.get(personId);
    if (!person) return [];

    // Find parents first
    const parents = person.relationships
      .filter(
        (rel) =>
          rel.relationshipType === RelationshipType.PARENT ||
          rel.reciprocalType === RelationshipType.CHILD,
      )
      .map((rel) => this.nodes.get(rel.targetPersonId))
      .filter(Boolean) as FamilyTreeNode[];

    // Find all children of those parents (siblings)
    const siblings = new Map<string, FamilyTreeNode>();

    for (const parent of parents) {
      const parentChildren = parent.relationships
        .filter(
          (rel) =>
            rel.relationshipType === RelationshipType.CHILD ||
            rel.reciprocalType === RelationshipType.PARENT,
        )
        .map((rel) => this.nodes.get(rel.targetPersonId))
        .filter(Boolean) as FamilyTreeNode[];

      parentChildren.forEach((child) => {
        if (child.id !== personId) {
          siblings.set(child.id, child);
        }
      });
    }

    return Array.from(siblings.values());
  }

  // Kenyan-specific family analysis
  findDependants(personId: string): FamilyTreeNode[] {
    const person = this.nodes.get(personId);
    if (!person) return [];

    const dependants: FamilyTreeNode[] = [];

    // Spouse
    const spouse = person.relationships.find(
      (rel) => rel.relationshipType === RelationshipType.SPOUSE,
    );
    if (spouse) {
      const spouseNode = this.nodes.get(spouse.targetPersonId);
      if (spouseNode) dependants.push(spouseNode);
    }

    // Children (including minors and adult dependents)
    const children = person.relationships
      .filter(
        (rel) =>
          rel.relationshipType === RelationshipType.CHILD ||
          rel.relationshipType === RelationshipType.ADOPTED_CHILD,
      )
      .map((rel) => this.nodes.get(rel.targetPersonId))
      .filter(Boolean) as FamilyTreeNode[];

    // Filter children who are dependents (minors, disabled, or in education)
    const dependentChildren = children.filter(
      (child) => child.isMinor || this.isDisabled(child) || this.isInEducation(child),
    );

    dependants.push(...dependentChildren);

    // Parents who are dependents
    const parents = person.relationships
      .filter((rel) => rel.relationshipType === RelationshipType.PARENT)
      .map((rel) => this.nodes.get(rel.targetPersonId))
      .filter(Boolean) as FamilyTreeNode[];

    const dependentParents = parents.filter((parent) => this.isDependentParent(parent, personId));

    dependants.push(...dependentParents);

    return dependants;
  }

  // Utility methods
  private traverseAncestors(
    personId: string,
    ancestors: FamilyTreeNode[],
    maxGenerations: number,
    currentGeneration: number,
  ): void {
    if (currentGeneration >= maxGenerations) return;

    const person = this.nodes.get(personId);
    if (!person) return;

    const parents = person.relationships
      .filter((rel) => rel.relationshipType === RelationshipType.PARENT)
      .map((rel) => this.nodes.get(rel.targetPersonId))
      .filter(Boolean) as FamilyTreeNode[];

    for (const parent of parents) {
      if (!ancestors.find((a) => a.id === parent.id)) {
        ancestors.push(parent);
        this.traverseAncestors(parent.id, ancestors, maxGenerations, currentGeneration + 1);
      }
    }
  }

  private traverseDescendants(
    personId: string,
    descendants: FamilyTreeNode[],
    maxGenerations: number,
    currentGeneration: number,
  ): void {
    if (currentGeneration >= maxGenerations) return;

    const person = this.nodes.get(personId);
    if (!person) return;

    const children = person.relationships
      .filter((rel) => rel.relationshipType === RelationshipType.CHILD)
      .map((rel) => this.nodes.get(rel.targetPersonId))
      .filter(Boolean) as FamilyTreeNode[];

    for (const child of children) {
      if (!descendants.find((d) => d.id === child.id)) {
        descendants.push(child);
        this.traverseDescendants(child.id, descendants, maxGenerations, currentGeneration + 1);
      }
    }
  }

  private isDisabled(person: FamilyTreeNode): boolean {
    // In reality, we'd check person's disability status
    // For now, return false
    return false;
  }

  private isInEducation(person: FamilyTreeNode): boolean {
    // Check if person is likely in education based on age
    if (!person.dateOfBirth) return false;

    const age = this.calculateAge(person.dateOfBirth);
    return age >= 18 && age <= 25; // Typical university age in Kenya
  }

  private isDependentParent(parent: FamilyTreeNode, dependentOfPersonId: string): boolean {
    // Check if parent is financially dependent
    // In reality, we'd have financial dependency data
    // For now, assume parents over 65 are dependent
    if (!parent.dateOfBirth) return false;

    const age = this.calculateAge(parent.dateOfBirth);
    return age >= 65; // Retirement age in Kenya
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

  // Validation
  validateTreeIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for orphaned nodes (nodes with no relationships)
    for (const node of this.nodes.values()) {
      if (node.relationships.length === 0 && node.id !== this.rootPersonId) {
        issues.push(`Node ${node.id} has no relationships and may be orphaned`);
      }
    }

    // Check for circular relationships
    const circularRelationships = this.findCircularRelationships();
    if (circularRelationships.length > 0) {
      issues.push(`Circular relationships detected: ${circularRelationships.join(', ')}`);
    }

    // Check for inconsistent relationships
    const inconsistentRelationships = this.findInconsistentRelationships();
    if (inconsistentRelationships.length > 0) {
      issues.push(`Inconsistent relationships: ${inconsistentRelationships.join(', ')}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private findCircularRelationships(): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.detectCycle(nodeId, visited, recursionStack, circular);
      }
    }

    return circular;
  }

  private detectCycle(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    circular: string[],
  ): boolean {
    if (recursionStack.has(nodeId)) {
      circular.push(nodeId);
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = this.nodes.get(nodeId);
    if (node) {
      for (const relationship of node.relationships) {
        if (this.detectCycle(relationship.targetPersonId, visited, recursionStack, circular)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  private findInconsistentRelationships(): string[] {
    const inconsistencies: string[] = [];

    for (const node of this.nodes.values()) {
      for (const relationship of node.relationships) {
        const targetNode = this.nodes.get(relationship.targetPersonId);
        if (!targetNode) continue;

        // Check if reciprocal relationship exists and is consistent
        const reciprocal = targetNode.relationships.find((rel) => rel.targetPersonId === node.id);

        if (!reciprocal) {
          inconsistencies.push(
            `Missing reciprocal relationship from ${relationship.targetPersonId} to ${node.id}`,
          );
        } else if (reciprocal.relationshipType !== relationship.reciprocalType) {
          inconsistencies.push(
            `Inconsistent relationship types between ${node.id} and ${relationship.targetPersonId}`,
          );
        }
      }
    }

    return inconsistencies;
  }

  // Export for visualization
  toGraphFormat(): any {
    const nodes = Array.from(this.nodes.values()).map((node) => ({
      id: node.id,
      label: `${node.firstName} ${node.lastName}`,
      data: {
        dateOfBirth: node.dateOfBirth,
        isDeceased: node.isDeceased,
        isMinor: node.isMinor,
      },
    }));

    const edges: any[] = [];

    for (const node of this.nodes.values()) {
      for (const relationship of node.relationships) {
        edges.push({
          source: node.id,
          target: relationship.targetPersonId,
          label: relationship.relationshipType,
          data: {
            reciprocalType: relationship.reciprocalType,
            isActive: relationship.isActive,
          },
        });
      }
    }

    return { nodes, edges };
  }

  // Static factory method
  static createFromRoot(rootPerson: FamilyTreeNode): FamilyTree {
    const tree = new FamilyTree(rootPerson.id);
    tree.addNode(rootPerson);
    return tree;
  }
}
