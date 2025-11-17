// family-tree/domain/repositories/family-member.repository.interface.ts
import { RelationshipType } from '@prisma/client';
import { FamilyMember } from '../entities/family-member.entity';
import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';

export interface FamilyMemberRepositoryInterface {
  // Basic CRUD operations
  findById(id: string): Promise<FamilyMember | null>;
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findByUserId(userId: string): Promise<FamilyMember[]>;
  save(member: FamilyMember): Promise<void>;
  delete(id: string): Promise<void>;

  // Relationship-based queries
  findByRelationshipType(
    familyId: string,
    relationshipType: RelationshipType,
  ): Promise<FamilyMember[]>;
  findMinors(familyId: string): Promise<FamilyMember[]>;
  findElders(familyId: string): Promise<FamilyMember[]>;
  findDeceased(familyId: string): Promise<FamilyMember[]>;

  // Complex queries
  findPotentialGuardians(familyId: string): Promise<FamilyMember[]>;
  findDependants(familyId: string, testatorId: string): Promise<FamilyMember[]>;
  findSuccessionLine(familyId: string, personId: string): Promise<FamilyMember[]>;

  // Search operations
  searchMembers(familyId: string, query: string): Promise<FamilyMember[]>;
  findMembersByAgeRange(familyId: string, minAge: number, maxAge: number): Promise<FamilyMember[]>;

  // Analytics
  getFamilyDemographics(familyId: string): Promise<{
    ageDistribution: Record<string, number>;
    relationshipDistribution: Record<RelationshipType, number>;
    dependencyRatio: number;
  }>;

  // Bulk operations
  bulkUpdateRelationship(
    memberIds: string[],
    relationship: KenyanRelationship,
    relationshipTo: string,
  ): Promise<void>;

  // Validation
  validateMemberUniqueness(familyId: string, personalDetails: any): Promise<boolean>;
}
