// domain/services/distribution-calculator.service.ts

import { Estate } from '../aggregates/estate.aggregate';
import { Money, SharePercentage, SuccessionLawSection } from '../value-objects';

/**
 * Distribution Calculator Service
 * 
 * The "Brain" of succession law - calculates inheritance shares
 * 
 * CRITICAL LEGAL IMPLEMENTATION:
 * - Section 35 LSA: Intestate succession (spouse + children)
 * - Section 40 LSA: Polygamous marriages (house-by-house)
 * - Section 26/29 LSA: Dependant provisions
 * - Hotchpot (S.35(3)): Gifts during life deducted from share
 * 
 * Business Rules:
 * 1. Distribution only after debts settled (S.45 priority)
 * 2. Dependants get provision first (S.26 overrides will)
 * 3. Spouse gets life interest (can't sell, only use)
 * 4. Children share remainder equally
 * 5. Polygamous houses get proportional shares (S.40)
 * 6. Hotchpot: gifts during life reduce final share
 * 
 * Design Pattern: Domain Service (stateless, pure functions)
 */

/**
 * Family Structure (from Family Service)
 * This is the context needed for distribution calculations
 */
export interface FamilyStructure {
  spouses: FamilyMember[];
  children: FamilyMember[];
  parents: FamilyMember[];
  isPolygamous: boolean;
  polygamousHouses?: PolygamousHouse[];
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  isAlive: boolean;
  dateOfBirth?: Date;
  polygamousHouseId?: string;
}

export interface PolygamousHouse {
  id: string;
  houseOrder: number;
  spouseId: string;
  childrenIds: string[];
}

/**
 * Distribution Result
 */
export interface DistributionResult {
  scenario: string; // "INTESTATE_S35", "INTESTATE_S40", "TESTATE"
  totalDistributableValue: Money;
  shares: BeneficiaryShare[];
  dependantProvisions: DependantProvision[];
  legalBasis: SuccessionLawSection;
  warnings: string[];
  calculations: CalculationBreakdown;
}

export interface BeneficiaryShare {
  beneficiaryId: string;
  beneficiaryName: string;
  relationship: string;
  shareType: 'ABSOLUTE' | 'LIFE_INTEREST' | 'REMAINDER';
  sharePercentage: SharePercentage;
  shareValue: Money;
  polygamousHouseId?: string;
  conditions?: string[];
  hotchpotDeduction?: Money;
}

export interface DependantProvision {
  dependantId: string;
  dependantName: string;
  monthlyProvision: Money;
  annualProvision: Money;
  lumpSumProvision?: Money;
  yearsOfSupport?: number;
}

export interface CalculationBreakdown {
  step1_GrossEstate: Money;
  step2_DebtsPaid: Money;
  step3_NetEstate: Money;
  step4_HotchpotAdditions: Money;
  step5_HotchpotAdjustedValue: Money;
  step6_DependantProvisions: Money;
  step7_DistributableRemainder: Money;
  step8_SpouseLifeInterest?: Money;
  step9_ChildrenRemainder?: Money;
}

export class DistributionCalculatorService {
  /**
   * Calculate distribution for intestate estate (S.35 LSA)
   * 
   * S.35 Rules:
   * - Spouse: Life interest in whole estate OR 20% absolute + life interest in remainder
   * - Children: Share remainder equally
   * - No spouse: Children get 100%
   * - No children: Spouse gets 100%
   * - No spouse/children: Parents get 100%
   */
  public calculateIntestateDistribution(
    estate: Estate,
    familyStructure: FamilyStructure,
  ): DistributionResult {
    const warnings: string[] = [];

    // Step 1: Validate estate is ready
    if (!estate.isReadyForDistribution()) {
      throw new Error(
        `Estate not ready for distribution: ${estate.getDistributionBlockers().join(', ')}`,
      );
    }

    // Step 2: Get distributable value
    const grossValue = estate.grossValueKES;
    const liabilities = estate.totalLiabilitiesKES;
    const netValue = estate.netEstateValueKES;

    // Step 3: Calculate hotchpot value (S.35(3))
    const hotchpotValue = estate.calculateTotalHotchpotValue();
    const hotchpotAdjustedValue = netValue.add(hotchpotValue);

    // Step 4: Deduct dependant provisions first (S.26 priority)
    const dependantProvisions = this.calculateDependantProvisions(estate);
    const totalDependantProvision = Money.sum(
      dependantProvisions.map(p => p.annualProvision),
    );

    const distributableRemainder = hotchpotAdjustedValue.subtract(totalDependantProvision);

    if (distributableRemainder.isNegative()) {
      warnings.push('Dependant provisions exceed estate value - court intervention required');
    }

    // Step 5: Apply S.35 distribution rules
    let shares: BeneficiaryShare[];

    if (familyStructure.isPolygamous) {
      // S.40 applies - polygamous distribution
      shares = this.calculatePolygamousDistribution(
        distributableRemainder,
        familyStructure,
        estate,
      );
    } else {
      // S.35 applies - standard intestate
      shares = this.calculateStandardIntestateShares(
        distributableRemainder,
        familyStructure,
        estate,
      );
    }

    // Step 6: Apply hotchpot deductions
    shares = this.applyHotchpotDeductions(shares, estate);

    return {
      scenario: familyStructure.isPolygamous ? 'INTESTATE_S40' : 'INTESTATE_S35',
      totalDistributableValue: distributableRemainder,
      shares,
      dependantProvisions,
      legalBasis: familyStructure.isPolygamous
        ? SuccessionLawSection.s40Polygamy()
        : SuccessionLawSection.s35SpousalChildShare(),
      warnings,
      calculations: {
        step1_GrossEstate: grossValue,
        step2_DebtsPaid: liabilities,
        step3_NetEstate: netValue,
        step4_HotchpotAdditions: hotchpotValue,
        step5_HotchpotAdjustedValue: hotchpotAdjustedValue,
        step6_DependantProvisions: totalDependantProvision,
        step7_DistributableRemainder: distributableRemainder,
      },
    };
  }

  /**
   * Calculate standard intestate shares (S.35 LSA)
   */
  private calculateStandardIntestateShares(
    distributableValue: Money,
    familyStructure: FamilyStructure,
    estate: Estate,
  ): BeneficiaryShare[] {
    const shares: BeneficiaryShare[] = [];
    const livingSpouses = familyStructure.spouses.filter(s => s.isAlive);
    const livingChildren = familyStructure.children.filter(c => c.isAlive);

    // Case 1: Spouse + Children (Most common)
    if (livingSpouses.length > 0 && livingChildren.length > 0) {
      // Spouse gets life interest in whole estate
      livingSpouses.forEach(spouse => {
        shares.push({
          beneficiaryId: spouse.id,
          beneficiaryName: spouse.name,
          relationship: 'Spouse',
          shareType: 'LIFE_INTEREST',
          sharePercentage: SharePercentage.full(),
          shareValue: distributableValue,
          conditions: [
            'Life interest only - cannot sell or dispose',
            'Property passes to children upon death',
            'Can use and enjoy property during lifetime',
          ],
        });
      });

      // Children get remainder (divided equally)
      const childShares = SharePercentage.allocateEqually(livingChildren.length);
      livingChildren.forEach((child, index) => {
        shares.push({
          beneficiaryId: child.id,
          beneficiaryName: child.name,
          relationship: 'Child',
          shareType: 'REMAINDER',
          sharePercentage: childShares[index],
          shareValue: distributableValue.multiply(childShares[index].getDecimal()),
          conditions: [
            'Remainder interest - receives upon death of surviving spouse',
            'Cannot access until life interest terminates',
          ],
        });
      });
    }
    // Case 2: Spouse only (No children)
    else if (livingSpouses.length > 0 && livingChildren.length === 0) {
      livingSpouses.forEach(spouse => {
        shares.push({
          beneficiaryId: spouse.id,
          beneficiaryName: spouse.name,
          relationship: 'Spouse',
          shareType: 'ABSOLUTE',
          sharePercentage: SharePercentage.full(),
          shareValue: distributableValue,
        });
      });
    }
    // Case 3: Children only (No spouse)
    else if (livingChildren.length > 0 && livingSpouses.length === 0) {
      const childShares = SharePercentage.allocateEqually(livingChildren.length);
      livingChildren.forEach((child, index) => {
        shares.push({
          beneficiaryId: child.id,
          beneficiaryName: child.name,
          relationship: 'Child',
          shareType: 'ABSOLUTE',
          sharePercentage: childShares[index],
          shareValue: distributableValue.multiply(childShares[index].getDecimal()),
        });
      });
    }
    // Case 4: Parents only (No spouse or children)
    else if (familyStructure.parents.length > 0) {
      const livingParents = familyStructure.parents.filter(p => p.isAlive);
      const parentShares = SharePercentage.allocateEqually(livingParents.length);

      livingParents.forEach((parent, index) => {
        shares.push({
          beneficiaryId: parent.id,
          beneficiaryName: parent.name,
          relationship: 'Parent',
          shareType: 'ABSOLUTE',
          sharePercentage: parentShares[index],
          shareValue: distributableValue.multiply(parentShares[index].getDecimal()),
        });
      });
    }

    return shares;
  }

  /**
   * Calculate polygamous distribution (S.40 LSA)
   * 
   * S.40 Rules:
   * - Estate divided among houses
   * - Each house gets share based on number of children
   * - House with most children gets larger share
   * - Within each house, S.35 rules apply
   */
  private calculatePolygamousDistribution(
    distributableValue: Money,
    familyStructure: FamilyStructure,
    estate: Estate,
  ): BeneficiaryShare[] {
    const shares: BeneficiaryShare[] = [];
    const houses = familyStructure.polygamousHouses || [];

    if (houses.length === 0) {
      throw new Error('Polygamous family structure missing house information');
    }

    // Step 1: Calculate house ratios (based on number of children)
    const houseRatios = houses.map(house => house.childrenIds.length || 1);
    const houseShares = SharePercentage.allocateByRatio(houseRatios);

    // Step 2: Distribute to each house
    houses.forEach((house, index) => {
      const houseShare = houseShares[index];
      const houseValue = distributableValue.multiply(houseShare.getDecimal());

      // Get house members
      const houseSpouse = familyStructure.spouses.find(s => s.id === house.spouseId);
      const houseChildren = familyStructure.children.filter(c =>
        house.childrenIds.includes(c.id) && c.isAlive,
      );

      if (!houseSpouse) continue;

      // House spouse gets life interest in house's share
      shares.push({
        beneficiaryId: houseSpouse.id,
        beneficiaryName: houseSpouse.name,
        relationship: `Spouse (House ${house.houseOrder})`,
        shareType: 'LIFE_INTEREST',
        sharePercentage: houseShare,
        shareValue: houseValue,
        polygamousHouseId: house.id,
        conditions: [
          `Life interest in House ${house.houseOrder}'s share only`,
          'Cannot sell or dispose',
          'Property passes to house children upon death',
        ],
      });

      // House children share remainder equally
      if (houseChildren.length > 0) {
        const childShares = SharePercentage.allocateEqually(houseChildren.length);

        houseChildren.forEach((child, childIndex) => {
          const childShareOfHouse = childShares[childIndex];
          const childAbsoluteShare = houseShare.multiply(childShareOfHouse.getDecimal());

          shares.push({
            beneficiaryId: child.id,
            beneficiaryName: child.name,
            relationship: `Child (House ${house.houseOrder})`,
            shareType: 'REMAINDER',
            sharePercentage: childAbsoluteShare,
            shareValue: distributableValue.multiply(childAbsoluteShare.getDecimal()),
            polygamousHouseId: house.id,
            conditions: [
              `Remainder interest in House ${house.houseOrder}'s share`,
              'Receives upon death of house spouse',
            ],
          });
        });
      }
    });

    return shares;
  }

  /**
   * Calculate dependant provisions (S.26/S.29 LSA)
   * 
   * Dependants get provision BEFORE beneficiaries
   * Court can override will to provide for dependants
   */
  private calculateDependantProvisions(estate: Estate): DependantProvision[] {
    const verifiedDependants = estate.getVerifiedDependants();
    const provisions: DependantProvision[] = [];

    for (const dependant of verifiedDependants) {
      const monthlyProvision = dependant.calculateMonthlyProvision();
      const annualProvision = dependant.calculateAnnualProvision();

      // For minors, calculate lump sum until age 18
      let lumpSumProvision: Money | undefined;
      let yearsOfSupport: number | undefined;

      if (dependant.isMinor()) {
        const age = dependant.calculateAge();
        yearsOfSupport = 18 - age;
        lumpSumProvision = dependant.estimateLumpSumProvision(yearsOfSupport);
      }

      provisions.push({
        dependantId: dependant.id.toString(),
        dependantName: `${dependant.relationshipToDeceased} Dependant`,
        monthlyProvision,
        annualProvision,
        lumpSumProvision,
        yearsOfSupport,
      });
    }

    return provisions;
  }

  /**
   * Apply hotchpot deductions (S.35(3) LSA)
   * 
   * If beneficiary received gift during deceased's life,
   * that gift is deducted from their final share
   */
  private applyHotchpotDeductions(
    shares: BeneficiaryShare[],
    estate: Estate,
  ): BeneficiaryShare[] {
    const hotchpotGifts = estate.getHotchpotGifts();

    return shares.map(share => {
      // Find gifts to this beneficiary
      const beneficiaryGifts = hotchpotGifts.filter(
        gift => gift.recipientId.toString() === share.beneficiaryId,
      );

      if (beneficiaryGifts.length === 0) {
        return share;
      }

      // Calculate total gifts received
      const totalGifts = Money.sum(beneficiaryGifts.map(g => g.getHotchpotValue()));

      // Deduct from share value
      const adjustedValue = share.shareValue.subtract(totalGifts);

      return {
        ...share,
        shareValue: adjustedValue.isNegative() ? Money.zero() : adjustedValue,
        hotchpotDeduction: totalGifts,
        conditions: [
          ...(share.conditions || []),
          `Hotchpot deduction: ${totalGifts.format()} (gifts during lifetime)`,
        ],
      };
    });
  }

  /**
   * Validate distribution result
   * 
   * Business Rules:
   * - Total shares must not exceed estate value
   * - All living beneficiaries must have shares
   * - Percentages must sum to 100% (for absolute shares)
   */
  public validateDistribution(result: DistributionResult): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check 1: Total value doesn't exceed estate
    const totalDistributed = Money.sum(result.shares.map(s => s.shareValue));
    const totalWithDependants = totalDistributed.add(
      Money.sum(result.dependantProvisions.map(p => p.annualProvision)),
    );

    if (totalWithDependants.greaterThan(result.totalDistributableValue)) {
      errors.push(
        `Total distribution (${totalWithDependants.format()}) exceeds estate value (${result.totalDistributableValue.format()})`,
      );
    }

    // Check 2: Absolute shares sum to 100%
    const absoluteShares = result.shares.filter(s => s.shareType === 'ABSOLUTE');
    if (absoluteShares.length > 0) {
      const totalPercentage = absoluteShares.reduce(
        (sum, share) => sum + share.sharePercentage.getPercentage(),
        0,
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`Absolute shares total ${totalPercentage}% instead of 100%`);
      }
    }

    // Check 3: Life interest + remainder integrity
    const lifeInterestShares = result.shares.filter(s => s.shareType === 'LIFE_INTEREST');
    const remainderShares = result.shares.filter(s => s.shareType === 'REMAINDER');

    if (lifeInterestShares.length > 0 && remainderShares.length === 0) {
      errors.push('Life interest exists without corresponding remainder interest');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate distribution report (for court/executor)
   */
  public generateDistributionReport(result: DistributionResult): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('ESTATE DISTRIBUTION CALCULATION');
    lines.push('='.repeat(80));
    lines.push('');

    lines.push(`Scenario: ${result.scenario}`);
    lines.push(`Legal Basis: ${result.legalBasis.getFullCitation()}`);
    lines.push('');

    lines.push('CALCULATION BREAKDOWN:');
    lines.push('-'.repeat(80));
    lines.push(`1. Gross Estate Value:           ${result.calculations.step1_GrossEstate.format()}`);
    lines.push(`2. Less: Debts Paid (S.45):      ${result.calculations.step2_DebtsPaid.format()}`);
    lines.push(`3. Net Estate:                    ${result.calculations.step3_NetEstate.format()}`);
    lines.push(`4. Add: Hotchpot Gifts (S.35(3)): ${result.calculations.step4_HotchpotAdditions.format()}`);
    lines.push(`5. Hotchpot-Adjusted Value:       ${result.calculations.step5_HotchpotAdjustedValue.format()}`);
    lines.push(`6. Less: Dependant Provisions:    ${result.calculations.step6_DependantProvisions.format()}`);
    lines.push(`7. Distributable Remainder:       ${result.calculations.step7_DistributableRemainder.format()}`);
    lines.push('');

    if (result.dependantProvisions.length > 0) {
      lines.push('DEPENDANT PROVISIONS (S.26/S.29 LSA):');
      lines.push('-'.repeat(80));
      result.dependantProvisions.forEach(dep => {
        lines.push(`${dep.dependantName}:`);
        lines.push(`  Monthly: ${dep.monthlyProvision.format()}`);
        lines.push(`  Annual:  ${dep.annualProvision.format()}`);
        if (dep.lumpSumProvision) {
          lines.push(`  Lump Sum (${dep.yearsOfSupport} years): ${dep.lumpSumProvision.format()}`);
        }
        lines.push('');
      });
    }

    lines.push('BENEFICIARY SHARES:');
    lines.push('-'.repeat(80));
    result.shares.forEach(share => {
      lines.push(`${share.beneficiaryName} (${share.relationship}):`);
      lines.push(`  Type:       ${share.shareType}`);
      lines.push(`  Percentage: ${share.sharePercentage.format()}`);
      lines.push(`  Value:      ${share.shareValue.format()}`);

      if (share.hotchpotDeduction) {
        lines.push(`  Hotchpot Deduction: ${share.hotchpotDeduction.format()}`);
      }

      if (share.conditions && share.conditions.length > 0) {
        lines.push('  Conditions:');
        share.conditions.forEach(condition => {
          lines.push(`    - ${condition}`);
        });
      }
      lines.push('');
    });

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('-'.repeat(80));
      result.warnings.forEach(warning => {
        lines.push(`⚠️  ${warning}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}