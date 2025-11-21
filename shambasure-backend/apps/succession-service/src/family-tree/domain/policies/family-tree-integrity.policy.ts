import { Injectable } from '@nestjs/common';
import { Relationship } from '../entities/relationship.entity';
import { RelationshipType } from '@prisma/client';

@Injectable()
export class FamilyTreeIntegrityPolicy {
  /**
   * Checks if adding a new relationship would create a cycle in the family tree graph.
   * Prevents invalid loops like: You -> Father -> Grandfather -> You.
   *
   * Only hierarchical relationships are considered for cycles.
   * Sibling/Spouse relationships are horizontal and ignored for cycles.
   */
  checkCycle(
    fromId: string,
    toId: string,
    type: RelationshipType,
    existingRelationships: Relationship[],
  ): boolean {
    // Only hierarchical relationships (ancestry) can form cycles
    const hierarchyTypes: RelationshipType[] = ['PARENT', 'CHILD', 'GRANDPARENT', 'GRANDCHILD'];

    if (!hierarchyTypes.includes(type)) {
      return false;
    }

    // Normalize direction to "ancestor -> descendant"
    let ancestorId: string;
    let descendantId: string;

    if (type === 'CHILD' || type === 'GRANDCHILD') {
      ancestorId = toId;
      descendantId = fromId;
    } else {
      ancestorId = fromId;
      descendantId = toId;
    }

    return this.pathExists(descendantId, ancestorId, existingRelationships);
  }

  /**
   * Depth-First Search (DFS) to detect if a path exists from startId -> targetId.
   * Prevents cycles by checking all hierarchical connections.
   */
  private pathExists(
    startId: string,
    targetId: string,
    allRelationships: Relationship[],
    visited: Set<string> = new Set(),
  ): boolean {
    if (startId === targetId) return true;
    if (visited.has(startId)) return false;

    visited.add(startId);

    // Outgoing hierarchical edges (startId is parent/grandparent)
    const outgoing = allRelationships.filter(
      (r) =>
        r.getFromMemberId() === startId &&
        (r.getType() === 'PARENT' || r.getType() === 'GRANDPARENT'),
    );

    // Incoming hierarchical edges (startId is child/grandchild)
    const incoming = allRelationships.filter(
      (r) =>
        r.getToMemberId() === startId && (r.getType() === 'CHILD' || r.getType() === 'GRANDCHILD'),
    );

    const nextNodes = [
      ...outgoing.map((r) => r.getToMemberId()),
      ...incoming.map((r) => r.getFromMemberId()),
    ];

    for (const nextId of nextNodes) {
      if (this.pathExists(nextId, targetId, allRelationships, visited)) {
        return true;
      }
    }

    return false;
  }
  detectCircularRelationships(relationships: Relationship[]): { hasCircular: boolean } {
    const ids = Array.from(
      new Set(relationships.flatMap((r) => [r.getFromMemberId(), r.getToMemberId()])),
    );
    for (const fromId of ids) {
      for (const toId of ids) {
        // Skip same member
        if (fromId === toId) continue;
        if (this.checkCycle(fromId, toId, 'PARENT', relationships)) {
          return { hasCircular: true };
        }
      }
    }
    return { hasCircular: false };
  }
}
