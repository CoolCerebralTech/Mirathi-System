import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a new family is created.
 *
 * Triggers:
 * - Initialize family tree structure
 * - Create default permissions for creator
 * - Send welcome/setup guide to creator
 * - Initialize family statistics
 */
export class FamilyCreatedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly creatorId: string,
    public readonly familyName: string,
    public readonly createdAt: Date,
  ) {}
}
