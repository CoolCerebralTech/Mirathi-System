import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

import type { Relationship } from '../entities/relationship.entity';

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
  ): { hasCycle: boolean; details?: string } {
    // Only hierarchical relationships (ancestry) can form cycles
    const hierarchyTypes: RelationshipType[] = [
      RelationshipType.PARENT,
      RelationshipType.CHILD,
      RelationshipType.GRANDPARENT,
      RelationshipType.GRANDCHILD,
      RelationshipType.ADOPTED_CHILD,
    ];

    if (!hierarchyTypes.includes(type)) {
      return { hasCycle: false };
    }

    // Determine direction of flow: Ancestor -> Descendant
    let ancestorId: string;
    let descendantId: string;

    if (
      type === RelationshipType.CHILD ||
      type === RelationshipType.GRANDCHILD ||
      type === RelationshipType.ADOPTED_CHILD
    ) {
      // If "from" is CHILD of "to" => "to" is Ancestor
      ancestorId = toId;
      descendantId = fromId;
    } else {
      // If "from" is PARENT of "to" => "from" is Ancestor
      ancestorId = fromId;
      descendantId = toId;
    }

    // Check: Does a path already exist from Descendant -> Ancestor?
    // If so, making Ancestor a parent of Descendant creates a loop.
    const hasCycle = this.pathExists(descendantId, ancestorId, existingRelationships);

    if (hasCycle) {
      return {
        hasCycle: true,
        details: `Adding this ${type} relationship would create a circular reference (Time Paradox) in the family tree.`,
      };
    }

    return { hasCycle: false };
  }

  /**
   * Depth-First Search (DFS) to detect if a path exists from startId -> targetId.
   * "Path" implies genetic/legal descent.
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

    // Find children of 'startId'
    // 1. Where 'startId' is PARENT/GRANDPARENT of 'X'
    const outgoing = allRelationships.filter(
      (r) =>
        r.getFromMemberId() === startId &&
        (r.getType() === RelationshipType.PARENT || r.getType() === RelationshipType.GRANDPARENT),
    );

    // 2. Where 'X' is CHILD/GRANDCHILD/ADOPTED of 'startId'
    const incoming = allRelationships.filter(
      (r) =>
        r.getToMemberId() === startId &&
        (r.getType() === RelationshipType.CHILD ||
          r.getType() === RelationshipType.GRANDCHILD ||
          r.getType() === RelationshipType.ADOPTED_CHILD),
    );

    const childrenIds = [
      ...outgoing.map((r) => r.getToMemberId()),
      ...incoming.map((r) => r.getFromMemberId()),
    ];

    for (const childId of childrenIds) {
      if (this.pathExists(childId, targetId, allRelationships, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detects circular relationships in the entire family tree
   */
  detectCircularRelationships(relationships: Relationship[]): { hasCircular: boolean } {
    const ids = Array.from(
      new Set(relationships.flatMap((r) => [r.getFromMemberId(), r.getToMemberId()])),
    );

    // Naive O(N^2) check, acceptable for typical family sizes < 500
    for (const fromId of ids) {
      for (const toId of ids) {
        if (fromId === toId) continue;

        // Check if there is a path from A -> B AND B -> A
        if (
          this.pathExists(fromId, toId, relationships) &&
          this.pathExists(toId, fromId, relationships)
        ) {
          return { hasCircular: true };
        }
      }
    }

    return { hasCircular: false };
  }
}
