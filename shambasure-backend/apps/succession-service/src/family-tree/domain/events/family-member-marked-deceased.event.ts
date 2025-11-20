// succession-service/src/family-tree/domain/events/family-member-marked-deceased.event.ts

export class FamilyMemberMarkedDeceasedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly dateOfDeath: Date,
    public readonly markedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
