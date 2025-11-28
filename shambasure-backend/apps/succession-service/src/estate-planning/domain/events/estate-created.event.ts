// estate-created.event.ts
import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a new estate aggregate is created for a deceased person
 * @class EstateCreatedEvent
 * @implements {IEvent}
 */
export class EstateCreatedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly deceasedId: string,
    public readonly createdAt: Date,
  ) {}
}
