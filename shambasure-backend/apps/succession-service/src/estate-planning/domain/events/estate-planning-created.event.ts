import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a user initiates estate planning.
 *
 * Triggers:
 * - User dashboard setup
 * - Initial planning workflow
 * - Analytics tracking
 */
export class EstatePlanningCreatedEvent implements IEvent {
  constructor(
    public readonly estatePlanningId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}
}
