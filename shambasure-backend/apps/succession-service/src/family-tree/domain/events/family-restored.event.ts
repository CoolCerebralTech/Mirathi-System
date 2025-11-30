import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when an archived family is restored.
 *
 * Triggers:
 * - Re-enable family access
 * - Restore family tree visualization
 * - Notify family creator
 * - Reindex family for search
 */
export class FamilyRestoredEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly restoredBy: string,
    public readonly restoredAt: Date,
  ) {}
}
