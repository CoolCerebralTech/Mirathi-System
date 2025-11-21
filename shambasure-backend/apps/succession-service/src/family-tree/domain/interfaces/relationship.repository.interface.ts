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
  findByFromMemberId(memberId: string): Promise<Relationship[]>;
  findByToMemberId(memberId: string): Promise<Relationship[]>;
  findByFamilyId(familyId: string): Promise<Relationship[]>;
  findByType(memberId: string, type: RelationshipType): Promise<Relationship[]>;
  exists(fromId: string, toId: string, type: RelationshipType): Promise<boolean>;

  // ---------------------------------------------------------
  // Kenyan Succession Law Specific Queries
  // ---------------------------------------------------------
  /**
   * Find verified relationships for strong inheritance claims
   */
  findVerifiedRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find adoption relationships for legal inheritance rights
   */
  findAdoptionRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find relationships that need verification for succession
   */
  findUnverifiedRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find biological relationships for primary inheritance
   */
  findBiologicalRelationships(familyId: string): Promise<Relationship[]>;

  /**
   * Find relationships born out of wedlock (Section 29 analysis)
   */
  findRelationshipsBornOutOfWedlock(familyId: string): Promise<Relationship[]>;

  // ---------------------------------------------------------
  // Family Tree Analysis
  // ---------------------------------------------------------
  /**
   * Find ancestral lineage for traditional inheritance patterns
   */
  findAncestralLineage(memberId: string, generations: number): Promise<Relationship[]>;

  /**
   * Find descendants for succession distribution
   */
  findDescendants(memberId: string, includeAdopted?: boolean): Promise<Relationship[]>;

  /**
   * Find siblings (full, half, step) for inheritance calculations
   */
  findSiblings(memberId: string): Promise<Relationship[]>;

  /**
   * Find spouse relationships for spousal inheritance rights
   */
  findSpouseRelationships(memberId: string): Promise<Relationship[]>;

  // ---------------------------------------------------------
  // Validation & Integrity
  // ---------------------------------------------------------
  /**
   * Check for circular relationships that would break the tree
   */
  detectCircularRelationships(
    familyId: string,
  ): Promise<{ hasCircular: boolean; details?: string }>;

  /**
   * Validate family tree integrity for succession
   */
  validateTreeIntegrity(familyId: string): Promise<{
    isValid: boolean;
    issues: string[];
    orphanedMembers: string[];
  }>;

  // ---------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------
  /**
   * Save multiple relationships for tree building
   */
  saveMany(relationships: Relationship[]): Promise<void>;

  /**
   * Delete relationships by member (when member is removed)
   */
  deleteByMember(memberId: string): Promise<void>;

  /**
   * Update verification status in bulk
   */
  bulkVerify(relationshipIds: string[], method: string, verifiedBy: string): Promise<void>;
}
