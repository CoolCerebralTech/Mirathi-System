import { Injectable } from '@nestjs/common';
import { WitnessStatus, WitnessType } from '@prisma/client';

import { BeneficiaryAssignment } from '../entities/beneficiary.entity';
import { Witness } from '../entities/witness.entity';

export interface WitnessPolicyResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WitnessCandidate {
  userId?: string;
  fullName: string;
  email?: string;
  age?: number;
  isMentalCapable?: boolean;
  relationshipToTestator?: string;
}

@Injectable()
export class WitnessEligibilityPolicy {
  // Kenyan Law Constants
  private readonly MINIMUM_TESTATOR_AGE = 18;
  private readonly MINIMUM_WITNESSES = 2;

  /**
   * Validates a single witness candidate's basic eligibility (Age, Capacity).
   */
  checkCandidateEligibility(candidate: WitnessCandidate): WitnessPolicyResult {
    const result: WitnessPolicyResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // 1. Age Check (Must be of age to sign legal documents)
    if (candidate.age !== undefined && candidate.age < this.MINIMUM_TESTATOR_AGE) {
      result.isValid = false;
      result.errors.push(`Witness must be at least ${this.MINIMUM_TESTATOR_AGE} years old.`);
    }

    // 2. Mental Capacity (Assumed true unless flagged)
    if (candidate.isMentalCapable === false) {
      result.isValid = false;
      result.errors.push('Witness must be of sound mind to attest to the signature.');
    }

    // 3. Relationship Warning (Spouse or close relatives)
    // While legally valid to be a relative (unless a beneficiary), close ties weaken independence.
    if (this.isProhibitedRelationship(candidate.relationshipToTestator)) {
      result.warnings.push(
        `Witness "${candidate.fullName}" has a close relationship (${candidate.relationshipToTestator}) to the testator. This may raise questions about independence.`,
      );
    }

    return result;
  }

  /**
   * CRITICAL: Checks for Section 13 violations (Beneficiary witnessing Will).
   * If a match is found, it returns a Warning/Error because the gift would be voided.
   */
  checkConflictOfInterest(
    witness: Witness,
    beneficiaries: BeneficiaryAssignment[],
  ): WitnessPolicyResult {
    const result: WitnessPolicyResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const beneficiary of beneficiaries) {
      let matchFound = false;

      // A. Direct User ID Match (100% accuracy)
      if (witness.witnessId && beneficiary.userId && witness.witnessId === beneficiary.userId) {
        matchFound = true;
      }

      // B. Name Match Check (For external users)
      if (!matchFound) {
        const witnessName = witness.fullName.trim().toLowerCase();
        const beneficiaryName = (beneficiary.externalName || '').trim().toLowerCase();

        if (witnessName === beneficiaryName) {
          result.warnings.push(
            `Potential Conflict: Witness "${witness.fullName}" shares a name with a Beneficiary. Ensure they are different people.`,
          );
        }
      }

      if (matchFound) {
        // Section 13 violation
        result.isValid = false;
        result.errors.push(
          `CRITICAL: Witness "${witness.fullName}" is also listed as a Beneficiary. Under Section 13 of the Law of Succession Act, witnessing the will would VOID their inheritance. Please choose a different witness.`,
        );
        break; // Stop checking this witness
      }
    }

    return result;
  }

  /**
   * Validates the final list of witnesses before Activation.
   */
  validateWitnessComposition(witnesses: Witness[]): WitnessPolicyResult {
    const result: WitnessPolicyResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Filter for valid witnesses (Signed/Verified)
    const signedWitnesses = witnesses.filter(
      (w) => w.status === WitnessStatus.SIGNED || w.status === WitnessStatus.VERIFIED,
    );

    if (signedWitnesses.length < this.MINIMUM_WITNESSES) {
      result.isValid = false;
      result.errors.push(
        `Insufficient witnesses. Kenyan law requires at least ${this.MINIMUM_WITNESSES} witnesses to sign in the presence of the testator.`,
      );
    }

    // Check witness diversity
    if (signedWitnesses.length > 0) {
      const allSameType = this.areAllWitnessesSameType(signedWitnesses);
      if (allSameType) {
        result.warnings.push(
          'All witnesses are of the same type. Consider having a mix of registered users and external witnesses for stronger legal validity.',
        );
      }
    }

    return result;
  }

  /**
   * Comprehensive witness validation combining all checks
   */
  comprehensiveWitnessValidation(
    witnesses: Witness[],
    beneficiaries: BeneficiaryAssignment[],
  ): {
    overallValid: boolean;
    individualResults: Array<{
      witness: Witness;
      eligibility: WitnessPolicyResult;
      conflicts: WitnessPolicyResult;
    }>;
    compositionResult: WitnessPolicyResult;
  } {
    const individualResults = witnesses.map((witness) => ({
      witness,
      eligibility: this.checkWitnessEligibility(witness),
      conflicts: this.checkConflictOfInterest(witness, beneficiaries),
    }));

    const compositionResult = this.validateWitnessComposition(witnesses);

    const overallValid =
      compositionResult.isValid &&
      individualResults.every((result) => result.eligibility.isValid && result.conflicts.isValid);

    return {
      overallValid,
      individualResults,
      compositionResult,
    };
  }

  /**
   * Check if witness has any prohibited relationships that might affect validity
   */
  private isProhibitedRelationship(relationship?: string): boolean {
    if (!relationship) return false;

    const prohibitedRelationships = [
      'SPOUSE',
      'CHILD',
      'PARENT',
      'SIBLING',
      'BENEFICIARY',
      'EXECUTOR',
      'LAWYER', // If also drafting the will
    ];

    return prohibitedRelationships.includes(relationship.toUpperCase());
  }

  /**
   * Check if all witnesses are of the same type (all users or all external)
   */
  private areAllWitnessesSameType(witnesses: Witness[]): boolean {
    if (witnesses.length <= 1) return false;

    const firstType = witnesses[0].witnessType === WitnessType.REGISTERED_USER;
    return witnesses.every(
      (witness) => (witness.witnessType === WitnessType.REGISTERED_USER) === firstType,
    );
  }

  /**
   * Check eligibility for an existing Witness entity (not just candidate)
   */
  private checkWitnessEligibility(witness: Witness): WitnessPolicyResult {
    const candidate: WitnessCandidate = {
      userId: witness.witnessId || undefined,
      fullName: witness.fullName || 'Unknown',
      email: witness.email || undefined,
      relationshipToTestator: witness.relationship || undefined,
    };

    return this.checkCandidateEligibility(candidate);
  }

  /**
   * Get detailed witness validation report
   */
  getDetailedValidationReport(
    witnesses: Witness[],
    beneficiaries: BeneficiaryAssignment[],
  ): {
    summary: {
      totalWitnesses: number;
      signedWitnesses: number;
      eligibleWitnesses: number;
      hasConflicts: boolean;
      meetsLegalMinimum: boolean;
    };
    issues: Array<{
      type: 'ERROR' | 'WARNING';
      message: string;
      witnessId?: string;
      witnessName?: string;
    }>;
    recommendations: string[];
  } {
    const validation = this.comprehensiveWitnessValidation(witnesses, beneficiaries);

    const signedWitnesses = witnesses.filter(
      (w) => w.status === WitnessStatus.SIGNED || w.status === WitnessStatus.VERIFIED,
    );

    const eligibleWitnesses = validation.individualResults.filter(
      (result) => result.eligibility.isValid && result.conflicts.isValid,
    ).length;

    const issues: Array<{
      type: 'ERROR' | 'WARNING';
      message: string;
      witnessId?: string;
      witnessName?: string;
    }> = [];

    // Collect all errors and warnings
    validation.individualResults.forEach((result) => {
      result.eligibility.errors.forEach((error) => {
        issues.push({
          type: 'ERROR',
          message: error,
          witnessId: result.witness.id,
          witnessName: result.witness.fullName,
        });
      });

      result.eligibility.warnings.forEach((warning) => {
        issues.push({
          type: 'WARNING',
          message: warning,
          witnessId: result.witness.id,
          witnessName: result.witness.fullName,
        });
      });

      result.conflicts.errors.forEach((error) => {
        issues.push({
          type: 'ERROR',
          message: error,
          witnessId: result.witness.id,
          witnessName: result.witness.fullName,
        });
      });

      result.conflicts.warnings.forEach((warning) => {
        issues.push({
          type: 'WARNING',
          message: warning,
          witnessId: result.witness.id,
          witnessName: result.witness.fullName,
        });
      });
    });

    validation.compositionResult.errors.forEach((error) => {
      issues.push({ type: 'ERROR', message: error });
    });

    validation.compositionResult.warnings.forEach((warning) => {
      issues.push({ type: 'WARNING', message: warning });
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (signedWitnesses.length < this.MINIMUM_WITNESSES) {
      recommendations.push(
        `Add ${this.MINIMUM_WITNESSES - signedWitnesses.length} more witness(es) to meet legal requirements.`,
      );
    }

    if (issues.some((issue) => issue.type === 'ERROR' && issue.message.includes('Beneficiary'))) {
      recommendations.push(
        'Replace any witnesses who are also beneficiaries to avoid Section 13 violations.',
      );
    }

    if (validation.individualResults.some((result) => !result.eligibility.isValid)) {
      recommendations.push('Review and replace ineligible witnesses.');
    }

    return {
      summary: {
        totalWitnesses: witnesses.length,
        signedWitnesses: signedWitnesses.length,
        eligibleWitnesses,
        hasConflicts: issues.some((issue) => issue.type === 'ERROR'),
        meetsLegalMinimum: signedWitnesses.length >= this.MINIMUM_WITNESSES,
      },
      issues,
      recommendations,
    };
  }
}
