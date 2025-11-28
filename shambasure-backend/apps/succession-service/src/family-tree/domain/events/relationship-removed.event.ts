export class RelationshipRemovedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly familyId: string,
    public readonly fromMemberId: string,
    public readonly toMemberId: string,
    public readonly removedBy: string,
    public readonly reason?: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
