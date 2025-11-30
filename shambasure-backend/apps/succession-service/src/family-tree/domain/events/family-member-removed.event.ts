import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a family member is unlinked from a family.
 *
 * Triggers:
 * - Recalculate family statistics
 * - Update family tree visualization
 * - Remove member's relationships
 * - Check if member was in active wills (warning)
 */
export class FamilyMemberRemovedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly memberId: string,
  ) {}
}
