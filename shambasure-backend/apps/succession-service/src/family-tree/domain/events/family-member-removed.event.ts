export class FamilyMemberRemovedEvent {
  constructor(
    public readonly memberId: string,
    public readonly familyId: string,
    public readonly removedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
