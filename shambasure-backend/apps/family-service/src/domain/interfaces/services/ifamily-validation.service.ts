import { Family } from '../../aggregates/family.aggregate';
import { FamilyMember } from '../../entities/family-member.entity';
import { FamilyRelationship } from '../../entities/family-relationship.entity';
import { Marriage } from '../../entities/marriage.entity';

export interface IFamilyValidationService {
  // Family validation
  validateFamilyCreation(family: Partial<Family>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  validateFamilyUpdate(
    family: Family,
    updates: Partial<Family>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  // Member validation
  validateFamilyMember(member: Partial<FamilyMember>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    verificationRequirements: string[];
  }>;

  validateMemberUpdate(
    existingMember: FamilyMember,
    updates: Partial<FamilyMember>,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    requiresVerification: boolean;
  }>;

  // Relationship validation
  validateRelationship(relationship: Partial<FamilyRelationship>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    legalImplications: string[];
  }>;

  validateRelationshipConsistency(
    familyId: string,
    relationships: FamilyRelationship[],
  ): Promise<{
    consistent: boolean;
    inconsistencies: Array<{
      relationship1: string;
      relationship2: string;
      conflict: string;
    }>;
  }>;

  // Marriage validation
  validateMarriage(marriage: Partial<Marriage>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    legalRequirements: string[];
  }>;

  validatePolygamousMarriage(
    existingMarriages: Marriage[],
    newMarriage: Marriage,
  ): Promise<{
    allowed: boolean;
    errors: string[];
    requirements: string[];
  }>;

  // Guardianship validation
  validateGuardianship(guardianship: {
    guardianId: string;
    wardId: string;
    type: string;
  }): Promise<{
    valid: boolean;
    errors: string[];
    courtRequirements: string[];
    bondRequirements: string[];
  }>;

  // Dependency validation
  validateDependencyClaim(claim: {
    deceasedId: string;
    dependantId: string;
    basis: string;
    evidence: string[];
  }): Promise<{
    valid: boolean;
    errors: string[];
    evidenceSufficient: boolean;
    courtLikelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;

  // Identity verification
  validateKenyanIdentity(identity: {
    nationalId?: string;
    kraPin?: string;
    birthCertificate?: string;
    passport?: string;
  }): Promise<{
    valid: boolean;
    verificationLevel: 'NONE' | 'BASIC' | 'FULL';
    issues: string[];
  }>;

  // Age validation
  validateAgeForPurpose(
    birthDate: Date,
    purpose: 'marriage' | 'guardianship' | 'inheritance' | 'testamentary',
  ): Promise<{
    valid: boolean;
    minimumAge: number;
    actualAge: number;
    exceptionPossible: boolean;
  }>;

  // Customary law validation
  validateCustomaryPractice(practice: {
    ethnicGroup: string;
    practiceType: string;
    participants: string[];
  }): Promise<{
    recognized: boolean;
    requirements: string[];
    documentationNeeded: string[];
  }>;

  // Cross-service validation
  validateCrossServiceConsistency(familyId: string): Promise<
    {
      consistent: boolean;
      service: string;
      inconsistencies: string[];
    }[]
  >;
}
