import { Injectable } from '@nestjs/common';
import type { FamilyMember } from '../entities/family-member.entity';
import { GuardianType } from '@prisma/client';

@Injectable()
export class GuardianEligibilityPolicy {
  /**
   * Determines if a proposed guardian is legally eligible to act for a ward.
   * Performs checks: age, self-guardianship, vital status, and ward eligibility.
   */
  checkGuardianEligibility(
    guardian: FamilyMember,
    ward: FamilyMember,
    guardianType: string,
  ): {
    isEligible: boolean;
    reason?: string;
    restrictions: string[];
  } {
    const restrictions: string[] = [];

    // Financial guardianship allows non-minor wards
    if (guardianType === 'FINANCIAL_GUARDIAN' && !ward.getIsMinor()) {
      restrictions.push('Financial decisions only - ward is an adult');
      return { isEligible: true, restrictions };
    }

    // Cannot be own guardian
    if (guardian.getId() === ward.getId()) {
      return {
        isEligible: false,
        reason: 'Cannot be own guardian.',
        restrictions: [],
      };
    }

    // Guardian must be alive
    if (guardian.getIsDeceased()) {
      return {
        isEligible: false,
        reason: 'Guardian cannot be deceased.',
        restrictions: [],
      };
    }

    // Ward must be minor (under 18) for most guardianship types
    if (!ward.getIsMinor() && guardianType !== 'FINANCIAL_GUARDIAN') {
      return {
        isEligible: false,
        reason: 'Ward is not a minor. Guardianship applies only to children under 18.',
        restrictions: [],
      };
    }

    // Guardian must be an adult
    if (guardian.getIsMinor()) {
      return {
        isEligible: false,
        reason: 'Guardian must be an adult (18 years or older).',
        restrictions: [],
      };
    }

    // Age appropriateness check
    const guardianAge = guardian.getAge();
    const wardAge = ward.getAge();

    if (guardianAge !== null && wardAge !== null) {
      const ageDifference = guardianAge - wardAge;
      if (ageDifference < 18) {
        restrictions.push(
          'Guardian is close in age to ward - court may require additional scrutiny',
        );
      }
    }

    // Disability considerations
    if (ward.getMetadata().disabilityStatus !== 'NONE') {
      restrictions.push(
        'Ward has special needs - guardian must be prepared for additional responsibilities',
      );
    }

    return { isEligible: true, restrictions };
  }

  /**
   * Legacy method for backward compatibility
   */
  checkEligibility(
    guardian: FamilyMember,
    ward: FamilyMember,
    type?: GuardianType,
  ): { isEligible: boolean; reason?: string } {
    const result = this.checkGuardianEligibility(guardian, ward, type || 'LEGAL_GUARDIAN');
    return {
      isEligible: result.isEligible,
      reason: result.reason,
    };
  }
}
