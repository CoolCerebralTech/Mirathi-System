import { RelationshipType, AssetType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

export interface Dependant {
  id: string;
  relationship: RelationshipType;
  isMinor: boolean;
  isSpouse: boolean;
  isDisabled: boolean;
  currentSupportLevel: 'FULL' | 'PARTIAL' | 'NONE';
}

export interface EstateContext {
  totalEstateValue: AssetValue;
  testatorAge: number;
  hasValidWill: boolean;
  dependants: Dependant[];
  provisionsMade: Array<{
    dependantId: string;
    provisionAmount: AssetValue;
    provisionType: 'CASH' | 'ASSET' | 'TRUST' | 'LIFE_INTEREST';
  }>;
}

export class DependantsProvisionPolicy {
  /**
   * Kenyan Law of Succession Act Section 26-30: Provision for dependants
   * The court may make reasonable provision for dependants if the will fails to do so
   */
  validateAdequateProvision(context: EstateContext): {
    isAdequate: boolean;
    shortfalls: Array<{ dependantId: string; recommendedMinimum: AssetValue; reason: string }>;
    recommendations: string[];
  } {
    const shortfalls: Array<{
      dependantId: string;
      recommendedMinimum: AssetValue;
      reason: string;
    }> = [];
    const recommendations: string[] = [];

    // Calculate minimum provisions per Kenyan law and best practices
    const minimumProvisions = this.calculateMinimumProvisions(context);

    for (const dependant of context.dependants) {
      const existingProvision = context.provisionsMade.find((p) => p.dependantId === dependant.id);
      const minimum = minimumProvisions.get(dependant.id);

      if (minimum && existingProvision) {
        const provisionAmount = existingProvision.provisionAmount.getAmount();
        const minimumAmount = minimum.amount.getAmount();

        if (provisionAmount < minimumAmount) {
          shortfalls.push({
            dependantId: dependant.id,
            recommendedMinimum: minimum.amount,
            reason: `Inadequate provision for ${this.getRelationshipLabel(dependant.relationship)}. Current: ${provisionAmount.toLocaleString()}, Minimum: ${minimumAmount.toLocaleString()}`,
          });
        }
      } else if (minimum && !existingProvision) {
        shortfalls.push({
          dependantId: dependant.id,
          recommendedMinimum: minimum.amount,
          reason: `No provision made for ${this.getRelationshipLabel(dependant.relationship)}`,
        });
      }
    }

    // Check for spouse's life interest in agricultural land (Kenyan customary law)
    const spouse = context.dependants.find((d) => d.isSpouse);
    if (spouse) {
      const hasLifeInterest = context.provisionsMade.some(
        (p) => p.dependantId === spouse.id && p.provisionType === 'LIFE_INTEREST',
      );

      if (!hasLifeInterest && this.hasAgriculturalLand(context)) {
        recommendations.push(
          'Consider granting life interest in agricultural land to surviving spouse as per Kenyan customary law',
        );
      }
    }

    // Check for minors' trust provisions
    const minors = context.dependants.filter((d) => d.isMinor);
    if (minors.length > 0) {
      const minorsWithTrusts = context.provisionsMade.filter(
        (p) => minors.some((m) => m.id === p.dependantId) && p.provisionType === 'TRUST',
      );

      if (minorsWithTrusts.length < minors.length) {
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

  /**
   * Calculate minimum reasonable provision for each dependant per Kenyan law
   */
  private calculateMinimumProvisions(
    context: EstateContext,
  ): Map<string, { amount: AssetValue; basis: string }> {
    const minimums = new Map<string, { amount: AssetValue; basis: string }>();
    const totalValue = context.totalEstateValue.getAmount();
    const currency = context.totalEstateValue.getCurrency();

    // Spouse gets priority - typically 20-50% of estate
    const spouse = context.dependants.find((d) => d.isSpouse);
    if (spouse) {
      let spouseShare = 0;
      let basis = '';

      if (context.hasValidWill) {
        // With will, spouse should get reasonable provision
        spouseShare = Math.max(totalValue * 0.2, 1000000); // 20% or 1M KES minimum
        basis = 'Minimum reasonable provision for spouse under Law of Succession Act';
      } else {
        // Intestate - spouse gets larger share
        const hasChildren = context.dependants.some(
          (d) => d.relationship === RelationshipType.CHILD,
        );
        if (hasChildren) {
          spouseShare = totalValue * 0.33; // 1/3 to spouse, 2/3 to children
          basis = 'Intestate succession: spouse share with children';
        } else {
          spouseShare = totalValue; // Entire estate to spouse if no children
          basis = 'Intestate succession: entire estate to spouse';
        }
      }

      minimums.set(spouse.id, {
        amount: new AssetValue(spouseShare, currency),
        basis,
      });
    }

    // Children provisions
    const children = context.dependants.filter(
      (d) =>
        d.relationship === RelationshipType.CHILD ||
        d.relationship === RelationshipType.ADOPTED_CHILD,
    );

    for (const child of children) {
      let childShare = 0;
      let basis = '';

      if (child.isMinor) {
        // Minors need education and maintenance funds
        childShare = Math.max(totalValue * 0.1, 500000); // 10% or 500K KES minimum per minor
        basis = 'Education and maintenance fund for minor child';
      } else if (child.isDisabled) {
        // Disabled children need lifetime support
        childShare = Math.max(totalValue * 0.15, 750000); // 15% or 750K KES minimum
        basis = 'Lifetime support for disabled child';
      } else {
        // Adult children - reasonable share
        childShare = totalValue * 0.08; // 8% per adult child
        basis = 'Reasonable provision for adult child';
      }

      // Adjust based on number of children
      if (children.length > 3) {
        childShare = childShare * (3 / children.length); // Cap at 3 children equivalent
      }

      minimums.set(child.id, {
        amount: new AssetValue(childShare, currency),
        basis,
      });
    }

    // Other dependants (parents, siblings who were dependent)
    const otherDependants = context.dependants.filter(
      (d) =>
        !d.isSpouse &&
        d.relationship !== RelationshipType.CHILD &&
        d.relationship !== RelationshipType.ADOPTED_CHILD &&
        d.currentSupportLevel !== 'NONE',
    );

    for (const dependant of otherDependants) {
      const share = totalValue * 0.05; // 5% for other dependants
      minimums.set(dependant.id, {
        amount: new AssetValue(share, currency),
        basis: `Support for dependent ${this.getRelationshipLabel(dependant.relationship)}`,
      });
    }

    return minimums;
  }

  private getRelationshipLabel(relationship: RelationshipType): string {
    const labels = {
      [RelationshipType.SPOUSE]: 'spouse',
      [RelationshipType.CHILD]: 'child',
      [RelationshipType.ADOPTED_CHILD]: 'adopted child',
      [RelationshipType.STEPCHILD]: 'stepchild',
      [RelationshipType.PARENT]: 'parent',
      [RelationshipType.SIBLING]: 'sibling',
      [RelationshipType.GRANDCHILD]: 'grandchild',
      [RelationshipType.OTHER]: 'dependant',
    };
    return labels[relationship] || 'dependant';
  }

  private hasAgriculturalLand(context: EstateContext): boolean {
    // In reality, we'd check the asset types in the estate
    // For now, return true if estate value suggests possible land ownership
    return context.totalEstateValue.getAmount() > 5000000; // 5M KES+ suggests land ownership
  }

  /**
   * Kenyan Law of Succession Act Section 29: Definition of dependants
   */
  static identifyDependants(familyMembers: any[], testatorAge: number): Dependant[] {
    const dependants: Dependant[] = [];

    for (const member of familyMembers) {
      let isDependant = false;
      let supportLevel: 'FULL' | 'PARTIAL' | 'NONE' = 'NONE';

      // Spouse is always a dependant
      if (member.relationship === RelationshipType.SPOUSE) {
        isDependant = true;
        supportLevel = 'FULL';
      }

      // Children under 18, or disabled, or in full-time education
      if (
        member.relationship === RelationshipType.CHILD ||
        member.relationship === RelationshipType.ADOPTED_CHILD
      ) {
        if (member.isMinor || member.isDisabled || member.isInEducation) {
          isDependant = true;
          supportLevel = 'FULL';
        } else if (member.age && member.age < 25 && member.isInEducation) {
          isDependant = true;
          supportLevel = 'PARTIAL';
        }
      }

      // Parents who were dependent on the testator
      if (member.relationship === RelationshipType.PARENT && member.wasDependent) {
        isDependant = true;
        supportLevel = member.dependencyLevel || 'PARTIAL';
      }

      // Other relatives who were actually dependent
      if (
        [RelationshipType.SIBLING, RelationshipType.GRANDCHILD].includes(member.relationship) &&
        member.wasDependent
      ) {
        isDependant = true;
        supportLevel = member.dependencyLevel || 'PARTIAL';
      }

      if (isDependant) {
        dependants.push({
          id: member.id,
          relationship: member.relationship,
          isMinor: member.isMinor || false,
          isSpouse: member.relationship === RelationshipType.SPOUSE,
          isDisabled: member.isDisabled || false,
          currentSupportLevel: supportLevel,
        });
      }
    }

    return dependants;
  }
}
