import { IEvent } from '@nestjs/cqrs';

/**
 * Event emitted when family tree visualization data is recalculated.
 *
 * Triggers:
 * - Cache visualization for frontend
 * - Update family dashboard
 * - Notify users viewing tree (WebSocket)
 */
export class FamilyTreeVisualizationUpdatedEvent implements IEvent {
  constructor(
    public readonly familyId: string,
    public readonly updatedAt: Date,
  ) {}
}
