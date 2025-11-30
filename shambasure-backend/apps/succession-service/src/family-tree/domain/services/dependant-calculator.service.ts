import { Inject, Injectable } from '@nestjs/common';
import { DependencyLevel, GuardianType, MarriageStatus, RelationshipType } from '@prisma/client';

import { FamilyMember } from '../entities/family-member.entity';
import { Guardianship } from '../entities/guardianship.entity';
import { Marriage } from '../entities/marriage.entity';
import { Relationship } from '../entities/relationship.entity';
import { FamilyMemberRepositoryInterface } from '../interfaces/family-member.repository.interface';
import { GuardianshipRepositoryInterface } from '../interfaces/guardianship.repository.interface';
import { MarriageRepositoryInterface } from '../interfaces/marriage.repository.interface';
import { RelationshipRepositoryInterface } from '../interfaces/relationship.repository.interface';
import { DependantIdentificationPolicy, Node } from '../policies/dependant-identification.policy';

// ============================================================================
// TYPE DEFINITIONS FOR GRAPH STRUCTURE
// ============================================================================

interface EnhancedRelationship {
  type: RelationshipType;
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
    guardianType?: GuardianType;
    appointmentDate?: Date;
    validUntil?: Date | null;
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
  dependencyLevel: DependencyLevel;
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
    // Note: Section 29 defines Dependants generally.
    // Intestate succession (Part V) prioritizes specific subsets of these dependants.
    const intestateDependants = result.dependants.filter((dependant) =>
      this.isIntestateEligible(dependant, result.dependants),
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
  ): Node[] {
    return members.map((member) => ({
      id: member.getId(),
      isMinor: member.getIsMinor(),
      isDeceased: member.getIsDeceased(),
      isDisabled: member.getMetadata().disabilityStatus !== 'NONE',
      dependencyLevel: member.getDependantStatus().dependencyLevel, // Use correct accessor from Entity
      gender: member.getGender() || '',
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
            isBiological: r.getKenyanMetadata().isBiological,
            isAdopted: r.getKenyanMetadata().isAdopted,
            bornOutOfWedlock: r.getKenyanMetadata().bornOutOfWedlock,
            adoptionOrderNumber: r.getKenyanMetadata().adoptionOrderNumber || undefined,
          },
        }),
      );

    // Add Marriages
    allMarriages
      .filter((m) => m.getSpouse1Id() === memberId || m.getSpouse2Id() === memberId)
      .forEach((m) => {
        const target = m.getSpouse1Id() === memberId ? m.getSpouse2Id() : m.getSpouse1Id();
        list.push({
          type: RelationshipType.SPOUSE,
          targetId: target,
          metadata: {
            marriageType: m.getMarriageType(),
            isActive: m.getIsActive(),
            marriageDate: m.getMarriageDate(),
            divorceDate: m.getDivorceDate(),
            isCustomary: m.getMarriageType() === MarriageStatus.CUSTOMARY_MARRIAGE,
          },
        });
      });

    // Add Guardianships (Directional: Guardian -> Ward)
    allGuardianships
      .filter((g) => g.getGuardianId() === memberId && g.getIsActive())
      .forEach((g) =>
        list.push({
          type: RelationshipType.GUARDIAN,
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

    return results.sort((a, b) => a.priority - b.priority);
  }

  private determineKenyanRelationshipType(
    sourceId: string,
    targetId: string,
    rels: Relationship[],
    marriages: Marriage[],
  ): { type: RelationshipType; description: string } {
    const marriage = marriages.find(
      (m) =>
        (m.getSpouse1Id() === sourceId && m.getSpouse2Id() === targetId) ||
        (m.getSpouse2Id() === sourceId && m.getSpouse1Id() === targetId),
    );

    if (marriage) {
      const description = marriage.getIsActive() ? 'SPOUSE' : 'FORMER_SPOUSE';
      return { type: RelationshipType.SPOUSE, description };
    }

    const directRel = rels.find(
      (r) => r.getFromMemberId() === sourceId && r.getToMemberId() === targetId,
    );

    if (directRel) {
      return {
        type: directRel.getType(),
        description: this.getRelationshipDescription(directRel.getType(), 'direct'),
      };
    }

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

    return { type: RelationshipType.OTHER, description: 'EXTENDED_FAMILY' };
  }

  private getInverseRelationshipType(type: RelationshipType): RelationshipType {
    const inverseMap: Partial<Record<RelationshipType, RelationshipType>> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.GUARDIAN]: RelationshipType.OTHER, // Ward
      [RelationshipType.OTHER]: RelationshipType.OTHER,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
    };

    return inverseMap[type] || RelationshipType.OTHER;
  }

  private getRelationshipDescription(
    type: RelationshipType,
    direction: 'direct' | 'inverse',
  ): string {
    const descriptions: Partial<Record<RelationshipType, string>> = {
      [RelationshipType.SPOUSE]: 'Spouse',
      [RelationshipType.CHILD]: direction === 'direct' ? 'Child' : 'Parent',
      [RelationshipType.PARENT]: direction === 'direct' ? 'Parent' : 'Child',
      [RelationshipType.SIBLING]: 'Sibling',
      [RelationshipType.GRANDCHILD]: direction === 'direct' ? 'Grandchild' : 'Grandparent',
      [RelationshipType.GRANDPARENT]: direction === 'direct' ? 'Grandparent' : 'Grandchild',
      [RelationshipType.NIECE_NEPHEW]: direction === 'direct' ? 'Niece/Nephew' : 'Aunt/Uncle',
      [RelationshipType.AUNT_UNCLE]: direction === 'direct' ? 'Aunt/Uncle' : 'Niece/Nephew',
      [RelationshipType.COUSIN]: 'Cousin',
      [RelationshipType.GUARDIAN]: 'Guardian',
      [RelationshipType.OTHER]: 'Other Relative',
      [RelationshipType.EX_SPOUSE]: 'Former Spouse',
      [RelationshipType.ADOPTED_CHILD]:
        direction === 'direct' ? 'Adopted Child' : 'Adoptive Parent',
      [RelationshipType.STEPCHILD]: direction === 'direct' ? 'Stepchild' : 'Stepparent',
      [RelationshipType.HALF_SIBLING]: 'Half-sibling',
    };

    return descriptions[type] || 'Relative';
  }

  private calculateDependencyLevel(
    member: FamilyMember,
    relationshipType: RelationshipType,
  ): DependencyLevel {
    if (member.getIsMinor()) return DependencyLevel.FULL;
    if (member.getMetadata().disabilityStatus !== 'NONE') return DependencyLevel.PARTIAL;
    if (relationshipType === RelationshipType.PARENT && member.getAge() && member.getAge()! > 65)
      return DependencyLevel.PARTIAL;
    return DependencyLevel.NONE;
  }

  private getKenyanPriority(
    relationshipType: RelationshipType,
    dependencyLevel: DependencyLevel,
  ): number {
    if (relationshipType === RelationshipType.SPOUSE) return 1;
    if (
      relationshipType === RelationshipType.CHILD ||
      relationshipType === RelationshipType.ADOPTED_CHILD
    )
      return 1;
    if (relationshipType === RelationshipType.PARENT && dependencyLevel !== DependencyLevel.NONE)
      return 2;
    if (relationshipType === RelationshipType.STEPCHILD && dependencyLevel === DependencyLevel.FULL)
      return 2;
    if (relationshipType === RelationshipType.SIBLING && dependencyLevel !== DependencyLevel.NONE)
      return 3;
    return 4;
  }

  private getLegalBasis(
    relationshipType: RelationshipType,
    dependencyLevel: DependencyLevel,
  ): string {
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
      dependencyLevel === DependencyLevel.NONE
        ? relationshipType
        : `${relationshipType}_${dependencyLevel}`;

    return bases[key] || 'Section 29 - Other Dependant';
  }

  private requiresMaintenance(
    relationshipType: RelationshipType,
    dependencyLevel: DependencyLevel,
  ): boolean {
    if (relationshipType === RelationshipType.SPOUSE || relationshipType === RelationshipType.CHILD)
      return true;
    return dependencyLevel !== DependencyLevel.NONE;
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

    if (relationshipInfo.type === RelationshipType.ADOPTED_CHILD) {
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
      spousalDependants: dependants.filter((d) => d.relationshipType === RelationshipType.SPOUSE)
        .length,
      childDependants: dependants.filter(
        (d) =>
          d.relationshipType === RelationshipType.CHILD ||
          d.relationshipType === RelationshipType.ADOPTED_CHILD,
      ).length,
      parentDependants: dependants.filter((d) => d.relationshipType === RelationshipType.PARENT)
        .length,
      otherDependants: dependants.filter(
        (d) =>
          ![
            RelationshipType.SPOUSE,
            RelationshipType.CHILD,
            RelationshipType.ADOPTED_CHILD,
            RelationshipType.PARENT,
          ].includes(d.relationshipType),
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
    const hasSpouse = dependants.some((d) => d.relationshipType === RelationshipType.SPOUSE);
    const hasChildren = dependants.some(
      (d) =>
        d.relationshipType === RelationshipType.CHILD ||
        d.relationshipType === RelationshipType.ADOPTED_CHILD,
    );
    const hasParents = dependants.some((d) => d.relationshipType === RelationshipType.PARENT);
    const hasOtherDependants = dependants.some(
      (d) =>
        ![
          RelationshipType.SPOUSE,
          RelationshipType.CHILD,
          RelationshipType.ADOPTED_CHILD,
          RelationshipType.PARENT,
        ].includes(d.relationshipType),
    );

    return {
      hasSpouse,
      hasChildren,
      hasParents,
      hasOtherDependants,
      successionType: 'INTESTATE',
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
    const sections: string[] = ['Section 29'];

    if (hasSpouse && hasChildren) sections.push('Section 35', 'Section 36');
    if (hasSpouse && !hasChildren) sections.push('Section 35');
    if (!hasSpouse && hasChildren) sections.push('Section 39');
    if (!hasSpouse && !hasChildren && hasParents) sections.push('Section 39');
    if (!hasSpouse && !hasChildren && !hasParents && hasOther) sections.push('Section 39');

    return sections;
  }

  private isIntestateEligible(
    dependant: IdentifiedDependant,
    allDependants: IdentifiedDependant[],
  ): boolean {
    const hasSpouse = allDependants.some((d) => d.relationshipType === RelationshipType.SPOUSE);
    const hasChildren = allDependants.some(
      (d) =>
        d.relationshipType === RelationshipType.CHILD ||
        d.relationshipType === RelationshipType.ADOPTED_CHILD,
    );

    // 1. Spouse and Children always inherit (Section 35)
    if (
      dependant.relationshipType === RelationshipType.SPOUSE ||
      dependant.relationshipType === RelationshipType.CHILD ||
      dependant.relationshipType === RelationshipType.ADOPTED_CHILD
    ) {
      return true;
    }

    // 2. If NO Spouse and NO Children, Parents inherit (Section 39)
    if (!hasSpouse && !hasChildren) {
      if (dependant.relationshipType === RelationshipType.PARENT) return true;

      const hasParents = allDependants.some((d) => d.relationshipType === RelationshipType.PARENT);
      // 3. If NO Parents, Siblings inherit
      if (
        !hasParents &&
        (dependant.relationshipType === RelationshipType.SIBLING ||
          dependant.relationshipType === RelationshipType.HALF_SIBLING)
      ) {
        return true;
      }
    }

    return false;
  }

  private getIntestateApplicableSections(dependants: IdentifiedDependant[]): string[] {
    const hasSpouse = dependants.some((d) => d.relationshipType === RelationshipType.SPOUSE);
    const hasChildren = dependants.some(
      (d) =>
        d.relationshipType === RelationshipType.CHILD ||
        d.relationshipType === RelationshipType.ADOPTED_CHILD,
    );

    if (hasSpouse && hasChildren) return ['Section 35', 'Section 36'];
    if (hasSpouse && !hasChildren) return ['Section 35'];
    if (!hasSpouse && hasChildren) return ['Section 39'];
    return ['Section 39'];
  }

  private getRecommendedProvision(dependant: IdentifiedDependant): string {
    if (dependant.relationshipType === RelationshipType.SPOUSE) {
      return 'Substantial provision including matrimonial home and maintenance';
    }
    if (
      dependant.relationshipType === RelationshipType.CHILD ||
      dependant.relationshipType === RelationshipType.ADOPTED_CHILD
    ) {
      if (dependant.isMinor) {
        return 'Full provision including education and maintenance until adulthood';
      }
      return 'Reasonable share of estate';
    }
    if (dependant.relationshipType === RelationshipType.PARENT) {
      return 'Maintenance provision if dependent';
    }
    return 'Reasonable maintenance if proven dependency';
  }

  private generateWillRecommendations(
    dependantsResult: DependantCalculationResult,
    willProvisions: Array<{ beneficiaryId: string }>,
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
