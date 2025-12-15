// domain/policies/law-of-succession-act/section-35-intestate.policy.ts
import { LsaSuccessionStructure } from '../../utils/family-tree-builder';

// Enums matching Prisma
export enum InterestType {
  ABSOLUTE = 'ABSOLUTE', // Beneficiary owns it outright
  LIFE_INTEREST = 'LIFE_INTEREST', // Beneficiary uses it until death/remarriage
}

export interface BeneficiaryShare {
  beneficiaryId: string;
  sharePercentage: number;
  shareValue: number;
  interestType: InterestType;
  conditions?: string; // e.g., "Terminates on remarriage"
  isTrust?: boolean; // Held in trust for minors
}

export interface IntestateDistributionResult {
  sectionApplied: string; // "S.35", "S.36", "S.38"
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
   * Calculates distribution for a Monogamous Estate (or a single House in polygamy).
   *
   * @param netResidueValue - Value AFTER debts and personal effects are removed
   * @param structure - The family tree analysis
   */
  static calculateDistribution(
    netResidueValue: number,
    structure: LsaSuccessionStructure,
  ): IntestateDistributionResult {
    const survivingSpouseCount = structure.survivingSpouses.length;

    // Count "Issues" (Living Children + Deceased Children with Issue)
    const issueCount = structure.children.length + structure.deceasedChildrenWithIssue.length;

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
   * - Children: Absolute share of Residue (vests upon spouse death/marriage).
   */
  private static applySection35(
    value: number,
    structure: LsaSuccessionStructure,
  ): IntestateDistributionResult {
    const spouseId = structure.survivingSpouses[0]; // Assuming monogamous context here
    const shares: BeneficiaryShare[] = [];

    // 1. Spouse Share (Life Interest)
    // In practice, the spouse manages the whole 100% as a Life Tenant.
    // The children are "Remaindermen".
    shares.push({
      beneficiaryId: spouseId,
      sharePercentage: 100, // They control 100% during life
      shareValue: value,
      interestType: InterestType.LIFE_INTEREST,
      conditions: 'Terminates upon death or remarriage. Held in trust for children.',
      isTrust: true,
    });

    // 2. Children Share (Future Interest / Remaindermen)
    // We record this to establish the "Trust" beneficiaries.
    // Technically they get 0% *now*, but 100% *later*.
    // For calculation transparency, we often show the split if the trust were dissolved today.
    // But under S.35, the Spouse takes the grant.

    return {
      sectionApplied: 'S.35',
      description:
        'Section 35: Surviving Spouse takes Life Interest. Children take capital upon cessation of life interest.',
      personalEffects: {
        beneficiaryIds: [spouseId],
        note: 'Surviving spouse entitled to all personal effects absolutely (S.35(1)(a)).',
      },
      residueDistribution: shares,
      warnings: [
        'Spouse has Life Interest only.',
        'Consent of court required for spouse to sell corpus of estate.',
        'Spouse loses interest upon remarriage.',
      ],
    };
  }

  /**
   * Section 36: Spouse Only (No Children)
   * - Spouse: Personal effects + Life Interest in Residue.
   * - Note: S.36 is strict. Even without kids, the spouse doesn't get absolute estate in Kenya (unless small estate).
   */
  private static applySection36(
    value: number,
    structure: LsaSuccessionStructure,
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
          isTrust: false, // No children beneficiaries, but devolution moves to parents/siblings on spouse death
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
   * - Grandchildren: Represent deceased parents (Per Stirpes).
   */
  private static applySection38(
    value: number,
    structure: LsaSuccessionStructure,
  ): IntestateDistributionResult {
    const totalUnits = structure.children.length + structure.deceasedChildrenWithIssue.length;
    const sharePerUnit = value / totalUnits;
    const percentagePerUnit = parseFloat((100 / totalUnits).toFixed(2));

    const shares: BeneficiaryShare[] = [];

    // 1. Living Children
    for (const childId of structure.children) {
      shares.push({
        beneficiaryId: childId,
        sharePercentage: percentagePerUnit,
        shareValue: Math.floor(sharePerUnit),
        interestType: InterestType.ABSOLUTE,
        conditions: undefined,
        isTrust: false, // Unless minor (handled in Aggregates)
      });
    }

    // 2. Deceased Children (Per Stirpes)
    // Note: The specific grandchildren are identified in the Tree Builder structure.
    // For this high-level policy, we allocate to the "Estate of Deceased Child"
    // or flag it for sub-division.
    for (const deadChildId of structure.deceasedChildrenWithIssue) {
      shares.push({
        beneficiaryId: deadChildId, // Represents the branch
        sharePercentage: percentagePerUnit,
        shareValue: Math.floor(sharePerUnit),
        interestType: InterestType.ABSOLUTE,
        conditions: 'Per Stirpes: To be divided among issue of deceased child (S.41).',
        isTrust: false,
      });
    }

    return {
      sectionApplied: 'S.38',
      description:
        'Section 38: Residue divided equally among children (and issue of deceased children).',
      personalEffects: {
        beneficiaryIds: [...structure.children], // Shared among children
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
    structure: LsaSuccessionStructure,
  ): IntestateDistributionResult {
    // Priority 1: Father (or Parents equally, depending on court interpretation of equality)
    // Standard LSA text says "Father; if dead, Mother".
    // Constitution Art 27 implies Equal Parents. We will assume Equal Parents logic here.

    if (structure.parents.length > 0) {
      const share = value / structure.parents.length;
      const shares = structure.parents.map((pId) => ({
        beneficiaryId: pId,
        sharePercentage: 100 / structure.parents.length,
        shareValue: Math.floor(share),
        interestType: InterestType.ABSOLUTE,
      }));

      return {
        sectionApplied: 'S.39(1)(a-b)',
        description: 'Section 39: Estate devolves to Parents.',
        personalEffects: { beneficiaryIds: structure.parents, note: 'To Parents' },
        residueDistribution: shares,
        warnings: [],
      };
    }

    // Fallback if parents dead (Siblings, etc.) - Simplified for now
    return {
      sectionApplied: 'S.39',
      description: 'Section 39: No spouse, children, or parents found.',
      personalEffects: { beneficiaryIds: [], note: 'To be determined by administration' },
      residueDistribution: [],
      warnings: ['Estate devolves to next of kin (Siblings/Half-Siblings) or State (S.46).'],
    };
  }
}
