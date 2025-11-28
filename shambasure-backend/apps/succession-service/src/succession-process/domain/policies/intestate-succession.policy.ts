import { Injectable } from '@nestjs/common';
import { ShareType } from '../../../common/types/kenyan-law.types';

export interface FamilyUnit {
  spouseId?: string;
  spouseName?: string;
  childrenIds: string[];
  childrenAges: { [childId: string]: number };
  isHouse: boolean;
  houseDescription?: string;
}

export interface DistributionResult {
  beneficiaryId: string;
  beneficiaryName?: string;
  sharePercentage: number;
  shareType: ShareType;
  relationship: string;
  conditions?: string[];
  notes?: string;
}

@Injectable()
export class IntestateSuccessionPolicy {
  private readonly MAJORITY_AGE = 18;

  /**
   * Calculates shares based on Kenyan Intestacy Rules (Part V, Law of Succession Act)
   */
  calculateShares(
    units: FamilyUnit[],
    estateNetValue: number,
    personalEffectsValue: number = 0,
  ): {
    distributions: DistributionResult[];
    summary: {
      totalShares: number;
      spouseLifeInterest: boolean;
      minorChildren: boolean;
      polygamous: boolean;
    };
    warnings: string[];
  } {
    const distributions: DistributionResult[] = [];
    const warnings: string[] = [];

    // Validate input
    if (units.length === 0) {
      throw new Error('At least one family unit must be provided');
    }

    const isPolygamous = units.length > 1 && units.every((u) => u.isHouse);
    const hasMinorChildren = units.some((unit) =>
      Object.values(unit.childrenAges).some((age) => age < this.MAJORITY_AGE),
    );

    // 1. Polygamous Case (Section 40)
    if (isPolygamous) {
      const polygamousResult = this.calculatePolygamousShares(units, personalEffectsValue);
      distributions.push(...polygamousResult.distributions);
      warnings.push(...polygamousResult.warnings);
    }
    // 2. Monogamous Case
    else {
      const unit = units[0];

      if (unit.spouseId && unit.childrenIds.length > 0) {
        // Section 35: Spouse + Children
        distributions.push(...this.calculateSpouseChildrenShares(unit, personalEffectsValue));
      } else if (unit.spouseId && unit.childrenIds.length === 0) {
        // Section 36: Spouse Only
        distributions.push(...this.calculateSpouseOnlyShares(unit, personalEffectsValue));
      } else if (!unit.spouseId && unit.childrenIds.length > 0) {
        // Section 38: Children Only
        distributions.push(...this.calculateChildrenOnlyShares(unit));
      } else {
        // Section 39: No Spouse or Children
        distributions.push(...this.calculateExtendedFamilyShares());
      }
    }

    // Validate total shares equal 100%
    const totalShares = distributions.reduce((sum, dist) => sum + dist.sharePercentage, 0);
    if (Math.abs(totalShares - 100) > 0.01) {
      warnings.push(`Total shares (${totalShares}%) do not equal 100%. Adjustments may be needed.`);
    }

    return {
      distributions,
      summary: {
        totalShares,
        spouseLifeInterest: distributions.some((d) => d.shareType === 'LIFE_INTEREST'),
        minorChildren: hasMinorChildren,
        polygamous: isPolygamous,
      },
      warnings,
    };
  }

  /**
   * Polygamous succession calculation (Section 40)
   */
  private calculatePolygamousShares(
    houses: FamilyUnit[],
    personalEffectsValue: number,
  ): { distributions: DistributionResult[]; warnings: string[] } {
    const distributions: DistributionResult[] = [];
    const warnings: string[] = [];

    // Calculate total units in the system
    let totalUnits = 0;
    houses.forEach((house) => {
      // Each wife counts as 1 unit, each child counts as 1 unit
      totalUnits += (house.spouseId ? 1 : 0) + house.childrenIds.length;
    });

    if (totalUnits === 0) {
      throw new Error('No family members found in polygamous calculation');
    }

    const percentagePerUnit = 100 / totalUnits;

    // Distribute personal effects to spouses equally
    if (personalEffectsValue > 0) {
      const spouseCount = houses.filter((h) => h.spouseId).length;
      houses.forEach((house) => {
        if (house.spouseId) {
          distributions.push({
            beneficiaryId: house.spouseId,
            beneficiaryName: house.spouseName,
            sharePercentage: 0, // Special handling for personal effects
            shareType: 'PERSONAL_EFFECTS',
            relationship: 'SPOUSE',
            notes: `Equal share of personal effects (KES ${(personalEffectsValue / spouseCount).toLocaleString()})`,
          });
        }
      });
    }

    // Distribute residue
    houses.forEach((house) => {
      // Wife's share (life interest)
      if (house.spouseId) {
        distributions.push({
          beneficiaryId: house.spouseId,
          beneficiaryName: house.spouseName,
          sharePercentage: percentagePerUnit,
          shareType: 'LIFE_INTEREST',
          relationship: 'SPOUSE',
          conditions: ['Life interest terminates upon remarriage or death'],
          notes: `Polygamous spouse share (${percentagePerUnit.toFixed(2)}%)`,
        });
      }

      // Children's shares (absolute interest, contingent if minors)
      house.childrenIds.forEach((childId) => {
        const age = house.childrenAges[childId] || 0;
        distributions.push({
          beneficiaryId: childId,
          sharePercentage: percentagePerUnit,
          shareType: age < this.MAJORITY_AGE ? 'CONTINGENT_INTEREST' : 'ABSOLUTE_INTEREST',
          relationship: 'CHILD',
          conditions: age < this.MAJORITY_AGE ? [`Vesting at age ${this.MAJORITY_AGE}`] : undefined,
          notes: `Polygamous child share (${percentagePerUnit.toFixed(2)}%)`,
        });
      });
    });

    warnings.push(
      'Polygamous succession requires careful management of multiple household interests',
    );

    return { distributions, warnings };
  }

  /**
   * Spouse and children shares (Section 35)
   */
  private calculateSpouseChildrenShares(
    unit: FamilyUnit,
    personalEffectsValue: number,
  ): DistributionResult[] {
    const distributions: DistributionResult[] = [];
    const hasMinorChildren = Object.values(unit.childrenAges).some(
      (age) => age < this.MAJORITY_AGE,
    );

    // Spouse gets personal effects absolutely
    if (unit.spouseId && personalEffectsValue > 0) {
      distributions.push({
        beneficiaryId: unit.spouseId,
        beneficiaryName: unit.spouseName,
        sharePercentage: 0, // Special handling
        shareType: 'PERSONAL_EFFECTS',
        relationship: 'SPOUSE',
        notes: `Personal effects (KES ${personalEffectsValue.toLocaleString()})`,
      });
    }

    // Spouse gets life interest in residue
    if (unit.spouseId) {
      distributions.push({
        beneficiaryId: unit.spouseId,
        beneficiaryName: unit.spouseName,
        sharePercentage: 100, // Life interest in entire residue
        shareType: 'LIFE_INTEREST',
        relationship: 'SPOUSE',
        conditions: [
          'Life interest in entire residue',
          'Terminates upon remarriage or death',
          hasMinorChildren ? `Until youngest child reaches age ${this.MAJORITY_AGE}` : undefined,
        ].filter(Boolean) as string[],
      });
    }

    // Children get absolute interest in residue (contingent if minors)
    unit.childrenIds.forEach((childId) => {
      const age = unit.childrenAges[childId] || 0;
      const share = 100 / unit.childrenIds.length;

      distributions.push({
        beneficiaryId: childId,
        sharePercentage: share,
        shareType: age < this.MAJORITY_AGE ? 'CONTINGENT_INTEREST' : 'ABSOLUTE_INTEREST',
        relationship: 'CHILD',
        conditions: age < this.MAJORITY_AGE ? [`Vesting at age ${this.MAJORITY_AGE}`] : undefined,
        notes: `Child's absolute share (${share.toFixed(2)}%)`,
      });
    });

    return distributions;
  }

  /**
   * Spouse only shares (Section 36)
   */
  private calculateSpouseOnlyShares(
    unit: FamilyUnit,
    personalEffectsValue: number,
  ): DistributionResult[] {
    return [
      {
        beneficiaryId: unit.spouseId!,
        beneficiaryName: unit.spouseName,
        sharePercentage: 100,
        shareType: 'ABSOLUTE_INTEREST',
        relationship: 'SPOUSE',
        notes: `Entire estate including personal effects (KES ${personalEffectsValue.toLocaleString()})`,
      },
    ];
  }

  /**
   * Children only shares (Section 38)
   */
  private calculateChildrenOnlyShares(unit: FamilyUnit): DistributionResult[] {
    return unit.childrenIds.map((childId) => {
      const age = unit.childrenAges[childId] || 0;
      const share = 100 / unit.childrenIds.length;

      return {
        beneficiaryId: childId,
        sharePercentage: share,
        shareType: age < this.MAJORITY_AGE ? 'CONTINGENT_INTEREST' : 'ABSOLUTE_INTEREST',
        relationship: 'CHILD',
        conditions: age < this.MAJORITY_AGE ? [`Vesting at age ${this.MAJORITY_AGE}`] : undefined,
        notes: `Equal child share (${share.toFixed(2)}%)`,
      };
    });
  }

  /**
   * Extended family shares (Section 39)
   */
  private calculateExtendedFamilyShares(): DistributionResult[] {
    // This would involve more complex family tree analysis
    // For now, return empty with note
    return [
      {
        beneficiaryId: 'EXTENDED_FAMILY',
        sharePercentage: 100,
        shareType: 'ABSOLUTE_INTEREST',
        relationship: 'EXTENDED_FAMILY',
        notes: 'Requires detailed family tree analysis per Sections 39-42',
      },
    ];
  }

  /**
   * Validates if distribution plan is compliant
   */
  validateDistributionPlan(
    distributions: DistributionResult[],
    familyStructure: { hasSpouse: boolean; childCount: number; isPolygamous: boolean },
  ): { valid: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const { hasSpouse, childCount } = familyStructure;

    // Check total shares
    const totalShares = distributions.reduce((sum, dist) => sum + dist.sharePercentage, 0);
    if (Math.abs(totalShares - 100) > 0.01) {
      issues.push(`Total shares equal ${totalShares}%, must equal 100%`);
    }

    // Check spouse entitlement
    if (hasSpouse) {
      const spouseDistributions = distributions.filter((d) => d.relationship === 'SPOUSE');
      if (spouseDistributions.length === 0) {
        issues.push('Spouse not included in distribution');
      }
    }

    // Check child entitlement
    if (childCount > 0) {
      const childDistributions = distributions.filter((d) => d.relationship === 'CHILD');
      if (childDistributions.length !== childCount) {
        issues.push(
          `Not all children included in distribution (${childDistributions.length}/${childCount})`,
        );
      }
    }

    // Check for minors
    const minorDistributions = distributions.filter((d) =>
      d.conditions?.some((c) => c.includes('Vesting at age')),
    );
    if (minorDistributions.length > 0) {
      recommendations.push(
        `Establish testamentary trust for ${minorDistributions.length} minor beneficiaries`,
      );
    }

    // Check life interest conditions
    const lifeInterestDistributions = distributions.filter((d) => d.shareType === 'LIFE_INTEREST');
    if (lifeInterestDistributions.length > 0) {
      recommendations.push('Ensure life interest is properly documented and managed');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Calculates maintenance amounts for dependants during administration
   */
  calculateDependantMaintenance(
    distributions: DistributionResult[],
    estateValue: number,
    dependants: { id: string; age: number; relationship: string; needs: string[] }[],
  ): { dependantId: string; monthlyAmount: number; durationMonths: number }[] {
    const maintenance: { dependantId: string; monthlyAmount: number; durationMonths: number }[] =
      [];

    dependants.forEach((dependant) => {
      if (dependant.age < this.MAJORITY_AGE) {
        // Calculate maintenance until majority
        const yearsUntilMajority = this.MAJORITY_AGE - dependant.age;
        const monthlyAmount = this.calculateMonthlyMaintenance(estateValue, dependant.needs);

        maintenance.push({
          dependantId: dependant.id,
          monthlyAmount,
          durationMonths: yearsUntilMajority * 12,
        });
      }
    });

    return maintenance;
  }

  private calculateMonthlyMaintenance(estateValue: number, needs: string[]): number {
    const baseAmount = estateValue * 0.01; // 1% of estate value as annual maintenance
    const monthlyBase = baseAmount / 12;

    // Adjust for special needs
    let adjustment = 1.0;
    if (needs.includes('MEDICAL')) adjustment += 0.5;
    if (needs.includes('EDUCATION')) adjustment += 0.3;
    if (needs.includes('SPECIAL_CARE')) adjustment += 0.7;

    return Math.min(monthlyBase * adjustment, 100000); // Cap at KES 100,000 per month
  }
}
