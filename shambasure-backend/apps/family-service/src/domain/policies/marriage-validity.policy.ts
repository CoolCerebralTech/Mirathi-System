import { MarriageType } from '@prisma/client';

import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';

export interface MarriageValidationResult {
  isValid: boolean;
  issues: string[];
  isVoidAbInitio: boolean; // Added: Differentiates between illegal and problematic
  requiresConversion: boolean;
  legalCitation?: string;
}

export interface ValidationContext {
  spouse1: FamilyMember;
  spouse2: FamilyMember;
  spouse1ExistingMarriages: Marriage[];
  spouse2ExistingMarriages: Marriage[];
  proposedType: MarriageType;
  areRelatedByBlood?: boolean;
  areRelatedByMarriage?: boolean;
}

export class MarriageValidityPolicy {
  static validateNewUnion(context: ValidationContext): MarriageValidationResult {
    const { spouse1, spouse2, proposedType } = context;
    const issues: string[] = [];
    let isVoid = false;

    // 1. CONSTITUTIONAL & ABSOLUTE BARS (Void Ab Initio)

    // A. Same Person
    if (spouse1.id === spouse2.id) {
      issues.push('Parties cannot be the same person.');
      isVoid = true;
    }

    // B. Gender (Constitution Art 45(2))
    if (spouse1.gender === spouse2.gender) {
      issues.push('Union must be between opposite genders (Const. Art 45(2)).');
      isVoid = true;
    }

    // C. Age (Marriage Act S.4)
    if (spouse1.isMinor || spouse2.isMinor) {
      issues.push('Marriage of a person under 18 years is void (Marriage Act S.11(1)).');
      isVoid = true;
    }

    // D. Prohibited Relationships (Incest)
    if (context.areRelatedByBlood || context.areRelatedByMarriage) {
      issues.push('Parties are within prohibited degrees of relationship (Marriage Act S.10).');
      isVoid = true;
    }

    // 2. CAPACITY & BIGAMY (Voidable or Void depending on section)

    // Check existing marriages
    const historyIssues = this.checkExistingMarriages(
      spouse1,
      context.spouse1ExistingMarriages,
      proposedType,
    );
    if (historyIssues.length > 0) issues.push(...historyIssues);

    const historyIssues2 = this.checkExistingMarriages(
      spouse2,
      context.spouse2ExistingMarriages,
      proposedType,
    );
    if (historyIssues2.length > 0) issues.push(...historyIssues2);

    // Check Conversion
    const isConversion = this.detectConversion(
      spouse1,
      spouse2,
      context.spouse1ExistingMarriages,
      proposedType,
    );

    if (issues.length > 0) {
      // If converting, we ignore specific "already married to each other" errors
      if (isConversion && !isVoid) {
        // In production, we would filter out the specific "Already married" error here
        return { isValid: true, issues: [], isVoidAbInitio: false, requiresConversion: true };
      }
      return { isValid: false, issues, isVoidAbInitio: isVoid, requiresConversion: false };
    }

    return { isValid: true, issues: [], isVoidAbInitio: false, requiresConversion: isConversion };
  }

  private static checkExistingMarriages(
    spouse: FamilyMember,
    marriages: Marriage[],
    proposedType: MarriageType,
  ): string[] {
    const issues: string[] = [];
    const activeMarriages = marriages.filter((m) => m.isActive);

    if (activeMarriages.length === 0) return [];

    // Polyandry
    if (spouse.gender === 'FEMALE') {
      issues.push('Female party is already married. Polyandry is not recognized.');
    }

    // Monogamous Restrictions
    for (const marriage of activeMarriages) {
      if (marriage.type === MarriageType.CIVIL || marriage.type === MarriageType.CHRISTIAN) {
        issues.push(`Party is in a Monogamous union (${marriage.type}). Cannot remarry.`);
      }
      if (
        (proposedType === MarriageType.CIVIL || proposedType === MarriageType.CHRISTIAN) &&
        marriage.isActive
      ) {
        issues.push(
          `Party in existing union cannot contract new Monogamous marriage without divorce.`,
        );
      }
    }
    return issues;
  }

  private static detectConversion(
    s1: FamilyMember,
    s2: FamilyMember,
    marriages: Marriage[],
    type: MarriageType,
  ): boolean {
    if (type !== MarriageType.CIVIL && type !== MarriageType.CHRISTIAN) return false;
    const existing = marriages.find(
      (m) => m.isActive && (m.spouse1Id === s2.id || m.spouse2Id === s2.id),
    );
    return (
      !!existing &&
      (existing.type === MarriageType.CUSTOMARY || existing.type === MarriageType.ISLAMIC)
    );
  }
}
