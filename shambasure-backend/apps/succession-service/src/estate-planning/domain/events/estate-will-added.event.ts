// estate-will-added.event.ts
import { IEvent } from '@nestjs/cqrs';
import { WillStatus } from '@prisma/client';

/**
 * Event emitted when a will is added to an estate aggregate
 * @class EstateWillAddedEvent
 * @implements {IEvent}
 */
export class EstateWillAddedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly willId: string,
    public readonly willStatus: WillStatus,
    public readonly addedAt: Date,
  ) {}
}
