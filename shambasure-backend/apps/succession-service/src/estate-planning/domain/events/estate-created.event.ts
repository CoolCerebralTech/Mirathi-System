import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when an estate is opened after a person's death.
 *
 * Legal Context:
 * - Marks the start of estate administration
 * - Triggers probate workflow initialization
 *
 * Triggers:
 * - Notify potential administrators/executors
 * - Initialize probate case
 * - Begin inventory compilation
 * - Compliance tracking
 */
export class EstateCreatedEvent implements IEvent {
  constructor(
    public readonly estateId: string,
    public readonly deceasedName: string,
    public readonly dateOfDeath: Date | null,
    public readonly createdAt: Date,
  ) {}
}
