import { Injectable, Inject } from '@nestjs/common';
import { RelationshipType, MarriageStatus } from '@prisma/client';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import type { GuardianshipRepositoryInterface } from '../interfaces/guardianship.repository.interface';
import { RelationshipValidationPolicy } from '../policies/relationship-validation.policy';
import { FamilyTreeIntegrityPolicy } from '../policies/family-tree-integrity.policy';
import { PolygamousFamilyPolicy } from '../policies/polygamous-family.policy';
import { CustomaryMarriagePolicy } from '../policies/customary-marriage.policy';
import { GuardianEligibilityPolicy } from '../policies/guardian-eligibility.policy';

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface MarriageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  legalRequirements: string[];
  requiresCustomaryDetails: boolean;
}

export interface GuardianshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  courtRequirements: string[];
  restrictions: string[];
}

@Injectable()
export class RelationshipIntegrityService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepo: GuardianshipRepositoryInterface,
    // Policies
    private readonly validationPolicy: RelationshipValidationPolicy,
    private readonly integrityPolicy: FamilyTreeIntegrityPolicy,
    private readonly polygamyPolicy: PolygamousFamilyPolicy,
    private readonly customaryPolicy: CustomaryMarriagePolicy,
    private readonly guardianPolicy: GuardianEligibilityPolicy,
  ) {}

  /**
   * Comprehensive validation for new relationships with Kenyan legal compliance
   */
  async validateNewRelationship(
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    type: RelationshipType,
    metadata?: {
      isAdopted?: boolean;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      adoptionOrderNumber?: string;
    },
  ): Promise<RelationshipValidationResult> {
    const result: RelationshipValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {
      // 1. Basic Entity Validation
      await this.validateBasicEntities(familyId, fromMemberId, toMemberId, result);

      if (result.errors.length > 0) {
        result.isValid = false;
        return result;
      }

      // 2. Load Entities for Policy Validation
      const [fromMember, toMember, existingRelationships] = await Promise.all([
        this.memberRepo.findById(fromMemberId),
        this.memberRepo.findById(toMemberId),
        this.relationshipRepo.findByFamilyId(familyId),
      ]);

      // 3. Kenyan Legal Validation
      await this.validateKenyanLegalRequirements(fromMember!, toMember!, type, metadata, result);

      // 4. Biological & Chronological Validation
      const bioCheck = this.validationPolicy.validateRelationship(
        fromMember!,
        toMember!,
        type,
        metadata,
      );
      if (!bioCheck.isValid) {
        result.errors.push(`Biological validation failed: ${bioCheck.error}`);
      }

      // 5. Graph Integrity (Cycle Detection)
      const cycleCheck = this.integrityPolicy.checkCycle(
        fromMemberId,
        toMemberId,
        type,
        existingRelationships,
      );
      if (cycleCheck.hasCycle) {
        result.errors.push(`Invalid Relationship: ${cycleCheck.details}`);
      }

      // 6. Duplicate Relationship Check
      const exists = await this.relationshipRepo.exists(fromMemberId, toMemberId, type);
      if (exists) {
        result.errors.push('Relationship already exists between these members.');
      }

      // 7. Kenyan Succession Implications
      this.analyzeSuccessionImplications(fromMember!, toMember!, type, metadata, result);
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Comprehensive marriage validation with Kenyan legal compliance
   */
  async validateNewMarriage(
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    marriageType: MarriageStatus,
    marriageDetails?: {
      marriageDate?: Date;
      customaryDetails?: {
        bridePricePaid: boolean;
        elderWitnesses: string[];
        ceremonyLocation: string;
      };
    },
  ): Promise<MarriageValidationResult> {
    const result: MarriageValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      legalRequirements: [],
      requiresCustomaryDetails: false,
    };

    try {
      // 1. Basic Validation
      if (spouse1Id === spouse2Id) {
        result.errors.push('Cannot marry oneself.');
      }

      // 2. Entity Validation
      await this.validateMarriageEntities(familyId, spouse1Id, spouse2Id, result);

      if (result.errors.length > 0) {
        result.isValid = false;
        return result;
      }

      // 3. Load Entities
      const [spouse1, spouse2, existingMarriages1, existingMarriages2] = await Promise.all([
        this.memberRepo.findById(spouse1Id),
        this.memberRepo.findById(spouse2Id),
        this.marriageRepo.findByMemberId(spouse1Id),
        this.marriageRepo.findByMemberId(spouse2Id),
      ]);

      // 4. Age Validation (Kenyan Legal Age)
      this.validateMarriageAge(spouse1!, spouse2!, result);

      // 5. Kenyan Marriage Type Validation
      this.validateKenyanMarriageType(marriageType, marriageDetails, result);

      // 6. Polygamy Validation
      const polygamyCheck1 = this.polygamyPolicy.checkMarriageEligibility(
        spouse1Id,
        existingMarriages1,
        marriageType,
      );
      if (!polygamyCheck1.isAllowed) {
        result.errors.push(`Spouse 1 ineligible: ${polygamyCheck1.error}`);
      }

      const polygamyCheck2 = this.polygamyPolicy.checkMarriageEligibility(
        spouse2Id,
        existingMarriages2,
        marriageType,
      );
      if (!polygamyCheck2.isAllowed) {
        result.errors.push(`Spouse 2 ineligible: ${polygamyCheck2.error}`);
      }

      // 7. Consanguinity Check (Blood Relative Prevention)
      const areRelated = await this.areBloodRelatives(spouse1Id, spouse2Id, familyId);
      if (areRelated.areBloodRelatives) {
        result.errors.push(
          `Marriage between blood relatives is prohibited: ${areRelated.relationship}`,
        );
      }

      // 8. Customary Marriage Specific Validation
      if (marriageType === 'CUSTOMARY_MARRIAGE') {
        const customaryValidation = this.customaryPolicy.validateCustomaryMarriage(
          marriageDetails?.customaryDetails,
        );
        if (!customaryValidation.isValid) {
          result.errors.push(...customaryValidation.errors);
        }
        result.requiresCustomaryDetails = true;
        result.legalRequirements.push(...customaryValidation.requirements);
      }

      // 9. Existing Active Marriage Check
      const existingActive = await this.marriageRepo.findActiveBetween(spouse1Id, spouse2Id);
      if (existingActive) {
        result.errors.push('Active marriage already exists between these individuals.');
      }

      // 10. Legal Requirements for Kenyan Marriage
      this.generateLegalRequirements(marriageType, spouse1!, spouse2!, result);
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Marriage validation error: ${error.message}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Comprehensive guardianship validation with Kenyan legal compliance
   */
  async validateNewGuardianship(
    familyId: string,
    guardianId: string,
    wardId: string,
    guardianType: string,
    appointmentDetails?: {
      appointedBy?: string;
      courtOrderNumber?: string;
      isTemporary?: boolean;
      validUntil?: Date;
    },
  ): Promise<GuardianshipValidationResult> {
    const result: GuardianshipValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      courtRequirements: [],
      restrictions: [],
    };

    try {
      // 1. Basic Validation
      if (guardianId === wardId) {
        result.errors.push('A member cannot be their own guardian.');
      }

      // 2. Entity Validation
      await this.validateGuardianshipEntities(familyId, guardianId, wardId, result);

      if (result.errors.length > 0) {
        result.isValid = false;
        return result;
      }

      // 3. Load Entities
      const [guardian, ward, existingGuardianships] = await Promise.all([
        this.memberRepo.findById(guardianId),
        this.memberRepo.findById(wardId),
        this.guardianshipRepo.findByWardId(wardId),
      ]);

      // 4. Guardian Eligibility Check
      const eligibility = this.guardianPolicy.checkGuardianEligibility(
        guardian!,
        ward!,
        guardianType,
      );
      if (!eligibility.isEligible) {
        result.errors.push(`Guardian ineligible: ${eligibility.reason}`);
      }
      result.restrictions.push(...eligibility.restrictions);

      // 5. Ward Status Validation
      if (!ward!.getIsMinor()) {
        result.warnings.push(
          'Guardianship typically applies to minors. Ensure this is a special case.',
        );
      }

      // 6. Existing Guardianship Check
      const activeGuardianships = existingGuardianships.filter((g) => g.getIsActiveRecord());
      if (activeGuardianships.length > 0) {
        result.warnings.push(
          'Ward already has active guardianship(s). Multiple guardianships may require court approval.',
        );
      }

      // 7. Capacity Check (Guardian Workload)
      const guardianWorkload = await this.guardianshipRepo.findByGuardianId(guardianId);
      const activeGuardianCount = guardianWorkload.filter((g) => g.getIsActiveRecord()).length;
      if (activeGuardianCount >= 3) {
        result.warnings.push(
          'Guardian has multiple active guardianships. Consider capacity limitations.',
        );
      }

      // 8. Court Requirements for Legal Guardianship
      if (guardianType === 'LEGAL_GUARDIAN') {
        result.courtRequirements.push(
          'Court order required for legal guardianship',
          'Background check and home study recommended',
          "Regular reporting to children's court may be required",
        );

        if (!appointmentDetails?.courtOrderNumber) {
          result.errors.push('Court order number is required for legal guardianship.');
        }
      }

      // 9. Testamentary Guardianship Validation
      if (guardianType === 'TESTAMENTARY' && !appointmentDetails?.appointedBy) {
        result.errors.push('Testamentary guardianship requires reference to the appointing will.');
      }

      // 10. Kenyan Legal Compliance
      this.validateKenyanGuardianshipLaws(guardian!, ward!, guardianType, result);
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Guardianship validation error: ${error.message}`);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validates family tree integrity for succession purposes
   */
  async validateFamilyTreeIntegrity(familyId: string): Promise<{
    isValid: boolean;
    issues: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      code: string;
      message: string;
      affectedMembers?: string[];
      recommendation?: string;
    }>;
    statistics: {
      totalMembers: number;
      verifiedRelationships: number;
      unverifiedRelationships: number;
      minorsWithoutGuardians: number;
      deceasedMembers: number;
      potentialSuccessionIssues: number;
    };
  }> {
    const issues: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      code: string;
      message: string;
      affectedMembers?: string[];
      recommendation?: string;
    }> = [];

    try {
      const [members, relationships, marriages, guardianships] = await Promise.all([
        this.memberRepo.findByFamilyId(familyId),
        this.relationshipRepo.findByFamilyId(familyId),
        this.marriageRepo.findByFamilyId(familyId),
        this.guardianshipRepo.findActiveByFamilyId(familyId),
      ]);

      // 1. Check for Orphaned Members (no relationships)
      const orphanedMembers = this.findOrphanedMembers(members, relationships, marriages);
      if (orphanedMembers.length > 0) {
        issues.push({
          type: 'WARNING',
          code: 'ORPHANED_MEMBERS',
          message: `${orphanedMembers.length} members have no family relationships`,
          affectedMembers: orphanedMembers,
          recommendation: 'Connect these members to the family tree',
        });
      }

      // 2. Check Minors Without Guardians
      const minorsWithoutGuardians = this.findMinorsWithoutGuardians(members, guardianships);
      if (minorsWithoutGuardians.length > 0) {
        issues.push({
          type: 'ERROR',
          code: 'MINORS_WITHOUT_GUARDIANS',
          message: `${minorsWithoutGuardians.length} minors do not have appointed guardians`,
          affectedMembers: minorsWithoutGuardians,
          recommendation: 'Appoint legal guardians for all minors',
        });
      }

      // 3. Check Unverified Critical Relationships
      const unverifiedCritical = this.findUnverifiedCriticalRelationships(relationships);
      if (unverifiedCritical.length > 0) {
        issues.push({
          type: 'WARNING',
          code: 'UNVERIFIED_RELATIONSHIPS',
          message: `${unverifiedCritical.length} critical relationships are not verified`,
          affectedMembers: unverifiedCritical.map((r) => r.getFromMemberId()),
          recommendation: 'Verify parent-child and spousal relationships for succession',
        });
      }

      // 4. Check Circular Relationships
      const circularCheck = this.integrityPolicy.detectCircularRelationships(relationships);
      if (circularCheck.hasCircular) {
        issues.push({
          type: 'ERROR',
          code: 'CIRCULAR_RELATIONSHIPS',
          message: 'Circular relationships detected in family tree',
          recommendation: 'Review and fix relationship cycles',
        });
      }

      // 5. Check Succession Readiness
      const successionIssues = this.analyzeSuccessionReadiness(members, relationships, marriages);
      issues.push(...successionIssues);

      // Generate Statistics
      const statistics = {
        totalMembers: members.length,
        verifiedRelationships: relationships.filter((r) => r.getIsVerified()).length,
        unverifiedRelationships: relationships.filter((r) => !r.getIsVerified()).length,
        minorsWithoutGuardians: minorsWithoutGuardians.length,
        deceasedMembers: members.filter((m) => m.getIsDeceased()).length,
        potentialSuccessionIssues: successionIssues.filter((i) => i.type === 'ERROR').length,
      };

      return {
        isValid: issues.filter((i) => i.type === 'ERROR').length === 0,
        issues,
        statistics,
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [
          {
            type: 'ERROR',
            code: 'VALIDATION_ERROR',
            message: `Family tree validation failed: ${error.message}`,
          },
        ],
        statistics: {
          totalMembers: 0,
          verifiedRelationships: 0,
          unverifiedRelationships: 0,
          minorsWithoutGuardians: 0,
          deceasedMembers: 0,
          potentialSuccessionIssues: 0,
        },
      };
    }
  }

  // --------------------------------------------------------------------------
  // PRIVATE IMPLEMENTATION - KENYAN LEGAL COMPLIANCE
  // --------------------------------------------------------------------------

  private async validateBasicEntities(
    familyId: string,
    fromMemberId: string,
    toMemberId: string,
    result: RelationshipValidationResult,
  ): Promise<void> {
    const [fromMember, toMember] = await Promise.all([
      this.memberRepo.findById(fromMemberId),
      this.memberRepo.findById(toMemberId),
    ]);

    if (!fromMember || !toMember) {
      result.errors.push('One or both family members not found.');
      return;
    }

    if (fromMember.getFamilyId() !== familyId || toMember.getFamilyId() !== familyId) {
      result.errors.push('Members belong to different family trees.');
    }

    if (fromMember.getIsDeceased() || toMember.getIsDeceased()) {
      result.warnings.push(
        'Creating relationships involving deceased members may affect succession calculations.',
      );
    }
  }

  private async validateKenyanLegalRequirements(
    fromMember: any,
    toMember: any,
    type: RelationshipType,
    metadata: any,
    result: RelationshipValidationResult,
  ): Promise<void> {
    // Adoption Validation
    if (metadata?.isAdopted && !metadata?.adoptionOrderNumber) {
      result.warnings.push(
        'Legal adoption should have an adoption order number for full inheritance rights.',
      );
    }

    // Born Out of Wedlock Considerations
    if (metadata?.bornOutOfWedlock && type === 'CHILD') {
      result.warnings.push(
        'Children born out of wedlock should have verified relationships for inheritance claims.',
      );
      result.recommendations.push(
        'Consider obtaining birth certificate or affidavit verification.',
      );
    }

    // Age Considerations for Parent-Child Relationships
    if (type === 'PARENT' || type === 'CHILD') {
      const fromAge = fromMember.getAge();
      const toAge = toMember.getAge();

      if (fromAge !== null && toAge !== null) {
        const ageDifference = Math.abs(fromAge - toAge);
        if (ageDifference < 15) {
          result.warnings.push('Unusual age difference for parent-child relationship.');
        }
      }
    }

    // Kenyan Customary Adoption Recognition
    if (metadata?.isAdopted && !metadata?.adoptionOrderNumber) {
      result.recommendations.push(
        'Consider formalizing customary adoption through legal channels for full inheritance rights.',
      );
    }
  }

  private async validateMarriageEntities(
    familyId: string,
    spouse1Id: string,
    spouse2Id: string,
    result: MarriageValidationResult,
  ): Promise<void> {
    const [spouse1, spouse2] = await Promise.all([
      this.memberRepo.findById(spouse1Id),
      this.memberRepo.findById(spouse2Id),
    ]);

    if (!spouse1 || !spouse2) {
      result.errors.push('One or both spouses not found.');
      return;
    }

    if (spouse1.getFamilyId() !== familyId || spouse2.getFamilyId() !== familyId) {
      result.errors.push('Spouses belong to different family trees.');
    }

    if (spouse1.getIsDeceased() || spouse2.getIsDeceased()) {
      result.errors.push('Cannot marry deceased individuals.');
    }
  }

  private validateMarriageAge(spouse1: any, spouse2: any, result: MarriageValidationResult): void {
    const age1 = spouse1.getAge();
    const age2 = spouse2.getAge();

    // Kenyan legal marriage age is 18
    if (age1 !== null && age1 < 18) {
      result.errors.push(`Spouse 1 is under the legal marriage age of 18 (age: ${age1}).`);
    }

    if (age2 !== null && age2 < 18) {
      result.errors.push(`Spouse 2 is under the legal marriage age of 18 (age: ${age2}).`);
    }

    // Warning for large age differences
    if (age1 !== null && age2 !== null) {
      const ageDifference = Math.abs(age1 - age2);
      if (ageDifference > 25) {
        result.warnings.push(
          'Significant age difference between spouses may have legal implications.',
        );
      }
    }
  }

  private validateKenyanMarriageType(
    marriageType: MarriageStatus,
    marriageDetails: any,
    result: MarriageValidationResult,
  ): void {
    switch (marriageType) {
      case 'CUSTOMARY_MARRIAGE':
        if (!marriageDetails?.customaryDetails) {
          result.errors.push(
            'Customary marriages require customary details (bride price, elder witnesses, etc.).',
          );
        }
        result.legalRequirements.push('Registration with Registrar of Marriages recommended');
        break;

      case 'CIVIL_UNION':
        result.legalRequirements.push(
          'Marriage certificate required',
          'Registration with civil registry',
        );
        break;

      case 'MARRIED': // Assuming Christian/church marriage
        result.legalRequirements.push('Marriage certificate required', 'Church registration');
        break;
    }
  }

  private async validateGuardianshipEntities(
    familyId: string,
    guardianId: string,
    wardId: string,
    result: GuardianshipValidationResult,
  ): Promise<void> {
    const [guardian, ward] = await Promise.all([
      this.memberRepo.findById(guardianId),
      this.memberRepo.findById(wardId),
    ]);

    if (!guardian || !ward) {
      result.errors.push('Guardian or ward not found.');
      return;
    }

    if (guardian.getFamilyId() !== familyId || ward.getFamilyId() !== familyId) {
      result.errors.push('Guardian and ward must belong to the same family tree.');
    }

    if (guardian.getIsDeceased()) {
      result.errors.push('Deceased individuals cannot serve as guardians.');
    }
  }

  private validateKenyanGuardianshipLaws(
    guardian: any,
    ward: any,
    guardianType: string,
    result: GuardianshipValidationResult,
  ): void {
    // Kenyan Children's Act considerations
    if (guardianType === 'LEGAL_GUARDIAN') {
      result.courtRequirements.push(
        'Best interests of the child must be paramount',
        'Guardian must be fit and proper person',
        "Consideration of child's wishes if of sufficient age",
      );
    }

    // Financial guardianship restrictions
    if (guardianType === 'FINANCIAL_GUARDIAN') {
      result.restrictions.push(
        "Separate accounting for ward's assets required",
        'Court approval for major financial decisions',
        'Regular financial reporting may be required',
      );
    }
  }

  private async areBloodRelatives(
    person1Id: string,
    person2Id: string,
    familyId: string,
  ): Promise<{ areBloodRelatives: boolean; relationship?: string }> {
    // Implementation of blood relative detection
    // This would involve graph traversal to find common ancestors
    // For now, return a simplified check
    const relationships = await this.relationshipRepo.findByFamilyId(familyId);

    // Check for direct parent-child or sibling relationships
    const directRelationship = relationships.find(
      (rel) =>
        (rel.getFromMemberId() === person1Id && rel.getToMemberId() === person2Id) ||
        (rel.getFromMemberId() === person2Id && rel.getToMemberId() === person1Id),
    );

    if (directRelationship) {
      return {
        areBloodRelatives: true,
        relationship: directRelationship.getType(),
      };
    }

    // More complex relationship detection would go here
    return { areBloodRelatives: false };
  }

  private analyzeSuccessionImplications(
    fromMember: any,
    toMember: any,
    type: RelationshipType,
    metadata: any,
    result: RelationshipValidationResult,
  ): void {
    const inheritanceStrength = this.calculateInheritanceStrength(type, metadata);

    if (inheritanceStrength === 'STRONG') {
      result.recommendations.push(
        'This relationship establishes strong inheritance rights under Kenyan law.',
      );
    } else if (inheritanceStrength === 'WEAK') {
      result.warnings.push(
        'This relationship may have weak inheritance claims without verification.',
      );
    }

    // Specific succession considerations
    if (type === 'CHILD' && metadata?.bornOutOfWedlock) {
      result.recommendations.push(
        'Consider formal recognition for full succession rights under Section 29.',
      );
    }

    if (type === 'ADOPTED_CHILD' && !metadata?.adoptionOrderNumber) {
      result.recommendations.push(
        'Legal adoption order recommended for unambiguous succession rights.',
      );
    }
  }

  private calculateInheritanceStrength(
    type: RelationshipType,
    metadata: any,
  ): 'STRONG' | 'MEDIUM' | 'WEAK' {
    if (type === 'SPOUSE') return 'STRONG';
    if (type === 'CHILD' && metadata?.isBiological && !metadata?.bornOutOfWedlock) return 'STRONG';
    if (type === 'ADOPTED_CHILD' && metadata?.adoptionOrderNumber) return 'STRONG';
    if (type === 'CHILD' && metadata?.bornOutOfWedlock) return 'MEDIUM';
    if (type === 'PARENT') return 'MEDIUM';
    return 'WEAK';
  }

  private generateLegalRequirements(
    marriageType: MarriageStatus,
    spouse1: any,
    spouse2: any,
    result: MarriageValidationResult,
  ): void {
    result.legalRequirements.push('Both spouses must consent to the marriage');

    if (marriageType === 'CUSTOMARY_MARRIAGE') {
      result.legalRequirements.push(
        'Bride price negotiation and payment',
        'Elder witnesses from both families',
        'Traditional ceremony according to community customs',
      );
    }

    // Age-specific requirements
    const age1 = spouse1.getAge();
    const age2 = spouse2.getAge();

    if (age1 !== null && age1 < 21) {
      result.legalRequirements.push('Parental consent required for spouse under 21');
    }
    if (age2 !== null && age2 < 21) {
      result.legalRequirements.push('Parental consent required for spouse under 21');
    }
  }

  private findOrphanedMembers(members: any[], relationships: any[], marriages: any[]): string[] {
    const connectedMembers = new Set<string>();

    relationships.forEach((rel) => {
      connectedMembers.add(rel.getFromMemberId());
      connectedMembers.add(rel.getToMemberId());
    });

    marriages.forEach((marriage) => {
      connectedMembers.add(marriage.getSpouse1Id());
      connectedMembers.add(marriage.getSpouse2Id());
    });

    return members
      .filter((member) => !connectedMembers.has(member.getId()))
      .map((member) => member.getId());
  }

  private findMinorsWithoutGuardians(members: any[], guardianships: any[]): string[] {
    const minors = members.filter((m) => m.getIsMinor() && !m.getIsDeceased());
    const wardsWithGuardians = new Set(
      guardianships.filter((g) => g.getIsActiveRecord()).map((g) => g.getWardId()),
    );

    return minors
      .filter((minor) => !wardsWithGuardians.has(minor.getId()))
      .map((minor) => minor.getId());
  }

  private findUnverifiedCriticalRelationships(relationships: any[]): any[] {
    const criticalTypes: RelationshipType[] = ['PARENT', 'CHILD', 'SPOUSE', 'ADOPTED_CHILD'];

    return relationships.filter(
      (rel) => criticalTypes.includes(rel.getType()) && !rel.getIsVerified(),
    );
  }

  private analyzeSuccessionReadiness(
    members: any[],
    relationships: any[],
    marriages: any[],
  ): Array<{
    type: 'ERROR' | 'WARNING' | 'INFO';
    code: string;
    message: string;
    recommendation?: string;
  }> {
    const issues: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      code: string;
      message: string;
      recommendation?: string;
    }> = [];

    // Check for unverified parent-child relationships
    const unverifiedParentChild = relationships.filter(
      (rel) => (rel.getType() === 'PARENT' || rel.getType() === 'CHILD') && !rel.getIsVerified(),
    );
    if (unverifiedParentChild.length > 0) {
      issues.push({
        type: 'WARNING',
        code: 'UNVERIFIED_PARENT_CHILD',
        message: `${unverifiedParentChild.length} parent-child relationships are not verified`,
        recommendation: 'Verify critical relationships for succession clarity',
      });
    }

    // Check for minors in the family
    const minors = members.filter((m) => m.getIsMinor() && !m.getIsDeceased());
    if (minors.length > 0) {
      issues.push({
        type: 'INFO',
        code: 'MINORS_PRESENT',
        message: `${minors.length} minors in family - consider guardianship provisions in wills`,
      });
    }

    // Check for complex marriage structures
    const polygamousMarriages = marriages.filter((m) => m.allowsPolygamy() && m.getIsActive());
    if (polygamousMarriages.length > 1) {
      issues.push({
        type: 'WARNING',
        code: 'POLYGAMOUS_STRUCTURE',
        message: 'Polygamous marriage structure detected',
        recommendation: 'Ensure clear succession provisions for all spouses and children',
      });
    }

    return issues;
  }
}
