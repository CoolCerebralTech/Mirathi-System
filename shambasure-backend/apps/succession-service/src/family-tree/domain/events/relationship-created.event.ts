// succession-service/src/family-tree/domain/events/relationship-created.event.ts

import { RelationshipType } from '@prisma/client';

export class RelationshipCreatedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly fromMemberId: string,
    public readonly toMemberId: string,
    public readonly type: RelationshipType,
    public readonly metadata?: Record<string, any>, // e.g. { isBiological: true }
    public readonly timestamp: Date = new Date(),
  ) {}
}
