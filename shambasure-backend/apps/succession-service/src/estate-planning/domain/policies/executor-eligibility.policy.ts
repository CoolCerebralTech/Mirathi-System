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
    const result: ExecutorPolicyResult = {
      isEligible: true,
      errors: [],
      warnings: [],
    };

    // 1. Age Check (Section 6)
    // Even though User entity might verify age, we enforce it here for external nominees.
    if (
      candidate.age !== undefined &&
      candidate.age < KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MINIMUM_AGE
    ) {
      result.isEligible = false;
      result.errors.push(
        `Executor must be at least ${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MINIMUM_AGE} years old.`,
      );
    }

    // 2. Mental Capacity
    if (candidate.isMentalCapable === false) {
      result.isEligible = false;
      result.errors.push('Executor must be of sound mind.');
    }

    // 3. Suitability (System Rule)
    if (candidate.hasCriminalRecord && EXECUTOR_RULES.ELIGIBILITY.NO_FELONY_CONVICTIONS) {
      result.warnings.push(
        'Candidate has a criminal record. The court may refuse to grant probate (Rule 25 Probate & Administration Rules).',
      );
    }

    // 4. Residency Warning
    if (candidate.residency === 'FOREIGN') {
      result.warnings.push(
        'Executor resides outside Kenya. This may complicate court processes and they may be required to provide a surety/bond.',
      );
    }

    return result;
  }

  /**
   * Validates the composition of the entire Executor list for a Will.
   */
  checkExecutorComposition(executors: Executor[]): ExecutorPolicyResult {
    const result: ExecutorPolicyResult = {
      isEligible: true,
      errors: [],
      warnings: [],
    };

    const activeExecutors = executors.filter((e) => !e.isRemoved());
    const primaryExecutors = activeExecutors.filter((e) => e.getIsPrimary());

    // 1. Max Count (Section 56 - Max 4 administrators/executors)
    if (primaryExecutors.length > EXECUTOR_RULES.MAX_EXECUTORS) {
      result.isEligible = false;
      result.errors.push(
        `You cannot appoint more than ${EXECUTOR_RULES.MAX_EXECUTORS} primary executors.`,
      );
    }

    // 2. Min Count
    if (primaryExecutors.length < 1) {
      result.warnings.push(
        'No primary executor appointed. The court will appoint an administrator (Intestacy rules may apply).',
      );
    }

    // 3. Alternate Logic
    if (
      EXECUTOR_RULES.ALTERNATE_REQUIREMENT &&
      primaryExecutors.length === 1 &&
      activeExecutors.length === 1
    ) {
      result.warnings.push(
        'It is highly recommended to appoint at least one Alternate Executor in case the primary is unable to act.',
      );
    }

    return result;
  }
}
