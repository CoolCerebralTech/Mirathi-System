import { Injectable, Inject } from '@nestjs/common';
import type { DisputeRepositoryInterface } from '../repositories/dispute.repository.interface';
import { DisputeGroundsPolicy } from '../policies/dispute-grounds.policy';
import { DisputeType } from '@prisma/client';

@Injectable()
export class DisputeResolutionService {
  constructor(
    @Inject('DisputeRepositoryInterface')
    private readonly disputeRepo: DisputeRepositoryInterface,
    private readonly groundsPolicy: DisputeGroundsPolicy,
  ) {}

  async validateAndFileObjection(
    willId: string,
    disputantId: string,
    type: DisputeType,
    description: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. Policy Check
    const policyCheck = this.groundsPolicy.validateObjection(type, description, 'PRE_GRANT');

    if (!policyCheck.isValid) {
      return { valid: false, reason: policyCheck.error };
    }

    // 2. Check for existing duplicates
    const existing = await this.disputeRepo.findByWillId(willId);
    const duplicate = existing.find(
      (d) => d.getDisputantId() === disputantId && d.getStatus() === 'FILED',
    );

    if (duplicate) {
      return { valid: false, reason: 'You already have an active dispute filed.' };
    }

    return { valid: true };
  }

  /**
   * Checks if the probate process is blocked by any active disputes.
   */
  async isProbateBlocked(willId: string): Promise<boolean> {
    const disputes = await this.disputeRepo.findByWillId(willId);
    // Block if any dispute is FILED, MEDIATION, or COURT_PROCEEDING
    const blockingStatuses = ['FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING'];

    return disputes.some((d) => blockingStatuses.includes(d.getStatus()));
  }
}
