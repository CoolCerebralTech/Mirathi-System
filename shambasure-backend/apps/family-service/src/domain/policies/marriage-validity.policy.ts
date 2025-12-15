// domain/policies/marriage-validity.policy.ts
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage, MarriageType } from '../entities/marriage.entity';
import { AgeCalculator } from '../utils/age-calculator';
import { RelationshipType } from '../value-objects/legal/relationship-type.vo';

export interface MarriageValidationResult {
  isValid: boolean;
  issues: string[];
  requiresConversion: boolean;
}

export class MarriageValidityPolicy {
  /**
   * Validates if a proposed marriage is legal under the Marriage Act 2014.
   */
  static validateNewUnion(
    spouse1: FamilyMember,
    spouse2: FamilyMember,
    spouse1ExistingMarriages: Marriage[],
    spouse2ExistingMarriages: Marriage[],
    proposedType: MarriageType,
  ): MarriageValidationResult {
    const issues: string[] = [];

    // 1. Age Check (Strict 18+ requirement in Kenya)
    if (spouse1.isMinor || spouse2.isMinor) {
      issues.push('Both parties must be at least 18 years old.');
    }

    // 2. Identity Check
    if (spouse1.id === spouse2.id) {
      issues.push('Parties cannot be the same person.');
    }
    if (spouse1.gender === spouse2.gender) {
      // Current Kenyan Law (Constitution Art 45) recognizes opposite-sex marriage
      issues.push('Union must be between opposite genders under current Kenyan Law.');
    }

    // 3. Mental Capacity
    if (spouse1.requiresSupportedDecisionMaking || spouse2.requiresSupportedDecisionMaking) {
      issues.push('One or both parties lack capacity to consent due to mental status.');
    }

    // 4. Bigamy & Monogamy Checks
    // Check Spouse 1
    const s1Issue = this.checkExistingMarriages(spouse1ExistingMarriages, proposedType, 'Spouse 1');
    if (s1Issue) issues.push(s1Issue);

    // Check Spouse 2
    const s2Issue = this.checkExistingMarriages(spouse2ExistingMarriages, proposedType, 'Spouse 2');
    if (s2Issue) issues.push(s2Issue);

    // 5. Prohibited Degrees (Consanguinity)
    // Note: Deep relationship check is done via FamilyTreeBuilder in services.
    // This policy assumes the inputs provided are the direct entities.

    return {
      isValid: issues.length === 0,
      issues,
      requiresConversion: false, // Handled in specific conversion logic
    };
  }

  /**
   * Helper to check existing marriages against the regime.
   * - Civil/Christian = Monogamous (Cannot marry again while active).
   * - Customary/Islamic = Potentially Polygamous (Can marry again, but ONLY Customary/Islamic).
   */
  private static checkExistingMarriages(
    marriages: Marriage[],
    proposedType: MarriageType,
    spouseLabel: string,
  ): string | null {
    const activeMarriages = marriages.filter((m) => m.isActive);

    for (const marriage of activeMarriages) {
      // Scenario A: Existing Monogamous Marriage
      if (marriage.type === MarriageType.CIVIL || marriage.type === MarriageType.CHRISTIAN) {
        return `${spouseLabel} is already in a Monogamous union (${marriage.type}). Must divorce before remarriage.`;
      }

      // Scenario B: Existing Polygamous Marriage, trying to marry Monogamous
      if (proposedType === MarriageType.CIVIL || proposedType === MarriageType.CHRISTIAN) {
        return `${spouseLabel} is in a potentially polygamous union. Cannot contract a Monogamous marriage without prior conversion/divorce.`;
      }

      // Scenario C: Islamic Limitations
      if (marriage.type === MarriageType.ISLAMIC && activeMarriages.length >= 4) {
        return `${spouseLabel} has reached the maximum of 4 wives under Islamic Law.`;
      }
    }

    return null;
  }
}
