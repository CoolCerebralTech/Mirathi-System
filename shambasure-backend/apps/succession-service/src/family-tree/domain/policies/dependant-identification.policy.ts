import { RelationshipType } from '@prisma/client';
import { FamilyMember } from '../entities/family-member.entity';

export interface DependantAnalysis {
  isDependant: boolean;
  dependencyType: 'MINOR' | 'SPOUSE' | 'ELDERLY' | 'DISABLED' | 'STUDENT' | 'NONE';
  dependencyLevel: 'FULL' | 'PARTIAL' | 'NONE';
  legalRequirements: string[];
  recommendedProvision: string;
}

export class DependantIdentificationPolicy {
  /**
   * Kenyan Law of Succession Act Section 29: Definition of dependants
   * Identifies who qualifies as a dependant for succession purposes
   */
  analyzeDependantStatus(
    member: FamilyMember,
    context: {
      testatorAge?: number;
      maritalStatus?: string;
      financialSupportProvided?: boolean;
      isInEducation?: boolean;
      isDisabled?: boolean;
    } = {},
  ): DependantAnalysis {
    const analysis: DependantAnalysis = {
      isDependant: false,
      dependencyType: 'NONE',
      dependencyLevel: 'NONE',
      legalRequirements: [],
      recommendedProvision: '',
    };

    const relationshipType = member.getRelationshipType().getRelationshipType();
    const age = member.getAge();
    const isDeceased = member.getIsDeceased();

    if (isDeceased) {
      return analysis; // Deceased persons are not dependants
    }

    // Spouse is always a dependant
    if (relationshipType === RelationshipType.SPOUSE) {
      analysis.isDependant = true;
      analysis.dependencyType = 'SPOUSE';
      analysis.dependencyLevel = 'FULL';
      analysis.legalRequirements = ['Marriage certificate', 'Proof of marriage'];
      analysis.recommendedProvision =
        'Reasonable provision including matrimonial home and personal effects';
      return analysis;
    }

    // Children under 18 are dependants
    if (
      (relationshipType === RelationshipType.CHILD ||
        relationshipType === RelationshipType.ADOPTED_CHILD) &&
      age !== null &&
      age < 18
    ) {
      analysis.isDependant = true;
      analysis.dependencyType = 'MINOR';
      analysis.dependencyLevel = 'FULL';
      analysis.legalRequirements = ['Birth certificate', 'Proof of parentage'];
      analysis.recommendedProvision = 'Education and maintenance fund until age of majority';
      return analysis;
    }

    // Children 18-25 in full-time education
    if (
      (relationshipType === RelationshipType.CHILD ||
        relationshipType === RelationshipType.ADOPTED_CHILD) &&
      age !== null &&
      age >= 18 &&
      age <= 25 &&
      context.isInEducation
    ) {
      analysis.isDependant = true;
      analysis.dependencyType = 'STUDENT';
      analysis.dependencyLevel = 'PARTIAL';
      analysis.legalRequirements = ['Proof of enrollment', 'Education expenses evidence'];
      analysis.recommendedProvision =
        'Education and maintenance support until completion of studies';
      return analysis;
    }

    // Disabled children (any age)
    if (
      (relationshipType === RelationshipType.CHILD ||
        relationshipType === RelationshipType.ADOPTED_CHILD) &&
      context.isDisabled
    ) {
      analysis.isDependant = true;
      analysis.dependencyType = 'DISABLED';
      analysis.dependencyLevel = 'FULL';
      analysis.legalRequirements = ['Medical certification', 'Disability assessment'];
      analysis.recommendedProvision = 'Lifetime support and care provision';
      return analysis;
    }

    // Parents who were dependent
    if (relationshipType === RelationshipType.PARENT && context.financialSupportProvided) {
      analysis.isDependant = true;
      analysis.dependencyType = 'ELDERLY';
      analysis.dependencyLevel = 'PARTIAL';
      analysis.legalRequirements = ['Proof of dependency', 'Financial support evidence'];
      analysis.recommendedProvision = 'Reasonable support for maintenance and healthcare';
      return analysis;
    }

    // Other relatives who were actually dependent
    if (this.isOtherDependant(relationshipType) && context.financialSupportProvided) {
      analysis.isDependant = true;
      analysis.dependencyType = 'NONE'; // Specific type would be determined
      analysis.dependencyLevel = 'PARTIAL';
      analysis.legalRequirements = ['Proof of dependency', 'Relationship evidence'];
      analysis.recommendedProvision = 'Reasonable support based on level of dependency';
      return analysis;
    }

    return analysis;
  }

  /**
   * Identify all dependants in a family for a specific testator
   */
  identifyFamilyDependants(
    familyMembers: FamilyMember[],
    testatorId: string,
    context: {
      financialSupportMap?: Map<string, boolean>;
      educationStatusMap?: Map<string, boolean>;
      disabilityStatusMap?: Map<string, boolean>;
    } = {},
  ): Map<string, DependantAnalysis> {
    const dependants = new Map<string, DependantAnalysis>();

    for (const member of familyMembers) {
      // Skip the testator themselves
      if (member.getId() === testatorId) {
        continue;
      }

      const analysis = this.analyzeDependantStatus(member, {
        financialSupportProvided: context.financialSupportMap?.get(member.getId()),
        isInEducation: context.educationStatusMap?.get(member.getId()),
        isDisabled: context.disabilityStatusMap?.get(member.getId()),
      });

      if (analysis.isDependant) {
        dependants.set(member.getId(), analysis);
      }
    }

    return dependants;
  }

  /**
   * Calculate recommended provision for each dependant
   */
  calculateRecommendedProvisions(
    dependants: Map<string, DependantAnalysis>,
    totalEstateValue: number,
  ): Map<string, { minimumAmount: number; recommendedAmount: number; basis: string }> {
    const provisions = new Map<
      string,
      { minimumAmount: number; recommendedAmount: number; basis: string }
    >();
    const currency = 'KES';

    // Distribute based on dependency type and level
    let totalAllocated = 0;
    const allocations: Array<{ memberId: string; allocation: number; basis: string }> = [];

    for (const [memberId, analysis] of dependants.entries()) {
      let allocation = 0;
      let basis = '';

      switch (analysis.dependencyType) {
        case 'SPOUSE':
          allocation = totalEstateValue * 0.3; // 30% for spouse
          basis = 'Reasonable provision for surviving spouse including matrimonial home';
          break;

        case 'MINOR':
          allocation = totalEstateValue * 0.2; // 20% per minor child
          basis = 'Education and maintenance until age of majority';
          break;

        case 'DISABLED':
          allocation = totalEstateValue * 0.25; // 25% for disabled dependant
          basis = 'Lifetime care and support for disabled dependant';
          break;

        case 'STUDENT':
          allocation = totalEstateValue * 0.15; // 15% for student
          basis = 'Education support until completion of studies';
          break;

        case 'ELDERLY':
          allocation = totalEstateValue * 0.1; // 10% for elderly parent
          basis = 'Support for elderly dependent parent';
          break;

        default:
          allocation = totalEstateValue * 0.05; // 5% for other dependants
          basis = 'Reasonable support for dependent relative';
      }

      // Adjust for dependency level
      if (analysis.dependencyLevel === 'PARTIAL') {
        allocation *= 0.7; // Reduce by 30% for partial dependency
      }

      allocations.push({ memberId, allocation, basis });
      totalAllocated += allocation;
    }

    // Scale allocations if they exceed total estate value
    if (totalAllocated > totalEstateValue) {
      const scaleFactor = totalEstateValue / totalAllocated;
      for (const allocation of allocations) {
        allocation.allocation *= scaleFactor;
      }
    }

    // Set provisions with minimum and recommended amounts
    for (const allocation of allocations) {
      provisions.set(allocation.memberId, {
        minimumAmount: allocation.allocation * 0.7, // Minimum 70% of recommended
        recommendedAmount: allocation.allocation,
        basis: allocation.basis,
      });
    }

    return provisions;
  }

  /**
   * Validate if will adequately provides for dependants under Kenyan law
   */
  validateDependantProvision(
    dependants: Map<string, DependantAnalysis>,
    provisionsInWill: Map<string, number>,
    totalEstateValue: number,
  ): {
    isAdequate: boolean;
    shortfalls: Array<{ memberId: string; shortfallAmount: number; reason: string }>;
    recommendations: string[];
  } {
    const shortfalls: Array<{ memberId: string; shortfallAmount: number; reason: string }> = [];
    const recommendations: string[] = [];

    const recommendedProvisions = this.calculateRecommendedProvisions(dependants, totalEstateValue);

    for (const [memberId, analysis] of dependants.entries()) {
      const recommended = recommendedProvisions.get(memberId);
      const provided = provisionsInWill.get(memberId) || 0;

      if (recommended && provided < recommended.minimumAmount) {
        const shortfallAmount = recommended.minimumAmount - provided;
        shortfalls.push({
          memberId,
          shortfallAmount,
          reason: `Inadequate provision for ${analysis.dependencyType.toLowerCase()} dependant. Minimum: ${recommended.minimumAmount.toLocaleString()}, Provided: ${provided.toLocaleString()}`,
        });
      }
    }

    // Kenyan law specific recommendations
    if (shortfalls.length > 0) {
      recommendations.push(
        'Consider increasing provisions for dependants to meet legal requirements',
      );
      recommendations.push(
        'Court may order reasonable provision for dependants under Law of Succession Act Section 26',
      );
    }

    // Check for spouse's special position
    const spouseDependant = Array.from(dependants.entries()).find(
      ([_, analysis]) => analysis.dependencyType === 'SPOUSE',
    );
    if (spouseDependant) {
      const [spouseId, spouseAnalysis] = spouseDependant;
      const spouseProvision = provisionsInWill.get(spouseId) || 0;

      if (spouseProvision < totalEstateValue * 0.2) {
        recommendations.push(
          'Consider enhancing provision for surviving spouse, who has priority under Kenyan succession law',
        );
      }
    }

    // Check for minors' trusts
    const minorDependants = Array.from(dependants.entries()).filter(
      ([_, analysis]) => analysis.dependencyType === 'MINOR',
    );
    if (minorDependants.length > 0) {
      const hasTrustProvision = minorDependants.some(([memberId]) => {
        // Check if trust is established for this minor
        // This would require checking the will's trust provisions
        return false; // Simplified
      });

      if (!hasTrustProvision) {
        recommendations.push(
          'Establish testamentary trusts for minor beneficiaries to protect their inheritance',
        );
      }
    }

    return {
      isAdequate: shortfalls.length === 0,
      shortfalls,
      recommendations,
    };
  }

  private isOtherDependant(relationshipType: RelationshipType): boolean {
    const otherDependantRelationships = [
      RelationshipType.STEPCHILD,
      RelationshipType.GRANDCHILD,
      RelationshipType.SIBLING,
      RelationshipType.PARENT, // Already handled separately, but included for completeness
    ];

    return otherDependantRelationships.includes(relationshipType);
  }

  /**
   * Get Kenyan legal definitions of dependants
   */
  static getKenyanLegalDefinitions(): Record<string, string> {
    return {
      Spouse: 'A person married to the deceased under any system of law',
      Child:
        'A biological or adopted child of the deceased, regardless of age if disabled or in education',
      Parent: 'A parent of the deceased who was dependent on them',
      'Step-child': 'A step-child who was dependent on the deceased',
      Grandchild: 'A grandchild who was dependent on the deceased',
      Sibling: 'A brother or sister who was dependent on the deceased',
    };
  }
}
