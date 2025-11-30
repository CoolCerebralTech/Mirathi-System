import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a family head is appointed.
 *
 * Legal Context:
 * - Section 40: Family head often administers customary estates
 * - Traditional role in Kenyan succession planning
 *
 * Triggers:
 * - Notify appointed family head
 * - Update family hierarchy in tree visualization
 * - Grant family head permissions (if applicable)
 * - Update succession planning recommendations
 */
export class FamilyHeadAppointedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly familyMemberId: string,
    public readonly previousFamilyHeadId: string | null,
  ) {}
}
