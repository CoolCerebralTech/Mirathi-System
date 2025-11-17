// family-tree/domain/services/relationship-integrity.service.ts
import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { KenyanRelationship } from '../value-objects/kenyan-relationship.vo';

export interface RelationshipValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface CulturalValidation {
  isValid: boolean;
  culturalIssues: string[];
  communityStandards: string[];
  traditionalRequirements: string[];
}

@Injectable()
export class RelationshipIntegrityService {
  /**
   * Validates family relationships for integrity and Kenyan cultural compliance
   */
  validateRelationshipIntegrity(
    member: FamilyMember,
    relatedMember: FamilyMember,
    relationship: KenyanRelationship,
    existingRelationships: Map<string, KenyanRelationship>, // memberId -> relationship
  ): RelationshipValidation {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Basic validation
    this.validateBasicRelationship(member, relatedMember, relationship, issues);

    // Cultural validation
    const culturalValidation = this.validateCulturalCompliance(member, relatedMember, relationship);
    if (!culturalValidation.isValid) {
      issues.push(...culturalValidation.culturalIssues);
    }
    recommendations.push(...culturalValidation.traditionalRequirements);

    // Legal validation
    this.validateLegalCompliance(member, relatedMember, relationship, issues, warnings);

    // Consistency validation
    this.validateRelationshipConsistency(
      member,
      relatedMember,
      relationship,
      existingRelationships,
      issues,
      warnings,
    );

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  /**
   * Validates basic relationship constraints
   */
  private validateBasicRelationship(
    member: FamilyMember,
    relatedMember: FamilyMember,
    relationship: KenyanRelationship,
    issues: string[],
  ): void {
    // Cannot have relationship with oneself
    if (member.getId() === relatedMember.getId()) {
      issues.push('A person cannot have a relationship with themselves');
      return;
    }

    // Check age appropriateness for certain relationships
    const memberAge = member.getAge();
    const relatedAge = relatedMember.getAge();

    if (memberAge !== null && relatedAge !== null) {
      // Parent-child relationship age check
      if (relationship.getRelationshipType() === RelationshipType.PARENT) {
        if (memberAge <= relatedAge + 15) {
          // Parent should be at least 15 years older
          issues.push('Parent must be significantly older than child');
        }
      }

      // Spouse relationship age check
      if (relationship.getRelationshipType() === RelationshipType.SPOUSE) {
        if (Math.abs(memberAge - relatedAge) > 40) {
          warnings.push(
            'Significant age difference between spouses may require additional validation',
          );
        }

        // Check minimum marriage age
        const minMarriageAge = 18;
        if (memberAge < minMarriageAge || relatedAge < minMarriageAge) {
          issues.push(`Both spouses must be at least ${minMarriageAge} years old for marriage`);
        }
      }
    }

    // Deceased person constraints
    if (member.getIsDeceased() || relatedMember.getIsDeceased()) {
      warnings.push('Relationship involves deceased person - consider historical context');
    }
  }

  /**
   * Validates cultural compliance for Kenyan relationships
   */
  private validateCulturalCompliance(
    member: FamilyMember,
    relatedMember: FamilyMember,
    relationship: KenyanRelationship,
  ): CulturalValidation {
    const culturalIssues: string[] = [];
    const communityStandards: string[] = [];
    const traditionalRequirements: string[] = [];

    const relationshipType = relationship.getRelationshipType();

    // Spouse relationship cultural considerations
    if (relationshipType === RelationshipType.SPOUSE) {
      // Check for customary marriage requirements
      if (relationship.getMetadata().isCustomaryRelationship) {
        traditionalRequirements.push(
          'Customary marriage requires elder involvement and traditional rites',
        );
        traditionalRequirements.push('Bride price arrangements should be documented');
      }

      // Polygamous marriage considerations
      if (relationship.getMetadata().inheritanceRights === 'FULL') {
        communityStandards.push('Ensure equal treatment of all spouses in succession planning');
      }
    }

    // Parent-child relationship cultural considerations
    if (
      relationshipType === RelationshipType.PARENT ||
      relationshipType === RelationshipType.CHILD
    ) {
      communityStandards.push('Respect for parents is fundamental in Kenyan family structures');
      communityStandards.push('Children have responsibility to care for elderly parents');
    }

    // Guardian relationships
    if (relationshipType === RelationshipType.GUARDIAN) {
      traditionalRequirements.push('Guardian appointments should involve family consultation');
      communityStandards.push('Guardians should be respected family or community members');
    }

    return {
      isValid: culturalIssues.length === 0,
      culturalIssues,
      communityStandards,
      traditionalRequirements,
    };
  }

  /**
   * Validates legal compliance for relationships
   */
  private validateLegalCompliance(
    member: FamilyMember,
    relatedMember: FamilyMember,
    relationship: KenyanRelationship,
    issues: string[],
    warnings: string[],
  ): void {
    const relationshipType = relationship.getRelationshipType();

    // Marriage legal requirements
    if (relationshipType === RelationshipType.SPOUSE) {
      if (!relationship.getMetadata().isLegalRelationship) {
        warnings.push('Marriage may not be legally recognized - could affect succession rights');
      }

      if (relationship.requiresLegalDocumentation()) {
        issues.push('Legal documentation required for this relationship type');
      }
    }

    // Adoption legal requirements
    if (relationshipType === RelationshipType.ADOPTED_CHILD) {
      if (!relationship.requiresLegalDocumentation()) {
        issues.push('Adoption requires legal documentation and court approval');
      }
    }

    // Guardian legal requirements
    if (relationshipType === RelationshipType.GUARDIAN) {
      if (member.getIsMinor()) {
        issues.push('Minors cannot serve as legal guardians');
      }

      if (!relationship.requiresLegalDocumentation()) {
        warnings.push('Guardianship should be formally documented for legal protection');
      }
    }

    // Inheritance rights validation
    if (!relationship.hasInheritanceRightsUnderIntestacy()) {
      warnings.push('This relationship may not have automatic inheritance rights under Kenyan law');
    }
  }

  /**
   * Validates relationship consistency within family context
   */
  private validateRelationshipConsistency(
    member: FamilyMember,
    relatedMember: FamilyMember,
    relationship: KenyanRelationship,
    existingRelationships: Map<string, KenyanRelationship>,
    issues: string[],
    warnings: string[],
  ): void {
    const relationshipType = relationship.getRelationshipType();

    // Check for conflicting relationships
    for (const [existingMemberId, existingRelationship] of existingRelationships.entries()) {
      const existingType = existingRelationship.getRelationshipType();

      // Cannot be both parent and child of the same person
      if (
        (relationshipType === RelationshipType.PARENT && existingType === RelationshipType.CHILD) ||
        (relationshipType === RelationshipType.CHILD && existingType === RelationshipType.PARENT)
      ) {
        issues.push(`Cannot be both parent and child of the same person`);
      }

      // Cannot be spouse and parent/child
      if (
        (relationshipType === RelationshipType.SPOUSE &&
          (existingType === RelationshipType.PARENT || existingType === RelationshipType.CHILD)) ||
        ((relationshipType === RelationshipType.PARENT ||
          relationshipType === RelationshipType.CHILD) &&
          existingType === RelationshipType.SPOUSE)
      ) {
        warnings.push('Spousal relationship with parent/child may indicate data error');
      }
    }

    // Check for circular relationships
    if (
      this.detectCircularRelationship(
        member.getId(),
        relatedMember.getId(),
        relationshipType,
        existingRelationships,
      )
    ) {
      issues.push('Circular relationship detected - would create infinite relationship loop');
    }
  }

  /**
   * Detects circular relationships
   */
  private detectCircularRelationship(
    memberId: string,
    relatedId: string,
    relationshipType: RelationshipType,
    existingRelationships: Map<string, KenyanRelationship>,
    visited: Set<string> = new Set(),
  ): boolean {
    if (visited.has(memberId)) {
      return true;
    }

    visited.add(memberId);

    // Follow relationship chain
    if (relationshipType === RelationshipType.PARENT) {
      // If A is parent of B, check if B is already in A's ancestry
      const childRelationships = Array.from(existingRelationships.entries())
        .filter(([_, rel]) => rel.getRelationshipType() === RelationshipType.PARENT)
        .map(([id, _]) => id);

      for (const childId of childRelationships) {
        if (
          this.detectCircularRelationship(
            childId,
            memberId,
            RelationshipType.CHILD,
            existingRelationships,
            new Set(visited),
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validates marriage relationships specifically
   */
  validateMarriageRelationship(
    marriage: Marriage,
    existingMarriages: Marriage[],
  ): RelationshipValidation {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const spouse1Id = marriage.getSpouse1Id();
    const spouse2Id = marriage.getSpouse2Id();

    // Check for self-marriage
    if (spouse1Id === spouse2Id) {
      issues.push('A person cannot marry themselves');
    }

    // Check for duplicate marriages
    const duplicateMarriage = existingMarriages.find(
      (existing) =>
        (existing.getSpouse1Id() === spouse1Id && existing.getSpouse2Id() === spouse2Id) ||
        (existing.getSpouse1Id() === spouse2Id && existing.getSpouse2Id() === spouse1Id),
    );

    if (duplicateMarriage && duplicateMarriage.getId() !== marriage.getId()) {
      issues.push('Marriage between these spouses already exists');
    }

    // Check for overlapping marriages (polygamy validation)
    if (!marriage.isPolygamous()) {
      const overlappingMarriage = existingMarriages.find(
        (existing) =>
          existing.getIsActive() &&
          (existing.getSpouse1Id() === spouse1Id || existing.getSpouse2Id() === spouse1Id) &&
          existing.getId() !== marriage.getId(),
      );

      if (overlappingMarriage) {
        issues.push(
          'Spouse is already in an active marriage - requires polygamous marriage registration',
        );
      }
    }

    // Validate marriage date
    const marriageDate = marriage.getMarriageDetails().getMarriageDate();
    if (marriageDate > new Date()) {
      issues.push('Marriage date cannot be in the future');
    }

    // Customary marriage validation
    if (marriage.isCustomaryMarriage()) {
      const customaryDetails = marriage.getMarriageDetails().getDetails().customaryDetails;
      if (!customaryDetails) {
        issues.push('Customary marriage requires customary details');
      } else {
        if (!customaryDetails.eldersInvolved || customaryDetails.eldersInvolved.length === 0) {
          warnings.push('Customary marriage should involve elders or community leaders');
        }

        if (!customaryDetails.community) {
          issues.push('Customary marriage must specify the community');
        }
      }
    }

    // Legal registration recommendation
    if (!marriage.isLegallyRecognized()) {
      recommendations.push('Register marriage for full legal recognition and protection');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  /**
   * Validates guardianship relationships
   */
  validateGuardianshipRelationship(
    guardian: FamilyMember,
    ward: FamilyMember,
    existingGuardianships: any[],
  ): RelationshipValidation {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Guardian must be adult
    if (guardian.getIsMinor()) {
      issues.push('Guardian must be an adult (18+ years)');
    }

    // Ward should typically be a minor or dependent
    if (!ward.getIsMinor() && !this.isDependentAdult(ward)) {
      warnings.push('Ward is not a minor - ensure guardianship is appropriate');
    }

    // Check for conflicting guardianships
    const conflictingGuardianship = existingGuardianships.find(
      (existing) => existing.getWardId() === ward.getId() && existing.getIsActive(),
    );

    if (conflictingGuardianship) {
      issues.push('Ward already has an active guardianship');
    }

    // Relationship appropriateness
    const relationship = guardian.getRelationshipType();
    if (!this.isAppropriateGuardianRelationship(relationship.getRelationshipType())) {
      warnings.push('Guardian relationship may not be culturally appropriate');
    }

    // Legal documentation
    if (relationship.requiresLegalDocumentation()) {
      recommendations.push('Formalize guardianship through legal documentation');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  /**
   * Checks if an adult is dependent
   */
  private isDependentAdult(member: FamilyMember): boolean {
    // This would check for disability, illness, or other dependency factors
    // Simplified implementation
    const age = member.getAge();
    return age !== null && age >= 65; // Elderly adults may be dependent
  }

  /**
   * Checks if relationship type is appropriate for guardianship
   */
  private isAppropriateGuardianRelationship(relationshipType: RelationshipType): boolean {
    const appropriateRelationships = [
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.GRANDPARENT,
      RelationshipType.AUNT_UNCLE,
    ];

    return appropriateRelationships.includes(relationshipType);
  }

  /**
   * Generates relationship integrity report
   */
  generateIntegrityReport(
    familyMembers: FamilyMember[],
    marriages: Marriage[],
    guardianships: any[],
  ): {
    overallIntegrity: 'HIGH' | 'MEDIUM' | 'LOW';
    relationshipCount: number;
    issueCount: number;
    warningCount: number;
    criticalIssues: string[];
    improvementRecommendations: string[];
  } {
    let issueCount = 0;
    let warningCount = 0;
    const criticalIssues: string[] = [];
    const improvementRecommendations: string[] = [];

    // Validate all marriages
    for (const marriage of marriages) {
      const validation = this.validateMarriageRelationship(marriage, marriages);
      issueCount += validation.issues.length;
      warningCount += validation.warnings.length;
      criticalIssues.push(...validation.issues);
      improvementRecommendations.push(...validation.recommendations);
    }

    // Sample some guardianships for validation
    for (const guardianship of guardianships.slice(0, 5)) {
      // Sample first 5
      // This would require actual guardian and ward objects
      // For now, we'll skip detailed guardianship validation in this sample
    }

    // Determine overall integrity
    let overallIntegrity: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    const totalRelationships = marriages.length + guardianships.length;
    const issueRatio = issueCount / totalRelationships;

    if (issueRatio > 0.3) {
      overallIntegrity = 'LOW';
    } else if (issueRatio > 0.1) {
      overallIntegrity = 'MEDIUM';
    }

    return {
      overallIntegrity,
      relationshipCount: totalRelationships,
      issueCount,
      warningCount,
      criticalIssues,
      improvementRecommendations,
    };
  }
}
