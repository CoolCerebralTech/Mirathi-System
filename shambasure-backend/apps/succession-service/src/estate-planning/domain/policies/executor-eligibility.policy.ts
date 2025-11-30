import { Injectable } from '@nestjs/common';
import { ExecutorStatus } from '@prisma/client';

import { Executor } from '../entities/executor.entity';

export interface ExecutorPolicyResult {
  isEligible: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * DTO representing a potential executor before they are fully instantiated as an entity
 * or used for checking User Profile data.
 */
export interface ExecutorCandidate {
  age?: number;
  isMentalCapable?: boolean;
  hasCriminalRecord?: boolean;
  residency?: string; // 'KENYAN' | 'FOREIGN'
  isBankrupt?: boolean; // Added per Section 51(3) considerations
}

/**
 * Executor Eligibility Policy
 *
 * Enforces Kenyan Law of Succession Act regarding:
 * - Capacity to serve (Section 6)
 * - Number of executors (Section 51)
 * - Suitability (Probate & Administration Rules)
 */
@Injectable()
export class ExecutorEligibilityPolicy {
  // Kenyan Law Constants
  private readonly MIN_AGE_YEARS = 18; // Age of majority
  private readonly MAX_EXECUTORS = 4; // Section 51(1): Grant cannot be made to more than 4 persons

  /**
   * Validates a single individual's eligibility to serve as Executor.
   * Based on Section 6 (Capacity) and general probate rules.
   */
  checkCandidateEligibility(candidate: ExecutorCandidate): ExecutorPolicyResult {
    const result: ExecutorPolicyResult = { isEligible: true, errors: [], warnings: [] };

    // 1. Age Check
    if (candidate.age !== undefined && candidate.age < this.MIN_AGE_YEARS) {
      result.isEligible = false;
      result.errors.push(
        `Executor must be of full age (at least ${this.MIN_AGE_YEARS} years old).`,
      );
    }

    // 2. Mental Capacity (Section 6)
    if (candidate.isMentalCapable === false) {
      result.isEligible = false;
      result.errors.push('Executor must be of sound mind.');
    }

    // 3. Bankruptcy
    // While not an absolute bar for *executors* (unlike administrators),
    // it is a strong ground for objection or requiring a bond.
    if (candidate.isBankrupt) {
      result.warnings.push('Candidate is bankrupt. Court may require a full bond or refuse grant.');
    }

    // 4. Criminal Record (Probate Rule 25)
    if (candidate.hasCriminalRecord) {
      result.warnings.push(
        'Candidate has a criminal record. Court may refuse probate under "Bad Character" provisions.',
      );
    }

    // 5. Residency Warning (Probate Rules)
    // Non-resident executors are valid but practically difficult and require bonds/sureties.
    if (candidate.residency === 'FOREIGN') {
      result.warnings.push(
        'Executor resides outside Kenya. This requires a surety bond and an attorney in Kenya for service of process.',
      );
    }

    return result;
  }

  /**
   * Validates the composition of the Executor list for a Will.
   * Enforces Section 51 of the Law of Succession Act.
   */
  checkExecutorComposition(executors: Executor[]): ExecutorPolicyResult {
    const result: ExecutorPolicyResult = { isEligible: true, errors: [], warnings: [] };

    // Explicitly type the array so .includes() works with the generic Enum type
    const validStatuses: ExecutorStatus[] = [
      ExecutorStatus.ACTIVE,
      ExecutorStatus.NOMINATED,
      ExecutorStatus.COMPLETED,
    ];

    const activeExecutors = executors.filter((e) => validStatuses.includes(e.status));
    const primaryExecutors = activeExecutors.filter((e) => e.isPrimary);

    // 1. Maximum Limit (Section 51(1))
    // "No grant of representation shall be made to more than four persons in respect of the same estate."
    if (activeExecutors.length > this.MAX_EXECUTORS) {
      result.isEligible = false;
      result.errors.push(
        `Kenyan law limits the number of proving executors to ${this.MAX_EXECUTORS}. You have ${activeExecutors.length}.`,
      );
    }

    // 2. Minimum Primary Executor
    if (primaryExecutors.length < 1) {
      result.warnings.push(
        'No primary executor appointed. If the Will has no executor, the court will appoint an administrator (Grant of Admon. with Will Annexed).',
      );
    }

    // 3. Alternate Recommendation
    // Practical advice: If only 1 executor, death/refusal leads to administrative vacuum.
    if (primaryExecutors.length === 1 && activeExecutors.length === 1) {
      result.warnings.push(
        'Recommended to appoint at least one alternate executor in case the primary is unable or unwilling to act.',
      );
    }

    // 4. Professional Executor Bond
    const professionals = activeExecutors.filter((e) => e.isProfessional);
    for (const pro of professionals) {
      if (!pro.requiresBond) {
        result.warnings.push(
          `Professional Executor ${pro.fullName} should typically have a bond requirement set.`,
        );
      }
    }

    return result;
  }
}
