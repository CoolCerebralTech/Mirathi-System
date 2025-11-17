// family-tree/domain/services/dependant-calculator.service.ts
import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { DependantIdentificationPolicy } from '../policies/dependant-identification.policy';

export interface DependantAnalysis {
  memberId: string;
  memberName: string;
  relationship: RelationshipType;
  dependencyType: string;
  dependencyLevel: 'FULL' | 'PARTIAL' | 'NONE';
  age?: number;
  isMinor: boolean;
  isElder: boolean;
  isDisabled: boolean;
  isInEducation: boolean;
  wasFinanciallySupported: boolean;
  recommendedProvision: string;
  legalRequirements: string[];
}

export interface SuccessionAnalysis {
  testatorId: string;
  testatorName: string;
  totalDependants: number;
  dependants: DependantAnalysis[];
  recommendedEstateDistribution: Map<
    string,
    { percentage: number; amount: number; rationale: string }
  >;
  legalCompliance: 'FULL' | 'PARTIAL' | 'NON_COMPLIANT';
  issues: string[];
  recommendations: string[];
}

@Injectable()
export class DependantCalculatorService {
  constructor(private readonly dependantPolicy: DependantIdentificationPolicy) {}

  /**
   * Comprehensive dependant analysis for Kenyan succession
   */
  analyzeDependants(
    testator: FamilyMember,
    familyMembers: FamilyMember[],
    marriages: Marriage[],
    context: {
      financialSupportMap?: Map<string, boolean>;
      educationStatusMap?: Map<string, boolean>;
      disabilityStatusMap?: Map<string, boolean>;
      estateValue?: number;
    } = {},
  ): SuccessionAnalysis {
    const dependants: DependantAnalysis[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Filter out the testator
    const otherMembers = familyMembers.filter((member) => member.getId() !== testator.getId());

    // Analyze each family member for dependant status
    for (const member of otherMembers) {
      const analysis = this.analyzeMemberDependantStatus(member, testator, marriages, context);

      if (analysis.dependencyLevel !== 'NONE') {
        dependants.push(analysis);
      }
    }

    // Calculate recommended distribution if estate value provided
    const recommendedDistribution = context.estateValue
      ? this.calculateRecommendedDistribution(dependants, context.estateValue)
      : new Map<string, { percentage: number; amount: number; rationale: string }>();

    // Determine legal compliance
    const legalCompliance = this.determineLegalCompliance(dependants, issues, recommendations);

    return {
      testatorId: testator.getId(),
      testatorName: testator.getFullName(),
      totalDependants: dependants.length,
      dependants,
      recommendedEstateDistribution: recommendedDistribution,
      legalCompliance,
      issues,
      recommendations,
    };
  }

  /**
   * Analyzes a single member's dependant status
   */
  private analyzeMemberDependantStatus(
    member: FamilyMember,
    testator: FamilyMember,
    marriages: Marriage[],
    context: {
      financialSupportMap?: Map<string, boolean>;
      educationStatusMap?: Map<string, boolean>;
      disabilityStatusMap?: Map<string, boolean>;
    },
  ): DependantAnalysis {
    const age = member.getAge();
    const relationshipType = member.getRelationshipType().getRelationshipType();

    // Determine dependency characteristics
    const isMinor = member.getIsMinor();
    const isElder = member.isElder();
    const isDisabled = context.disabilityStatusMap?.get(member.getId()) || false;
    const isInEducation = context.educationStatusMap?.get(member.getId()) || false;
    const wasFinanciallySupported = context.financialSupportMap?.get(member.getId()) || false;

    // Use policy to determine dependant status
    const policyAnalysis = this.dependantPolicy.analyzeDependantStatus(member, {
      financialSupportProvided: wasFinanciallySupported,
      isInEducation,
      isDisabled,
    });

    return {
      memberId: member.getId(),
      memberName: member.getFullName(),
      relationship: relationshipType,
      dependencyType: policyAnalysis.dependencyType,
      dependencyLevel: policyAnalysis.dependencyLevel,
      age,
      isMinor,
      isElder,
      isDisabled,
      isInEducation,
      wasFinanciallySupported,
      recommendedProvision: policyAnalysis.recommendedProvision,
      legalRequirements: policyAnalysis.legalRequirements,
    };
  }

  /**
   * Calculates recommended estate distribution for dependants
   */
  private calculateRecommendedDistribution(
    dependants: DependantAnalysis[],
    estateValue: number,
  ): Map<string, { percentage: number; amount: number; rationale: string }> {
    const distribution = new Map<
      string,
      { percentage: number; amount: number; rationale: string }
    >();

    // Group dependants by type for allocation
    const spouses = dependants.filter((d) => d.dependencyType === 'SPOUSE');
    const minors = dependants.filter((d) => d.dependencyType === 'MINOR');
    const disabled = dependants.filter((d) => d.dependencyType === 'DISABLED');
    const students = dependants.filter((d) => d.dependencyType === 'STUDENT');
    const elderly = dependants.filter((d) => d.dependencyType === 'ELDERLY');
    const others = dependants.filter(
      (d) => d.dependencyType === 'NONE' && d.dependencyLevel !== 'NONE',
    );

    // Kenyan succession allocation guidelines
    let totalAllocated = 0;

    // Spouses get priority
    for (const spouse of spouses) {
      const share = 30 / spouses.length; // 30% total for all spouses
      distribution.set(spouse.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: `Equal share among ${spouses.length} spouse(s)`,
      });
      totalAllocated += share;
    }

    // Minors get education and maintenance
    for (const minor of minors) {
      const share = 20 / minors.length; // 20% total for all minors
      distribution.set(minor.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: 'Education and maintenance until age of majority',
      });
      totalAllocated += share;
    }

    // Disabled get lifetime support
    for (const disabledPerson of disabled) {
      const share = 25 / disabled.length; // 25% total for all disabled
      distribution.set(disabledPerson.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: 'Lifetime care and support for disabled dependant',
      });
      totalAllocated += share;
    }

    // Students get education support
    for (const student of students) {
      const share = 15 / students.length; // 15% total for all students
      distribution.set(student.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: 'Education support until completion of studies',
      });
      totalAllocated += share;
    }

    // Elderly get support
    for (const elder of elderly) {
      const share = 10 / elderly.length; // 10% total for all elderly
      distribution.set(elder.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: 'Support for elderly dependent parent',
      });
      totalAllocated += share;
    }

    // Others get reasonable support
    for (const other of others) {
      const share = 5 / others.length; // 5% total for others
      distribution.set(other.memberId, {
        percentage: share,
        amount: estateValue * (share / 100),
        rationale: 'Reasonable support for dependent relative',
      });
      totalAllocated += share;
    }

    // Scale if total exceeds 100%
    if (totalAllocated > 100) {
      const scaleFactor = 100 / totalAllocated;
      for (const [memberId, allocation] of distribution.entries()) {
        distribution.set(memberId, {
          percentage: allocation.percentage * scaleFactor,
          amount: allocation.amount * scaleFactor,
          rationale: `${allocation.rationale} (scaled to fit estate)`,
        });
      }
    }

    return distribution;
  }

  /**
   * Determines legal compliance of dependant provisions
   */
  private determineLegalCompliance(
    dependants: DependantAnalysis[],
    issues: string[],
    recommendations: string[],
  ): 'FULL' | 'PARTIAL' | 'NON_COMPLIANT' {
    let compliance: 'FULL' | 'PARTIAL' | 'NON_COMPLIANT' = 'FULL';

    // Check for spouses
    const spouses = dependants.filter((d) => d.dependencyType === 'SPOUSE');
    if (spouses.length === 0) {
      recommendations.push(
        'No spouse identified. If testator is married, ensure spouse is included in succession planning.',
      );
    }

    // Check for minors without adequate provision
    const minors = dependants.filter((d) => d.dependencyType === 'MINOR');
    if (minors.length > 0) {
      recommendations.push(
        `Establish guardianship and trust arrangements for ${minors.length} minor dependant(s)`,
      );
    }

    // Check for disabled dependants
    const disabled = dependants.filter((d) => d.dependencyType === 'DISABLED');
    if (disabled.length > 0) {
      recommendations.push(
        `Ensure lifetime care provision for ${disabled.length} disabled dependant(s)`,
      );
      compliance = 'PARTIAL';
    }

    // Check for elderly dependants
    const elderly = dependants.filter((d) => d.dependencyType === 'ELDERLY');
    if (elderly.length > 0) {
      recommendations.push(
        `Provide maintenance support for ${elderly.length} elderly dependant(s)`,
      );
    }

    // Check if any dependants have no provision
    const dependantsWithoutClearProvision = dependants.filter(
      (d) =>
        d.dependencyLevel === 'FULL' && !['SPOUSE', 'MINOR', 'DISABLED'].includes(d.dependencyType),
    );

    if (dependantsWithoutClearProvision.length > 0) {
      issues.push(
        `${dependantsWithoutClearProvision.length} dependants lack clear provision guidelines`,
      );
      compliance = compliance === 'FULL' ? 'PARTIAL' : compliance;
    }

    return compliance;
  }

  /**
   * Kenyan intestate succession calculation
   */
  calculateIntestateSuccession(
    testator: FamilyMember,
    familyMembers: FamilyMember[],
    marriages: Marriage[],
    estateValue: number,
  ): Map<string, { share: number; amount: number; basis: string }> {
    const distribution = new Map<string, { share: number; amount: number; basis: string }>();

    // Get active marriages
    const activeMarriages = marriages.filter((marriage) => marriage.getIsActive());
    const spouseIds = new Set<string>();

    for (const marriage of activeMarriages) {
      spouseIds.add(marriage.getSpouse1Id());
      spouseIds.add(marriage.getSpouse2Id());
    }

    // Remove testator from spouse IDs
    spouseIds.delete(testator.getId());

    const spouses = Array.from(spouseIds)
      .map((id) => familyMembers.find((member) => member.getId() === id))
      .filter(Boolean) as FamilyMember[];

    // Identify children
    const children = familyMembers.filter((member) => {
      const relationship = member.getRelationshipType().getRelationshipType();
      return (
        (relationship === RelationshipType.CHILD ||
          relationship === RelationshipType.ADOPTED_CHILD) &&
        !member.getIsDeceased()
      );
    });

    // Kenyan intestate succession rules
    if (spouses.length > 0 && children.length > 0) {
      // Spouse gets personal effects and life interest in residue
      const personalEffects = Math.min(estateValue * 0.1, 1000000); // 10% or 1M max
      const spouseShare = estateValue * 0.33; // 1/3 to spouse

      for (const spouse of spouses) {
        distribution.set(spouse.getId(), {
          share: ((personalEffects + spouseShare) / estateValue) * 100,
          amount: personalEffects + spouseShare,
          basis: 'Intestate succession: spouse share with children',
        });
      }

      // Children share the remaining 2/3
      const childrenShare = estateValue * 0.67;
      const sharePerChild = childrenShare / children.length;

      for (const child of children) {
        distribution.set(child.getId(), {
          share: (sharePerChild / estateValue) * 100,
          amount: sharePerChild,
          basis: 'Intestate succession: child share',
        });
      }
    } else if (spouses.length > 0 && children.length === 0) {
      // Entire estate to spouse if no children
      const sharePerSpouse = estateValue / spouses.length;

      for (const spouse of spouses) {
        distribution.set(spouse.getId(), {
          share: 100 / spouses.length,
          amount: sharePerSpouse,
          basis: 'Intestate succession: entire estate to spouse (no children)',
        });
      }
    } else if (spouses.length === 0 && children.length > 0) {
      // Entire estate to children if no spouse
      const sharePerChild = estateValue / children.length;

      for (const child of children) {
        distribution.set(child.getId(), {
          share: 100 / children.length,
          amount: sharePerChild,
          basis: 'Intestate succession: entire estate to children (no spouse)',
        });
      }
    } else {
      // No spouse or children - follow other rules
      const parents = familyMembers.filter(
        (member) =>
          member.getRelationshipType().getRelationshipType() === RelationshipType.PARENT &&
          !member.getIsDeceased(),
      );

      if (parents.length > 0) {
        const sharePerParent = estateValue / parents.length;

        for (const parent of parents) {
          distribution.set(parent.getId(), {
            share: 100 / parents.length,
            amount: sharePerParent,
            basis: 'Intestate succession: estate to parents',
          });
        }
      } else {
        // To siblings or other relatives
        const siblings = familyMembers.filter(
          (member) =>
            member.getRelationshipType().getRelationshipType() === RelationshipType.SIBLING &&
            !member.getIsDeceased(),
        );

        if (siblings.length > 0) {
          const sharePerSibling = estateValue / siblings.length;

          for (const sibling of siblings) {
            distribution.set(sibling.getId(), {
              share: 100 / siblings.length,
              amount: sharePerSibling,
              basis: 'Intestate succession: estate to siblings',
            });
          }
        }
      }
    }

    return distribution;
  }

  /**
   * Generates dependant analysis report
   */
  generateDependantReport(analysis: SuccessionAnalysis): {
    summary: string;
    keyFindings: string[];
    actionItems: string[];
    legalConsiderations: string[];
  } {
    const keyFindings: string[] = [];
    const actionItems: string[];
    const legalConsiderations: string[] = [];

    // Summary
    const summary = `Succession analysis for ${analysis.testatorName}: ${analysis.totalDependants} dependants identified with ${analysis.legalCompliance} legal compliance.`;

    // Key findings
    keyFindings.push(`Total dependants: ${analysis.totalDependants}`);

    const spouseCount = analysis.dependants.filter((d) => d.dependencyType === 'SPOUSE').length;
    if (spouseCount > 0) {
      keyFindings.push(`Spouses: ${spouseCount}`);
    }

    const minorCount = analysis.dependants.filter((d) => d.dependencyType === 'MINOR').length;
    if (minorCount > 0) {
      keyFindings.push(`Minors: ${minorCount} requiring guardianship arrangements`);
    }

    const disabledCount = analysis.dependants.filter((d) => d.dependencyType === 'DISABLED').length;
    if (disabledCount > 0) {
      keyFindings.push(`Disabled dependants: ${disabledCount} requiring lifetime care`);
    }

    // Action items from recommendations
    actionItems.push(...analysis.recommendations);

    // Legal considerations
    if (analysis.legalCompliance !== 'FULL') {
      legalConsiderations.push(
        'Consider court application for dependants provision under Law of Succession Act Section 26',
      );
    }

    if (minorCount > 0) {
      legalConsiderations.push('Establish testamentary trusts for minor beneficiaries');
    }

    if (spouseCount > 1) {
      legalConsiderations.push('Ensure equal treatment of all spouses in polygamous marriage');
    }

    return {
      summary,
      keyFindings,
      actionItems,
      legalConsiderations,
    };
  }
}
