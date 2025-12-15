// domain/policies/marriage-validity.policy.ts
import { MarriageType } from '@prisma/client';

import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';

export interface MarriageValidationResult {
  isValid: boolean;
  issues: string[];
  requiresConversion: boolean; // E.g., Converting Customary to Christian
  legalCitation?: string;
}

export interface ValidationContext {
  spouse1: FamilyMember;
  spouse2: FamilyMember;
  spouse1ExistingMarriages: Marriage[];
  spouse2ExistingMarriages: Marriage[];
  proposedType: MarriageType;
  areRelatedByBlood?: boolean; // S.10 Consanguinity check
  areRelatedByMarriage?: boolean; // S.10 Affinity check
}

export class MarriageValidityPolicy {
  /**
   * Validates if a proposed marriage is legal under the Marriage Act 2014.
   */
  static validateNewUnion(context: ValidationContext): MarriageValidationResult {
    const { spouse1, spouse2, proposedType } = context;
    const issues: string[] = [];

    // =========================================================================
    // 1. FUNDAMENTAL CAPACITIES
    // =========================================================================

    // A. Identity & Gender
    if (spouse1.id === spouse2.id) {
      return this.fail(['Parties cannot be the same person.']);
    }

    if (spouse1.gender === spouse2.gender) {
      return this.fail(
        ['Union must be between opposite genders under current Kenyan Law.'],
        'Constitution of Kenya 2010, Article 45(2)',
      );
    }

    // B. Age (Marriage Act S.4 - Void if under 18)
    if (spouse1.isMinor || spouse2.isMinor) {
      issues.push(`Minimum legal age for marriage is 18.`);
    }

    // C. Mental Capacity
    if (spouse1.requiresSupportedDecisionMaking || spouse2.requiresSupportedDecisionMaking) {
      issues.push('One or both parties lack capacity to consent due to mental status.');
    }

    // D. Prohibited Relationships
    if (context.areRelatedByBlood) {
      issues.push('Parties are within prohibited degrees of consanguinity (Blood Relation).');
    }

    // =========================================================================
    // 2. BIGAMY & REGIME CHECKS (Sections 6-9)
    // =========================================================================

    // Validate Spouse 1
    issues.push(
      ...this.checkExistingMarriages(spouse1, context.spouse1ExistingMarriages, proposedType),
    );

    // Validate Spouse 2
    issues.push(
      ...this.checkExistingMarriages(spouse2, context.spouse2ExistingMarriages, proposedType),
    );

    // Check for "Conversion" (S.9) - e.g., Couple converting Customary -> Christian
    const isConversion = this.detectConversion(
      spouse1,
      spouse2,
      context.spouse1ExistingMarriages,
      proposedType,
    );

    if (issues.length > 0) {
      // If it's a valid conversion, ignore "Existing Marriage" errors specific to the couple themselves
      if (isConversion) {
        // Filter out errors related to the partner being married to each other
        // (Simplified logic: In a real system, we'd check if the error is about *this* specific partner)
        // For now, if issues exist, we return them unless we build specific waiver logic.
        return { isValid: false, issues, requiresConversion: false };
      }
      return { isValid: false, issues, requiresConversion: false };
    }

    return {
      isValid: true,
      issues: [],
      requiresConversion: isConversion,
    };
  }

  /**
   * Checks a spouse's ability to contract a new marriage based on history.
   */
  private static checkExistingMarriages(
    spouse: FamilyMember,
    marriages: Marriage[],
    proposedType: MarriageType,
  ): string[] {
    const issues: string[] = [];

    // FILTER: Only look at Active marriages
    const activeMarriages = marriages.filter((m) => m.isActive);

    if (activeMarriages.length === 0) {
      return [];
    }

    // RULE 1: Polyandry Check (Women cannot have > 1 husband)
    if (spouse.gender === 'FEMALE' && activeMarriages.length > 0) {
      issues.push('Female party is already married. Polyandry is not recognized.');
      return issues;
    }

    // RULE 2: Regime Compatibility (Men)
    for (const marriage of activeMarriages) {
      // A. Existing Monogamous Union
      if (
        marriage.type === MarriageType.CIVIL ||
        marriage.type === MarriageType.CHRISTIAN
        //marriage.type === MarriageType.HINDU
      ) {
        issues.push(
          `Party is already in a Monogamous union (${marriage.type}). Must divorce before remarriage.`,
        );
        return issues;
      }

      // B. Existing Potentially Polygamous Union
      // Can marry again, BUT cannot switch to Monogamous (Civil/Christian) without divorce/conversion
      if (proposedType === MarriageType.CIVIL || proposedType === MarriageType.CHRISTIAN) {
        issues.push(
          `Party is in a potentially polygamous union (${marriage.type}). Cannot contract a Monogamous marriage without prior divorce or conversion.`,
        );
      }

      // C. Islamic Limit (4 Wives)
      if (marriage.type === MarriageType.ISLAMIC && activeMarriages.length >= 4) {
        issues.push('Party has reached the maximum of 4 wives allowed under Islamic Law.');
      }
    }

    return issues;
  }

  /**
   * Detects if the couple is ALREADY married to EACH OTHER and wants to convert.
   */
  private static detectConversion(
    spouse1: FamilyMember,
    spouse2: FamilyMember,
    s1Marriages: Marriage[],
    proposedType: MarriageType,
  ): boolean {
    // Conversion is only relevant if moving TO Monogamous
    if (proposedType !== MarriageType.CIVIL && proposedType !== MarriageType.CHRISTIAN) {
      return false;
    }

    // Find existing marriage between these two
    const existingUnion = s1Marriages.find(
      (m) => m.isActive && (m.spouse1Id === spouse2.id || m.spouse2Id === spouse2.id),
    );

    if (existingUnion) {
      // Allow conversion only from Customary or Islamic
      return (
        existingUnion.type === MarriageType.CUSTOMARY || existingUnion.type === MarriageType.ISLAMIC
      );
    }

    return false;
  }

  private static fail(issues: string[], citation?: string): MarriageValidationResult {
    return {
      isValid: false,
      issues,
      requiresConversion: false,
      legalCitation: citation,
    };
  }
}
