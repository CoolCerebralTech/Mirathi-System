// domain/interfaces/repositories/ifamily-relationship.repository.ts
import { RelationshipType } from '@prisma/client';

import { FamilyRelationship } from '../../entities/family-relationship.entity';
import { InheritanceRights } from '../../value-objects/legal/inheritance-rights.vo';

export interface IFamilyRelationshipRepository {
  /**
   * Core CRUD Operations
   */
  create(relationship: FamilyRelationship): Promise<FamilyRelationship>;
  findById(id: string): Promise<FamilyRelationship | null>;
  update(relationship: FamilyRelationship): Promise<FamilyRelationship>;
  delete(id: string): Promise<void>;

  /**
   * Relationship Existence & Validation
   */
  findByMembersAndType(
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<FamilyRelationship | null>;
  existsBetweenMembers(memberId1: string, memberId2: string): Promise<boolean>;
  validateRelationshipUniqueness(
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
  ): Promise<boolean>;

  /**
   * Family Graph Queries (Critical for inheritance)
   */
  findAllByFromMemberId(fromMemberId: string): Promise<FamilyRelationship[]>;
  findAllByToMemberId(toMemberId: string): Promise<FamilyRelationship[]>;
  findAllByFamilyId(familyId: string): Promise<FamilyRelationship[]>;
  findAllByFamilyMemberId(memberId: string): Promise<FamilyRelationship[]>;

  /**
   * Relationship Type Queries
   */
  findAllByType(familyId: string, type: RelationshipType): Promise<FamilyRelationship[]>;
  findParentsOfMember(memberId: string): Promise<FamilyRelationship[]>;
  findChildrenOfMember(memberId: string): Promise<FamilyRelationship[]>;
  findSpousesOfMember(memberId: string): Promise<FamilyRelationship[]>;
  findSiblingsOfMember(memberId: string): Promise<FamilyRelationship[]>;

  /**
   * Inheritance Rights Queries (Critical for estate distribution)
   */
  findWithInheritanceRights(memberId: string): Promise<FamilyRelationship[]>;
  findWithFullInheritanceRights(memberId: string): Promise<FamilyRelationship[]>;
  findWithPartialInheritanceRights(memberId: string): Promise<FamilyRelationship[]>;
  findExcludedFromInheritance(memberId: string): Promise<FamilyRelationship[]>;

  /**
   * Next of Kin Queries (Critical for legal decisions)
   */
  findNextOfKinForMember(memberId: string): Promise<FamilyRelationship[]>;
  findPrimaryNextOfKin(memberId: string): Promise<FamilyRelationship | null>;
  updateNextOfKinPriorities(memberId: string, priorities: Map<string, number>): Promise<void>;

  /**
   * Legal Status Queries
   */
  findVerifiedRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findUnverifiedRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findContestedRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findCourtValidatedRelationships(familyId: string): Promise<FamilyRelationship[]>;

  /**
   * Biological vs Legal Queries
   */
  findBiologicalRelationships(memberId: string): Promise<FamilyRelationship[]>;
  findAdoptedRelationships(memberId: string): Promise<FamilyRelationship[]>;
  findStepRelationships(memberId: string): Promise<FamilyRelationship[]>;
  findCustomaryAdoptionRelationships(familyId: string): Promise<FamilyRelationship[]>;

  /**
   * S.29 Dependant Identification Queries
   */
  findPotentialDependants(deceasedId: string): Promise<FamilyRelationship[]>;
  findS29QualifyingRelationships(deceasedId: string): Promise<FamilyRelationship[]>;
  findDependantChildren(deceasedId: string): Promise<FamilyRelationship[]>;
  findDependantSpouses(deceasedId: string): Promise<FamilyRelationship[]>;
  findDependantParents(deceasedId: string): Promise<FamilyRelationship[]>;

  /**
   * Bulk Operations for Family Management
   */
  batchCreate(relationships: FamilyRelationship[]): Promise<FamilyRelationship[]>;
  batchDeleteByFamilyId(familyId: string): Promise<void>;
  batchUpdateInheritanceRights(
    familyId: string,
    updates: Array<{ relationshipId: string; rights: InheritanceRights }>,
  ): Promise<void>;

  /**
   * Verification & Validation Queries
   */
  verifyRelationship(id: string, verifierId: string, method: string): Promise<void>;
  contestRelationship(id: string, caseNumber: string): Promise<void>;
  resolveContest(id: string, isValid: boolean, courtOrderNumber: string): Promise<void>;

  /**
   * Statistics & Reporting
   */
  getFamilyGraphStatistics(familyId: string): Promise<{
    totalRelationships: number;
    verifiedCount: number;
    contestedCount: number;
    nextOfKinCount: number;
    biologicalCount: number;
    adoptedCount: number;
    stepCount: number;
    inheritanceEligibleCount: number;
  }>;

  /**
   * Complex Relationship Analysis
   */
  findRelationshipPath(member1Id: string, member2Id: string): Promise<FamilyRelationship[]>;
  findCommonAncestors(member1Id: string, member2Id: string): Promise<string[]>;
  calculateDegreesOfSeparation(member1Id: string, member2Id: string): Promise<number | null>;

  /**
   * S.40 Polygamy Support Queries
   */
  findPolygamousRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findPolygamousSpouses(memberId: string): Promise<FamilyRelationship[]>;

  /**
   * S.35 LSA Intestate Succession Queries
   */
  findSurvivingSpouseAndChildren(deceasedId: string): Promise<{
    spouse?: FamilyRelationship;
    children: FamilyRelationship[];
  }>;
  findSurvivingParents(deceasedId: string): Promise<FamilyRelationship[]>;
  findSurvivingSiblings(deceasedId: string): Promise<FamilyRelationship[]>;
  findOtherRelatives(deceasedId: string): Promise<FamilyRelationship[]>;

  /**
   * Customary Law Queries
   */
  findCustomaryLawRecognized(familyId: string): Promise<FamilyRelationship[]>;
  updateCustomaryCeremonyDetails(id: string, details: any): Promise<void>;
}
