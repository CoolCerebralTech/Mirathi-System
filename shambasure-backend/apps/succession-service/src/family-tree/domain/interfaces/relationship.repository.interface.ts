import { RelationshipType } from '@prisma/client';

import { Relationship } from '../entities/relationship.entity';

export interface RelationshipRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(relationship: Relationship): Promise<void>;
  findById(id: string): Promise<Relationship | null>;
  delete(id: string): Promise<void>;
  saveMany(relationships: Relationship[]): Promise<void>;

  // ---------------------------------------------------------
  // Graph Traversal
  // ---------------------------------------------------------
  findByFromMemberId(memberId: string): Promise<Relationship[]>;
  findByToMemberId(memberId: string): Promise<Relationship[]>;
  findByFamilyId(familyId: string): Promise<Relationship[]>;
  findByType(memberId: string, type: RelationshipType): Promise<Relationship[]>;

  /**
   * Check if a relationship edge exists.
   */
  exists(fromId: string, toId: string, type: RelationshipType): Promise<boolean>;

  // ---------------------------------------------------------
  // Kenyan Succession Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find relationships that have been verified.
   * Critical for "First Priority" heirs.
   */
  findVerifiedRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find adoption relationships (Legal or Customary).
   */
  findAdoptionRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find relationships pending verification.
   * Used for generating "Missing Docs" alerts.
   */
  findUnverifiedRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find relationships marked as "Born Out of Wedlock".
   * Critical for Section 29 analysis (dependants).
   */
  findRelationshipsBornOutOfWedlock(familyId: string): Promise<Relationship[]>;

  // ---------------------------------------------------------
  // Family Tree Analysis (Complex Queries)
  // ---------------------------------------------------------
  /**
   * Traverse up the tree to find ancestors.
   */
  findAncestralLineage(memberId: string, generations: number): Promise<Relationship[]>;

  /**
   * Traverse down the tree to find descendants.
   * Critical for "Per Stirpes" distribution.
   */
  findDescendants(memberId: string): Promise<Relationship[]>;

  /**
   * Find siblings (Full, Half, Step).
   * Often involves finding common parents.
   */
  findSiblings(memberId: string): Promise<Relationship[]>;

  /**
   * Find spouse relationships for a member.
   */
  findSpouseRelationships(memberId: string): Promise<Relationship[]>;

  // ---------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------
  /**
   * Delete all relationships involving a specific member.
   */
  deleteByMember(memberId: string): Promise<void>;

  /**
   * Update verification status in bulk.
   */
  bulkVerify(relationshipIds: string[], method: string, verifiedBy: string): Promise<void>;
}
