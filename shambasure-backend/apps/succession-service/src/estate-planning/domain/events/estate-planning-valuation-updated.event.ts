import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate net worth calculation is updated.
 *
 * Triggers:
 * - Net worth reports
 * - Financial planning notifications
 * - Dashboard refresh
 * - Analytics tracking
 */
export class EstatePlanningValuationUpdatedEvent implements IEvent {
  constructor(
    public readonly estatePlanningId: string,
    public readonly userId: string,
    public readonly totalAssets: number,
    public readonly totalDebts: number,
    public readonly netWorth: number,
    public readonly currency: string,
    public readonly calculatedAt: Date,
  ) {}
}
