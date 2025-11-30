import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a family member is linked to a family.
 *
 * Triggers:
 * - Recalculate family statistics
 * - Update family tree visualization
 * - Notify family creator of new member
 * - Check succession planning completeness
 */
export class FamilyMemberLinkedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly memberId: string,
  ) {}
}
