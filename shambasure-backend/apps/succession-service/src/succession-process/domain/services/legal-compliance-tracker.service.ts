// succession-service/src/succession-process/domain/services/legal-compliance-tracker.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { ExecutorDutiesRepositoryInterface } from '../repositories/executor-duties.repository.interface';
import { ExecutorDuty } from '../entities/executor-duties.entity';

@Injectable()
export class LegalComplianceTrackerService {
  constructor(
    @Inject('ExecutorDutiesRepositoryInterface')
    private readonly dutiesRepo: ExecutorDutiesRepositoryInterface,
  ) {}

  /**
   * Scans the estate for compliance issues.
   * Returns a Score (0-100) and list of violations.
   */
  async calculateComplianceScore(
    estateId: string,
  ): Promise<{ score: number; violations: string[] }> {
    const duties = await this.dutiesRepo.findByEstateId(estateId);

    let score = 100;
    const violations: string[] = [];

    duties.forEach((duty) => {
      // 1. Check Overdue
      if (duty.checkOverdue()) {
        // Updates status internally
        score -= 15; // Heavy penalty for lateness
        violations.push(
          `Overdue Duty: ${duty.getType()} was due on ${duty.getDeadline().toDateString()}`,
        );
      }

      // 2. Check Sequence (Advanced)
      // e.g., If 'Distribute Assets' is marked Complete but 'Pay Debts' is Pending
      if (duty.getType() === 'DISTRIBUTE_ASSETS' && duty.getStatus() === 'COMPLETED') {
        const debtsDuty = duties.find((d) => d.getType() === 'PAY_DEBTS');
        if (debtsDuty && debtsDuty.getStatus() !== 'COMPLETED') {
          score -= 50; // Critical illegal action
          violations.push(
            'CRITICAL: Assets distributed before debts were settled (Section 83 violation).',
          );
        }
      }
    });

    return { score: Math.max(0, score), violations };
  }
}
