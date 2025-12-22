// src/domain/services/kenyan-intestacy-calculator.service.ts
import { Result } from '../core/result';
import { CustomaryLogicRule, KenyanCustomaryLaw } from '../shared/kenyan-customary-law.vo';
import { Money } from '../shared/money.vo';

// --- Types ---
export type Gender = 'MALE' | 'FEMALE';
export type MarriageType = 'MONOGAMOUS' | 'POLYGAMOUS' | 'CUSTOMARY';

export interface FamilyMemberNode {
  id: string;
  role: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING';
  gender: Gender;
  isMinor: boolean;
  houseId?: string; // CRITICAL for S.40 (Polygamy)
  isDeceased?: boolean; // For "Representation" (S.41)
}

export interface FamilyStructure {
  spouses: FamilyMemberNode[];
  children: FamilyMemberNode[];
  parents: FamilyMemberNode[];
  siblings: FamilyMemberNode[];
  isPolygamous: boolean;
}

export interface DistributionShare {
  beneficiaryId: string;
  beneficiaryRole: string;
  shareValue: Money;
  sharePercentage: number;
  type: 'ABSOLUTE' | 'LIFE_INTEREST' | 'CONDITIONAL_TRUST';
  legalBasis: string; // "S.35(1)(b)", "Customary-EldestSon"
  description: string;
}

export class DistributionResult {
  constructor(
    public readonly shares: DistributionShare[],
    public readonly unallocatedAmount: Money,
    public readonly basis: string,
  ) {}
}

// --- Service ---
export class KenyanIntestacyCalculator {
  /**
   * Main entry point. Uses Result pattern to avoid throwing exceptions.
   */
  public calculateDistribution(
    netEstateValue: Money,
    family: FamilyStructure,
    customaryLaw?: KenyanCustomaryLaw,
  ): Result<DistributionResult> {
    // 1. Customary Law Override Check
    // In Kenya, customary law applies mostly to un-gazetted land or specific tribes
    // However, the Constitution (Art 27) overrides discriminatory customary law.
    if (customaryLaw) {
      return this.calculateCustomary(netEstateValue, family, customaryLaw);
    }

    // 2. Statutory Law (Law of Succession Act)
    if (family.isPolygamous || family.spouses.length > 1) {
      return this.calculateSection40(netEstateValue, family);
    }

    if (family.spouses.length === 1 && family.children.length > 0) {
      return this.calculateSection35(netEstateValue, family);
    }

    if (family.spouses.length === 1 && family.children.length === 0) {
      return this.calculateSection36(netEstateValue, family);
    }

    if (family.spouses.length === 0 && family.children.length > 0) {
      return this.calculateSection38(netEstateValue, family);
    }

    // Fallback: S.39 (Parents -> Siblings -> Half-Siblings -> Relatives -> State)
    return this.calculateSection39(netEstateValue, family);
  }

  // ==========================================
  // SECTION 35: Spouse + Children
  // ==========================================
  private calculateSection35(estate: Money, family: FamilyStructure): Result<DistributionResult> {
    const spouse = family.spouses[0];
    const shares: DistributionShare[] = [];

    // 1. Personal Effects (Excluded from residue, usually calculated separately,
    // but for this value simulation, we assume they are handled.
    // If 'estate' is NET residue, we proceed.)

    // 2. Spouse gets LIFE INTEREST in the whole residue
    // Note: Children are "remaindermen". They don't get shares now.
    // They get it when spouse dies or remarries.

    shares.push({
      beneficiaryId: spouse.id,
      beneficiaryRole: 'SPOUSE',
      shareValue: estate,
      sharePercentage: 100.0,
      type: 'LIFE_INTEREST',
      legalBasis: 'LSA Section 35(1)(b)',
      description: 'Life interest in the whole residue. Terminates on death or remarriage.',
    });

    // In a sophisticated system, we might actually split the "Capital Value"
    // vs "Actuarial Life Interest", but legally, the spouse controls 100% currently.

    return Result.ok(new DistributionResult(shares, Money.zero(estate.currency), 'STATUTORY_S35'));
  }

  // ==========================================
  // SECTION 40: Polygamy (The "Houses" Rule)
  // ==========================================
  private calculateSection40(estate: Money, family: FamilyStructure): Result<DistributionResult> {
    // S.40(1): "Divided among the houses according to the number of children in each house,
    // but also adding any wife as an additional unit to the number of children."

    const shares: DistributionShare[] = [];

    // 1. Group by House
    const houses = new Map<string, { spouse?: FamilyMemberNode; children: FamilyMemberNode[] }>();

    // Initialize houses from spouses
    family.spouses.forEach((spouse) => {
      if (!spouse.houseId) return; // Data error check
      if (!houses.has(spouse.houseId)) houses.set(spouse.houseId, { children: [] });
      houses.get(spouse.houseId)!.spouse = spouse;
    });

    // Add children to houses
    family.children.forEach((child) => {
      if (!child.houseId) return; // Data error check
      if (!houses.has(child.houseId)) houses.set(child.houseId, { children: [] });
      houses.get(child.houseId)!.children.push(child);
    });

    // 2. Calculate "Units" per S.40(2)
    // Unit = (Number of Children) + (1 for the Wife if alive)
    let totalUnits = 0;
    const houseUnits = new Map<string, number>();

    for (const [houseId, data] of houses.entries()) {
      let units = data.children.length;
      if (data.spouse) units += 1; // Wife counts as a unit

      houseUnits.set(houseId, units);
      totalUnits += units;
    }

    if (totalUnits === 0)
      return Result.fail('Polygamous estate has no surviving units (wives or children).');

    // 3. Distribute to Houses
    for (const [houseId, units] of houseUnits.entries()) {
      const houseData = houses.get(houseId)!;
      const houseShareRatio = units / totalUnits;
      const houseTotalValue = estate.multiply(houseShareRatio);

      // 3a. Inside the House?
      // "S.40: The share of each house is then divided based on S.35 rules"
      // Meaning: Wife gets Life Interest, Children get remainder.

      if (houseData.spouse) {
        shares.push({
          beneficiaryId: houseData.spouse.id,
          beneficiaryRole: 'SPOUSE',
          shareValue: houseTotalValue,
          sharePercentage: houseShareRatio * 100,
          type: 'LIFE_INTEREST',
          legalBasis: `LSA Section 40 via House ${houseId}`,
          description: `Life interest in House Share (${units}/${totalUnits} units)`,
        });
      } else {
        // If wife is dead, children share equally absolutely
        const perChildValue = houseTotalValue.allocate(houseData.children.length); // Money.allocate handles cents

        houseData.children.forEach((child, idx) => {
          shares.push({
            beneficiaryId: child.id,
            beneficiaryRole: 'CHILD',
            shareValue: perChildValue[idx],
            sharePercentage: (houseShareRatio * 100) / houseData.children.length,
            type: 'ABSOLUTE',
            legalBasis: `LSA Section 40 - Orphaned House`,
            description: `Absolute share of House ${houseId}`,
          });
        });
      }
    }

    return Result.ok(new DistributionResult(shares, Money.zero(estate.currency), 'STATUTORY_S40'));
  }

  // ==========================================
  // CUSTOMARY LAW ("The Matrix" Implementation)
  // ==========================================
  private calculateCustomary(
    estate: Money,
    family: FamilyStructure,
    rules: KenyanCustomaryLaw,
  ): Result<DistributionResult> {
    const shares: DistributionShare[] = [];
    let remainingEstate = estate;

    // 1. Check Rule: ELDEST_SON_EXTRA_SHARE (e.g., Kikuyu "Muramati")
    if (rules.hasRule(CustomaryLogicRule.ELDEST_SON_EXTRA_SHARE)) {
      const extraPercent =
        rules.getRuleParam(CustomaryLogicRule.ELDEST_SON_EXTRA_SHARE, 'percent') || 10;

      const eldestSon = family.children.filter((c) => c.gender === 'MALE').sort((a, b) => 0)[0]; // Assume sorted by age or DOB check needed

      if (eldestSon) {
        const extraAmount = estate.percentage(extraPercent);
        shares.push({
          beneficiaryId: eldestSon.id,
          beneficiaryRole: 'ELDEST_SON',
          shareValue: extraAmount,
          sharePercentage: extraPercent,
          type: 'ABSOLUTE',
          legalBasis: `${rules.tribe} Customary Law - Muramati`,
          description: 'Extra share for head of household duties',
        });
        remainingEstate = remainingEstate.subtract(extraAmount);
      }
    }

    // 2. Check Rule: PATRILINEAL_ONLY
    // Note: This is unconstitutional, but the system must flag it or apply it
    // if configured to do so (with warnings).
    let eligibleChildren = family.children;
    if (rules.hasRule(CustomaryLogicRule.PATRILINEAL_ONLY)) {
      eligibleChildren = family.children.filter((c) => c.gender === 'MALE');
    }

    // 3. Distribute Remainder Equally
    if (eligibleChildren.length > 0) {
      const splitParts = remainingEstate.allocate(eligibleChildren.length);

      eligibleChildren.forEach((child, idx) => {
        shares.push({
          beneficiaryId: child.id,
          beneficiaryRole: 'CHILD',
          shareValue: splitParts[idx],
          sharePercentage: (splitParts[idx].amount / estate.amount) * 100, // Approximate
          type: 'ABSOLUTE',
          legalBasis: `${rules.tribe} Customary Law`,
          description: 'Standard customary share',
        });
      });
    }

    return Result.ok(
      new DistributionResult(shares, Money.zero(estate.currency), `CUSTOMARY_${rules.tribe}`),
    );
  }

  // Stubs for other sections
  private calculateSection36(estate: Money, family: FamilyStructure): Result<DistributionResult> {
    // Spouse takes all absolutely (no children)
    return Result.ok(
      new DistributionResult(
        [
          {
            beneficiaryId: family.spouses[0].id,
            beneficiaryRole: 'SPOUSE',
            shareValue: estate,
            sharePercentage: 100,
            type: 'ABSOLUTE',
            legalBasis: 'LSA Section 36',
            description: 'Spouse takes all absolutely (no children)',
          },
        ],
        Money.zero(estate.currency),
        'STATUTORY_S36',
      ),
    );
  }

  private calculateSection38(estate: Money, family: FamilyStructure): Result<DistributionResult> {
    // Children take all equally
    const shares = estate.allocate(family.children.length).map((val, idx) => ({
      beneficiaryId: family.children[idx].id,
      beneficiaryRole: 'CHILD',
      shareValue: val,
      sharePercentage: 100 / family.children.length,
      type: 'ABSOLUTE' as const,
      legalBasis: 'LSA Section 38',
      description: 'Equal share among children',
    }));
    return Result.ok(new DistributionResult(shares, Money.zero(estate.currency), 'STATUTORY_S38'));
  }

  private calculateSection39(estate: Money, family: FamilyStructure): Result<DistributionResult> {
    // Logic for Parents -> Siblings etc.
    return Result.ok(new DistributionResult([], estate, 'STATUTORY_S39_PENDING')); // Simplified for brevity
  }
}
