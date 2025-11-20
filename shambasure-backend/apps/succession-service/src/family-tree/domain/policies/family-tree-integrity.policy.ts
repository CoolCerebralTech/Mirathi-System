import { Injectable } from '@nestjs/common';
import { Relationship } from '../entities/relationship.entity';
import { RelationshipType } from '@prisma/client';

@Injectable()
export class FamilyTreeIntegrityPolicy {
  /**
   * Checks if adding a new relationship would create a cycle in the graph.
   * (e.g. Preventing: You -> Father -> Grandfather -> You)
   *
   * Note: This is a simplified Depth-First Search (DFS).
   * In a production system with millions of nodes, this logic belongs in the DB (Recursive CTE)
   * or a graph database (Neo4j). For application layer, we check immediate depth.
   */
  checkCycle(
    fromId: string,
    toId: string,
    type: RelationshipType,
    existingRelationships: Relationship[],
  ): boolean {
    // Only hierarchical relationships cause cycles (Parent/Child)
    // Sibling/Spouse relationships are bi-directional or horizontal, so cycles are expected/irrelevant.
    const hierarchyTypes: RelationshipType[] = ['PARENT', 'CHILD', 'GRANDPARENT', 'GRANDCHILD'];

    if (!hierarchyTypes.includes(type)) {
      return false;
    }

    // Normalize direction to "Is Ancestor Of"
    // If we are adding "A is Child of B", we check if "A is already an Ancestor of B"
    let ancestorId: string;
    let descendantId: string;

    if (type === 'CHILD' || type === 'GRANDCHILD') {
      ancestorId = toId;
      descendantId = fromId;
    } else {
      ancestorId = fromId;
      descendantId = toId;
    }

    // Search: Can we go from Descendant -> Ancestor using existing links?
    return this.pathExists(descendantId, ancestorId, existingRelationships);
  }

  private pathExists(
    startId: string,
    targetId: string,
    allRelationships: Relationship[],
    visited: Set<string> = new Set(),
  ): boolean {
    if (startId === targetId) return true;
    if (visited.has(startId)) return false;

    visited.add(startId);

    // Find all people 'startId' is a PARENT or GRANDPARENT of
    // (Traversing down the tree)
    const outgoing = allRelationships.filter(
      (r) =>
        r.getFromMemberId() === startId &&
        (r.getType() === 'PARENT' || r.getType() === 'GRANDPARENT'),
    );

    // Also check inverse: Relationships where 'startId' is the target of CHILD/GRANDCHILD
    const incoming = allRelationships.filter(
      (r) =>
        r.getToMemberId() === startId && (r.getType() === 'CHILD' || r.getType() === 'GRANDCHILD'),
    );

    const nextSteps = [
      ...outgoing.map((r) => r.getToMemberId()),
      ...incoming.map((r) => r.getFromMemberId()),
    ];

    for (const nextId of nextSteps) {
      if (this.pathExists(nextId, targetId, allRelationships, visited)) {
        return true;
      }
    }

    return false;
  }
}
