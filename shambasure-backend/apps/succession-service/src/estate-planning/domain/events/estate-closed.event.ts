import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate administration is officially closed.
 *
 * Legal Context:
 * - Final accounts approved by court
 * - All duties fulfilled per Section 83
 * - Grant of representation can be discharged
 *
 * Triggers:
 * - Archive estate records
 * - Release executor compensation
 * - Final compliance reporting
 * - Close probate case
 */
export class EstateClosedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly administratorId: string,
    public readonly closedBy: string,
    public readonly closedAt: Date,
    public readonly finalAccountsApproved: boolean,
  ) {}
}
