// estate-probate-validated.event.ts
import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when estate is validated for probate process
 * @class EstateProbateValidatedEvent
 * @implements {IEvent}
 */
export class EstateProbateValidatedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly isValid: boolean,
    public readonly issues: string[],
    public readonly validatedAt: Date = new Date(),
  ) {}
}
