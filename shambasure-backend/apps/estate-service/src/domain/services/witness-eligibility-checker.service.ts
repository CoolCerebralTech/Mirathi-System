// domain/services/witness-eligibility-checker.service.ts
import { Will } from '../aggregates/will.aggregate';
import { WillWitness } from '../entities/will-witness.entity';
import {
  WitnessEligibility,
  WitnessEligibilityStatus,
} from '../value-objects/witness-eligibility.vo';

/**
 * Witness Eligibility Checker Service
 *
 * Purpose:
 * - Deep eligibility checking for will witnesses
 * - Section 11 LSA compliance verification
 * - Cross-checks with beneficiaries and executors
 * - Conflict of interest detection
 *
 * Kenyan Legal Context - Section 11 LSA:
 * "If any person who attests the execution of a will is at the time
 * of the execution thereof or at any time afterwards a beneficiary
 * under the will, the attestation shall be valid but the bequest to
 * that person shall be void"
 *
 * This is a DOMAIN SERVICE
 * - Pure business logic
 * - No infrastructure dependencies
 * - Stateless
 */

export interface EligibilityCheckResult {
  isEligible: boolean;
  status: WitnessEligibilityStatus;
  eligibility: WitnessEligibility;
  conflicts: EligibilityConflict[];
  warnings: string[];
  legalIssues: LegalIssue[];
}

export interface EligibilityConflict {
  type: ConflictType;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  legalBasis?: string;
  affectedParty?: string;
  resolution?: string;
}

export enum ConflictType {
  IS_BENEFICIARY = 'IS_BENEFICIARY',
  IS_SPOUSE = 'IS_SPOUSE',
  IS_EXECUTOR = 'IS_EXECUTOR',
  IS_MINOR = 'IS_MINOR',
  LACKS_CAPACITY = 'LACKS_CAPACITY',
  HAS_CRIMINAL_RECORD = 'HAS_CRIMINAL_RECORD',
  FAMILY_CONFLICT = 'FAMILY_CONFLICT',
  FINANCIAL_INTEREST = 'FINANCIAL_INTEREST',
}

export interface LegalIssue {
  section: string;
  description: string;
  consequence: string;
  canProceed: boolean;
}

export interface WitnessCandidate {
  userId?: string;
  nationalId?: string;
  fullName: string;
  dateOfBirth?: Date;
  relationshipToTestator?: string;
  isSpouseOfTestator?: boolean;
  hasCriminalRecord?: boolean;
  hasMentalCapacity?: boolean;
}

/**
 * WitnessEligibilityChecker
 *
 * Domain service for comprehensive witness eligibility checking
 */
export class WitnessEligibilityChecker {
  /**
   * Check if person can serve as witness for this will
   *
   * Performs comprehensive checks:
   * - Age verification (18+)
   * - Beneficiary conflict (Section 11 LSA)
   * - Spouse conflict
   * - Executor conflict (best practice)
   * - Mental capacity
   * - Criminal record
   * - Family conflicts of interest
   */
  public checkEligibility(candidate: WitnessCandidate, will: Will): EligibilityCheckResult {
    const conflicts: EligibilityConflict[] = [];
    const warnings: string[] = [];
    const legalIssues: LegalIssue[] = [];

    // 1. Age check (CRITICAL - Legal requirement)
    const ageCheck = this.checkAge(candidate);
    if (!ageCheck.eligible) {
      conflicts.push(ageCheck.conflict!);
    }

    // 2. Beneficiary check (CRITICAL - Section 11 LSA)
    const beneficiaryCheck = this.checkBeneficiaryConflict(candidate, will);
    if (beneficiaryCheck.hasConflict) {
      conflicts.push(beneficiaryCheck.conflict!);
      legalIssues.push({
        section: 'Section 11 LSA',
        description: 'Witness is also a beneficiary',
        consequence: 'Witness loses their bequest (bequest void)',
        canProceed: false,
      });
    }

    // 3. Spouse check (CRITICAL - Legal requirement)
    if (candidate.isSpouseOfTestator) {
      conflicts.push({
        type: ConflictType.IS_SPOUSE,
        description: 'Spouse of testator cannot be witness',
        severity: 'CRITICAL',
        legalBasis: 'Section 11 LSA',
        resolution: 'Choose different witness (non-spouse)',
      });
      legalIssues.push({
        section: 'Section 11 LSA',
        description: 'Witness is spouse of testator',
        consequence: 'Will may be invalidated',
        canProceed: false,
      });
    }

    // 4. Mental capacity check (CRITICAL)
    if (candidate.hasMentalCapacity === false) {
      conflicts.push({
        type: ConflictType.LACKS_CAPACITY,
        description: 'Witness lacks mental capacity',
        severity: 'CRITICAL',
        legalBasis: 'Common law requirement',
        resolution: 'Choose witness with mental capacity',
      });
    }

    // 5. Criminal record check (HIGH)
    if (candidate.hasCriminalRecord) {
      conflicts.push({
        type: ConflictType.HAS_CRIMINAL_RECORD,
        description: 'Witness has criminal record (fraud/forgery)',
        severity: 'HIGH',
        legalBasis: 'Best practice',
        resolution: 'Consider different witness',
      });
      warnings.push('Witness with fraud conviction may reduce will credibility');
    }

    // 6. Executor check (MEDIUM - Best practice, not law)
    const executorCheck = this.checkExecutorConflict(candidate, will);
    if (executorCheck.hasConflict) {
      conflicts.push({
        type: ConflictType.IS_EXECUTOR,
        description: 'Witness is also nominated as executor',
        severity: 'MEDIUM',
        legalBasis: 'Best practice (not illegal)',
        resolution: 'Consider separate witnesses and executors',
      });
      warnings.push('Executor witnessing is legal but discouraged - may complicate probate');
    }

    // 7. Family relationship check (LOW - Best practice)
    const familyCheck = this.checkFamilyConflict(candidate, will);
    if (familyCheck.hasConflict) {
      conflicts.push(familyCheck.conflict!);
      warnings.push('Close family member as witness may raise questions of undue influence');
    }

    // Determine overall eligibility
    const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL');
    const isEligible = criticalConflicts.length === 0;

    // Create eligibility value object
    const eligibility = this.createEligibilityVO(candidate, conflicts, isEligible);

    return {
      isEligible,
      status: eligibility.getStatus(),
      eligibility,
      conflicts,
      warnings,
      legalIssues,
    };
  }

  /**
   * Check if existing witness is still eligible after will modifications
   *
   * Use case: User adds beneficiary who is already a witness
   */
  public recheckWitnessAfterModification(witness: WillWitness, will: Will): EligibilityCheckResult {
    const candidate: WitnessCandidate = {
      userId: witness.userId,
      nationalId: witness.nationalId,
      fullName: witness.fullName,
      isSpouseOfTestator: false, // Assume checked during initial add
      hasCriminalRecord: false,
      hasMentalCapacity: true,
    };

    return this.checkEligibility(candidate, will);
  }

  /**
   * Get recommended witness types for this will
   *
   * Based on will type and testator circumstances
   */
  public getRecommendedWitnessTypes(will: Will): string[] {
    const recommendations: string[] = [];

    // Standard recommendation
    recommendations.push('Two independent adults (18+) not mentioned in will');

    // Additional recommendations based on will type
    if (will.type.requiresNotarization()) {
      recommendations.push('Notary public or professional witness');
    }

    if (will.type.isJoint() || will.type.isMutual()) {
      recommendations.push('Three witnesses recommended (one extra for joint wills)');
    }

    // If high-value estate
    const beneficiaries = will.getActiveBeneficiaries();
    if (beneficiaries.length > 5) {
      recommendations.push('Professional witness (lawyer/notary) recommended for complex estates');
    }

    // If disinheritance present
    const disinheritance = will.disinheritanceRecords.filter((d) => d.isActive());
    if (disinheritance.length > 0) {
      recommendations.push('Professional witness recommended when disinheriting family members');
      recommendations.push('Consider video recording of signing ceremony');
    }

    return recommendations;
  }

  // =========================================================================
  // PRIVATE CHECK METHODS
  // =========================================================================

  private checkAge(candidate: WitnessCandidate): {
    eligible: boolean;
    conflict?: EligibilityConflict;
  } {
    if (!candidate.dateOfBirth) {
      return {
        eligible: false,
        conflict: {
          type: ConflictType.IS_MINOR,
          description: 'Cannot verify age - date of birth required',
          severity: 'CRITICAL',
          legalBasis: 'Must be 18+ to witness',
          resolution: 'Provide date of birth for verification',
        },
      };
    }

    const age = this.calculateAge(candidate.dateOfBirth);
    if (age < 18) {
      return {
        eligible: false,
        conflict: {
          type: ConflictType.IS_MINOR,
          description: `Witness is ${age} years old (must be 18+)`,
          severity: 'CRITICAL',
          legalBasis: 'Legal age requirement',
          resolution: 'Choose adult witness (18+)',
        },
      };
    }

    return { eligible: true };
  }

  private checkBeneficiaryConflict(
    candidate: WitnessCandidate,
    will: Will,
  ): { hasConflict: boolean; conflict?: EligibilityConflict } {
    const beneficiaries = will.getActiveBeneficiaries();

    // Check by user ID
    if (candidate.userId) {
      const isBeneficiary = beneficiaries.some((b) => b.userId === candidate.userId);

      if (isBeneficiary) {
        return {
          hasConflict: true,
          conflict: {
            type: ConflictType.IS_BENEFICIARY,
            description: `${candidate.fullName} is named as beneficiary in this will`,
            severity: 'CRITICAL',
            legalBasis: 'Section 11 LSA',
            affectedParty: candidate.fullName,
            resolution:
              'Remove as beneficiary OR choose different witness. Beneficiary-witness loses their bequest.',
          },
        };
      }
    }

    // Check by national ID (external beneficiaries)
    if (candidate.nationalId) {
      const isBeneficiary = beneficiaries.some(
        (b) => b.externalNationalId === candidate.nationalId,
      );

      if (isBeneficiary) {
        return {
          hasConflict: true,
          conflict: {
            type: ConflictType.IS_BENEFICIARY,
            description: `${candidate.fullName} is named as beneficiary (external)`,
            severity: 'CRITICAL',
            legalBasis: 'Section 11 LSA',
            affectedParty: candidate.fullName,
            resolution: 'Choose different witness',
          },
        };
      }
    }

    return { hasConflict: false };
  }

  private checkExecutorConflict(
    candidate: WitnessCandidate,
    will: Will,
  ): { hasConflict: boolean; conflict?: EligibilityConflict } {
    const executors = will.executors;

    // Check by user ID
    if (candidate.userId) {
      const isExecutor = executors.some((e) => e.executorId === candidate.userId);

      if (isExecutor) {
        return {
          hasConflict: true,
          conflict: {
            type: ConflictType.IS_EXECUTOR,
            description: `${candidate.fullName} is nominated as executor`,
            severity: 'MEDIUM',
            legalBasis: 'Best practice (not illegal)',
            resolution: 'Consider separate witnesses and executors for clarity',
          },
        };
      }
    }

    // Check by national ID
    if (candidate.nationalId) {
      const isExecutor = executors.some((e) => e.nationalId === candidate.nationalId);

      if (isExecutor) {
        return {
          hasConflict: true,
          conflict: {
            type: ConflictType.IS_EXECUTOR,
            description: `${candidate.fullName} is nominated as executor`,
            severity: 'MEDIUM',
            legalBasis: 'Best practice (not illegal)',
            resolution: 'Legal but discouraged',
          },
        };
      }
    }

    return { hasConflict: false };
  }

  private checkFamilyConflict(
    candidate: WitnessCandidate,
    will: Will,
  ): { hasConflict: boolean; conflict?: EligibilityConflict } {
    // Check if close family member (child, parent, sibling)
    const closeRelationships = ['child', 'son', 'daughter', 'parent', 'sibling'];

    if (candidate.relationshipToTestator) {
      const relationship = candidate.relationshipToTestator.toLowerCase();
      const isCloseFamily = closeRelationships.some((rel) => relationship.includes(rel));

      if (isCloseFamily) {
        return {
          hasConflict: true,
          conflict: {
            type: ConflictType.FAMILY_CONFLICT,
            description: `${candidate.fullName} is ${candidate.relationshipToTestator} of testator`,
            severity: 'LOW',
            legalBasis: 'Best practice (not illegal)',
            resolution:
              'Legal but consider independent witness to avoid appearance of undue influence',
          },
        };
      }
    }

    return { hasConflict: false };
  }

  private createEligibilityVO(
    candidate: WitnessCandidate,
    conflicts: EligibilityConflict[],
    isEligible: boolean,
  ): WitnessEligibility {
    const isBeneficiary = conflicts.some((c) => c.type === ConflictType.IS_BENEFICIARY);
    const isSpouse = conflicts.some((c) => c.type === ConflictType.IS_SPOUSE);
    const isExecutor = conflicts.some((c) => c.type === ConflictType.IS_EXECUTOR);
    const hasCapacity =
      candidate.hasMentalCapacity !== false &&
      !conflicts.some((c) => c.type === ConflictType.LACKS_CAPACITY);
    const hasCriminalRecord = candidate.hasCriminalRecord ?? false;
    const hasConflictOfInterest = conflicts.some((c) => c.type === ConflictType.FAMILY_CONFLICT);

    return WitnessEligibility.create({
      dateOfBirth: candidate.dateOfBirth,
      isBeneficiary,
      isSpouseOfTestator: isSpouse,
      isExecutor,
      hasMentalCapacity: hasCapacity,
      hasCriminalRecord,
      hasConflictOfInterest,
      reason: isEligible
        ? 'Eligible to witness'
        : conflicts
            .filter((c) => c.severity === 'CRITICAL')
            .map((c) => c.description)
            .join('; '),
    });
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  // =========================================================================
  // BULK OPERATIONS
  // =========================================================================

  /**
   * Check eligibility for multiple candidates at once
   *
   * Useful for:
   * - Witness selection UI
   * - Bulk import
   * - Family member selection
   */
  public checkMultipleCandidates(
    candidates: WitnessCandidate[],
    will: Will,
  ): Map<string, EligibilityCheckResult> {
    const results = new Map<string, EligibilityCheckResult>();

    candidates.forEach((candidate) => {
      const key = candidate.userId ?? candidate.nationalId ?? candidate.fullName;
      const result = this.checkEligibility(candidate, will);
      results.set(key, result);
    });

    return results;
  }

  /**
   * Get best witness candidates from list
   *
   * Ranks candidates by eligibility and suitability
   */
  public rankCandidates(
    candidates: WitnessCandidate[],
    will: Will,
  ): Array<{ candidate: WitnessCandidate; result: EligibilityCheckResult; score: number }> {
    const ranked = candidates.map((candidate) => {
      const result = this.checkEligibility(candidate, will);
      const score = this.calculateCandidateScore(result);
      return { candidate, result, score };
    });

    // Sort by score (descending)
    return ranked.sort((a, b) => b.score - a.score);
  }

  private calculateCandidateScore(result: EligibilityCheckResult): number {
    let score = 100;

    // Deduct for conflicts
    result.conflicts.forEach((conflict) => {
      switch (conflict.severity) {
        case 'CRITICAL':
          score -= 50; // Disqualifying
          break;
        case 'HIGH':
          score -= 25;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    });

    // Deduct for warnings
    score -= result.warnings.length * 3;

    // Bonus for professional witnesses
    if (result.warnings.length === 0 && result.conflicts.length === 0) {
      score += 10; // Ideal candidate
    }

    return Math.max(0, score);
  }
}
