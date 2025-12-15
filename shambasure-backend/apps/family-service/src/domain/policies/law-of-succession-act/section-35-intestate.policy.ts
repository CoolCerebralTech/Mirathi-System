// domain/policies/law-of-succession-act/section-35-intestate.policy.ts
import { SuccessionStructure } from '../../utils/family-tree-builder';

// Enums matching Prisma
export enum InterestType {
  ABSOLUTE = 'ABSOLUTE', // Beneficiary owns it outright
  LIFE_INTEREST = 'LIFE_INTEREST', // Beneficiary uses it until death/remarriage
  TRUST_FOR_MINOR = 'TRUST_FOR_MINOR', // Held until age of majority
}

export interface BeneficiaryShare {
  beneficiaryId: string;
  sharePercentage: number;
  shareValue: number;
  interestType: InterestType;
  conditions?: string; // e.g., "Terminates on remarriage"
  isTrust: boolean; // Held in trust (for minors or remainder interest)
  description: string; // "Share of Child X"
}

export interface IntestateDistributionResult {
  sectionApplied: string; // "S.35", "S.36", "S.38", "S.39"
  description: string;

  // Specific Allocations
  personalEffects: {
    beneficiaryIds: string[];
    note: string;
  };

  residueDistribution: BeneficiaryShare[];

  // Logic Warnings
  warnings: string[];
}

export class Section35IntestatePolicy {
  /**
   * Calculates distribution for a Monogamous Estate (or a single House in S.40 polygamy).
   *
   * @param netResidueValue - Value AFTER debts and personal effects are removed
   * @param structure - The analysis from FamilyTreeBuilder
   */
  static calculateDistribution(
    netResidueValue: number,
    structure: SuccessionStructure,
  ): IntestateDistributionResult {
    const survivingSpouseCount = structure.survivingSpouses.length;

    // "Issue" = Living Children + Deceased Children with Issue (Grandkids)
    const issueCount = structure.livingChildren.length + structure.deceasedChildrenWithIssue.size;

    // --- SCENARIO 1: Spouse + Children (Section 35) ---
    if (survivingSpouseCount > 0 && issueCount > 0) {
      return this.applySection35(netResidueValue, structure);
    }

    // --- SCENARIO 2: Spouse Only, No Children (Section 36) ---
    if (survivingSpouseCount > 0 && issueCount === 0) {
      return this.applySection36(netResidueValue, structure);
    }

    // --- SCENARIO 3: Children Only, No Spouse (Section 38) ---
    if (survivingSpouseCount === 0 && issueCount > 0) {
      return this.applySection38(netResidueValue, structure);
    }

    // --- SCENARIO 4: No Spouse, No Children (Section 39) ---
    return this.applySection39(netResidueValue, structure);
  }

  /**
   * Section 35: Spouse + Children
   * - Spouse: Personal effects + Life Interest in Residue.
   * - Children: Absolute share of Residue (Vests upon spouse death/remarriage).
   */
  private static applySection35(
    value: number,
    structure: SuccessionStructure,
  ): IntestateDistributionResult {
    const spouseId = structure.survivingSpouses[0]; // Assumes single spouse context here
    const shares: BeneficiaryShare[] = [];

    // 1. Spouse Share (Life Interest)
    // The spouse holds the "Life Interest" in the WHOLE estate.
    shares.push({
      beneficiaryId: spouseId,
      sharePercentage: 100, // Controls 100% during life
      shareValue: value,
      interestType: InterestType.LIFE_INTEREST,
      conditions: 'Terminates upon death or remarriage. Held in trust for children.',
      isTrust: true,
      description: 'Life Interest in whole Net Intestate Estate',
    });

    // 2. Note on Remaindermen (Children)
    // We don't distribute capital to children yet, but the "Warnings" clarifies their future right.

    return {
      sectionApplied: 'S.35',
      description:
        'Section 35: Surviving Spouse takes Life Interest. Children (Remaindermen) take capital only upon cessation of life interest.',
      personalEffects: {
        beneficiaryIds: [spouseId],
        note: 'Surviving spouse entitled to all personal effects absolutely (S.35(1)(a)).',
      },
      residueDistribution: shares,
      warnings: [
        'Spouse has Life Interest only (cannot sell capital without court consent).',
        'Spouse loses interest upon remarriage.',
        'Children strictly entitled to capital upon spouse death/remarriage.',
      ],
    };
  }

  /**
   * Section 36: Spouse Only (No Children)
   * - Spouse: Personal effects + Life Interest in Residue.
   * - Difference: If spouse dies/remarries, estate goes to S.39 relatives (Parents/Siblings).
   */
  private static applySection36(
    value: number,
    structure: SuccessionStructure,
  ): IntestateDistributionResult {
    const spouseId = structure.survivingSpouses[0];

    return {
      sectionApplied: 'S.36',
      description: 'Section 36: Surviving Spouse takes Life Interest (No children).',
      personalEffects: {
        beneficiaryIds: [spouseId],
        note: 'Surviving spouse entitled to all personal effects absolutely.',
      },
      residueDistribution: [
        {
          beneficiaryId: spouseId,
          sharePercentage: 100,
          shareValue: value,
          interestType: InterestType.LIFE_INTEREST,
          conditions: 'Terminates upon death or remarriage.',
          isTrust: false,
          description: 'Life Interest in whole Net Intestate Estate',
        },
      ],
      warnings: [
        'Spouse has Life Interest only.',
        'On spouse death/remarriage, estate devolves to parents/siblings (S.39).',
      ],
    };
  }

  /**
   * Section 38: Children Only (No Spouse)
   * - Children: Equal shares absolutely.
   * - Grandchildren (Issue of dead child): Represent parent per stirpes (S.41).
   */
  private static applySection38(
    value: number,
    structure: SuccessionStructure,
  ): IntestateDistributionResult {
    const totalUnits = structure.livingChildren.length + structure.deceasedChildrenWithIssue.size;

    if (totalUnits === 0) return this.applySection39(value, structure); // Fallback

    const sharePerUnit = value / totalUnits;
    const percentagePerUnit = parseFloat((100 / totalUnits).toFixed(4));
    const shares: BeneficiaryShare[] = [];

    // 1. Living Children (Absolute)
    for (const childId of structure.livingChildren) {
      shares.push({
        beneficiaryId: childId,
        sharePercentage: percentagePerUnit,
        shareValue: Math.floor(sharePerUnit),
        interestType: InterestType.ABSOLUTE,
        isTrust: false, // Unless minor (flagged by service later)
        description: 'Equal share (Child)',
      });
    }

    // 2. Deceased Children (Per Stirpes - S.41)
    // We iterate the map: { deadChildId -> [grandChildId1, grandChildId2] }
    structure.deceasedChildrenWithIssue.forEach((grandChildIds) => {
      // The dead child's share is split among their kids
      const grandChildCount = grandChildIds.length;
      const grandChildShareValue = Math.floor(sharePerUnit / grandChildCount);
      const grandChildSharePercent = parseFloat((percentagePerUnit / grandChildCount).toFixed(4));

      for (const gcId of grandChildIds) {
        shares.push({
          beneficiaryId: gcId,
          sharePercentage: grandChildSharePercent,
          shareValue: grandChildShareValue,
          interestType: InterestType.ABSOLUTE,
          conditions: 'Per Stirpes (S.41)',
          isTrust: false,
          description: 'Share of deceased parent (Per Stirpes)',
        });
      }
    });

    return {
      sectionApplied: 'S.38 / S.41',
      description:
        'Section 38: Residue divided equally among children (and issue of deceased children per stirpes).',
      personalEffects: {
        beneficiaryIds: [...structure.livingChildren],
        note: 'Personal effects divided among children.',
      },
      residueDistribution: shares,
      warnings: [],
    };
  }

  /**
   * Section 39: No Spouse, No Children
   * - Father -> Mother -> Brothers/Sisters -> etc.
   */
  private static applySection39(
    value: number,
    structure: SuccessionStructure,
  ): IntestateDistributionResult {
    // Priority 1: Parents (S.39(1)(a) & (b))
    // Note: Constitution Art 27 implies parents share equally vs older "Father first" rule.
    if (structure.livingParents.length > 0) {
      const shareValue = Math.floor(value / structure.livingParents.length);
      const sharePercent = parseFloat((100 / structure.livingParents.length).toFixed(2));

      const shares = structure.livingParents.map(
        (pId) =>
          ({
            beneficiaryId: pId,
            sharePercentage: sharePercent,
            shareValue: shareValue,
            interestType: InterestType.ABSOLUTE,
            isTrust: false,
            description: 'Parent share (S.39)',
          }) as BeneficiaryShare,
      );

      return {
        sectionApplied: 'S.39(1)',
        description: 'Section 39: Estate devolves to Parents.',
        personalEffects: { beneficiaryIds: structure.livingParents, note: 'To Parents' },
        residueDistribution: shares,
        warnings: [],
      };
    }

    // Fallback: S.39(1)(c) Siblings / Half-Siblings
    // Note: The FamilyTreeBuilder structure might not explicitly list siblings if deceased has no parents.
    // In a real flow, the service would fetch siblings if parents are empty.

    return {
      sectionApplied: 'S.39',
      description: 'Section 39: No spouse, children, or parents found.',
      personalEffects: { beneficiaryIds: [], note: 'To be determined by administration' },
      residueDistribution: [],
      warnings: [
        'Estate devolves to next of kin (Siblings -> Half-Siblings -> Relatives -> State).',
      ],
    };
  }
}
