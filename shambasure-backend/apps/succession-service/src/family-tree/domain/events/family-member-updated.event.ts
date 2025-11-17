export class FamilyMemberUpdatedEvent {
  constructor(
    public readonly memberId: string,
    public readonly familyId: string,
    public readonly updatedBy: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
