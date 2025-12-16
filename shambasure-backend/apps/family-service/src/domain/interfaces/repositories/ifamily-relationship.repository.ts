import { RelationshipType } from '@prisma/client';

import { FamilyRelationship } from '../../entities/family-relationship.entity';

/**
 * Defines the query criteria for finding FamilyRelationship entities.
 */
export interface RelationshipQueryCriteria {
  familyId?: string;
  fromMemberId?: string;
  toMemberId?: string;
  type?: RelationshipType;
  isVerified?: boolean;
  isContested?: boolean;
}

export interface IFamilyRelationshipRepository {
  /**
   * Finds a FamilyRelationship by its unique ID.
   */
  findById(id: string): Promise<FamilyRelationship | null>;

  /**
   * Finds a specific relationship between two members, if it exists.
   * Useful for preventing duplicate relationship entries.
   */
  findByMembersAndType(
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<FamilyRelationship | null>;

  /**
   * Finds all relationships originating from a specific family member.
   * (e.g., find all children of a parent).
   */
  findAllByFromMemberId(fromMemberId: string): Promise<FamilyRelationship[]>;

  /**
   * Finds all relationships pointing to a specific family member.
   * (e.g., find the parents of a child).
   */
  findAllByToMemberId(toMemberId: string): Promise<FamilyRelationship[]>;

  /**
   * Finds all FamilyRelationship entities that match the given criteria.
   * @param criteria The query criteria to filter relationships by.
   */
  findAll(criteria: RelationshipQueryCriteria): Promise<FamilyRelationship[]>;

  /**
   * Saves a new or updated FamilyRelationship entity.
   * @param relationship The FamilyRelationship entity to save.
   * @param tx An optional transaction client.
   */
  save(relationship: FamilyRelationship, tx?: any): Promise<FamilyRelationship>;

  /**
   * Deletes a FamilyRelationship from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
