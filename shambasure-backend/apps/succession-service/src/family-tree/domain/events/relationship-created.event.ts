import { RelationshipType } from '@prisma/client';

export class RelationshipCreatedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly fromMemberId: string,
    public readonly toMemberId: string,
    public readonly type: RelationshipType,
    // Contains the initial Kenyan metadata snapshot
    public readonly metadata?: Record<string, any>,
    public readonly timestamp: Date = new Date(),
  ) {}
}
