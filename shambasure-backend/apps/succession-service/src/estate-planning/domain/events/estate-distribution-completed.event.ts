import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate distribution is completed.
 *
 * Legal Context:
 * - Section 83: Personal Representative completes distribution duties
 * - All assets transferred to beneficiaries
 *
 * Triggers:
 * - Prepare final accounts
 * - File court confirmation
 * - Close estate administration
 * - Release executor bond (if applicable)
 */
export class EstateDistributionCompletedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly administratorId: string,
    public readonly completedBy: string,
    public readonly completedAt: Date,
  ) {}
}
