// succession-service/src/family-tree/domain/events/relationship-removed.event.ts

export class RelationshipRemovedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly fromMemberId: string,
    public readonly toMemberId: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
