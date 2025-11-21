import { RelationshipType } from '@prisma/client';
import { Relationship } from '../entities/relationship.entity';

export interface RelationshipRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(relationship: Relationship): Promise<void>;
  findById(id: string): Promise<Relationship | null>;
  delete(id: string): Promise<void>;

  // ---------------------------------------------------------
  // Graph Traversal (Lineage Logic)
  // ---------------------------------------------------------
  /**
   * Find all outgoing relationships (e.g. "John is Parent of...")
   */
  findByFromMemberId(memberId: string): Promise<Relationship[]>;

  /**
   * Find all incoming relationships (e.g. "...is Parent of John")
   */
  findByToMemberId(memberId: string): Promise<Relationship[]>;

  /**
   * Find edges for the whole tree (for building the visualization graph).
   */
  findByFamilyId(familyId: string): Promise<Relationship[]>;

  /**
   * Specific lookup (e.g., "Find Children of X").
   */
  findByType(memberId: string, type: RelationshipType): Promise<Relationship[]>;

  /**
   * Check if a relationship already exists between two nodes.
   */
  exists(fromId: string, toId: string, type: RelationshipType): Promise<boolean>;
}
