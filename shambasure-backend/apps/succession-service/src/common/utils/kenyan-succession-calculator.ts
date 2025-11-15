import { Injectable } from '@nestjs/common';
import { legalRulesConfig } from '../config/legal-rules.config';

export interface Dependant {
  id?: string;
  relationship: string;
  name?: string;
}

export interface Deceased {
  id?: string;
  name?: string;
}

export interface Beneficiary {
  id?: string;
  shareValue?: number;
}

export interface Will {
  beneficiaries?: Beneficiary[];
}

export interface IntestateDistribution {
  spouse: {
    personalEffects: number;
    lifeInterest: number;
    absoluteInterest?: number;
  };
  children: {
    absoluteInterest: number;
    perChildShare?: number;
  };
  otherHeirs?: {
    [relationship: string]: number;
  };
}

export interface DistributionPlan {
  totalEstate: number;
  distribution: IntestateDistribution;
  lawSection: string;
  notes: string[];
}

@Injectable()
export class KenyanSuccessionCalculator {
  private legalRules = legalRulesConfig();

  /**
   * Calculate intestate shares based on family structure and estate value
   */
  calculateIntestateShares(
    deceased: Deceased,
    estateValue: number,
    dependants: Dependant[],
  ): DistributionPlan {
    const spouses = dependants.filter((d) => d.relationship === 'SPOUSE');
    const children = dependants.filter((d) =>
      ['CHILD', 'ADOPTED_CHILD', 'STEPCHILD'].includes(d.relationship),
    );
    const otherDependants = dependants.filter(
      (d) => !['SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEPCHILD'].includes(d.relationship),
    );

    let distribution: IntestateDistribution;
    let lawSection: string;
    const notes: string[] = [];

    if (spouses.length === 1 && children.length > 0) {
      distribution = this.calculateOneSpouseWithChildren(estateValue);
      lawSection = '35';
      notes.push(
        'Surviving spouse gets personal and household effects plus life interest in remainder',
      );
      notes.push("Children get absolute interest in remainder upon spouse's death");
    } else if (spouses.length > 1 && children.length > 0) {
      distribution = this.calculateMultipleSpousesWithChildren(estateValue, spouses.length);
      lawSection = '36';
      notes.push(`Personal and household effects divided equally among ${spouses.length} spouses`);
      notes.push('Spouses share life interest in remainder, children get absolute interest');
    } else if (spouses.length > 0 && children.length === 0) {
      distribution = this.calculateSpouseOnly(estateValue, spouses.length);
      lawSection = '37';
      notes.push('Spouse gets entire estate if no children, parents, or siblings exist');
    } else if (spouses.length === 0 && children.length === 0) {
      distribution = this.calculateRelativesOnly(estateValue, otherDependants);
      lawSection = '39';
      notes.push(
        'Estate distributed to relatives in order of priority: parents, siblings, half-siblings, grandparents',
      );
    } else {
      throw new Error('Unable to calculate intestate succession for this family structure');
    }

    return { totalEstate: estateValue, distribution, lawSection, notes };
  }

  private calculateOneSpouseWithChildren(estateValue: number): IntestateDistribution {
    const personalEffects =
      estateValue * this.legalRules.intestateSuccession.oneSpouseWithChildren.spousePersonalEffects;
    const remainder = estateValue - personalEffects;
    return {
      spouse: { personalEffects, lifeInterest: remainder },
      children: { absoluteInterest: remainder },
    };
  }

  private calculateMultipleSpousesWithChildren(
    estateValue: number,
    spouseCount: number,
  ): IntestateDistribution {
    const rules = this.legalRules.intestateSuccession.multipleSpousesWithChildren;
    const personalEffects = estateValue * rules.spousePersonalEffects;
    const remainder = estateValue - personalEffects;
    return {
      spouse: {
        personalEffects: personalEffects / spouseCount,
        lifeInterest: remainder / spouseCount,
      },
      children: { absoluteInterest: remainder },
    };
  }

  private calculateSpouseOnly(estateValue: number, spouseCount: number): IntestateDistribution {
    const sharePerSpouse = estateValue / spouseCount;
    return {
      spouse: {
        personalEffects: sharePerSpouse * 0.5,
        lifeInterest: 0,
        absoluteInterest: sharePerSpouse,
      },
      children: { absoluteInterest: 0 },
    };
  }

  private calculateRelativesOnly(
    estateValue: number,
    relatives: Dependant[],
  ): IntestateDistribution {
    const sharePerRelative = estateValue / Math.max(relatives.length, 1);
    const otherHeirs: { [relationship: string]: number } = {};

    relatives.forEach((relative) => {
      if (relative.relationship) {
        otherHeirs[relative.relationship] = sharePerRelative;
      }
    });

    return {
      spouse: { personalEffects: 0, lifeInterest: 0 },
      children: { absoluteInterest: 0 },
      otherHeirs,
    };
  }

  /**
   * Calculate reasonable provision for dependants (Section 26-29)
   */
  calculateDependantsProvision(estateValue: number, dependants: Dependant[]): number {
    const rules = this.legalRules.dependantProvision.reasonableProvision;
    const base = estateValue * rules.basePercentage;
    const additional = estateValue * rules.additionalPerDependant * dependants.length;
    return Math.max(base + additional, rules.minimumAmount);
  }

  /**
   * Validate if will provides adequate provision to dependants
   */
  validateDependantsProvision(will: Will, estateValue: number, dependants: Dependant[]): boolean {
    const required = this.calculateDependantsProvision(estateValue, dependants);
    const actual = this.calculateActualProvision(will, dependants);
    return actual >= required;
  }

  private calculateActualProvision(will: Will, dependants: Dependant[]): number {
    let total = 0;
    dependants.forEach((dep) => {
      const beneficiary = will.beneficiaries?.find((b) => b.id === dep.id);
      if (beneficiary) {
        total += beneficiary.shareValue || 0;
      }
    });
    return total;
  }
}
