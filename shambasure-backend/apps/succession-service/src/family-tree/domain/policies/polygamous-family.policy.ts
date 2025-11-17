import { KenyanMarriage } from '../value-objects/kenyan-marriage.vo';
import { FamilyMember } from '../entities/family-member.entity';

export interface PolygamousFamilyStructure {
  primarySpouse?: string;
  coSpouses: string[];
  houses: Map<string, string[]>; // House name to member IDs
  childrenBySpouse: Map<string, string[]>; // Spouse ID to children IDs
}

export interface PolygamousSuccessionAnalysis {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  spouseShares: Map<string, number>; // Spouse ID to percentage share
  houseDistributions: Map<string, any>; // House to distribution plan
}

export class PolygamousFamilyPolicy {
  /**
   * Analyzes polygamous family structure for Kenyan succession purposes
   */
  analyzeFamilyStructure(
    marriages: KenyanMarriage[],
    familyMembers: FamilyMember[],
  ): PolygamousFamilyStructure {
    const structure: PolygamousFamilyStructure = {
      coSpouses: [],
      houses: new Map(),
      childrenBySpouse: new Map(),
    };

    const activeMarriages = marriages.filter((marriage) => marriage.getIsActive());
    const polygamousMarriages = activeMarriages.filter((marriage) => marriage.isPolygamous());

    if (polygamousMarriages.length === 0) {
      return structure; // Not a polygamous family
    }

    // Identify all spouses
    const allSpouses = new Set<string>();
    for (const marriage of polygamousMarriages) {
      allSpouses.add(marriage.getSpouse1Id());
      allSpouses.add(marriage.getSpouse2Id());
    }

    // Remove the testator (assuming they're one of the spouses)
    // In reality, we'd know who the testator is
    const spousesArray = Array.from(allSpouses);
    structure.coSpouses = spousesArray;

    // Try to identify primary spouse (usually first wife)
    if (spousesArray.length > 0) {
      // Sort by marriage date to identify primary spouse
      const sortedByDate = [...polygamousMarriages].sort(
        (a, b) => a.getMarriageDate().getTime() - b.getMarriageDate().getTime(),
      );

      const firstMarriage = sortedByDate[0];
      structure.primarySpouse = firstMarriage.getSpouse1Id(); // Simplified
    }

    // Organize by houses (simplified - in reality, we'd have house information)
    this.organizeHouses(structure, familyMembers);

    // Organize children by spouse
    this.organizeChildrenBySpouse(structure, familyMembers);

    return structure;
  }

  /**
   * Validates succession planning for polygamous family
   */
  validatePolygamousSuccession(
    structure: PolygamousFamilyStructure,
    estateValue: number,
    existingWillProvisions?: Map<string, number>,
  ): PolygamousSuccessionAnalysis {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const spouseShares = new Map<string, number>();
    const houseDistributions = new Map<string, any>();

    // Kenyan law: Equal distribution among spouses in polygamous marriage
    const spouseCount = structure.coSpouses.length;
    const equalShare = 100 / spouseCount;

    for (const spouseId of structure.coSpouses) {
      spouseShares.set(spouseId, equalShare);
    }

    // Validate against existing provisions if provided
    if (existingWillProvisions) {
      for (const [spouseId, providedShare] of existingWillProvisions.entries()) {
        const expectedShare = spouseShares.get(spouseId) || 0;

        if (providedShare < expectedShare * 0.8) {
          // Allow 20% tolerance
          issues.push(
            `Spouse ${spouseId} receives ${providedShare}% but expected approximately ${expectedShare}% for equal distribution`,
          );
        }
      }
    }

    // House distribution recommendations
    for (const [houseName, members] of structure.houses.entries()) {
      houseDistributions.set(houseName, {
        recommendedAction: 'Consider allocating house to residing spouse and children',
        members,
        considerations: ['Maintain family stability', "Consider children's welfare"],
      });
    }

    // Children's inheritance considerations
    const allChildren = Array.from(structure.childrenBySpouse.values()).flat();
    if (allChildren.length > 0) {
      recommendations.push(
        `Ensure equal provision for all ${allChildren.length} children regardless of which house they belong to`,
      );
    }

    // Special considerations for primary spouse
    if (structure.primarySpouse) {
      recommendations.push(
        'Primary spouse may have additional responsibilities - consider appropriate recognition',
      );
    }

    // Legal requirements
    recommendations.push('Ensure equal treatment of all spouses to avoid legal challenges');
    recommendations.push('Document clear distribution plan for each house and family unit');
    recommendations.push('Consider cultural practices while ensuring legal compliance');

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      spouseShares,
      houseDistributions,
    };
  }

  /**
   * Calculates recommended estate distribution for polygamous family
   */
  calculateRecommendedDistribution(
    structure: PolygamousFamilyStructure,
    totalEstateValue: number,
  ): Map<string, { sharePercentage: number; amount: number; rationale: string }> {
    const distribution = new Map<
      string,
      { sharePercentage: number; amount: number; rationale: string }
    >();

    const spouseCount = structure.coSpouses.length;
    const spouseShare = 100 / spouseCount;

    // Distribute equally among spouses
    for (const spouseId of structure.coSpouses) {
      distribution.set(spouseId, {
        sharePercentage: spouseShare,
        amount: totalEstateValue * (spouseShare / 100),
        rationale: `Equal share among ${spouseCount} spouses in polygamous marriage`,
      });
    }

    // Additional considerations for children
    const allChildren = Array.from(structure.childrenBySpouse.values()).flat();
    if (allChildren.length > 0) {
      // Recommend setting aside portion for children's education and welfare
      const childrensShare = Math.min(30, 100 - spouseShare * spouseCount); // Up to 30% for children
      const sharePerChild = childrensShare / allChildren.length;

      for (const childId of allChildren) {
        distribution.set(childId, {
          sharePercentage: sharePerChild,
          amount: totalEstateValue * (sharePerChild / 100),
          rationale: `Education and welfare share for child in polygamous family`,
        });
      }
    }

    return distribution;
  }

  /**
   * Validates guardianship arrangements in polygamous families
   */
  validateGuardianshipArrangements(
    structure: PolygamousFamilyStructure,
    existingGuardianships: any[],
  ): { isValid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for minors without guardians
    const allChildren = Array.from(structure.childrenBySpouse.values()).flat();
    const minors = allChildren.filter((childId) => {
      // In reality, we'd check if the child is a minor
      // For now, assume we have this information
      return true; // Simplified
    });

    for (const minorId of minors) {
      const hasGuardian = existingGuardianships.some(
        (guardianship) => guardianship.getWardId() === minorId && guardianship.getIsActive(),
      );

      if (!hasGuardian) {
        issues.push(`Minor ${minorId} has no appointed guardian`);
      }
    }

    // Recommend biological mother as primary guardian where appropriate
    for (const [spouseId, children] of structure.childrenBySpouse.entries()) {
      const hasGuardianship = existingGuardianships.some(
        (guardianship) =>
          children.includes(guardianship.getWardId()) && guardianship.getGuardianId() === spouseId,
      );

      if (!hasGuardianship && children.length > 0) {
        recommendations.push(
          `Consider appointing spouse ${spouseId} as guardian for their biological children`,
        );
      }
    }

    // Cross-house guardianship considerations
    if (structure.houses.size > 1) {
      recommendations.push('Consider cross-house guardianship arrangements for family unity');
      recommendations.push('Establish clear communication between houses for co-parenting');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // Private helper methods
  private organizeHouses(
    structure: PolygamousFamilyStructure,
    familyMembers: FamilyMember[],
  ): void {
    // Simplified house organization
    // In reality, this would use actual house information from family members
    let houseCounter = 1;

    for (const spouseId of structure.coSpouses) {
      const houseName = `House ${houseCounter}`;
      const houseMembers = [spouseId];

      // Add children of this spouse
      const spouseChildren = structure.childrenBySpouse.get(spouseId) || [];
      houseMembers.push(...spouseChildren);

      structure.houses.set(houseName, houseMembers);
      houseCounter++;
    }
  }

  private organizeChildrenBySpouse(
    structure: PolygamousFamilyStructure,
    familyMembers: FamilyMember[],
  ): void {
    // Simplified children organization
    // In reality, this would use actual parent-child relationships

    for (const spouseId of structure.coSpouses) {
      // For demonstration, assign 2 children per spouse
      const children = familyMembers
        .filter((member) => {
          // Simplified: Assume we can identify children somehow
          return !member.getIsDeceased() && member.getAge() !== null && member.getAge() < 18;
        })
        .slice(0, 2) // Take first 2 children for this spouse
        .map((member) => member.getId());

      structure.childrenBySpouse.set(spouseId, children);
    }
  }

  /**
   * Get Kenyan legal framework for polygamous families
   */
  static getLegalFramework(): {
    laws: string[];
    rights: string[];
    responsibilities: string[];
    courtConsiderations: string[];
  } {
    return {
      laws: [
        'Law of Succession Act - Equal treatment of spouses in polygamous marriages',
        'Marriage Act - Recognition of polygamous marriages under customary law',
        'Constitution - Protection of culture and tradition',
      ],
      rights: [
        'Equal inheritance rights for all spouses',
        'Right to matrimonial property',
        'Right to spousal maintenance if dependent',
        'Children have equal rights regardless of which house they belong to',
      ],
      responsibilities: [
        'Equal provision for all spouses in estate planning',
        'Fair treatment of children from all houses',
        'Clear documentation of family structure',
        'Cultural sensitivity in distribution plans',
      ],
      courtConsiderations: [
        'Evidence of marriage recognition',
        'Proof of equal treatment',
        "Children's welfare as paramount consideration",
        'Cultural context and practices',
      ],
    };
  }
}
