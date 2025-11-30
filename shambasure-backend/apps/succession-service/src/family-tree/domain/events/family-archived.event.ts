import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when a family is archived (soft deleted).
 *
 * Triggers:
 * - Hide family from active lists
 * - Preserve family data for compliance
 * - Notify family members (optional)
 * - Deactivate related wills (if applicable)
 */
export class FamilyArchivedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly archivedBy: string,
    public readonly archivedAt: Date,
  ) {}
}
