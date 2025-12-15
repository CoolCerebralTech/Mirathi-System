import { FamilyRelationship } from '../../entities/family-relationship.entity';
import { InheritanceRights } from '../../value-objects/legal/inheritance-rights.vo';
import { RelationshipType } from '../../value-objects/legal/relationship-type.vo';

export interface IFamilyRelationshipRepository {
  // CRUD operations
  findById(id: string): Promise<FamilyRelationship | null>;
  save(relationship: FamilyRelationship): Promise<FamilyRelationship>;
  update(relationship: FamilyRelationship): Promise<FamilyRelationship>;
  delete(id: string): Promise<void>;

  // Query operations
  findByFamilyId(familyId: string): Promise<FamilyRelationship[]>;
  findByFromMemberId(fromMemberId: string): Promise<FamilyRelationship[]>;
  findByToMemberId(toMemberId: string): Promise<FamilyRelationship[]>;
  findRelationship(fromMemberId: string, toMemberId: string): Promise<FamilyRelationship | null>;

  // Type-based queries
  findByRelationshipType(type: RelationshipType): Promise<FamilyRelationship[]>;
  findBiologicalRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findAdoptionRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findCustomaryRelationships(familyId: string): Promise<FamilyRelationship[]>;

  // Verification
  findVerifiedRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findUnverifiedRelationships(familyId: string): Promise<FamilyRelationship[]>;
  findContestedRelationships(familyId: string): Promise<FamilyRelationship[]>;

  // Next-of-kin queries
  findNextOfKin(memberId: string): Promise<FamilyRelationship[]>;
  findPrimaryNextOfKin(memberId: string): Promise<FamilyRelationship | null>;

  // Inheritance rights
  findByInheritanceRights(rights: InheritanceRights): Promise<FamilyRelationship[]>;

  // Verification operations
  verifyRelationship(
    relationshipId: string,
    verificationDetails: {
      verificationMethod: string;
      verifiedBy: string;
      verificationDocuments?: object;
    },
  ): Promise<void>;

  contestRelationship(
    relationshipId: string,
    contestationDetails: {
      contestationCaseNumber?: string;
      reasons: string[];
    },
  ): Promise<void>;

  // Court validation
  courtValidateRelationship(
    relationshipId: string,
    courtDetails: {
      courtOrderNumber?: string;
      validatedDate: Date;
    },
  ): Promise<void>;

  // Next-of-kin designation
  designateNextOfKin(
    relationshipId: string,
    designationDetails: {
      isNextOfKin: boolean;
      priority?: number;
    },
  ): Promise<void>;

  // Adoption tracking
  recordAdoption(
    relationshipId: string,
    adoptionDetails: {
      adoptionOrderNumber?: string;
      adoptionCourt?: string;
      adoptionDate: Date;
      isCustomaryAdoption?: boolean;
    },
  ): Promise<void>;

  // Search
  searchRelationships(criteria: {
    familyId?: string;
    fromMemberId?: string;
    toMemberId?: string;
    type?: string;
    isBiological?: boolean;
    isVerified?: boolean;
    isNextOfKin?: boolean;
    inheritanceRights?: string;
    isContested?: boolean;
  }): Promise<FamilyRelationship[]>;

  // Family tree operations
  getFamilyTree(
    familyId: string,
    rootMemberId?: string,
  ): Promise<Map<string, FamilyRelationship[]>>;

  // Relationship strength
  updateRelationshipStrength(
    relationshipId: string,
    strength: 'FULL' | 'HALF' | 'STEP' | 'ADOPTED',
  ): Promise<void>;
}
