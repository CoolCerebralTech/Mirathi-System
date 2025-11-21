import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

@Injectable()
export class ProbateEligibilityPolicy {
  /**
   * Checks if a list of applicants is valid to hold the grant.
   */
  validateApplicants(
    applicants: { relationship: RelationshipType; isMinor: boolean }[],
    hasWill: boolean,
  ): { valid: boolean; error?: string } {
    // 1. Number of Applicants (Section 56)
    if (applicants.length > 4) {
      return { valid: false, error: 'Maximum 4 administrators allowed.' };
    }
    if (applicants.length < 1) {
      return { valid: false, error: 'At least one administrator required.' };
    }

    // 2. Minors (Section 56)
    const hasMinor = applicants.some((a) => a.isMinor);
    if (hasMinor) {
      return { valid: false, error: 'A minor cannot be an administrator.' };
    }

    // 3. Minority Interest (Section 58)
    // If the estate involves a continuing trust (e.g. for a minor beneficiary),
    // there MUST be at least 2 administrators (or a corporate trustee).
    // Note: This check usually requires knowing the Beneficiaries, handled in Service layer.

    return { valid: true };
  }

  /**
   * Calculates the "Priority Score" for Intestate Administration (Section 66).
   * Lower number = Higher priority.
   */
  getPriorityScore(relationship: RelationshipType): number {
    switch (relationship) {
      case 'SPOUSE':
        return 1;
      case 'CHILD':
        return 2; // Adult children
      case 'PARENT':
        return 3;
      case 'SIBLING':
        return 4;
      case 'HALF_SIBLING':
        return 5;
      case 'AUNT_UNCLE':
        return 6; // Up to 6th degree of consanguinity
      default:
        return 99;
    }
  }
}
