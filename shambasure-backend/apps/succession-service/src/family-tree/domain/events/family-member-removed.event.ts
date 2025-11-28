// succession-service/src/family-tree/domain/events/family-member-removed.event.ts

export class FamilyMemberRemovedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly reason?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
