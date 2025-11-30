export class FamilyMemberRemovedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly reason: string, // Aggregate always provides a fallback string
    public readonly timestamp: Date = new Date(),
  ) {}
}
