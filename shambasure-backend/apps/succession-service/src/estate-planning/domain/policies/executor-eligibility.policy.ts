import { Injectable } from '@nestjs/common';
import { Executor } from '../entities/executor.entity';
import { EXECUTOR_RULES } from '../../../common/constants/succession-rules.constants';
import { KENYAN_LEGAL_REQUIREMENTS } from '../../../common/constants/kenyan-law.constants';

export interface ExecutorPolicyResult {
  isEligible: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutorCandidate {
  age?: number; // If known (from User Profile)
  isMentalCapable?: boolean; // Self-attested or system check
  hasCriminalRecord?: boolean; // Background check
  residency?: string; // 'KENYAN' | 'FOREIGN'
}

@Injectable()
export class ExecutorEligibilityPolicy {
  /**
   * Validates a single individual's eligibility to serve as Executor.
   */
  checkCandidateEligibility(candidate: ExecutorCandidate): ExecutorPolicyResult {
    const result: ExecutorPolicyResult = { isEligible: true, errors: [], warnings: [] };

    // 1. Age Check (Section 6)
    const minAge = KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MINIMUM_AGE;
    if (candidate.age !== undefined && candidate.age < minAge) {
      result.isEligible = false;
      result.errors.push(`Executor must be at least ${minAge} years old.`);
    }

    // 2. Mental Capacity
    if (candidate.isMentalCapable === false) {
      result.isEligible = false;
      result.errors.push('Executor must be of sound mind.');
    }

    // 3. Criminal Record Check
    if (candidate.hasCriminalRecord && EXECUTOR_RULES.ELIGIBILITY.NO_FELONY_CONVICTIONS) {
      result.warnings.push(
        'Candidate has a criminal record. Court may refuse probate under Rule 25 of the Probate & Administration Rules.',
      );
    }

    // 4. Residency Warning
    if (candidate.residency === 'FOREIGN') {
      result.warnings.push(
        'Executor resides outside Kenya. May need a surety/bond and court approval could be delayed.',
      );
    }

    return result;
  }

  /**
   * Validates the composition of the Executor list for a Will.
   */
  checkExecutorComposition(executors: Executor[]): ExecutorPolicyResult {
    const result: ExecutorPolicyResult = { isEligible: true, errors: [], warnings: [] };

    const activeExecutors = executors.filter((e) => !e.isRemoved());
    const primaryExecutors = activeExecutors.filter((e) => e.getIsPrimary());

    // 1. Maximum primary executors
    if (primaryExecutors.length > EXECUTOR_RULES.MAX_EXECUTORS) {
      result.isEligible = false;
      result.errors.push(
        `Cannot appoint more than ${EXECUTOR_RULES.MAX_EXECUTORS} primary executors.`,
      );
    }

    // 2. Minimum primary executor
    if (primaryExecutors.length < 1) {
      result.warnings.push(
        'No primary executor appointed. Court may appoint an administrator under intestacy rules.',
      );
    }

    // 3. Recommend alternate executor if only one active executor
    if (
      EXECUTOR_RULES.ALTERNATE_REQUIREMENT &&
      primaryExecutors.length === 1 &&
      activeExecutors.length === 1
    ) {
      result.warnings.push(
        'Recommended to appoint at least one alternate executor in case the primary is unable to act.',
      );
    }

    return result;
  }
}
