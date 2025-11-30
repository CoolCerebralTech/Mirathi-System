import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate inventory is verified and valued.
 *
 * Legal Context:
 * - Section 83: Personal Representative duty to file inventory
 * - Critical milestone in probate process
 *
 * Triggers:
 * - Update estate valuation
 * - Proceed to grant application
 * - Tax assessment preparation
 * - Creditor notification (30-day claim period)
 */
export class EstateInventoryVerifiedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly itemCount: number,
    public readonly totalValue: number,
    public readonly currency: string,
    public readonly verifiedBy: string,
    public readonly verifiedAt: Date,
  ) {}
}
