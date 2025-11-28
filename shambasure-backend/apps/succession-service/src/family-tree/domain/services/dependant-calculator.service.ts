import { Inject, Injectable } from '@nestjs/common';
import { MarriageStatus, RelationshipType } from '@prisma/client';

import type { FamilyMember } from '../entities/family-member.entity';
import type { Guardianship } from '../entities/guardianship.entity';
import type { Marriage } from '../entities/marriage.entity';
import type { Relationship } from '../entities/relationship.entity';
import type { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import type { GuardianshipRepositoryInterface } from '../interfaces/guardianship.repository.interface';
import type { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import type { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import { DependantIdentificationPolicy } from '../policies/dependant-identification.policy';

// ============================================================================
// TYPE DEFINITIONS FOR GRAPH STRUCTURE
// ============================================================================

interface EnhancedRelationship {
  type: string;
  targetId: string;
  metadata: {
    isVerified?: boolean;
    isBiological?: boolean;
    isAdopted?: boolean;
    bornOutOfWedlock?: boolean;
    adoptionOrderNumber?: string;
    marriageType?: MarriageStatus;
    isActive?: boolean;
    marriageDate?: Date;
    divorceDate?: Date | null;
    isCustomary?: boolean;
    guardianType?: string;
    appointmentDate?: Date;
    validUntil?: Date | null;
  };
}

interface LegalGraphNode {
  id: string;
  isMinor: boolean;
  isDeceased: boolean;
  isDisabled: boolean;
  dependencyLevel: 'INDEPENDENT' | 'PARTIAL' | 'FULL';
  gender: string;
  age: number | null;
  relationships: EnhancedRelationship[];
  metadata: {
    clan?: string;
    subClan?: string;
    birthOrder?: number;
    isFamilyHead: boolean;
    isElder: boolean;
    traditionalTitle?: string;
    educationLevel?: 'NONE' | 'PRIMARY' | 'SECONDARY' | 'COLLEGE' | 'UNIVERSITY';
    occupation?: string;
    disabilityStatus?: 'NONE' | 'PHYSICAL' | 'MENTAL' | 'VISUAL' | 'HEARING';
    dependencyStatus: 'INDEPENDENT' | 'PARTIAL' | 'FULL';
  };
}

// ============================================================================
// RESULT INTERFACES
// ============================================================================

export interface IdentifiedDependant {
  id: string;
  fullName: string;
  relationshipToTestator: string;
  relationshipType: RelationshipType;
  isMinor: boolean;
  isDisabled: boolean;
  dependencyLevel: 'FULL' | 'PARTIAL' | 'INDEPENDENT';
  priority: number; // 1 = High (Section 29 Primary), 2 = Secondary, 3 = Tertiary
  legalBasis: string; // Specific section of Law of Succession Act
  maintenanceRequired: boolean;
  specialConsiderations: string[];
}

export interface DependantCalculationResult {
  dependants: IdentifiedDependant[];
  summary: {
    totalDependants: number;
    minorDependants: number;
    disabledDependants: number;
    spousalDependants: number;
    childDependants: number;
    parentDependants: number;
    otherDependants: number;
  };
  legalAnalysis: {
    hasSpouse: boolean;
    hasChildren: boolean;
    hasParents: boolean;
    hasOtherDependants: boolean;
    successionType: 'TESTATE' | 'INTESTATE' | 'MIXED';
    applicableSections: string[]; // e.g., ['Section 29', 'Section 35', 'Section 39']
  };
}

@Injectable()
export class DependantCalculatorService {
  constructor(
    @Inject('FamilyMemberRepositoryInterface')
    private readonly memberRepo: FamilyMemberRepositoryInterface,
    @Inject('RelationshipRepositoryInterface')
    private readonly relationshipRepo: RelationshipRepositoryInterface,
    @Inject('MarriageRepositoryInterface')
    private readonly marriageRepo: MarriageRepositoryInterface,
    @Inject('GuardianshipRepositoryInterface')
    private readonly guardianshipRepo: GuardianshipRepositoryInterface,
    private readonly identificationPolicy: DependantIdentificationPolicy,
  ) {}

  /**
   * Identifies all potential legal dependants for a specific user (Testator) under Kenyan Law
   */
  async identifyLegalDependants(
    familyId: string,
    testatorMemberId: string,
  ): Promise<DependantCalculationResult> {
    // Fetch comprehensive data for analysis
    const [members, relationships, marriages, activeGuardianships] = await Promise.all([
      this.memberRepo.findByFamilyId(familyId),
      this.relationshipRepo.findByFamilyId(familyId),
      this.marriageRepo.findByFamilyId(familyId),
      this.guardianshipRepo.findActiveByFamilyId(familyId),
    ]);

    const testator = members.find((m) => m.getId() === testatorMemberId);
    if (!testator) {
      throw new Error(`Testator member ${testatorMemberId} not found in family ${familyId}`);
    }

    // Build enhanced graph structure with Kenyan legal context
    const legalGraph = this.buildLegalRelationshipGraph(
      members,
      relationships,
      marriages,
      activeGuardianships,
    );

    // Execute Kenyan law compliance policy
    const dependantIds = this.identificationPolicy.identifyDependants(testatorMemberId, legalGraph);

    // Enrich results with Kenyan legal analysis
    const dependants = this.enrichDependantResults(
      dependantIds,
      members,
      testatorMemberId,
      relationships,
      marriages,
    );

    // Generate legal analysis
    const legalAnalysis = this.analyzeLegalImplications(dependants);

    return {
      dependants,
      summary: this.generateSummary(dependants),
      legalAnalysis,
    };
  }

  /**
   * Calculates dependants for intestate succession under Kenyan Law of Succession Act
   */
  async calculateIntestateDependants(
    familyId: string,
    deceasedMemberId: string,
  ): Promise<DependantCalculationResult> {
    const result = await this.identifyLegalDependants(familyId, deceasedMemberId);

    // Apply intestate succession specific rules
    const intestateDependants = result.dependants.filter((dependant) =>
      this.isIntestateEligible(dependant),
    );

    return {
      ...result,
      dependants: intestateDependants,
      summary: this.generateSummary(intestateDependants),
      legalAnalysis: {
        ...result.legalAnalysis,
        successionType: 'INTESTATE' as const,
        applicableSections: this.getIntestateApplicableSections(intestateDependants),
      },
    };
  }

  /**
   * Validates if a will adequately provides for all dependants under Section 26
   */
  async validateWillAdequacy(
    familyId: string,
    testatorMemberId: string,
    willProvisions: Array<{
      beneficiaryId: string;
      provisionType: 'SPECIFIC' | 'PERCENTAGE' | 'RESIDUARY';
      value?: number;
      percentage?: number;
    }>,
  ): Promise<{
    isAdequate: boolean;
    inadequacies: Array<{
      dependantId: string;
      dependantName: string;
      relationship: string;
      recommendedProvision: string;
      legalBasis: string;
    }>;
    recommendations: string[];
  }> {
    const dependantsResult = await this.identifyLegalDependants(familyId, testatorMemberId);
    const inadequacies: Array<{
      dependantId: string;
      dependantName: string;
      relationship: string;
      recommendedProvision: string;
      legalBasis: string;
    }> = [];

    const coveredDependantIds = new Set(willProvisions.map((p) => p.beneficiaryId));

    for (const dependant of dependantsResult.dependants) {
      if (!coveredDependantIds.has(dependant.id)) {
        inadequacies.push({
          dependantId: dependant.id,
          dependantName: dependant.fullName,
          relationship: dependant.relationshipToTestator,
          recommendedProvision: this.getRecommendedProvision(dependant),
          legalBasis: 'Section 26 - Family Provision',
        });
      }
    }

    return {
      isAdequate: inadequacies.length === 0,
      inadequacies,
      recommendations: this.generateWillRecommendations(dependantsResult, willProvisions),
    };
  }

  // --------------------------------------------------------------------------
  // PRIVATE IMPLEMENTATION - KENYAN LEGAL COMPLIANCE
  // --------------------------------------------------------------------------

  private buildLegalRelationshipGraph(
    members: FamilyMember[],
    relationships: Relationship[],
    marriages: Marriage[],
    guardianships: Guardianship[],
  ): LegalGraphNode[] {
    return members.map((member) => ({
      id: member.getId(),
      isMinor: member.getIsMinor(),
      isDeceased: member.getIsDeceased(),
      isDisabled: member.getMetadata().disabilityStatus !== 'NONE',
      dependencyLevel: member.getMetadata().dependencyStatus,
      gender: member.getGender(),
      age: member.getAge(),
      relationships: this.buildEnhancedRelationshipList(
        member.getId(),
        relationships,
        marriages,
        guardianships,
      ),
      metadata: member.getMetadata(),
    }));
  }

  private buildEnhancedRelationshipList(
    memberId: string,
    allRels: Relationship[],
    allMarriages: Marriage[],
    allGuardianships: Guardianship[],
  ): EnhancedRelationship[] {
    const list: EnhancedRelationship[] = [];

    // Add Blood Relationships
    allRels
      .filter((r) => r.getFromMemberId() === memberId)
      .forEach((r) =>
        list.push({
          type: r.getType(),
          targetId: r.getToMemberId(),
          metadata: {
            isVerified: r.getIsVerified(),
            isBiological: r.getMetadata().isBiological,
            isAdopted: r.getMetadata().isAdopted,
            bornOutOfWedlock: r.getMetadata().bornOutOfWedlock,
            adoptionOrderNumber: r.getMetadata().adoptionOrderNumber,
          },
        }),
      );

    // Add Marriages (including dissolved for maintenance claims)
    allMarriages
      .filter((m) => m.getSpouse1Id() === memberId || m.getSpouse2Id() === memberId)
      .forEach((m) => {
        const target = m.getSpouse1Id() === memberId ? m.getSpouse2Id() : m.getSpouse1Id();
        list.push({
          type: 'SPOUSE',
          targetId: target,
          metadata: {
            marriageType: m.getMarriageType(),
            isActive: m.getIsActive(),
            marriageDate: m.getMarriageDate(),
            divorceDate: m.getDivorceDate(),
            isCustomary: m.getMarriageType() === 'CUSTOMARY_MARRIAGE',
          },
        });
      });

    // Add Guardianships
    allGuardianships
      .filter((g) => g.getGuardianId() === memberId && g.getIsActiveRecord())
      .forEach((g) =>
        list.push({
          type: 'GUARDIAN_OF',
          targetId: g.getWardId(),
          metadata: {
            guardianType: g.getType(),
            appointmentDate: g.getAppointmentDate(),
            validUntil: g.getValidUntil(),
          },
        }),
      );

    return list;
  }

  private enrichDependantResults(
    dependantIds: string[],
    members: FamilyMember[],
    testatorId: string,
    relationships: Relationship[],
    marriages: Marriage[],
  ): IdentifiedDependant[] {
    const results: IdentifiedDependant[] = [];

    for (const dependantId of dependantIds) {
      const member = members.find((m) => m.getId() === dependantId);
      if (!member) continue;

      const relationshipInfo = this.determineKenyanRelationshipType(
        testatorId,
        dependantId,
        relationships,
        marriages,
      );

      const dependencyLevel = this.calculateDependencyLevel(member, relationshipInfo.type);

      results.push({
        id: member.getId(),
        fullName: member.getFullName(),
        relationshipToTestator: relationshipInfo.description,
        relationshipType: relationshipInfo.type,
        isMinor: member.getIsMinor(),
        isDisabled: member.getMetadata().disabilityStatus !== 'NONE',
        dependencyLevel,
        priority: this.getKenyanPriority(relationshipInfo.type, dependencyLevel),
        legalBasis: this.getLegalBasis(relationshipInfo.type, dependencyLevel),
        maintenanceRequired: this.requiresMaintenance(relationshipInfo.type, dependencyLevel),
        specialConsiderations: this.getSpecialConsiderations(member, relationshipInfo),
      });
    }

    // Sort by Kenyan legal priority
    return results.sort((a, b) => a.priority - b.priority);
  }

  private determineKenyanRelationshipType(
    sourceId: string,
    targetId: string,
    rels: Relationship[],
    marriages: Marriage[],
  ): { type: RelationshipType; description: string } {
    // Check Marriage (including dissolved)
    const marriage = marriages.find(
      (m) =>
        (m.getSpouse1Id() === sourceId && m.getSpouse2Id() === targetId) ||
        (m.getSpouse2Id() === sourceId && m.getSpouse1Id() === targetId),
    );

    if (marriage) {
      const description = marriage.getIsActive() ? 'SPOUSE' : 'FORMER_SPOUSE';
      return { type: 'SPOUSE', description };
    }

    // Check Direct Relationship
    const directRel = rels.find(
      (r) => r.getFromMemberId() === sourceId && r.getToMemberId() === targetId,
    );

    if (directRel) {
      return {
        type: directRel.getType(),
        description: this.getRelationshipDescription(directRel.getType(), 'direct'),
      };
    }

    // Check Inverse Relationship
    const inverseRel = rels.find(
      (r) => r.getToMemberId() === sourceId && r.getFromMemberId() === targetId,
    );

    if (inverseRel) {
      const inverseType = this.getInverseRelationshipType(inverseRel.getType());
      return {
        type: inverseType,
        description: this.getRelationshipDescription(inverseType, 'inverse'),
      };
    }

    return { type: 'OTHER', description: 'EXTENDED_FAMILY' };
  }

  private getInverseRelationshipType(type: RelationshipType): RelationshipType {
    const inverseMap: Record<RelationshipType, RelationshipType> = {
      SPOUSE: 'SPOUSE',
      CHILD: 'PARENT',
      PARENT: 'CHILD',
      SIBLING: 'SIBLING',
      GRANDCHILD: 'GRANDPARENT',
      GRANDPARENT: 'GRANDCHILD',
      NIECE_NEPHEW: 'AUNT_UNCLE',
      AUNT_UNCLE: 'NIECE_NEPHEW',
      COUSIN: 'COUSIN',
      GUARDIAN: 'OTHER',
      OTHER: 'OTHER',
      EX_SPOUSE: 'EX_SPOUSE',
      ADOPTED_CHILD: 'PARENT',
      STEPCHILD: 'PARENT',
      HALF_SIBLING: 'HALF_SIBLING',
    };

    return inverseMap[type] || 'OTHER';
  }

  private getRelationshipDescription(
    type: RelationshipType,
    direction: 'direct' | 'inverse',
  ): string {
    const descriptions: Record<RelationshipType, string> = {
      SPOUSE: 'Spouse',
      CHILD: direction === 'direct' ? 'Child' : 'Parent',
      PARENT: direction === 'direct' ? 'Parent' : 'Child',
      SIBLING: 'Sibling',
      GRANDCHILD: direction === 'direct' ? 'Grandchild' : 'Grandparent',
      GRANDPARENT: direction === 'direct' ? 'Grandparent' : 'Grandchild',
      NIECE_NEPHEW: direction === 'direct' ? 'Niece/Nephew' : 'Aunt/Uncle',
      AUNT_UNCLE: direction === 'direct' ? 'Aunt/Uncle' : 'Niece/Nephew',
      COUSIN: 'Cousin',
      GUARDIAN: 'Guardian',
      OTHER: 'Other Relative',
      EX_SPOUSE: 'Former Spouse',
      ADOPTED_CHILD: direction === 'direct' ? 'Adopted Child' : 'Adoptive Parent',
      STEPCHILD: direction === 'direct' ? 'Stepchild' : 'Stepparent',
      HALF_SIBLING: 'Half-sibling',
    };

    return descriptions[type];
  }

  private calculateDependencyLevel(
    member: FamilyMember,
    relationshipType: RelationshipType,
  ): 'FULL' | 'PARTIAL' | 'INDEPENDENT' {
    if (member.getIsMinor()) return 'FULL';
    if (member.getMetadata().disabilityStatus !== 'NONE') return 'PARTIAL';
    if (relationshipType === 'PARENT' && member.getAge() && member.getAge()! > 65) return 'PARTIAL';
    return 'INDEPENDENT';
  }

  private getKenyanPriority(relationshipType: RelationshipType, dependencyLevel: string): number {
    // Priority based on Law of Succession Act Section 29
    if (relationshipType === 'SPOUSE') return 1;
    if (relationshipType === 'CHILD' || relationshipType === 'ADOPTED_CHILD') return 1;
    if (relationshipType === 'PARENT' && dependencyLevel !== 'INDEPENDENT') return 2;
    if (relationshipType === 'STEPCHILD' && dependencyLevel === 'FULL') return 2;
    if (relationshipType === 'SIBLING' && dependencyLevel !== 'INDEPENDENT') return 3;
    return 4;
  }

  private getLegalBasis(relationshipType: RelationshipType, dependencyLevel: string): string {
    const bases: Record<string, string> = {
      SPOUSE: 'Section 29(1)(a) - Spouse',
      CHILD: 'Section 29(1)(b) - Child',
      ADOPTED_CHILD: 'Section 29(1)(b) - Adopted Child',
      PARENT_FULL: 'Section 29(1)(c) - Dependent Parent',
      PARENT_PARTIAL: 'Section 29(1)(c) - Dependent Parent',
      STEPCHILD_FULL: 'Section 29(1)(d) - Dependent Step-child',
      SIBLING_FULL: 'Section 29(1)(e) - Dependent Sibling',
    };

    const key =
      dependencyLevel === 'INDEPENDENT'
        ? relationshipType
        : `${relationshipType}_${dependencyLevel}`;

    return bases[key] || 'Section 29 - Other Dependant';
  }

  private requiresMaintenance(
    relationshipType: RelationshipType,
    dependencyLevel: string,
  ): boolean {
    // Spouses and children always require maintenance under Kenyan law
    if (relationshipType === 'SPOUSE' || relationshipType === 'CHILD') return true;
    // Others only if dependent
    return dependencyLevel !== 'INDEPENDENT';
  }

  private getSpecialConsiderations(
    member: FamilyMember,
    relationshipInfo: { type: RelationshipType; description: string },
  ): string[] {
    const considerations: string[] = [];

    if (member.getIsMinor()) {
      considerations.push('Minor requiring guardianship provisions');
    }

    if (member.getMetadata().disabilityStatus !== 'NONE') {
      considerations.push(
        `Special needs due to ${member.getMetadata().disabilityStatus?.toLowerCase()} disability`,
      );
    }

    if (relationshipInfo.type === 'ADOPTED_CHILD') {
      considerations.push('Legally adopted child with full inheritance rights');
    }

    if (relationshipInfo.description.includes('Former')) {
      considerations.push('Former spouse may have maintenance claims');
    }

    return considerations;
  }

  private generateSummary(dependants: IdentifiedDependant[]) {
    return {
      totalDependants: dependants.length,
      minorDependants: dependants.filter((d) => d.isMinor).length,
      disabledDependants: dependants.filter((d) => d.isDisabled).length,
      spousalDependants: dependants.filter((d) => d.relationshipType === 'SPOUSE').length,
      childDependants: dependants.filter(
        (d) => d.relationshipType === 'CHILD' || d.relationshipType === 'ADOPTED_CHILD',
      ).length,
      parentDependants: dependants.filter((d) => d.relationshipType === 'PARENT').length,
      otherDependants: dependants.filter(
        (d) => !['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'PARENT'].includes(d.relationshipType),
      ).length,
    };
  }

  private analyzeLegalImplications(dependants: IdentifiedDependant[]): {
    hasSpouse: boolean;
    hasChildren: boolean;
    hasParents: boolean;
    hasOtherDependants: boolean;
    successionType: 'TESTATE' | 'INTESTATE' | 'MIXED';
    applicableSections: string[];
  } {
    const hasSpouse = dependants.some((d) => d.relationshipType === 'SPOUSE');
    const hasChildren = dependants.some(
      (d) => d.relationshipType === 'CHILD' || d.relationshipType === 'ADOPTED_CHILD',
    );
    const hasParents = dependants.some((d) => d.relationshipType === 'PARENT');
    const hasOtherDependants = dependants.some(
      (d) => !['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'PARENT'].includes(d.relationshipType),
    );

    return {
      hasSpouse,
      hasChildren,
      hasParents,
      hasOtherDependants,
      successionType: 'INTESTATE' as const, // Default, can be overridden
      applicableSections: this.determineApplicableSections(
        hasSpouse,
        hasChildren,
        hasParents,
        hasOtherDependants,
      ),
    };
  }

  private determineApplicableSections(
    hasSpouse: boolean,
    hasChildren: boolean,
    hasParents: boolean,
    hasOther: boolean,
  ): string[] {
    const sections: string[] = ['Section 29']; // Dependants definition

    if (hasSpouse && hasChildren) sections.push('Section 35', 'Section 36');
    if (hasSpouse && !hasChildren) sections.push('Section 35');
    if (!hasSpouse && hasChildren) sections.push('Section 39');
    if (!hasSpouse && !hasChildren && hasParents) sections.push('Section 39');
    if (!hasSpouse && !hasChildren && !hasParents && hasOther) sections.push('Section 39');

    return sections;
  }

  private isIntestateEligible(dependant: IdentifiedDependant): boolean {
    // Under Kenyan intestate succession, only specific relationships inherit
    const eligibleTypes: RelationshipType[] = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'PARENT'];

    return eligibleTypes.includes(dependant.relationshipType);
  }

  private getIntestateApplicableSections(dependants: IdentifiedDependant[]): string[] {
    const hasSpouse = dependants.some((d) => d.relationshipType === 'SPOUSE');
    const hasChildren = dependants.some(
      (d) => d.relationshipType === 'CHILD' || d.relationshipType === 'ADOPTED_CHILD',
    );

    if (hasSpouse && hasChildren) return ['Section 35', 'Section 36'];
    if (hasSpouse && !hasChildren) return ['Section 35'];
    if (!hasSpouse && hasChildren) return ['Section 39'];
    return ['Section 39']; // Parents or other relatives
  }

  private getRecommendedProvision(dependant: IdentifiedDependant): string {
    if (dependant.relationshipType === 'SPOUSE') {
      return 'Substantial provision including matrimonial home and maintenance';
    }
    if (dependant.relationshipType === 'CHILD' || dependant.relationshipType === 'ADOPTED_CHILD') {
      if (dependant.isMinor) {
        return 'Full provision including education and maintenance until adulthood';
      }
      return 'Reasonable share of estate';
    }
    if (dependant.relationshipType === 'PARENT') {
      return 'Maintenance provision if dependent';
    }
    return 'Reasonable maintenance if proven dependency';
  }

  private generateWillRecommendations(
    dependantsResult: DependantCalculationResult,
    willProvisions: Array<{
      beneficiaryId: string;
      provisionType: 'SPECIFIC' | 'PERCENTAGE' | 'RESIDUARY';
      value?: number;
      percentage?: number;
    }>,
  ): string[] {
    const recommendations: string[] = [];

    if (dependantsResult.dependants.length > 0 && willProvisions.length === 0) {
      recommendations.push(
        'Will does not provide for any dependants. Consider adding provisions for identified dependants.',
      );
    }

    const minorDependants = dependantsResult.dependants.filter((d) => d.isMinor);
    if (minorDependants.length > 0) {
      recommendations.push(
        `Consider testamentary guardianship provisions for ${minorDependants.length} minor dependant(s).`,
      );
    }

    const disabledDependants = dependantsResult.dependants.filter((d) => d.isDisabled);
    if (disabledDependants.length > 0) {
      recommendations.push(
        `Consider special needs trusts for ${disabledDependants.length} disabled dependant(s).`,
      );
    }

    if (dependantsResult.legalAnalysis.hasSpouse) {
      recommendations.push(
        'Ensure adequate provision for spouse, including matrimonial home rights.',
      );
    }

    return recommendations;
  }
}
